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
import EuroIcon from '@mui/icons-material/Euro';

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
  const [availableMoney, setAvailableMoney] = useState(0);

  // Positions for filter - adapted to LoL Esports API
  const positions = [
    { value: 'top', label: 'Top Laner' },
    { value: 'jungle', label: 'Jungler' },
    { value: 'mid', label: 'Mid Laner' },
    { value: 'bottom', label: 'ADC' },
    { value: 'support', label: 'Support' }
  ];

  // Effect to load initial data
  useEffect(() => {
    // If no league selected, don't load data
    if (!selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Load all players
        const allPlayers = await playerService.getAllPlayers();

        // Load teams for filter
        const teamsData = await playerService.getTeams();

        // Load user's players in this league
        const userPlayersData = await playerService.getUserPlayers(selectedLeague._id);

        // Load user's financial data in this league
        const userLeagueData = await playerService.getUserLeagueData(selectedLeague._id);

        // Set the available money
        setAvailableMoney(userLeagueData.money);

        setPlayers(allPlayers);
        setFilteredPlayers(allPlayers);
        setTeams(teamsData);
        setUserPlayers(userPlayersData);
      } catch (err) {
        console.error("Error loading market data:", err);
        setError("Error loading market data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLeague, refreshKey]);

  // Effect to filter players
  useEffect(() => {
    let results = players;

    // Filter by name
    if (searchTerm) {
      results = results.filter(player =>
        (player.summonerName || player.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by position
    if (positionFilter) {
      results = results.filter(player =>
        player.role?.toLowerCase() === positionFilter.toLowerCase()
      );
    }

    // Filter by team
    if (teamFilter) {
      results = results.filter(player => player.team === teamFilter);
    }

    setFilteredPlayers(results);
  }, [searchTerm, positionFilter, teamFilter, players]);

  // Function to handle player purchase
  const handleBuyPlayer = async (playerId) => {
    if (!selectedLeague) return;

    // Get player data
    const playerToBuy = players.find(p => p.id === playerId);
    if (!playerToBuy) return;

    try {
      setLoading(true);
      // Enviar la posición correcta junto con el ID del jugador
      await playerService.buyPlayer(playerId, selectedLeague._id, playerToBuy.role);

      // Show success message
      setSuccessMessage(`You've signed ${playerToBuy.summonerName || playerToBuy.name} for ${playerToBuy.price}M€!`);

      // Refresh data
      setRefreshKey(prev => prev + 1);

      // Update available money
      setAvailableMoney(prev => prev - playerToBuy.price);
    } catch (err) {
      console.error("Error buying player:", err);
      setError(err.response?.data?.message || "Error buying player.");
    } finally {
      setLoading(false);
    }
  };

  // Clear error message
  const handleCloseError = () => {
    setError("");
  };

  // Clear success message
  const handleCloseSuccess = () => {
    setSuccessMessage("");
  };

  // If no league selected, show message
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
          You must select a league to access the player market
        </Typography>

        <Typography variant="body1" sx={{ color: 'white', mb: 4, textAlign: 'center' }}>
          Go to the main page and select a league to continue.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
        >
          Go to league selection
        </Button>
      </Box>
    );
  }

  return (
    <div className="market-container">
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Player Market - {selectedLeague.Nombre}
      </Typography>

      {/* Filters */}
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
            label="Position"
            sx={{ color: 'white' }}
          >
            <MenuItem value="">All positions</MenuItem>
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
            label="Team"
            sx={{ color: 'white' }}
          >
            <MenuItem value="">All teams</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Team status information */}
      <Box className="market-team-info" sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mi equipo
          </Typography>
          <Typography variant="body1">
            Jugadores en plantilla: {userPlayers.length}/10
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Recuerda: máximo 2 jugadores de cada equipo
          </Typography>
        </Box>
        <Box sx={{
          textAlign: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          p: 2,
          borderRadius: 2,
          minWidth: '120px'
        }}>
          <Typography variant="h4">
            {availableMoney}M€
          </Typography>
        </Box>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Player list */}
      {!loading && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {filteredPlayers.length} players
          </Typography>

          <Grid container spacing={3}>
            {filteredPlayers.map(player => {
              // Check if player is owned by user
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
                No players found with the selected filters
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Alerts */}
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