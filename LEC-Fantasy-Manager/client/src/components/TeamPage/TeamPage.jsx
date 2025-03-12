import React, { useState, useEffect } from 'react';
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
    Snackbar
} from '@mui/material';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { useNavigate } from 'react-router-dom';
import playerService from '../../services/players.service';
import { SportsSoccer, Person, ArrowForward, Error, AttachMoney, SportsEsports, ShoppingCart } from '@mui/icons-material';
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
            if (!player) return;

            const sellPrice = Math.round(player.price * 2 / 3);

            const response = await playerService.sellPlayerToMarket(playerId, selectedLeague._id);

            // Update money
            setAvailableMoney(response.newBalance);

            // Remove player from list
            setUserPlayers(prev => prev.filter(p => p.id !== playerId));

            // If player was in lineup, remove them
            Object.keys(lineup).forEach(position => {
                if (lineup[position] && lineup[position].id === playerId) {
                    setLineup(prev => ({
                        ...prev,
                        [position]: null
                    }));
                }
            });

            setSuccessMessage(`Player sold for ${sellPrice}M€!`);
        } catch (err) {
            console.error("Error selling player:", err);
            setError(err.response?.data?.message || "Error selling player");
        }
    };

    // Open offer dialog to user
    const handleOfferToUser = (playerId) => {
        const player = userPlayers.find(p => p.id === playerId);
        if (!player) return;

        setOfferDialog({
            open: true,
            playerId,
            price: player.price, // Suggested initial price
            playerName: player.summonerName || player.name
        });
    };

    // Send offer to user
    const handleSendOffer = async () => {
        try {
            if (!selectedUser) {
                setError("You must select a user");
                return;
            }

            await playerService.createPlayerOffer(
                offerDialog.playerId,
                selectedLeague._id,
                selectedUser,
                offerDialog.price
            );

            setOfferDialog({
                open: false,
                playerId: null,
                price: 0,
                playerName: ""
            });

            setSelectedUser("");
            setSuccessMessage("Offer sent successfully");
        } catch (err) {
            console.error("Error creating offer:", err);
            setError(err.response?.data?.message || "Error creating offer");
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
                        Available Money
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
                                            Value: {player.price}M€
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
                                        Sell for {Math.round(player.price * 2 / 3)}M€
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleOfferToUser(player.id)}
                                    >
                                        Offer to User
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
                                label="Lineup"
                                icon={<SportsEsports />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Market"
                                icon={<AttachMoney />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Paper>

                    {activeTab === 0 ? renderLineupTab() : renderMarketTab()}
                </>
            )}

            {/* Offer dialog */}
            <Dialog open={offerDialog.open} onClose={handleCloseOfferDialog}>
                <DialogTitle>
                    Ofrecer jugador
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {offerDialog.playerName}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Seleccionar participante:
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="Participante"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value=""></option>
                            {leagueUsers.map((user) => (
                                <option key={user.id} value={user.id} style={{color:"black"}}>
                                    {user.username}
                                </option>
                            ))}
                        </TextField>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Sale price (in millions €):
                        </Typography>

                        <TextField
                            type="number"
                            fullWidth
                            value={offerDialog.price}
                            onChange={handlePriceChange}
                            inputProps={{ min: 1 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseOfferDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendOffer}
                        variant="contained"
                        color="primary"
                    >
                        Send Offer
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