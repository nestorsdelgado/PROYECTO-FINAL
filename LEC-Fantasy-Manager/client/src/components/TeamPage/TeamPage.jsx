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

        // If no valid destination, do nothing
        if (!destination) return;

        // If dragged to the same position, do nothing
        if (source.droppableId === destination.droppableId &&
            source.index === destination.index) {
            return;
        }

        // If dragged from player list to a position
        if (source.droppableId === 'playersList' &&
            ['top', 'jungle', 'mid', 'adc', 'support'].includes(destination.droppableId)) {

            const playerId = userPlayers[source.index].id;
            const playerRole = userPlayers[source.index].role.toLowerCase();

            // Verify position matches
            if (playerRole !== destination.droppableId) {
                setError(`This player is ${getPositionName(playerRole)}, not ${getPositionName(destination.droppableId)}`);
                return;
            }

            try {
                // Update in backend
                await playerService.setPlayerAsStarter(
                    playerId,
                    selectedLeague._id,
                    destination.droppableId
                );

                // Update locally
                setLineup(prev => ({
                    ...prev,
                    [destination.droppableId]: userPlayers[source.index]
                }));

                setSuccessMessage(`${userPlayers[source.index].summonerName || userPlayers[source.index].name} set as starter!`);
            } catch (err) {
                console.error("Error setting player as starter:", err);
                setError(err.response?.data?.message || "Error setting player as starter");
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
            <Box className="lineup-container">
                <Box className="field-background">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        {/* Position slots on the map */}
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
                                                draggableId={lineup[position].id}
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
                                                            src={lineup[position].imageUrl}
                                                            alt={lineup[position].name}
                                                        />
                                                        <Typography className="player-name">
                                                            {lineup[position].summonerName || lineup[position].name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ) : (
                                            <Box className="empty-position">
                                                <Typography>
                                                    {`Drag a ${getPositionName(position)} here`}
                                                </Typography>
                                            </Box>
                                        )}

                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        ))}

                        {/* Available players list */}
                        <Droppable droppableId="playersList">
                            {(provided) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="available-players"
                                >
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Available Players
                                    </Typography>

                                    {userPlayers.length > 0 ? (
                                        userPlayers.map((player, index) => (
                                            <Draggable
                                                key={player.id}
                                                draggableId={player.id}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="player-list-item"
                                                    >
                                                        <img
                                                            src={player.imageUrl}
                                                            alt={player.name}
                                                            className="player-thumbnail"
                                                        />
                                                        <Box>
                                                            <Typography>
                                                                {player.summonerName || player.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {getPositionName(player.role)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))
                                    ) : (
                                        <Typography>
                                            You don't have any players. Go to the market to buy some.
                                        </Typography>
                                    )}

                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
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
                    <Paper sx={{ mb: 3, background:'#0A1428', marginTop: '5vh' }}>
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