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

// GET /api/user-league/:leagueId - Get user's data for a specific league
router.get('/user-league/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Verify the league exists
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Get user's financial data for this league
        const userLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId
        });

        if (!userLeague) {
            // If no record exists (shouldn't happen), create one with default values
            const newUserLeague = new UserLeague({
                userId: req.user.id,
                leagueId,
                money: 75 // Default initial money
            });

            await newUserLeague.save();

            return res.json(newUserLeague);
        }

        res.json(userLeague);
    } catch (error) {
        console.error("Error fetching user league data:", error);
        res.status(500).json({ message: "Failed to fetch user league data" });
    }
});

// GET /api/league-users/:leagueId - Get all users in a league
router.get('/league-users/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Verify the league exists
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Get all users in the league (excluding the requesting user)
        const userIds = league.participants
            .filter(p => p.user.toString() !== req.user.id)
            .map(p => p.user);

        const users = await User.find({ _id: { $in: userIds } })
            .select('username name');

        res.json(users);
    } catch (error) {
        console.error("Error fetching league users:", error);
        res.status(500).json({ message: "Failed to fetch league users" });
    }
});

// POST /api/players/buy - Buy a player for the selected league (requires authentication)
router.post('/players/buy', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        if (!playerId || !leagueId) {
            return res.status(400).json({ message: "Player ID and League ID are required" });
        }

        // Verify the league exists and user is a participant
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Verify player isn't already owned by the user in this league
        const existingPurchase = await UserPlayer.findOne({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        if (existingPurchase) {
            return res.status(400).json({ message: "You already own this player in this league" });
        }

        // Get player info to validate
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player not found" });
        }

        // Verify user has enough funds
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

        // Verify team limit (max 2 players per team)
        const teamPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        // Verify total player limit (max 10 players)
        if (teamPlayers.length >= 10) {
            return res.status(400).json({
                message: "You already have 10 players. Sell a player before buying a new one."
            });
        }

        // Get all player info for team validation
        const allTeamPlayersInfo = await Promise.all(
            teamPlayers.map(async (player) => {
                return await getPlayerInfo(player.playerId);
            })
        );

        // Filter null values and count players from the same team
        const validTeamPlayers = allTeamPlayersInfo.filter(p => p !== null);
        const sameTeamPlayers = validTeamPlayers.filter(p => p.team === playerInfo.team);

        if (sameTeamPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players from ${playerInfo.teamName || playerInfo.team}. Maximum reached.`
            });
        }

        // Count players by position (max 2 per position)
        const positionPlayers = validTeamPlayers.filter(p =>
            p.role?.toLowerCase() === playerInfo.role?.toLowerCase()
        );

        if (positionPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players for the ${playerInfo.role} position. Maximum reached.`
            });
        }

        // All good, create the purchase
        const newUserPlayer = new UserPlayer({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        await newUserPlayer.save();

        // Deduct money from user
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

// GET /api/players/user/:leagueId - Get user's players in a specific league
router.get('/players/user/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Verify league exists
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Get players owned by user in this league
        const userPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        if (!userPlayers.length) {
            return res.json([]);
        }

        // Get detailed info for each player
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

        // Filter null values (players that no longer exist)
        const validPlayers = playerDetails.filter(p => p !== null);

        res.json(validPlayers);
    } catch (error) {
        console.error("Error fetching user's players:", error);
        res.status(500).json({ message: "Failed to fetch your players" });
    }
});

// Set player as starter
router.post('/players/lineup', auth, async (req, res) => {
    try {
        const { playerId, leagueId, position, matchday } = req.body;

        // Verify user owns this player
        const userOwnsPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userOwnsPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Get player info to verify position
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Verify position matches player's role
        if (playerInfo.role?.toLowerCase() !== position.toLowerCase()) {
            return res.status(400).json({
                message: `This player is a ${playerInfo.role}, not a ${position}`
            });
        }

        // Check if there's already a starter for this position
        const existingLineup = await LineupPlayer.findOne({
            userId: req.user.id,
            leagueId,
            position,
            matchday: matchday || 1
        });

        if (existingLineup) {
            // Update the starter
            existingLineup.playerId = playerId;
            await existingLineup.save();
        } else {
            // Create new starter
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

// Get current lineup
router.get('/players/lineup/:leagueId/:matchday?', auth, async (req, res) => {
    try {
        const { leagueId, matchday = 1 } = req.params;

        const lineup = await LineupPlayer.find({
            userId: req.user.id,
            leagueId,
            matchday: parseInt(matchday)
        });

        // Get detailed info for lineup players
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

// Sell player to market
router.post('/players/sell/market', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        // Verify user owns this player
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Get player info to calculate sell price
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Calculate sell price (1/3 less than original)
        const sellPrice = Math.round(playerInfo.price * 2 / 3);

        // Remove player from user's collection
        await UserPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Remove from lineup if they were a starter
        await LineupPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Add money to user
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

// Create offer to another user
router.post('/players/sell/offer', auth, async (req, res) => {
    try {
        const { playerId, leagueId, targetUserId, price } = req.body;

        // Verify user owns this player
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Verify target user exists and is in the league
        const targetParticipant = await MyLeagues.findOne({
            _id: leagueId,
            'participants.user': targetUserId
        });

        if (!targetParticipant) {
            return res.status(400).json({ message: "Target user is not in this league" });
        }

        // Create new offer
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

// GET /api/players/offers/:leagueId - Get pending offers for user in a league
router.get('/players/offers/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Get offers where user is the buyer
        const incomingOffers = await PlayerOffer.find({
            leagueId,
            buyerUserId: req.user.id,
            status: 'pending'
        }).populate('sellerUserId', 'username name');

        // Get offers where user is the seller
        const outgoingOffers = await PlayerOffer.find({
            leagueId,
            sellerUserId: req.user.id,
            status: 'pending'
        }).populate('buyerUserId', 'username name');

        // Get detailed info for each player in the offers
        const processedIncomingOffers = await Promise.all(
            incomingOffers.map(async (offer) => {
                const playerInfo = await getPlayerInfo(offer.playerId);
                return {
                    ...offer.toObject(),
                    player: playerInfo
                };
            })
        );

        const processedOutgoingOffers = await Promise.all(
            outgoingOffers.map(async (offer) => {
                const playerInfo = await getPlayerInfo(offer.playerId);
                return {
                    ...offer.toObject(),
                    player: playerInfo
                };
            })
        );

        res.json({
            incoming: processedIncomingOffers,
            outgoing: processedOutgoingOffers
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).json({ message: "Failed to fetch offers" });
    }
});

// Accept offer
router.post('/players/offer/accept/:offerId', auth, async (req, res) => {
    try {
        const { offerId } = req.params;

        // Find the offer
        const offer = await PlayerOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Verify user is the buyer
        if (offer.buyerUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not the buyer of this offer" });
        }

        // Verify buyer has enough funds
        const buyerLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        if (!buyerLeague || buyerLeague.money < offer.price) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        // Verify seller still owns the player
        const sellerPlayer = await UserPlayer.findOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (!sellerPlayer) {
            return res.status(400).json({ message: "Seller no longer owns this player" });
        }

        // Transfer the player
        // 1. Remove from seller
        await UserPlayer.deleteOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        // 2. Assign to buyer
        const newUserPlayer = new UserPlayer({
            playerId: offer.playerId,
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        await newUserPlayer.save();

        // 3. Transfer the money
        // Deduct from buyer
        buyerLeague.money -= offer.price;
        await buyerLeague.save();

        // Add to seller
        const sellerLeague = await UserLeague.findOne({
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (sellerLeague) {
            sellerLeague.money += offer.price;
            await sellerLeague.save();
        }

        // Mark offer as completed
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

// Reject offer
router.post('/players/offer/reject/:offerId', auth, async (req, res) => {
    try {
        const { offerId } = req.params;

        // Find the offer
        const offer = await PlayerOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Verify user is the buyer or seller
        if (offer.buyerUserId.toString() !== req.user.id && offer.sellerUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not part of this offer" });
        }

        // Mark offer as rejected
        offer.status = 'rejected';
        await offer.save();

        res.status(200).json({
            message: "Offer rejected successfully"
        });
    } catch (error) {
        console.error("Error rejecting offer:", error);
        res.status(500).json({ message: "Failed to reject offer" });
    }
});

// POST /api/players/buy - Buy a player for the selected league (requires authentication)
router.post('/players/buy', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        if (!playerId || !leagueId) {
            return res.status(400).json({ message: "Player ID and League ID are required" });

            // Helper function to get player info from LoL Esports API
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

                    // Search for the player in all teams
                    for (const team of allTeams) {
                        if (team.players) {
                            const player = team.players.find(p => p.id === playerId);
                            if (player) {
                                // Skip "Ben01" player
                                if (player.summonerName === "Ben01" || player.name === "Ben01") {
                                    return null;
                                }

                                // Add price and team info
                                return {
                                    ...player,
                                    team: team.code,
                                    teamName: team.name,
                                    teamId: team.id,
                                    price: Math.floor(Math.random() * 5) + 5 // Prices between 5-10 million
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
        }

        // Verify the league exists and user is a participant
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Verify player isn't already owned by the user in this league
        const existingPurchase = await UserPlayer.findOne({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        if (existingPurchase) {
            return res.status(400).json({ message: "You already own this player in this league" });
        }

        // Get player info to validate
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player not found" });
        }

        // Verify user has enough funds
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

        // Verify team limit (max 2 players per team)
        const teamPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        // Verify total player limit (max 10 players)
        if (teamPlayers.length >= 10) {
            return res.status(400).json({
                message: "You already have 10 players. Sell a player before buying a new one."
            });
        }

        // Get all player info for team validation
        const allTeamPlayersInfo = await Promise.all(
            teamPlayers.map(async (player) => {
                return await getPlayerInfo(player.playerId);
            })
        );

        // Filter null values and count players from the same team
        const validTeamPlayers = allTeamPlayersInfo.filter(p => p !== null);
        const sameTeamPlayers = validTeamPlayers.filter(p => p.team === playerInfo.team);

        if (sameTeamPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players from ${playerInfo.teamName || playerInfo.team}. Maximum reached.`
            });
        }

        // Count players by position (max 2 per position)
        const positionPlayers = validTeamPlayers.filter(p =>
            p.role?.toLowerCase() === playerInfo.role?.toLowerCase()
        );

        if (positionPlayers.length >= 2) {
            return res.status(400).json({
                message: `You already have 2 players for the ${playerInfo.role} position. Maximum reached.`
            });
        }

        // All good, create the purchase
        const newUserPlayer = new UserPlayer({
            playerId: playerId,
            userId: req.user.id,
            leagueId: leagueId
        });

        await newUserPlayer.save();

        // Deduct money from user
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

// GET /api/players/user/:leagueId - Get user's players in a specific league
router.get('/players/user/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Verify league exists
        const league = await MyLeagues.findById(leagueId);
        if (!league) {
            return res.status(404).json({ message: "League not found" });
        }

        // Verify user is part of the league
        const isParticipant = league.participants.some(p =>
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not a participant in this league" });
        }

        // Get players owned by user in this league
        const userPlayers = await UserPlayer.find({
            userId: req.user.id,
            leagueId: leagueId
        });

        if (!userPlayers.length) {
            return res.json([]);
        }

        // Get detailed info for each player
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

        // Filter null values (players that no longer exist)
        const validPlayers = playerDetails.filter(p => p !== null);

        res.json(validPlayers);
    } catch (error) {
        console.error("Error fetching user's players:", error);
        res.status(500).json({ message: "Failed to fetch your players" });
    }
});

// Set player as starter
router.post('/players/lineup', auth, async (req, res) => {
    try {
        const { playerId, leagueId, position, matchday } = req.body;

        // Verify user owns this player
        const userOwnsPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userOwnsPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Get player info to verify position
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Verify position matches player's role
        if (playerInfo.role?.toLowerCase() !== position.toLowerCase()) {
            return res.status(400).json({
                message: `This player is a ${playerInfo.role}, not a ${position}`
            });
        }

        // Check if there's already a starter for this position
        const existingLineup = await LineupPlayer.findOne({
            userId: req.user.id,
            leagueId,
            position,
            matchday: matchday || 1
        });

        if (existingLineup) {
            // Update the starter
            existingLineup.playerId = playerId;
            await existingLineup.save();
        } else {
            // Create new starter
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

// Get current lineup
router.get('/players/lineup/:leagueId/:matchday?', auth, async (req, res) => {
    try {
        const { leagueId, matchday = 1 } = req.params;

        const lineup = await LineupPlayer.find({
            userId: req.user.id,
            leagueId,
            matchday: parseInt(matchday)
        });

        // Get detailed info for lineup players
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

// Sell player to market
router.post('/players/sell/market', auth, async (req, res) => {
    try {
        const { playerId, leagueId } = req.body;

        // Verify user owns this player
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Get player info to calculate sell price
        const playerInfo = await getPlayerInfo(playerId);
        if (!playerInfo) {
            return res.status(404).json({ message: "Player info not found" });
        }

        // Calculate sell price (1/3 less than original)
        const sellPrice = Math.round(playerInfo.price * 2 / 3);

        // Remove player from user's collection
        await UserPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Remove from lineup if they were a starter
        await LineupPlayer.deleteOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        // Add money to user
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

// Create offer to another user
router.post('/players/sell/offer', auth, async (req, res) => {
    try {
        const { playerId, leagueId, targetUserId, price } = req.body;

        // Verify user owns this player
        const userPlayer = await UserPlayer.findOne({
            playerId,
            userId: req.user.id,
            leagueId
        });

        if (!userPlayer) {
            return res.status(400).json({ message: "You don't own this player" });
        }

        // Verify target user exists and is in the league
        const targetParticipant = await MyLeagues.findOne({
            _id: leagueId,
            'participants.user': targetUserId
        });

        if (!targetParticipant) {
            return res.status(400).json({ message: "Target user is not in this league" });
        }

        // Create new offer
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

// GET /api/players/offers/:leagueId - Get pending offers for user in a league
router.get('/players/offers/:leagueId', auth, async (req, res) => {
    try {
        const { leagueId } = req.params;

        // Get offers where user is the buyer
        const incomingOffers = await PlayerOffer.find({
            leagueId,
            buyerUserId: req.user.id,
            status: 'pending'
        }).populate('sellerUserId', 'username name');

        // Get offers where user is the seller
        const outgoingOffers = await PlayerOffer.find({
            leagueId,
            sellerUserId: req.user.id,
            status: 'pending'
        }).populate('buyerUserId', 'username name');

        // Get detailed info for each player in the offers
        const processedIncomingOffers = await Promise.all(
            incomingOffers.map(async (offer) => {
                const playerInfo = await getPlayerInfo(offer.playerId);
                return {
                    ...offer.toObject(),
                    player: playerInfo
                };
            })
        );

        const processedOutgoingOffers = await Promise.all(
            outgoingOffers.map(async (offer) => {
                const playerInfo = await getPlayerInfo(offer.playerId);
                return {
                    ...offer.toObject(),
                    player: playerInfo
                };
            })
        );

        res.json({
            incoming: processedIncomingOffers,
            outgoing: processedOutgoingOffers
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).json({ message: "Failed to fetch offers" });
    }
});

// Accept offer
router.post('/players/offer/accept/:offerId', auth, async (req, res) => {
    try {
        const { offerId } = req.params;

        // Find the offer
        const offer = await PlayerOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Verify user is the buyer
        if (offer.buyerUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not the buyer of this offer" });
        }

        // Verify buyer has enough funds
        const buyerLeague = await UserLeague.findOne({
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        if (!buyerLeague || buyerLeague.money < offer.price) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        // Verify seller still owns the player
        const sellerPlayer = await UserPlayer.findOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (!sellerPlayer) {
            return res.status(400).json({ message: "Seller no longer owns this player" });
        }

        // Transfer the player
        // 1. Remove from seller
        await UserPlayer.deleteOne({
            playerId: offer.playerId,
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        // 2. Assign to buyer
        const newUserPlayer = new UserPlayer({
            playerId: offer.playerId,
            userId: req.user.id,
            leagueId: offer.leagueId
        });

        await newUserPlayer.save();

        // 3. Transfer the money
        // Deduct from buyer
        buyerLeague.money -= offer.price;
        await buyerLeague.save();

        // Add to seller
        const sellerLeague = await UserLeague.findOne({
            userId: offer.sellerUserId,
            leagueId: offer.leagueId
        });

        if (sellerLeague) {
            sellerLeague.money += offer.price;
            await sellerLeague.save();
        }

        // Mark offer as completed
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

// Reject offer
router.post('/players/offer/reject/:offerId', auth, async (req, res) => {
    try {
        const { offerId } = req.params;

        // Find the offer
        const offer = await PlayerOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Verify user is the buyer or seller
        if (offer.buyerUserId.toString() !== req.user.id && offer.sellerUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not part of this offer" });
        }

        // Mark offer as rejected
        offer.status = 'rejected';
        await offer.save();

        res.status(200).json({
            message: "Offer rejected successfully"
        });
    } catch (error) {
        console.error("Error rejecting offer:", error);
        res.status(500).json({ message: "Failed to reject offer" });
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