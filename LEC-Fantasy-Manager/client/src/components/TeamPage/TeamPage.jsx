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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { useNavigate } from 'react-router-dom';
import playerService from '../../services/players.service';
import { SportsSoccer, Person, ArrowForward, Error, AttachMoney, SportsEsports, ShoppingCart } from '@mui/icons-material';
import './TeamPage.css';

// Helper function to get position color
const getPositionColor = (position) => {
    const colors = {
        top: '#F44336',    // Red
        jungle: '#4CAF50', // Green
        mid: '#2196F3',    // Blue
        adc: '#FF9800',    // Orange
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
        adc: 'ADC',
        support: 'Support'
    };

    return names[position?.toLowerCase()] || position;
};

// Helper function to get position icon
const getPositionIcon = (position) => {
    switch (position.toLowerCase()) {
        case 'top':
            return '🛡️';
        case 'jungle':
            return '🌲';
        case 'mid':
            return '⚔️';
        case 'adc':
            return '🏹';
        case 'support':
            return '💊';
        default:
            return '❓';
    }
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
                setUserPlayers(players);

                // Load current lineup
                const currentLineup = await playerService.getCurrentLineup(selectedLeague._id);

                // Convert array to object by position
                const lineupByPosition = {
                    top: null,
                    jungle: null,
                    mid: null,
                    adc: null,
                    support: null
                };

                currentLineup.forEach(player => {
                    lineupByPosition[player.position.toLowerCase()] = player;
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

    // Handle drag & drop
    const handleDragEnd = async (result) => {
        const { source, destination } = result;

        // Si no hay destino válido, no hacer nada
        if (!destination) return;

        // Si arrastró a la misma posición, no hacer nada
        if (source.droppableId === destination.droppableId &&
            source.index === destination.index) {
            return;
        }

        // Si arrastró desde la lista de jugadores a una posición
        if (source.droppableId === 'playersList' &&
            ['top', 'jungle', 'mid', 'adc', 'support'].includes(destination.droppableId)) {

            const draggedPlayer = userPlayers[source.index];
            if (!draggedPlayer) {
                console.error("Player not found at index:", source.index);
                return;
            }

            const playerId = draggedPlayer.id;
            // Aseguramos que role esté en minúsculas para la comparación
            const playerRole = (draggedPlayer.role || '').toLowerCase();

            // Verificar que la posición coincide
            if (playerRole !== destination.droppableId) {
                setError(`Este jugador es ${getPositionName(playerRole)}, no puede jugar como ${getPositionName(destination.droppableId)}`);
                return;
            }

            try {
                // Actualizar en el backend
                await playerService.setPlayerAsStarter(
                    playerId,
                    selectedLeague._id,
                    destination.droppableId
                );

                // Actualizar localmente - Crear copia completa del jugador
                setLineup(prev => ({
                    ...prev,
                    [destination.droppableId]: { ...draggedPlayer }
                }));

                setSuccessMessage(`¡${draggedPlayer.summonerName || draggedPlayer.name} establecido como titular!`);
            } catch (err) {
                console.error("Error setting player as starter:", err);
                setError(err.response?.data?.message || "Error al establecer jugador como titular");
            }
        }
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

    // Render lineup tab
    const renderLineupTab = () => {
        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    minHeight: '600px'
                }}>
                    {/* Campo a la izquierda */}
                    <Box sx={{
                        flex: 2,
                        position: 'relative',
                        height: { xs: '400px', sm: '500px', md: '600px' }
                    }}>
                        <Box className="field-background">
                            {/* Posiciones en el mapa */}
                            {Object.keys(lineup).map(position => (
                                <Droppable key={position} droppableId={position}>
                                    {(provided, snapshot) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`position-slot ${position} ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                        >
                                            <Box className="position-icon">
                                                {getPositionIcon(position)}
                                            </Box>

                                            {lineup[position] ? (
                                                <Draggable
                                                    key={lineup[position].id}
                                                    draggableId={String(lineup[position].id)}
                                                    index={0}
                                                >
                                                    {(provided) => (
                                                        <Box
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="player-avatar"
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
                                                    )}
                                                </Draggable>
                                            ) : (
                                                <Box className="empty-position">
                                                    <Typography>
                                                        {`Arrastra un ${getPositionName(position)} aquí`}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {provided.placeholder}
                                        </Box>
                                    )}
                                </Droppable>
                            ))}
                        </Box>
                    </Box>

                    {/* Lista de jugadores disponibles a la derecha */}
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

                            <Droppable droppableId="playersList">
                                {(provided) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {userPlayers.length > 0 ? (
                                            userPlayers.map((player, index) => (
                                                <Draggable
                                                    key={player.id}
                                                    draggableId={String(player.id)}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <Box
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="player-list-item"
                                                            sx={{ mb: 1 }}
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
                                                    )}
                                                </Draggable>
                                            ))
                                        ) : (
                                            <Typography>
                                                No tienes jugadores. Ve al mercado para comprar algunos.
                                            </Typography>
                                        )}

                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Paper>
                    </Box>
                </Box>
            </DragDropContext>
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
                                        src={player.imageUrl}
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

    const getPlayerImageUrl = (player) => {
        // Asegurarse de que tenemos una URL de imagen válida
        if (!player) return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';

        if (player.imageUrl && player.imageUrl.startsWith('http')) {
            return player.imageUrl;
        } else if (player.image && player.image.startsWith('http')) {
            return player.image;
        } else if (player.profilePhotoUrl && player.profilePhotoUrl.startsWith('http')) {
            return player.profilePhotoUrl;
        }
        // URL de imagen por defecto
        return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
    };

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
                    Offer player to another user
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {offerDialog.playerName}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Select the user who will receive the offer:
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="User"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value="">Select a user</option>
                            {leagueUsers.map((user) => (
                                <option key={user.id} value={user.id}>
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