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
    Tooltip,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    ShoppingCart,
    Person,
    ArrowForward,
    FilterList,
    Refresh,
    SortByAlpha,
    KeyboardArrowDown,
    KeyboardArrowUp,
    LocalAtm,
    SwapHoriz
} from '@mui/icons-material';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { useNavigate } from 'react-router-dom';
import transactionService from '../../services/transactions.service';
import playerService from '../../services/players.service';
import './ActivityPage.css';

// Función de utilidad para determinar el color según la posición del jugador
const getPositionColor = (position) => {
    const colors = {
        top: '#F44336',    // Red
        jungle: '#4CAF50', // Green
        mid: '#2196F3',    // Blue
        adc: '#FF9800',    // Orange
        bottom: '#FF9800', // Orange (mismo color que ADC)
        support: '#9C27B0' // Purple
    };

    if (!position) return '#757575';
    return colors[position.toLowerCase()] || '#757575';
};

// Función para obtener una etiqueta legible según el tipo de transacción
const getTransactionTypeLabel = (type) => {
    switch (type) {
        case 'purchase':
            return 'Compra del mercado';
        case 'sale':
            return 'Venta al mercado';
        case 'trade':
            return 'Intercambio entre usuarios';
        default:
            return 'Transacción';
    }
};

// Función de utilidad para transformar la transacción en un formato coherente
const normalizeTransaction = (transaction) => {
    // Valores por defecto para evitar errores
    return {
        id: transaction.id || transaction._id,
        type: transaction.type || 'unknown',
        typeLabel: getTransactionTypeLabel(transaction.type),
        playerId: transaction.playerId,
        playerName: transaction.playerName || 'Jugador desconocido',
        playerTeam: transaction.playerTeam || '',
        playerPosition: transaction.playerPosition || '',
        price: transaction.price || 0,
        timestamp: new Date(transaction.timestamp || transaction.createdAt),
        username: transaction.username || transaction.userId?.username,
        sellerUserId: transaction.sellerUserId?._id || transaction.sellerUserId,
        sellerUsername: transaction.sellerUsername || transaction.sellerUserId?.username || 'Usuario',
        buyerUserId: transaction.buyerUserId?._id || transaction.buyerUserId,
        buyerUsername: transaction.buyerUsername || transaction.buyerUserId?.username || 'Usuario'
    };
};

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
    const [activeView, setActiveView] = useState('all'); // 'all', 'purchases', 'sales', 'trades'

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
                console.log("Fetching transactions for league:", selectedLeague._id);
                const data = await transactionService.getTransactionHistory(selectedLeague._id);
                console.log("Transacciones recibidas:", data?.length || 0, data);

                if (Array.isArray(data)) {
                    // Normalizar los datos para facilitar su procesamiento
                    const normalizedData = data.map(transaction => normalizeTransaction(transaction));

                    // Log para depuración - contar transacciones por tipo
                    const counts = {
                        purchase: normalizedData.filter(t => t.type === 'purchase').length,
                        sale: normalizedData.filter(t => t.type === 'sale').length,
                        trade: normalizedData.filter(t => t.type === 'trade').length,
                        total: normalizedData.length
                    };
                    console.log("Transactions by type:", counts);

                    setTransactions(normalizedData);
                    setFilteredTransactions(normalizedData);
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

    // Mejorar la visualización de las transacciones de intercambio
    const renderTransactionDetails = (transaction) => {
        switch (transaction.type) {
            case 'purchase':
                return (
                    <Typography variant="body2">
                        {transaction.username} compró este jugador del mercado.
                    </Typography>
                );
            case 'sale':
                return (
                    <Typography variant="body2">
                        {transaction.username} vendió este jugador al mercado.
                    </Typography>
                );
            case 'trade':
                return (
                    <>
                        <Typography variant="body2">
                            Intercambio directo entre usuarios por {transaction.price}M€.
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {transaction.sellerUsername || "Vendedor"}
                            </Typography>
                            <ArrowForward sx={{ mx: 1, fontSize: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {transaction.buyerUsername || "Comprador"}
                            </Typography>
                        </Box>
                    </>
                );
            default:
                return null;
        }
    };

    // Efecto para aplicar filtros
    useEffect(() => {
        if (!transactions.length) return;

        let results = [...transactions];

        // Filtrar por vista activa
        if (activeView !== 'all') {
            switch (activeView) {
                case 'purchases':
                    results = results.filter(t => t.type === 'purchase');
                    break;
                case 'sales':
                    results = results.filter(t => t.type === 'sale');
                    break;
                case 'trades':
                    results = results.filter(t => t.type === 'trade');
                    break;
            }
        }

        // Filtrar por tipo de transacción (si hay un filtro adicional seleccionado)
        if (typeFilter && (activeView === 'all' || activeView === typeFilter)) {
            results = results.filter(t => t.type === typeFilter);
        }

        // Filtrar por jugador
        if (playerFilter) {
            const search = playerFilter.toLowerCase();
            results = results.filter(t =>
                (t.playerName?.toLowerCase().includes(search) || false) ||
                (t.playerTeam?.toLowerCase().includes(search) || false)
            );
        }

        // Ordenar por fecha
        results.sort((a, b) => {
            if (sortOrder === 'asc') {
                return new Date(a.timestamp) - new Date(b.timestamp);
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        setFilteredTransactions(results);
    }, [transactions, typeFilter, playerFilter, sortOrder, activeView]);

    // Manejadores de filtros
    const handleTypeChange = (event) => {
        setTypeFilter(event.target.value);
    };

    const handlePlayerFilterChange = (event) => {
        setPlayerFilter(event.target.value);
    };

    // Cambiar la vista activa
    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setActiveView(newView);
        }
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
        setActiveView('all');
    };

    // Función para formatear la fecha
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';

        const date = new Date(timestamp);
        if (isNaN(date)) return 'Fecha inválida';

        return date.toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

            {/* Controles de vista rápida */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value={activeView}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="transaction type view"
                    sx={{
                        gap: '10px',
                        '& .MuiToggleButton-root': {
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            backgroundColor: 'rgba(25, 118, 210, 0.9)',
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(6, 36, 67, 0.9)',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(6, 36, 67, 0.9)',
                                }
                            },
                            '&:hover': {
                                backgroundColor: 'rgba(6, 36, 67, 0.9)',
                            }
                        }
                    }}
                >
                    <ToggleButton value="all" aria-label="all transactions">
                        Todas
                    </ToggleButton>
                    <ToggleButton value="purchases" aria-label="purchases">
                        <ShoppingCart sx={{ mr: 1 }} />
                        Compras
                    </ToggleButton>
                    <ToggleButton value="sales" aria-label="sales">
                        <LocalAtm sx={{ mr: 1 }} />
                        Ventas
                    </ToggleButton>
                    <ToggleButton value="trades" aria-label="trades">
                        <SwapHoriz sx={{ mr: 1 }} />
                        Intercambios
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Filtros avanzados */}
            <Box className="activity-filters">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
                    <Typography variant="h6">
                        Filtros Avanzados
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
                            {Array.from(new Set(transactions.map(t => t.playerTeam).filter(Boolean))).map((team) => (
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
                    <Typography variant="subtitle1" sx={{ color: 'black', mb: 2 }}>
                        {filteredTransactions.length === 0
                            ? "No hay transacciones para mostrar"
                            : `Mostrando ${filteredTransactions.length} transacciones`}
                    </Typography>

                    <Paper sx={{ bgcolor: 'rgba(0, 0, 0, 0.7)', p: 0 }}>
                        <List sx={{ width: '100%' }}>
                            {filteredTransactions.map((transaction, index) => (
                                <React.Fragment key={transaction.id || index}>
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
                                                {transaction.type === 'sale' && <LocalAtm />}
                                                {transaction.type === 'trade' && <SwapHoriz />}
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
                                                            <>Intercambio: {transaction.sellerUsername} vendió {transaction.playerName} a {transaction.buyerUsername}</>
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
                                                        {transaction.playerTeam && (
                                                            <Chip
                                                                label={transaction.playerTeam}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ borderColor: 'rgba(255, 255, 255, 0.3)', color:'white' }}
                                                            />
                                                        )}

                                                        {/* Posición del jugador */}
                                                        {transaction.playerPosition && (
                                                            <Chip
                                                                label={transaction.playerPosition}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: getPositionColor(transaction.playerPosition),
                                                                    color: 'white'
                                                                }}
                                                            />
                                                        )}

                                                        {/* Precio */}
                                                        <Chip
                                                            label={`${transaction.price}M€`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'primary.main',
                                                                color: 'white'
                                                            }}
                                                        />

                                                        {/* Tipo de transacción */}
                                                        <Chip
                                                            label={transaction.typeLabel}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ borderColor: 'rgba(255, 255, 255, 0.3)', color:'white' }}
                                                        />
                                                    </Box>

                                                    {/* Detalles adicionales según tipo */}
                                                    {renderTransactionDetails(transaction)}
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