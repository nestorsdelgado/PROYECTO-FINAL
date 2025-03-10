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

// Función auxiliar para obtener el color de la posición
const getPositionColor = (position) => {
    const colors = {
        top: '#F44336',    // Rojo
        jungle: '#4CAF50', // Verde
        mid: '#2196F3',    // Azul
        adc: '#FF9800',    // Naranja
        support: '#9C27B0' // Púrpura
    };

    return colors[position?.toLowerCase()] || '#757575';
};

// Función auxiliar para obtener el nombre completo de la posición
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

// Función para obtener icono de posición
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

    // Estado para diálogo de oferta
    const [offerDialog, setOfferDialog] = useState({
        open: false,
        playerId: null,
        price: 0,
        playerName: ""
    });

    // Estado para selección de usuario
    const [selectedUser, setSelectedUser] = useState("");
    const [leagueUsers, setLeagueUsers] = useState([]);

    // Cargar datos del equipo y alineación
    useEffect(() => {
        if (!selectedLeague) {
            setLoading(false);
            return;
        }

        const fetchTeamData = async () => {
            setLoading(true);
            setError("");

            try {
                // Cargar jugadores del usuario
                const players = await playerService.getUserPlayers(selectedLeague._id);
                setUserPlayers(players);

                // Cargar alineación actual
                const currentLineup = await playerService.getCurrentLineup(selectedLeague._id);

                // Convertir array a objeto por posición
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

                // Cargar dinero disponible
                const userLeagueData = await playerService.getUserLeagueData(selectedLeague._id);
                setAvailableMoney(userLeagueData.money);

                // Cargar usuarios de la liga
                const leagueUsersData = await playerService.getLeagueUsers(selectedLeague._id);
                setLeagueUsers(leagueUsersData);
            } catch (err) {
                console.error("Error loading team data:", err);
                setError("Error al cargar los datos del equipo");
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [selectedLeague]);

    // Manejar cambio de pestaña
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Manejar drag & drop
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

            const playerId = userPlayers[source.index].id;
            const playerRole = userPlayers[source.index].role.toLowerCase();

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

                // Actualizar localmente
                setLineup(prev => ({
                    ...prev,
                    [destination.droppableId]: userPlayers[source.index]
                }));

                setSuccessMessage(`¡${userPlayers[source.index].summonerName || userPlayers[source.index].name} establecido como titular!`);
            } catch (err) {
                console.error("Error setting player as starter:", err);
                setError(err.response?.data?.message || "Error al establecer jugador como titular");
            }
        }
    };

    // Vender jugador al mercado
    const handleSellToMarket = async (playerId) => {
        try {
            const player = userPlayers.find(p => p.id === playerId);
            if (!player) return;

            const sellPrice = Math.round(player.price * 2 / 3);

            const response = await playerService.sellPlayerToMarket(playerId, selectedLeague._id);

            // Actualizar dinero
            setAvailableMoney(response.newBalance);

            // Eliminar jugador de la lista
            setUserPlayers(prev => prev.filter(p => p.id !== playerId));

            // Si estaba en la alineación, eliminarlo
            Object.keys(lineup).forEach(position => {
                if (lineup[position] && lineup[position].id === playerId) {
                    setLineup(prev => ({
                        ...prev,
                        [position]: null
                    }));
                }
            });

            setSuccessMessage(`¡Jugador vendido por ${sellPrice}M€!`);
        } catch (err) {
            console.error("Error selling player:", err);
            setError(err.response?.data?.message || "Error al vender jugador");
        }
    };

    // Abrir diálogo de oferta a usuario
    const handleOfferToUser = (playerId) => {
        const player = userPlayers.find(p => p.id === playerId);
        if (!player) return;

        setOfferDialog({
            open: true,
            playerId,
            price: player.price, // Precio sugerido inicial
            playerName: player.summonerName || player.name
        });
    };

    // Enviar oferta a usuario
    const handleSendOffer = async () => {
        try {
            if (!selectedUser) {
                setError("Debes seleccionar un usuario");
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
            setSuccessMessage("Oferta enviada correctamente");
        } catch (err) {
            console.error("Error creating offer:", err);
            setError(err.response?.data?.message || "Error al crear oferta");
        }
    };

    // Cerrar diálogo de oferta
    const handleCloseOfferDialog = () => {
        setOfferDialog({
            open: false,
            playerId: null,
            price: 0,
            playerName: ""
        });
        setSelectedUser("");
    };

    // Manejar cambio de precio en oferta
    const handlePriceChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setOfferDialog(prev => ({
                ...prev,
                price: value
            }));
        }
    };

    // Limpiar mensajes
    const handleClearError = () => {
        setError("");
    };

    const handleClearSuccess = () => {
        setSuccessMessage("");
    };

    // Renderizar pestaña de alineación
    const renderLineupTab = () => {
        return (
            <Box className="lineup-container">
                <Box className="field-background">
                    <DragDropContext onDragEnd={handleDragEnd}>
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
                                                    {`Arrastra un ${getPositionName(position)} aquí`}
                                                </Typography>
                                            </Box>
                                        )}

                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        ))}

                        {/* Lista de jugadores disponibles */}
                        <Droppable droppableId="playersList">
                            {(provided) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="available-players"
                                >
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Jugadores Disponibles
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
                                            No tienes jugadores. Ve al mercado para comprar algunos.
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

    // Renderizar pestaña de mercado del equipo
    const renderMarketTab = () => {
        return (
            <Box className="team-market">
                <Paper className="money-info-card">
                    <Typography variant="h6">
                        Dinero Disponible
                    </Typography>
                    <Typography variant="h4">
                        {availableMoney}M€
                    </Typography>
                </Paper>

                <Typography variant="h5" sx={{ mb: 2, mt: 3 }}>
                    Tus Jugadores
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
                                            Valor: {player.price}M€
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
                                        Ofrecer a Usuario
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {userPlayers.length === 0 && (
                    <Paper className="empty-team-message">
                        <Typography variant="h6">
                            No tienes jugadores en tu equipo
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/market')}
                            sx={{ mt: 2 }}
                            startIcon={<ShoppingCart />}
                        >
                            Ir al Mercado
                        </Button>
                    </Paper>
                )}
            </Box>
        );
    };

    // Si no hay liga seleccionada, mostrar mensaje
    if (!selectedLeague) {
        return (
            <Box className="team-container no-league">
                <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
                    Debes seleccionar una liga para ver tu equipo
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                >
                    Ir a seleccionar liga
                </Button>
            </Box>
        );
    }

    return (
        <Box className="team-container">
            <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                Mi Equipo - {selectedLeague.Nombre}
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    <Paper sx={{ mb: 3 }}>
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
                        </Tabs>
                    </Paper>

                    {activeTab === 0 ? renderLineupTab() : renderMarketTab()}
                </>
            )}

            {/* Diálogo de oferta a usuario */}
            <Dialog open={offerDialog.open} onClose={handleCloseOfferDialog}>
                <DialogTitle>
                    Ofrecer jugador a otro usuario
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {offerDialog.playerName}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Selecciona el usuario que recibirá la oferta:
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="Usuario"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value="">Selecciona un usuario</option>
                            {leagueUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                        </TextField>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Precio de venta (en millones €):
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
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSendOffer}
                        variant="contained"
                        color="primary"
                    >
                        Enviar Oferta
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alertas */}
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