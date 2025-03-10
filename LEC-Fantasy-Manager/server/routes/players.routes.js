const router = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const MyLeagues = require('../models/myLeagues.model');
const auth = require('../middleware/auth');
require('dotenv').config();

const API_KEY = process.env.LOLESPORTS_API_KEY;
const LEC_ID = "98767991302996019"; // LEC id

// Modelo esquema para UserPlayer (jugadores comprados por un usuario)
const userPlayerSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MyLeagues',
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
});

const UserPlayer = mongoose.model('UserPlayer', userPlayerSchema);

// GET /api/players - Obtener todos los jugadores de la LEC (excluyendo a Ben01)
router.get('/players', async (req, res) => {
    try {
        const response = await axios.get("https://esports-api.lolesports.com/persisted/gw/getTeams", {
            headers: {
                "x-api-key": API_KEY
            },
            params: {
                hl: "en-US"
            }
        });

        const allTeams = response.data.data.teams || [];

        const lecTeams = allTeams.filter(team =>
            team.homeLeague && team.homeLeague.name === "LEC"
        );

        if (!lecTeams.length) {
            return res.status(404).json({ message: "No LEC teams found" });
        }

        // Extraer jugadores y añadir el equipo al que pertenecen
        const allPlayers = [];
        lecTeams.forEach(team => {
            const teamPlayers = team.players || [];
            teamPlayers.forEach(player => {
                // Excluir al jugador "Ben01"
                if (player.summonerName !== "Ben01" && player.name !== "Ben01") {
                    // Añadir precio basado en estadísticas (simulado)
                    const price = Math.floor(Math.random() * 5) + 5; // Precios entre 5 y 10 millones

                    allPlayers.push({
                        ...player,
                        team: team.code,
                        teamName: team.name,
                        teamId: team.id,
                        price: price
                    });
                }
            });
        });

        if (!allPlayers.length) {
            return res.status(404).json({ message: "No LEC players found" });
        }

        res.json(allPlayers);
    } catch (error) {
        console.error("Error fetching LEC players from LoLEsports API:", error.response?.data || error);
        res.status(500).json({ message: "Failed to fetch LEC players" });
    }
});

// GET /api/players/team/:teamId - Obtener jugadores por equipo (excluyendo a Ben01)
router.get('/players/team/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;

        const response = await axios.get("https://esports-api.lolesports.com/persisted/gw/getTeams", {
            headers: {
                "x-api-key": API_KEY
            },
            params: {
                hl: "en-US",
                id: teamId
            }
        });

        const team = response.data.data.teams && response.data.data.teams[0];

        if (!team || !team.players || !team.players.length) {
            return res.status(404).json({ message: "No players found for this team" });
        }

        // Filtrar para excluir a Ben01 y añadir precios a los jugadores
        const playersWithPrices = team.players
            .filter(player => player.summonerName !== "Ben01" && player.name !== "Ben01")
            .map(player => ({
                ...player,
                team: team.code,
                teamName: team.name,
                teamId: team.id,
                price: Math.floor(Math.random() * 5) + 5 // Precios entre 5 y 10 millones
            }));

        if (!playersWithPrices.length) {
            return res.status(404).json({ message: "No eligible players found for this team" });
        }

        res.json(playersWithPrices);
    } catch (error) {
        console.error("Error fetching team players from LoLEsports API:", error.response?.data || error);
        res.status(500).json({ message: "Failed to fetch team players" });
    }
});

// GET /api/players/position/:position - Obtener jugadores por posición
router.get('/players/position/:position', async (req, res) => {
    try {
        const { position } = req.params;
        const validPositions = ['top', 'jungle', 'mid', 'adc', 'support'];

        if (!validPositions.includes(position.toLowerCase())) {
            return res.status(400).json({ message: "Invalid position. Valid positions are: top, jungle, mid, adc, support" });
        }

        const response = await axios.get("https://esports-api.lolesports.com/persisted/gw/getTeams", {
            headers: {
                "x-api-key": API_KEY
            },
            params: {
                hl: "en-US"
            }
        });

        const allTeams = response.data.data.teams || [];

        const lecTeams = allTeams.filter(team =>
            team.homeLeague && team.homeLeague.name === "LEC"
        );

        // Filtrar jugadores por posición
        const positionPlayers = [];
        lecTeams.forEach(team => {
            const teamPlayers = team.players || [];
            teamPlayers.forEach(player => {
                if (player.role && player.role.toLowerCase() === position.toLowerCase()) {
                    positionPlayers.push({
                        ...player,
                        team: team.code,
                        teamName: team.name,
                        teamId: team.id,
                        price: Math.floor(Math.random() * 5) + 5 // Precios entre 5 y 10 millones
                    });
                }
            });
        });

        if (!positionPlayers.length) {
            return res.status(404).json({ message: `No players found for position: ${position}` });
        }

        res.json(positionPlayers);
    } catch (error) {
        console.error("Error fetching players by position from LoLEsports API:", error.response?.data || error);
        res.status(500).json({ message: "Failed to fetch players by position" });
    }
});

// POST /api/players/buy - Comprar un jugador para la liga seleccionada (requiere autenticación)
router.post('/players/buy', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        if (!playerId || !leagueId) {
            return res.status(400).json({ message: "Player ID and League ID are required" });
        }

        // Verificar que la liga existe y el usuario es participante
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verificar que el usuario es participante de la liga
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Verificar si el jugador ya está comprado por el usuario en esta liga
        const existingPurchase = await UserPlayer.findOne({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        if (existingPurchase) {
            return res.status(400).json({ message: "You already own this player in this league" });
        }

        // Obtener información del jugador para validar
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player not found" });
        }

        // Verificar fondos disponibles
        const userLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId: leagueId
        });

        if (!userLeague) {
            return res.status(404).json({ message: "User league data not found" });
        }

        if (userLeague.money < playerInfo.price) {
            return res.status(400).json({
                message: `Insufficient funds. You have ${userLeague.money}M€ but the player costs ${playerInfo.price}M€`
            });
        }

        // Verificar regla de máximo 2 jugadores por equipo
        const teamPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        // Verificar límite total de 10 jugadores
        if (teamPlayers.length >= 10) {
            return res.status(400).json({
                message: "You already have 10 players. Sell a player before buying a new one."
            });
        }

        // Obtener datos de todos los jugadores del usuario
        const allTeamPlayersInfo = await Promise.all(
            teamPlayers.map(async (player) => {
                return await getPlayerInfo(player.playerId);
            })
        );

        // Filtrar null values y contar jugadores del mismo equipo
        const validTeamPlayers = allTeamPlayersInfo.filter(p => p !== null);
        const sameTeamPlayers = validTeamPlayers.filter(p => p.team === playerInfo.team);

        if (sameTeamPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players from ${playerInfo.teamName || playerInfo.team}. Maximum reached.`
            });
        }

        // Contar jugadores por posición
        const positionPlayers = validTeamPlayers.filter(p =>
            p.role?.toLowerCase() === playerInfo.role?.toLowerCase()
        );

        if (positionPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players for the ${playerInfo.role} position. Maximum reached.`
            });
        }

        // Todo está bien, crear la compra
        const newUserPlayer = new UserPlayer({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        await newUserPlayer.save();

        // Restar el dinero del usuario
        userLeague.money -= playerInfo.price;
        await userLeague.save();

        res.status(201).json({
            message: "Player purchased successfully",
            player: playerInfo,
            remainingMoney: userLeague.money
        });
    } catch (error) {
        console.error("Error buying player:", error);
        res.status(500).json({ message: "Failed to buy player" });
    }
});

// GET /api/players/user/:leagueId - Obtener jugadores del usuario en una liga específica
router.get('/players/user/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Verificar que la liga existe
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verificar que el usuario es participante de la liga
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Obtener jugadores comprados por el usuario en esta liga
        const userPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        if (!userPlayers.length) {
            return res.json([]);
        }

        // Obtener información detallada de cada jugador
        const playerDetails = await Promise.all(
            userPlayers.map(async (userPlayer) => {
                const playerInfo = await getPlayerInfo(userPlayer.playerId);
                if (playerInfo) {
                    return {
                        ...playerInfo,
                        purchaseDate: userPlayer.purchaseDate
                    };
                }
                return null;
            })
        );

        // Filtrar null values (jugadores que ya no existen)
        const validPlayers = playerDetails.filter(p => p !== null);

        res.json(validPlayers);
    } catch (error) {
        console.error("Error fetching user's players:", error);
        res.status(500).json({ message: "Failed to fetch your players" });
    }
});

// Establecer jugador como titular
router.post('/players/lineup', auth, async (req, res) => {
    try {
        const { playerId, leagueId, position, matchday } = req.body;

        // Verificar que el usuario posee este jugador
        const userOwnsPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userOwnsPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Obtener información del jugador para verificar posición
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Verificar que la posición coincide con la del jugador
        if (playerInfo.role?.toLowerCase() !== position.toLowerCase()) {
            return res.status(400).json({
                message: `This player is a ${playerInfo.role}, not a ${position}`
            });
        }

        // Buscar si ya hay un titular para esa posición
        const existingLineup = await LineupPlayer.findOne({
            userId: req.user.id,
            leagueId,
            position,
            matchday: matchday || 1
        });

        if (existingLineup) {
            // Actualizar el jugador titular
            existingLineup.playerId = playerId;
            await existingLineup.save();
        } else {
            // Crear nuevo jugador titular
            const newLineup = new LineupPlayer({
                userId: req.user.id,
                leagueId,
                playerId,
                position,
                matchday: matchday || 1
            });
            await newLineup.save();
        }

        res.status(200).json({
            message: "Player set as starter successfully"
        });
    } catch (error) {
        console.error("Error setting player as starter:", error);
        res.status(500).json({ message: "Failed to set player as starter" });
    }
});

// Obtener alineación actual
router.get('/players/lineup/:leagueId/:matchday?', auth, async (req, res) => {
    try {
        const { leagueId, matchday = 1 } = req.params;

        const lineup = await LineupPlayer.find({
            userId: req.user.id,
            leagueId,
            matchday: parseInt(matchday)
        });

        // Obtener información detallada de los jugadores de la alineación
        const lineupDetails = await Promise.all(
            lineup.map(async (lineupPlayer) => {
                const playerInfo = await getPlayerInfo(lineupPlayer.playerId);
                return {
                    ...playerInfo,
                    position: lineupPlayer.position
                };
            })
        );

        res.json(lineupDetails);
    } catch (error) {
        console.error("Error fetching lineup:", error);
        res.status(500).json({ message: "Failed to fetch lineup" });
    }
});

// Vender jugador al mercado
router.post('/players/sell/market', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        // Verificar que el usuario posee este jugador
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Obtener información del jugador para calcular el precio de venta
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Calcular precio de venta (1/3 menos del original)
        const sellPrice = Math.round(playerInfo.price * 2 / 3);

        // Eliminar al jugador de la colección de usuarios
        await UserPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Eliminar de la alineación si estaba como titular
        await LineupPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Añadir dinero al usuario
        const userLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId
        });

        if (userLeague) {
            userLeague.money += sellPrice;
            await userLeague.save();
        }

        res.status(200).json({
            message: "Player sold successfully",
            sellPrice,
            newBalance: userLeague.money
        });
    } catch (error) {
        console.error("Error selling player:", error);
        res.status(500).json({ message: "Failed to sell player" });
    }
});

// Crear oferta para otro usuario
router.post('/players/sell/offer', auth, async (req, res) => {
    try {
        const { playerId, leagueId, targetUserId, price } = req.body;

        // Verificar que el usuario posee este jugador
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Verificar que el usuario destino existe y está en la liga
        const targetParticipant = await MyLeagues.findOne({
            _id: leagueId,
            'participants.user': targetUserId
        });

        if (!targetParticipant) {
            return res.status(400).json({ message: "Target user is not in this league" });
        }

        // Crear nueva oferta
        const newOffer = new PlayerOffer({
            playerId,
            leagueId,
            sellerUserId: req.user.id,
            buyerUserId: targetUserId,
            price,
            status: 'pending'
        });

        await newOffer.save();

        res.status(201).json({
            message: "Offer created successfully",
            offerId: newOffer._id
        });
    } catch (error) {
        console.error("Error creating offer:", error);
        res.status(500).json({ message: "Failed to create offer" });
    }
});

// Aceptar oferta
router.post('/players/offer/accept/:offerId', auth, async (req, res) => {
    try {
        const { offerId } = req.params;

        // Buscar la oferta
        const offer = await PlayerOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Verificar que el usuario es el comprador
        if (offer.buyerUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not the buyer of this offer" });
        }

        // Verificar fondos del comprador
        const buyerLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        if (!buyerLeague || buyerLeague.money < offer.price) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        // Verificar que el vendedor aún tiene el jugador
        const sellerPlayer = await UserPlayer.findOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (!sellerPlayer) {
            return res.status(400).json({ message: "Seller no longer owns this player" });
        }

        // Transferir el jugador
        // 1. Eliminar del vendedor
        await UserPlayer.deleteOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        // 2. Asignar al comprador
        const newUserPlayer = new UserPlayer({
            playerId: offer.playerId,
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        await newUserPlayer.save();

        // 3. Transferir el dinero
        // Restar al comprador
        buyerLeague.money -= offer.price;
        await buyerLeague.save();

        // Sumar al vendedor
        const sellerLeague = await UserLeague.findOne({
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (sellerLeague) {
            sellerLeague.money += offer.price;
            await sellerLeague.save();
        }

        // Marcar oferta como completada
        offer.status = 'completed';
        await offer.save();

        res.status(200).json({
            message: "Transfer completed successfully"
        });
    } catch (error) {
        console.error("Error accepting offer:", error);
        res.status(500).json({ message: "Failed to accept offer" });
    }
});

// Función auxiliar para obtener información de un jugador
async function getPlayerInfo(playerId) {
    try {
        const response = await axios.get("https://esports-api.lolesports.com/persisted/gw/getTeams", {
            headers: {
                "x-api-key": API_KEY
            },
            params: {
                hl: "en-US"
            }
        });

        const allTeams = response.data.data.teams || [];

        // Buscar el jugador en todos los equipos
        for (const team of allTeams) {
            if (team.players) {
                const player = team.players.find(p => p.id === playerId);
                if (player) {
                    // Verificar que no sea "Ben01"
                    if (player.summonerName === "Ben01" || player.name === "Ben01") {
                        return null;
                    }

                    return {
                        ...player,
                        team: team.code,
                        teamName: team.name,
                        teamId: team.id,
                        price: Math.floor(Math.random() * 5) + 5 // Precios entre 5 y 10 millones
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching player info:", error);
        return null;
    }
}

module.exports = router;