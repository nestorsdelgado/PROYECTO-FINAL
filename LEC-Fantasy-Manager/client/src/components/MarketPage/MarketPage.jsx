import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import { Search } from '@mui/icons-material';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import playerService from '../../services/players.service';
import PlayerCard from '../PlayerCard/PlayerCard';
import { useNavigate } from 'react-router-dom';
import './MarketPage.css';

const MarketPage = () => {
  const { selectedLeague } = useSelectedLeague();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [teams, setTeams] = useState([]);
  const [userPlayers, setUserPlayers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  // Posiciones para el filtro - adaptadas a la API de LoL Esports
  const positions = [
    { value: 'top', label: 'Top Laner' },
    { value: 'jungle', label: 'Jungler' },
    { value: 'mid', label: 'Mid Laner' },
    { value: 'adc', label: 'ADC' },
    { value: 'support', label: 'Support' }
  ];

  // Efecto para cargar datos iniciales
  useEffect(() => {
    // Si no hay liga seleccionada, no cargar datos
    if (!selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Cargar todos los jugadores
        const allPlayers = await playerService.getAllPlayers();

        // Cargar equipos para el filtro
        const teamsData = await playerService.getTeams();

        // Cargar jugadores del usuario en esta liga
        const userPlayersData = await playerService.getUserPlayers(selectedLeague._id);

        setPlayers(allPlayers);
        setFilteredPlayers(allPlayers);
        setTeams(teamsData);
        setUserPlayers(userPlayersData);
      } catch (err) {
        console.error("Error loading market data:", err);
        setError("Error al cargar los datos del mercado. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLeague, refreshKey]);

  // Efecto para filtrar jugadores
  useEffect(() => {
    let results = players;

    // Filtrar por nombre
    if (searchTerm) {
      results = results.filter(player =>
        (player.summonerName || player.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por posición
    if (positionFilter) {
      results = results.filter(player =>
        player.role?.toLowerCase() === positionFilter.toLowerCase()
      );
    }

    // Filtrar por equipo
    if (teamFilter) {
      results = results.filter(player => player.team === teamFilter);
    }

    setFilteredPlayers(results);
  }, [searchTerm, positionFilter, teamFilter, players]);

  // Función para manejar la compra de jugadores
  const handleBuyPlayer = async (playerId) => {
    if (!selectedLeague) return;

    // Obtener datos del jugador
    const playerToBuy = players.find(p => p.id === playerId);
    if (!playerToBuy) return;

    try {
      setLoading(true);
      await playerService.buyPlayer(playerId, selectedLeague._id);

      // Mostrar mensaje de éxito
      setSuccessMessage(`¡Has fichado a ${playerToBuy.summonerName || playerToBuy.name} por ${playerToBuy.price}M€!`);

      // Refrescar datos
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Error buying player:", err);
      setError(err.response?.data?.message || "Error al comprar el jugador.");
    } finally {
      setLoading(false);
    }
  };

  // Limpiar mensaje de error
  const handleCloseError = () => {
    setError("");
  };

  // Limpiar mensaje de éxito
  const handleCloseSuccess = () => {
    setSuccessMessage("");
  };

  // Si no hay liga seleccionada, mostrar mensaje
  if (!selectedLeague) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          p: 3
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
          Debes seleccionar una liga para acceder al mercado de jugadores
        </Typography>

        <Typography variant="body1" sx={{ color: 'white', mb: 4, textAlign: 'center' }}>
          Dirígete a la página principal y selecciona una liga para continuar.
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
    <div className="market-container">
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Mercado de Jugadores - {selectedLeague.Nombre}
      </Typography>

      {/* Filtros */}
      <Box className="market-filters">
        <TextField
          label="Buscar jugador"
          variant="outlined"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'white' }} />
              </InputAdornment>
            ),
            sx: { color: 'white' }
          }}
          InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
          sx={{ flexGrow: 1, minWidth: '200px', input: { color: 'white' } }}
          className="market-filter-item"
        />

        <FormControl sx={{ minWidth: '200px' }} className="market-filter-item">
          <InputLabel id="position-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Posición
          </InputLabel>
          <Select
            labelId="position-filter-label"
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            label="Posición"
            sx={{ color: 'white' }}
          >
            <MenuItem value="">Todas las posiciones</MenuItem>
            {positions.map(pos => (
              <MenuItem key={pos.value} value={pos.value}>
                {pos.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: '200px' }} className="market-filter-item">
          <InputLabel id="team-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Equipo
          </InputLabel>
          <Select
            labelId="team-filter-label"
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            label="Equipo"
            sx={{ color: 'white' }}
          >
            <MenuItem value="">Todos los equipos</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Información de estado del equipo */}
      <Box className="market-team-info">
        <Typography variant="h6" sx={{ mb: 1 }}>
          Mi Equipo
        </Typography>
        <Typography variant="body1">
          Jugadores en plantilla: {userPlayers.length}/5
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Recuerda: máximo 2 jugadores del mismo equipo
        </Typography>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Lista de jugadores */}
      {!loading && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Mostrando {filteredPlayers.length} jugadores
          </Typography>

          <Grid container spacing={3}>
            {filteredPlayers.map(player => {
              // Comprobar si el jugador pertenece al usuario
              const isOwned = userPlayers.some(p => p.id === player.id);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                  <PlayerCard
                    player={player}
                    onBuy={handleBuyPlayer}
                    isOwned={isOwned}
                    userPlayers={userPlayers}
                  />
                </Grid>
              );
            })}
          </Grid>

          {filteredPlayers.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                No se encontraron jugadores con los filtros seleccionados
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Alertas */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MarketPage;