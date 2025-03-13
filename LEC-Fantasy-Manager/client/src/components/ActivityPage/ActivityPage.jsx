import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    ShoppingCart,
    Person,
    ArrowForward,
    FilterList,
    Refresh,
    SortByAlpha,
    KeyboardArrowDown,
    KeyboardArrowUp
} from '@mui/icons-material';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { useNavigate } from 'react-router-dom';
import transactionService from '../../services/transactions.service';
import './ActivityPage.css';

// No necesitamos la función de simulación ya que vamos a 
// usar el servicio de transacciones para obtener datos reales

// Componente principal de Activity Page
const ActivityPage = () => {
    const { selectedLeague } = useSelectedLeague();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [typeFilter, setTypeFilter] = useState('');
    const [playerFilter, setPlayerFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc'); // desc = más reciente primero
    const [refreshKey, setRefreshKey] = useState(0);

    // Efecto para cargar las transacciones iniciales
    useEffect(() => {
        if (!selectedLeague) {
            setLoading(false);
            return;
        }

        const fetchTransactions = async () => {
            setLoading(true);
            setError("");

            try {
                // Llamar al servicio para obtener los datos
                const data = await transactionService.getTransactionHistory(selectedLeague._id);
                console.log("Transacciones recibidas:", data?.length || 0);

                if (Array.isArray(data)) {
                    setTransactions(data);
                    setFilteredTransactions(data);
                } else {
                    console.error("Los datos recibidos no son un array:", data);
                    setTransactions([]);
                    setFilteredTransactions([]);
                }
            } catch (err) {
                console.error("Error loading transaction data:", err);
                setError("Error loading transaction activity. Please try again.");
                setTransactions([]);
                setFilteredTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();

        // Configurar un intervalo para actualizar automáticamente cada 30 segundos
        const intervalId = setInterval(() => {
            console.log("Actualizando transacciones automáticamente...");
            fetchTransactions();
        }, 30000); // 30 segundos

        // Limpiar el intervalo cuando el componente se desmonte
        return () => clearInterval(intervalId);
    }, [selectedLeague, refreshKey]);

    // Efecto para aplicar filtros
    useEffect(() => {
        if (!transactions.length) return;

        let results = [...transactions];

        // Filtrar por tipo de transacción
        if (typeFilter) {
            results = results.filter(t => t.type === typeFilter);
        }

        // Filtrar por jugador
        if (playerFilter) {
            const search = playerFilter.toLowerCase();
            results = results.filter(t =>
                t.playerName.toLowerCase().includes(search) ||
                t.playerTeam.toLowerCase().includes(search)
            );
        }

        // Ordenar por fecha
        results.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.timestamp - b.timestamp;
            }
            return b.timestamp - a.timestamp;
        });

        setFilteredTransactions(results);
    }, [transactions, typeFilter, playerFilter, sortOrder]);

    // Manejadores de filtros
    const handleTypeChange = (event) => {
        setTypeFilter(event.target.value);
    };

    const handlePlayerFilterChange = (event) => {
        setPlayerFilter(event.target.value);
    };

    // Actualizar las transacciones cuando cambie refreshKey
    const handleRefresh = () => {
        console.log("Actualizando transacciones...");
        setRefreshKey(prevKey => prevKey + 1);
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    const clearFilters = () => {
        setTypeFilter('');
        setPlayerFilter('');
    };

    // Función para formatear la fecha
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para obtener el color de la posición
    const getPositionColor = (position) => {
        const colors = {
            top: '#F44336',    // Red
            jungle: '#4CAF50', // Green
            mid: '#2196F3',    // Blue
            adc: '#FF9800',    // Orange
            bottom: '#FF9800', // Orange (mismo color que ADC)
            support: '#9C27B0' // Purple
        };

        return colors[position?.toLowerCase()] || '#757575';
    };

    // Si no hay liga seleccionada, mostrar mensaje
    if (!selectedLeague) {
        return (
            <Box className="activity-container no-league">
                <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
                    Necesitas seleccionar una liga para ver la actividad reciente
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                >
                    Seleccionar una liga
                </Button>
            </Box>
        );
    }

    return (
        <div className="activity-container">
            <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                Actividad Reciente - {selectedLeague.Nombre}
            </Typography>

            {/* Filtros */}
            <Box className="activity-filters">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
                    <Typography variant="h6">
                        Filtros
                    </Typography>
                    <Box>
                        <Tooltip title="Actualizar">
                            <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={sortOrder === 'desc' ? "Más antiguos primero" : "Más recientes primero"}>
                            <IconButton onClick={toggleSortOrder} sx={{ color: 'white' }}>
                                {sortOrder === 'desc' ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={clearFilters}
                            sx={{ ml: 1, color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Limpiar
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
                    <FormControl sx={{ minWidth: 200, flex: 1 }}>
                        <InputLabel id="type-filter-label">Tipo de transacción</InputLabel>
                        <Select
                            labelId="type-filter-label"
                            value={typeFilter}
                            onChange={handleTypeChange}
                            label="Tipo de transacción"
                            sx={{ color: 'white' }}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="purchase">Compras del mercado</MenuItem>
                            <MenuItem value="sale">Ventas al mercado</MenuItem>
                            <MenuItem value="trade">Intercambios entre usuarios</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200, flex: 1 }}>
                        <InputLabel id="player-filter-label">Buscar jugador/equipo</InputLabel>
                        <Select
                            labelId="player-filter-label"
                            value={playerFilter}
                            onChange={handlePlayerFilterChange}
                            label="Buscar jugador/equipo"
                            sx={{ color: 'white' }}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {/* Extraer jugadores únicos de las transacciones */}
                            {Array.from(new Set(transactions.map(t => t.playerName))).map((name) => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                            {/* Extraer equipos únicos de las transacciones */}
                            {Array.from(new Set(transactions.map(t => t.playerTeam))).map((team) => (
                                <MenuItem key={`team-${team}`} value={team}>Equipo: {team}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Loading state */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {/* Transaction list */}
            {!loading && (
                <>
                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                        {filteredTransactions.length === 0
                            ? "No hay transacciones para mostrar"
                            : `Mostrando ${filteredTransactions.length} transacciones`}
                    </Typography>

                    <Paper sx={{ bgcolor: 'rgba(0, 0, 0, 0.7)', p: 0 }}>
                        <List sx={{ width: '100%' }}>
                            {filteredTransactions.map((transaction, index) => (
                                <React.Fragment key={transaction.id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{
                                            p: 2,
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.05)'
                                            }
                                        }}
                                    >
                                        {/* Icono de tipo de transacción */}
                                        <ListItemAvatar>
                                            <Avatar sx={{
                                                bgcolor: transaction.type === 'purchase'
                                                    ? 'success.main'
                                                    : transaction.type === 'sale'
                                                        ? 'error.main'
                                                        : 'warning.main'
                                            }}>
                                                {transaction.type === 'purchase' && <ShoppingCart />}
                                                {transaction.type === 'sale' && <ShoppingCart />}
                                                {transaction.type === 'trade' && <Person />}
                                            </Avatar>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" color="white">
                                                        {transaction.type === 'purchase' && (
                                                            <>Compra de {transaction.playerName}</>
                                                        )}
                                                        {transaction.type === 'sale' && (
                                                            <>Venta de {transaction.playerName}</>
                                                        )}
                                                        {transaction.type === 'trade' && (
                                                            <>{transaction.sellerUsername} vendió {transaction.playerName} a {transaction.buyerUsername}</>
                                                        )}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatTimestamp(transaction.timestamp)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
                                                        {/* Equipo del jugador */}
                                                        <Chip
                                                            label={transaction.playerTeam}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                                        />

                                                        {/* Posición del jugador */}
                                                        <Chip
                                                            label={transaction.playerPosition}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: getPositionColor(transaction.playerPosition),
                                                                color: 'white'
                                                            }}
                                                        />

                                                        {/* Precio */}
                                                        <Chip
                                                            label={`${transaction.price}M€`}
                                                            size="small"
                                                            sx={{ bgcolor: 'primary.main', color: 'white' }}
                                                        />

                                                        {/* Tipo de transacción */}
                                                        <Chip
                                                            label={transaction.typeLabel}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                                        />
                                                    </Box>

                                                    {/* Detalles adicionales según tipo */}
                                                    {transaction.type === 'purchase' && (
                                                        <Typography variant="body2">
                                                            {transaction.username} compró este jugador del mercado.
                                                        </Typography>
                                                    )}
                                                    {transaction.type === 'sale' && (
                                                        <Typography variant="body2">
                                                            {transaction.username} vendió este jugador al mercado.
                                                        </Typography>
                                                    )}
                                                    {transaction.type === 'trade' && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                {transaction.sellerUsername}
                                                            </Typography>
                                                            <ArrowForward sx={{ mx: 1, fontSize: 16 }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                {transaction.buyerUsername}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < filteredTransactions.length - 1 && <Divider component="li" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />}
                                </React.Fragment>
                            ))}

                            {filteredTransactions.length === 0 && (
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ color: 'white', textAlign: 'center', p: 4 }}>
                                                {loading
                                                    ? "Cargando transacciones..."
                                                    : "No hay transacciones registradas en esta liga todavía. Las compras, ventas e intercambios de jugadores aparecerán aquí."}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </>
            )}

            {/* Error message */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError("")}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setError("")}
                    severity="error"
                    variant="filled"
                >
                    {error}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ActivityPage;