const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction.model');
const auth = require('../middleware/auth');

// GET /api/transactions/:leagueId - Obtener todas las transacciones de una liga
router.get('/transactions/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Validar que el ID de la liga sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(leagueId)) {
            return res.status(400).json({ message: "ID de liga inválido" });
        }

        // Buscar transacciones para esta liga
        const transactions = await Transaction.find({ leagueId })
            .populate('userId', 'username')
            .populate('sellerUserId', 'username')
            .populate('buyerUserId', 'username')
            .sort({ createdAt: -1 }); // Ordenar por fecha, más reciente primero

        // Si no hay transacciones registradas, buscar ofertas completadas/aceptadas 
        // para crear registros de transacciones
        if (transactions.length === 0) {
            console.log("No hay transacciones, sincronizando desde ofertas completadas...");
            await syncTransactionsFromOffers(leagueId);

            // Buscar de nuevo después de la sincronización
            const freshTransactions = await Transaction.find({ leagueId })
                .populate('userId', 'username')
                .populate('sellerUserId', 'username')
                .populate('buyerUserId', 'username')
                .sort({ createdAt: -1 });

            return res.json(freshTransactions);
        }

        res.json(transactions);
    } catch (error) {
        console.error("Error obteniendo transacciones:", error);
        res.status(500).json({ message: "Error del servidor al obtener transacciones" });
    }
});

// Función para sincronizar transacciones a partir de ofertas
const syncTransactionsFromOffers = async (leagueId) => {
    try {
        // Importamos aquí para evitar problemas de importación circular
        const PlayerOffer = require('../models/PlayerOffer.model');

        // Buscar ofertas completadas/aceptadas que no tengan una transacción asociada
        const completedOffers = await PlayerOffer.find({
            leagueId,
            status: { $in: ['completed', 'accepted'] }
        }).populate('playerId').populate('sellerUserId').populate('buyerUserId');

        if (!completedOffers.length) {
            console.log("No hay ofertas completadas para sincronizar");
            return;
        }

        console.log(`Encontradas ${completedOffers.length} ofertas para sincronizar`);

        // Verificar transacciones existentes para no duplicar
        const existingTransactionsByOfferId = {};
        const existingTransactions = await Transaction.find({
            leagueId,
            offerId: { $in: completedOffers.map(o => o._id) }
        });

        existingTransactions.forEach(t => {
            existingTransactionsByOfferId[t.offerId.toString()] = true;
        });

        // Crear transacciones para cada oferta completada
        const transactionsToCreate = [];

        for (const offer of completedOffers) {
            // Saltar si ya hay una transacción para esta oferta
            if (existingTransactionsByOfferId[offer._id.toString()]) {
                continue;
            }

            // Obtener información del jugador
            let playerInfo = offer.playerId;

            // Si playerId es un string (ID) en lugar de un objeto poblado
            if (typeof offer.playerId === 'string' || offer.playerId instanceof mongoose.Types.ObjectId) {
                // Aquí podrías intentar obtener la información del jugador de otra fuente
                // Por ahora, usamos información mínima
                playerInfo = {
                    name: 'Unknown Player',
                    team: '',
                    role: ''
                };
            }

            transactionsToCreate.push({
                type: 'trade',
                leagueId: offer.leagueId,
                playerId: typeof offer.playerId === 'string' ? offer.playerId : offer.playerId?.id || '',
                playerName: playerInfo?.summonerName || playerInfo?.name || 'Unknown Player',
                playerTeam: playerInfo?.team || '',
                playerPosition: playerInfo?.role || '',
                price: offer.price,
                sellerUserId: offer.sellerUserId,
                buyerUserId: offer.buyerUserId,
                offerId: offer._id,
                createdAt: offer.createdAt
            });
        }

        // Insertar nuevas transacciones
        if (transactionsToCreate.length > 0) {
            await Transaction.insertMany(transactionsToCreate);
            console.log(`Creadas ${transactionsToCreate.length} nuevas transacciones`);
        }
    } catch (error) {
        console.error("Error sincronizando transacciones desde ofertas:", error);
    }
};

// POST /api/transactions - Registrar una nueva transacción (usado internamente)
router.post('/transactions', auth, async (req, res) => {
    try {
        const {
            type, leagueId, playerId, playerName, playerTeam, playerPosition,
            price, userId, sellerUserId, buyerUserId, offerId
        } = req.body;

        // Validar tipo de transacción
        if (!['purchase', 'sale', 'trade'].includes(type)) {
            return res.status(400).json({ message: "Tipo de transacción inválido" });
        }

        // Validar que el ID de la liga sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(leagueId)) {
            return res.status(400).json({ message: "ID de liga inválido" });
        }

        // Crear la transacción
        const newTransaction = new Transaction({
            type,
            leagueId,
            playerId,
            playerName,
            playerTeam,
            playerPosition,
            price,
            userId: type !== 'trade' ? userId : undefined,
            sellerUserId: type === 'trade' ? sellerUserId : undefined,
            buyerUserId: type === 'trade' ? buyerUserId : undefined,
            offerId
        });

        await newTransaction.save();

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Error creando transacción:", error);
        res.status(500).json({ message: "Error del servidor al crear transacción" });
    }
});

module.exports = router;