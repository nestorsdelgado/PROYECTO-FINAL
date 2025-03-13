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
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import { Search } from '@mui/icons-material';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import playerService from '../../services/players.service';
import PlayerStatsCard from './PlayerStatsCard';
import { useNavigate } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = () => {
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
    const [tabValue, setTabValue] = useState(0);

    // Positions for filter - adapted to LoL Esports API
    const positions = [
        { value: 'top', label: 'Top Laner' },
        { value: 'jungle', label: 'Jungler' },
        { value: 'mid', label: 'Mid Laner' },
        { value: 'bottom', label: 'ADC' },
        { value: 'support', label: 'Support' }
    ];

    // Stats tabs
    const statCategories = [
        { label: "General", value: 0 },
        { label: "Combate", value: 1 },
        { label: "Económicas", value: 2 },
        { label: "Visión", value: 3 }
    ];

    // Effect to load initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");

            try {
                // Load all players
                const allPlayers = await playerService.getAllPlayers();

                // Load teams for filter
                const teamsData = await playerService.getTeams();

                // Enrich players with stats (simulated for now)
                const playersWithStats = allPlayers.map(player => ({
                    ...player,
                    stats: generateMockStats(player)
                }));

                setPlayers(playersWithStats);
                setFilteredPlayers(playersWithStats);
                setTeams(teamsData);
            } catch (err) {
                console.error("Error loading players data:", err);
                setError("Error loading players data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Function to generate mock stats for demonstration purposes
    // In a real application, this would come from the API
    const generateMockStats = (player) => {
        const getRandomStat = (min, max, precision = 1) => {
            return parseFloat((Math.random() * (max - min) + min).toFixed(precision));
        };

        const role = player.role?.toLowerCase() || '';

        // Base stats for all players
        const baseStats = {
            // General
            gamesPlayed: Math.floor(getRandomStat(10, 18, 0)),
            winRate: getRandomStat(40, 70, 1),
            kda: getRandomStat(2, 5, 2),

            // Combat
            kills: getRandomStat(2, 7, 1),
            deaths: getRandomStat(1, 5, 1),
            assists: getRandomStat(3, 10, 1),
            killParticipation: getRandomStat(50, 80, 1),

            // Economy
            csPerMin: getRandomStat(7, 10, 1),
            goldPerMin: getRandomStat(350, 450, 0),
            damageShare: getRandomStat(15, 30, 1),

            // Vision
            wardsPlaced: getRandomStat(0.5, 1.2, 1),
            wardsCleared: getRandomStat(0.2, 0.8, 1),
            visionScore: getRandomStat(30, 60, 0)
        };

        // Role-specific stat adjustments
        switch (role) {
            case 'top':
                return {
                    ...baseStats,
                    soloKills: getRandomStat(0.5, 2, 1),
                    teleportPlays: getRandomStat(1, 3, 1),
                    tankDamage: getRandomStat(20, 40, 1)
                };
            case 'jungle':
                return {
                    ...baseStats,
                    firstBloodParticipation: getRandomStat(30, 60, 1),
                    objectivesSecured: getRandomStat(2, 5, 1),
                    ganksPerGame: getRandomStat(5, 12, 1)
                };
            case 'mid':
                return {
                    ...baseStats,
                    soloKills: getRandomStat(1, 3, 1),
                    roamingScore: getRandomStat(6, 10, 1),
                    damageShare: getRandomStat(25, 35, 1)
                };
            case 'bottom':
            case 'adc':
                return {
                    ...baseStats,
                    csPerMin: getRandomStat(9, 12, 1),
                    damageShare: getRandomStat(25, 40, 1),
                    goldShare: getRandomStat(25, 35, 1)
                };
            case 'support':
                return {
                    ...baseStats,
                    assists: getRandomStat(8, 15, 1),
                    wardsPlaced: getRandomStat(1.5, 2.5, 1),
                    visionScore: getRandomStat(60, 100, 0),
                    healShield: getRandomStat(5000, 12000, 0)
                };
            default:
                return baseStats;
        }
    };

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

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Clear error message
    const handleCloseError = () => {
        setError("");
    };

    return (
        <div className="info-page-container">

            {/* Stat category tabs */}
            <Paper sx={{ mb: 3, bgcolor: 'rgba(0, 0, 0, 0.7)' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="inherit"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1976d2',
                        },
                    }}
                >
                    {statCategories.map((category) => (
                        <Tab
                            key={category.value}
                            label={category.label}
                            sx={{ color: 'white' }}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Filters */}
            <Box className="info-filters">
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
                    className="info-filter-item"
                />

                <FormControl sx={{ minWidth: '200px' }} className="info-filter-item">
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
                        <MenuItem value="">Todas las posiciones</MenuItem>
                        {positions.map(pos => (
                            <MenuItem key={pos.value} value={pos.value}>
                                {pos.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: '200px' }} className="info-filter-item">
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
                        <MenuItem value="">Todos los equipos</MenuItem>
                        {teams.map(team => (
                            <MenuItem key={team.id} value={team.id}>
                                {team.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                    <Typography variant="subtitle1" sx={{ mb: 2, color: 'white' }}>
                        Mostrando {filteredPlayers.length} jugadores
                    </Typography>

                    <Grid container spacing={3}>
                        {filteredPlayers.map(player => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                                <PlayerStatsCard
                                    player={player}
                                    statCategory={tabValue}
                                />
                            </Grid>
                        ))}
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
        </div>
    );
};

export default InfoPage;