import React, { useState, useEffect, useCallback } from 'react';

import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Avatar
} from '@mui/material';
import {
    ShoppingCart,
    Person,
    ArrowForward,
    Error,
    AttachMoney,
    SportsEsports,
    SportsSoccer,
    Notifications
} from '@mui/icons-material';
import PlayerOffers from '../PlayerOffers/PlayerOffers';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { useNavigate } from 'react-router-dom';
import playerService from '../../services/players.service';
import './TeamPage.css';

// Función para normalizar la posición (convierte "bottom" a "adc" para la UI)
const normalizePosition = (position) => {
    if (!position) return '';
    position = position.toLowerCase();
    if (position === 'bottom') return 'adc';
    return position;
};

// Función para desnormalizar la posición (convierte "adc" a "bottom" para la API)
const denormalizePosition = (position) => {
    if (!position) return '';
    position = position.toLowerCase();
    if (position === 'adc') return 'bottom';
    return position;
};

// Helper function to get position color
const getPositionColor = (position) => {
    const colors = {
        top: '#F44336',    // Red
        jungle: '#4CAF50', // Green
        mid: '#2196F3',    // Blue
        adc: '#FF9800',    // Orange - Usamos 'adc' para UI
        bottom: '#FF9800', // Mismo color para 'bottom' (por si acaso)
        support: '#9C27B0' // Purple
    };

    return colors[position?.toLowerCase()] || '#757575';
};

// Helper function to get full position name
const getPositionName = (position) => {
    const names = {
        top: 'Top Laner',
        jungle: 'Jungler',
        mid: 'Mid Laner',
        adc: 'ADC',         // Para UI
        bottom: 'ADC',      // Para la API
        support: 'Support'
    };

    return names[position?.toLowerCase()] || position;
};

const TeamPage = () => {
    const { selectedLeague } = useSelectedLeague();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userPlayers, setUserPlayers] = useState([]);
    const [lineup, setLineup] = useState({
        top: null,
        jungle: null,
        mid: null,
        adc: null,
        support: null
    });
    const [availableMoney, setAvailableMoney] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [successMessage, setSuccessMessage] = useState("");
    const [offersRefreshKey, setOffersRefreshKey] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    // Nueva variable para identificar la posición sobre la que se está arrastrando
    const [dragOverPosition, setDragOverPosition] = useState(null);

    // State for offer dialog
    const [offerDialog, setOfferDialog] = useState({
        open: false,
        playerId: null,
        price: 0,
        playerName: ""
    });

    // State for user selection
    const [selectedUser, setSelectedUser] = useState("");
    const [leagueUsers, setLeagueUsers] = useState([]);

    // Load team data and lineup
    useEffect(() => {
        if (!selectedLeague) {
            setLoading(false);
            return;
        }

        const fetchTeamData = async () => {
            setLoading(true);
            setError("");

            try {
                // Load user's players
                const players = await playerService.getUserPlayers(selectedLeague._id);
                // Normalizar las posiciones de los jugadores para la UI (bottom -> adc)
                const normalizedPlayers = players.map(player => {
                    const normalizedRole = normalizePosition(player.role);
                    return {
                        ...player,
                        normalizedRole, // Añadir una propiedad extra para UI
                    };
                });

                setUserPlayers(normalizedPlayers);

                // Load current lineup
                const currentLineup = await playerService.getCurrentLineup(selectedLeague._id);

                // Convert array to object by position
                const lineupByPosition = {
                    top: null,
                    jungle: null,
                    mid: null,
                    adc: null, // Usamos 'adc' en la UI
                    support: null
                };

                currentLineup.forEach(player => {
                    // Normalizar la posición (bottom -> adc) para la UI
                    const uiPosition = normalizePosition(player.position?.toLowerCase());
                    lineupByPosition[uiPosition] = player;
                });

                setLineup(lineupByPosition);

                // Load available money
                const userLeagueData = await playerService.getUserLeagueData(selectedLeague._id);
                setAvailableMoney(userLeagueData.money);

                // Load league users
                const leagueUsersData = await playerService.getLeagueUsers(selectedLeague._id);
                setLeagueUsers(leagueUsersData);
            } catch (err) {
                console.error("Error loading team data:", err);
                setError("Error loading team data");
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [selectedLeague]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle drag start
    const handleDragStart = (e, player) => {

        // Asegurarnos de convertir el ID a string para evitar problemas
        const playerId = String(player.id);

        // Normalizar la posición de "bottom" a "adc" para la UI
        const rawRole = (player.role || '').toLowerCase();
        const playerRole = normalizePosition(rawRole);

        e.dataTransfer.setData("playerId", playerId);
        e.dataTransfer.setData("playerRole", playerRole);
        e.dataTransfer.setData("originalRole", rawRole); // Guardamos la posición original también

        // Añadir una clase al elemento arrastrado para efectos visuales
        e.currentTarget.classList.add('dragging');
    };

    // Handle drag over
    const handleDragOver = (e, position) => {
        e.preventDefault(); // Necesario para permitir el drop
        setDragOverPosition(position);
    };

    // Handle drag leave
    const handleDragLeave = () => {
        setDragOverPosition(null);
    };

    // Handle drop
    const handleDrop = async (e, position) => {
        e.preventDefault();
        setDragOverPosition(null);

        // Obtener datos del jugador arrastrado
        const playerId = e.dataTransfer.getData("playerId");
        const playerRole = e.dataTransfer.getData("playerRole");
        const originalRole = e.dataTransfer.getData("originalRole");

        // Verificar que la posición coincide con el rol del jugador
        if (playerRole !== position) {
            setError(`Este jugador es ${getPositionName(playerRole)}, no puede jugar como ${getPositionName(position)}`);
            return;
        }

        try {
            // Buscar el objeto completo del jugador
            const player = userPlayers.find(p => p.id === playerId);
            if (!player) {
                console.error("Player not found:", playerId);
                setError("Error: Jugador no encontrado. Por favor, intenta de nuevo.");
                return;
            }

            // Convertir posición UI a posición API
            const apiPosition = denormalizePosition(position);

            // Actualizar en el backend
            const response = await playerService.setPlayerAsStarter(
                playerId,
                selectedLeague._id,
                apiPosition
            );

            // Actualizar localmente
            setLineup(prev => ({
                ...prev,
                [position]: player
            }));

            setSuccessMessage(`¡${player.summonerName || player.name} establecido como titular!`);
        } catch (err) {
            console.error("Error setting player as starter:", err);
            if (err.response && err.response.data) {
                console.error("API Error details:", err.response.data);
                setError(err.response.data.message || "Error al establecer jugador como titular");
            } else {
                setError("Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.");
            }
        }
    };

    // Handle drag end
    const handleDragEnd = (e) => {
        // Limpiar la clase de arrastre
        e.currentTarget.classList.remove('dragging');
        setDragOverPosition(null);
    };

    // Sell player to market
    const handleSellToMarket = async (playerId) => {
        try {
            const player = userPlayers.find(p => p.id === playerId);
            if (!player) {
                setError("Player not found");
                return;
            }

            // Verificar si hay ofertas pendientes
            const sellPrice = Math.round(player.price * 2 / 3);

            setLoading(true);
            const response = await playerService.sellPlayerToMarket(playerId, selectedLeague._id);

            // Actualizar dinero localmente
            setAvailableMoney(response.newBalance);

            // Eliminar jugador de la lista local
            setUserPlayers(prev => prev.filter(p => p.id !== playerId));

            // Si el jugador estaba en la alineación, eliminarlo
            setLineup(prev => {
                const newLineup = { ...prev };
                Object.keys(newLineup).forEach(position => {
                    if (newLineup[position] && newLineup[position].id === playerId) {
                        newLineup[position] = null;
                    }
                });
                return newLineup;
            });

            // Mostrar mensaje de éxito incluyendo información sobre ofertas canceladas
            let message = `Jugador vendido por ${sellPrice}M€!`;
            if (response.cancelledOffers && response.cancelledOffers > 0) {
                message += ` ${response.cancelledOffers} pending offer(s) were cancelled.`;
            }
            setSuccessMessage(message);

            // Actualizar los datos de ofertas si estamos en la pestaña de ofertas
            if (activeTab === 2) {
                setOffersRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error("Error selling player:", err);
            setError(err.response?.data?.message || "Error selling player");
        } finally {
            setLoading(false);
        }
    };

    // Open offer dialog to user
    const handleOfferToUser = (playerId) => {
        // First clear any previous errors
        setError("");

        // Find the player in the user's players
        const player = userPlayers.find(p => p.id === playerId);
        if (!player) {
            console.error("Player not found:", playerId);
            setError("Player not found. Please try again.");
            return;
        }

        console.log("Opening offer dialog for player:", player);

        // Check if there are any users to offer to
        if (!leagueUsers || leagueUsers.length === 0) {
            setError("No other users in this league to offer to");
            return;
        }

        // Log league users to verify IDs
        console.log("Available league users:", leagueUsers);

        // Set up the dialog with player information
        setOfferDialog({
            open: true,
            playerId: playerId,
            price: player.price || 5, // Suggested initial price, fallback to 5 if not defined
            playerName: player.summonerName || player.name || "Unknown Player",
            playerImage: getPlayerImageUrl(player) // Add the player image using the helper function
        });

        // Reset selected user
        setSelectedUser("");
    };

    // Send offer to user
    const handleSendOffer = async () => {
        try {
            if (!selectedUser) {
                setError("You must select a user");
                return;
            }

            if (offerDialog.price <= 0) {
                setError("Price must be greater than 0");
                return;
            }

            // Log the request parameters for debugging
            console.log("Creating offer with parameters:", {
                playerId: offerDialog.playerId,
                leagueId: selectedLeague._id,
                targetUserId: selectedUser, // This should be the MongoDB ObjectId string
                price: offerDialog.price
            });

            // Verify that selectedUser is a valid MongoDB ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(selectedUser)) {
                console.error("Invalid user ID format:", selectedUser);
                setError("Invalid user ID format. Please select a valid user.");
                return;
            }

            // Send the offer to the backend
            const response = await playerService.createPlayerOffer(
                offerDialog.playerId,
                selectedLeague._id,
                selectedUser,
                offerDialog.price
            );

            console.log("Offer created successfully:", response);

            // Close the dialog and reset state
            setOfferDialog({
                open: false,
                playerId: null,
                price: 0,
                playerName: ""
            });

            setSelectedUser("");
            setSuccessMessage("Offer sent successfully! The other user will be able to accept or reject it.");

            // Trigger refresh of offers list
            setOffersRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Error creating offer:", err);

            // Log detailed error information
            if (err.response) {
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
            }

            setError(err.response?.data?.message || "Error creating offer. Please try again.");
        }
    };

    // Close offer dialog
    const handleCloseOfferDialog = () => {
        setOfferDialog({
            open: false,
            playerId: null,
            price: 0,
            playerName: ""
        });
        setSelectedUser("");
    };

    // Handle price change in offer
    const handlePriceChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setOfferDialog(prev => ({
                ...prev,
                price: value
            }));
        }
    };

    // Clear messages
    const handleClearError = () => {
        setError("");
    };

    const handleClearSuccess = () => {
        setSuccessMessage("");
    };

    // Handle offer updates
    const handleOfferAction = (action, playerInfo) => {
        if (action === 'accept') {
            // Add player to local user players immediately
            if (playerInfo && playerInfo.id) {
                // Create a local version of the player for immediate UI update
                const newPlayerEntry = {
                    ...playerInfo,
                    // Add any missing required fields
                    id: playerInfo.id,
                    role: playerInfo.role || playerInfo.position,
                    summonerName: playerInfo.summonerName || playerInfo.name || "Unknown Player",
                    purchaseDate: new Date()
                };

                // Add to userPlayers array
                setUserPlayers(prev => {
                    // Check if player already exists to avoid duplicates
                    if (!prev.some(p => p.id === newPlayerEntry.id)) {
                        return [...prev, newPlayerEntry];
                    }
                    return prev;
                });
            }

            setSuccessMessage("Offer accepted successfully! The player has been added to your team.");

            // Refresh player data
            setRefreshKey(prevKey => prevKey + 1);
        } else if (action === 'reject') {
            setSuccessMessage("Offer rejected.");
        }

        // Always refresh the offers list
        setOffersRefreshKey(prevKey => prevKey + 1);
    };

    // Get player image URL helper
    const getPlayerImageUrl = (player) => {
        // Ensure we have a valid image URL
        if (!player) return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';

        if (player.imageUrl && player.imageUrl.startsWith('http')) {
            return player.imageUrl;
        } else if (player.image && player.image.startsWith('http')) {
            return player.image;
        } else if (player.profilePhotoUrl && player.profilePhotoUrl.startsWith('http')) {
            return player.profilePhotoUrl;
        }
        // Default image URL
        return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
    };

    // Render lineup tab
    const renderLineupTab = () => {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                minHeight: '600px'
            }}>
                {/* Field on the left */}
                <Box sx={{
                    flex: 2,
                    position: 'relative',
                    height: { xs: '400px', sm: '500px', md: '600px' }
                }}>
                    <Box className="field-background">
                        {/* Positions on the map */}
                        {Object.keys(lineup).map(position => (
                            <Box
                                key={position}
                                className={`position-slot ${position} ${dragOverPosition === position ? 'dragging-over' : ''}`}
                                onDragOver={(e) => handleDragOver(e, position)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, position)}
                            >

                                {lineup[position] ? (
                                    <Box
                                        className="player-avatar"
                                        draggable
                                        onDragStart={(e) => {
                                            // Si arrastramos desde el campo, asegurarnos de que playerRole sea normalizado
                                            const normalizedRole = normalizePosition(lineup[position].role);
                                            const playerWithNormalizedRole = {
                                                ...lineup[position],
                                                role: normalizedRole
                                            };
                                            handleDragStart(e, playerWithNormalizedRole);
                                        }}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <img
                                            src={getPlayerImageUrl(lineup[position])}
                                            alt={lineup[position].name || lineup[position].summonerName || "Jugador"}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
                                            }}
                                        />
                                        <Typography className="player-name">
                                            {lineup[position].summonerName || lineup[position].name || "Jugador"}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box className="empty-position">
                                        <Typography>
                                            {`Arrastra un ${getPositionName(position)} aquí`}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Available players list on the right */}
                <Box sx={{
                    flex: 1,
                    minWidth: { xs: '100%', md: '250px' },
                    maxWidth: { xs: '100%', md: '350px' }
                }}>
                    <Paper sx={{
                        p: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        height: '100%',
                        maxHeight: { xs: '350px', md: '600px' },
                        overflow: 'auto'
                    }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Jugadores Disponibles
                        </Typography>

                        <Box className="players-list">
                            {userPlayers.length > 0 ? (
                                userPlayers.map((player) => (
                                    <Box
                                        key={player.id}
                                        className="player-list-item"
                                        sx={{
                                            mb: 1,
                                            borderLeft: `4px solid ${getPositionColor(player.role)}`
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, player)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <img
                                            src={getPlayerImageUrl(player)}
                                            alt={player.name || player.summonerName || "Jugador"}
                                            className="player-thumbnail"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
                                            }}
                                        />
                                        <Box>
                                            <Typography>
                                                {player.summonerName || player.name || "Jugador"}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                {getPositionName(player.role)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography>
                                    No tienes jugadores. Ve al mercado para comprar algunos.
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        );
    };

    // Render market tab
    const renderMarketTab = () => {
        return (
            <Box className="team-market">
                <Paper className="money-info-card">
                    <Typography variant="h6">
                        Capital disponible
                    </Typography>
                    <Typography variant="h4">
                        {availableMoney}M€
                    </Typography>
                </Paper>

                <Typography variant="h5" sx={{ mb: 2, mt: 3 }}>
                    Your Players
                </Typography>

                <Grid container spacing={3}>
                    {userPlayers.map(player => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                            <Paper className="player-market-card">
                                <Box className="player-info">
                                    <img
                                        src={getPlayerImageUrl(player)}
                                        alt={player.name}
                                        className="player-avatar-market"
                                    />
                                    <Box>
                                        <Typography variant="h6">
                                            {player.summonerName || player.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {player.team} - {getPositionName(player.role)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            Precio de compra: {player.price}M€
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box className="player-actions">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleSellToMarket(player.id)}
                                    >
                                        Vender por {Math.round(player.price * 2 / 3)}M€
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleOfferToUser(player.id)}
                                    >
                                        Oferta a otro jugador
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {userPlayers.length === 0 && (
                    <Paper className="empty-team-message">
                        <Typography variant="h6">
                            You don't have any players in your team
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/market')}
                            sx={{ mt: 2 }}
                            startIcon={<ShoppingCart />}
                        >
                            Go to Market
                        </Button>
                    </Paper>
                )}
            </Box>
        );
    };

    // If no league selected, show message
    if (!selectedLeague) {
        return (
            <Box className="team-container no-league">
                <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
                    You must select a league to view your team
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                >
                    Go select a league
                </Button>
            </Box>
        );
    }

    return (
        <Box className="team-container">
            <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                My Team - {selectedLeague.Nombre}
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    <Paper sx={{ mb: 3, background: '#0A1428', marginTop: '5vh' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            centered
                            variant="fullWidth"
                        >
                            <Tab
                                label="Alineación"
                                icon={<SportsEsports />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Mercado"
                                icon={<AttachMoney />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Ofertas"
                                icon={<Notifications />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Paper>

                    {activeTab === 0 && renderLineupTab()}
                    {activeTab === 1 && renderMarketTab()}
                    {activeTab === 2 && (
                        <PlayerOffers
                            leagueId={selectedLeague._id}
                            onOfferAction={(action, playerInfo) => handleOfferAction(action, playerInfo)}
                            onRefresh={offersRefreshKey}
                        />
                    )}
                </>
            )}

            {/* Offer dialog */}
            <Dialog open={offerDialog.open} onClose={handleCloseOfferDialog}>
                <DialogTitle sx={{ bgcolor: '#1A2634', color: 'white' }}>
                    Ofrecer jugador a otro usuario
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#1A2634', color: 'white', pt: 2 }}>
                    <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
                        {offerDialog.playerId && (
                            <Avatar
                                src={offerDialog.playerImage}
                                alt={offerDialog.playerName}
                                sx={{ width: 60, height: 60, mr: 2 }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
                                }}
                            />
                        )}
                        <Typography variant="h6">
                            {offerDialog.playerName}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Selecciona a que usuario quieres ofrecer tu jugador:
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="Usuario"
                            value={selectedUser}
                            onChange={(e) => {
                                console.log("Selected user ID:", e.target.value);
                                setSelectedUser(e.target.value);
                            }}
                            error={!selectedUser && error && error.includes("user")}
                            helperText={!selectedUser && error && error.includes("user") ? "User selection is required" : ""}
                            SelectProps={{
                                native: true,
                            }}
                            InputLabelProps={{
                                style: { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    color: 'white',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '& .MuiFormHelperText-root': {
                                    color: '#f44336',
                                },
                            }}
                        >
                            <option value="" style={{ color: "black" }}></option>
                            {leagueUsers.map((user) => (
                                <option key={user.id} value={user.id} style={{ color: "black" }}>
                                    {user.username}
                                </option>
                            ))}
                        </TextField>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Precio ofertado (en millones de €):
                        </Typography>

                        <TextField
                            type="number"
                            fullWidth
                            value={offerDialog.price}
                            onChange={handlePriceChange}
                            inputProps={{ min: 1 }}
                            InputLabelProps={{
                                style: { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    color: 'white',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                            }}
                        />
                    </Box>

                    <Typography variant="body2" sx={{ mt: 3, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
                        El usuario seleccionado recibirá esta oferta y podrá aceptarla o rechazarla.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#1A2634', p: 2 }}>
                    <Button
                        onClick={handleCloseOfferDialog}
                        sx={{ color: 'white' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSendOffer}
                        variant="contained"
                        color="primary"
                        disabled={!selectedUser || offerDialog.price <= 0}
                    >
                        Enviar oferta
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alerts */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleClearError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClearError}
                    severity="error"
                    variant="filled"
                >
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={handleClearSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClearSuccess}
                    severity="success"
                    variant="filled"
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TeamPage;