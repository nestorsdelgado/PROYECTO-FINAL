import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Tabs,
    Tab,
    Avatar,
    Chip,
    Divider,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Snackbar,
    Tooltip
} from '@mui/material';
import {
    EmojiEvents,
    CalendarToday,
    Person,
    Star,
    StarBorder,
    SportsSoccer,
    Timeline,
    Info
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useSelectedLeague from '../../hooks/useSelectedLeague';
import { AuthContext } from '../../context/auth.context';
import playerScoringService from '../../services/playerScoring.service';
import playerService from '../../services/players.service';
import teamsService from '../../services/teams.service';
import PlayerStatsCard from './PlayerStatsCard';
import ScoringExplainer from './ScoringExplainer';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
    const { selectedLeague } = useSelectedLeague();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [matches, setMatches] = useState([]);
    const [userLineup, setUserLineup] = useState([]);
    const [leagueStandings, setLeagueStandings] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMatchday, setSelectedMatchday] = useState(1);
    const [matchdays, setMatchdays] = useState([1, 2, 3]); // We'll populate this dynamically
    const [activeStandingsView, setActiveStandingsView] = useState(false); // false = weekly, true = season

    // Function to fetch available matchdays
    const fetchAvailableMatchdays = async () => {
        try {
            // Try to get real matchday data if the service is available
            let matchdayData = [];

            try {
                const data = await playerScoringService.getAvailableMatchdays();
                if (Array.isArray(data) && data.length > 0) {
                    matchdayData = data;
                }
            } catch (apiError) {
                console.error("Error fetching matchdays from API:", apiError);
                // Continue with fallback data
            }

            // If no real data available, use fallback
            if (matchdayData.length === 0) {
                // Create fallback matchdays (1 to 9)
                matchdayData = Array.from({ length: 9 }, (_, i) => i + 1);
            }

            setMatchdays(matchdayData);
        } catch (err) {
            console.error("Error fetching available matchdays:", err);
            setError("Failed to load matchday data");
        }
    };

    // Function to fetch upcoming LEC matches
    const fetchUpcomingMatches = async () => {
        try {
            let matchesData = [];

            // Intentar obtener equipos de la API
            try {
                const response = await teamsService.getTeams();
                console.log("Teams API response:", response);

                // Procesar datos de equipos según la estructura de respuesta
                let teams = [];
                if (response && response.data) {
                    teams = Array.isArray(response.data) ? response.data :
                        (response.data.teams ? response.data.teams : []);
                }

                // Filtrar equipos de la LEC usando la estructura que proporcionaste
                const lecTeams = teams.filter(team =>
                    team.homeLeague && team.homeLeague.name === "LEC"
                );

                console.log("LEC Teams count:", lecTeams.length);

                // Crear partidos de muestra usando los equipos de la API
                if (lecTeams.length > 1) {
                    for (let i = 0; i < Math.min(5, Math.floor(lecTeams.length / 2)); i++) {
                        const team1 = lecTeams[i * 2];
                        const team2 = lecTeams[i * 2 + 1];

                        if (team1 && team2) {
                            // Usar directamente la propiedad 'image' de cada equipo
                            matchesData.push({
                                id: `m${i + 1}`,
                                team1: {
                                    id: team1.id,
                                    code: team1.code,
                                    name: team1.name,
                                    logo: team1.image // Usar directamente la propiedad 'image'
                                },
                                team2: {
                                    id: team2.id,
                                    code: team2.code,
                                    name: team2.name,
                                    logo: team2.image // Usar directamente la propiedad 'image'
                                },
                                date: new Date(Date.now() + (i * 3600000)).toISOString(),
                                matchNumber: i + 1,
                                state: 'unstarted'
                            });
                        }
                    }
                }
            } catch (apiError) {
                console.error("Error fetching teams from API:", apiError);
                // Continuaremos con datos de respaldo si la API falla
            }

            // Si no pudimos obtener datos de la API, usar datos de respaldo
            if (matchesData.length === 0) {
                console.log("Using fallback match data");

            }

            // Para matchday 2 y posteriores, cambiar los estados de algunos partidos
            if (selectedMatchday > 1) {
                // Hacer que algunos partidos ya se hayan jugado
                for (let i = 0; i < Math.min(selectedMatchday - 1, 3); i++) {
                    if (matchesData[i]) {
                        matchesData[i].state = 'completed';
                        // Añadir puntuaciones
                        matchesData[i].team1Score = Math.floor(Math.random() * 2);
                        matchesData[i].team2Score = matchesData[i].team1Score === 0 ? 1 : 0;
                    }
                }
            }

            setMatches(matchesData);
        } catch (err) {
            console.error("Error fetching upcoming matches:", err);
            setError("Failed to load upcoming matches");
        }
    };

    // Function to fetch user's lineup with their scores
    const fetchUserLineup = async () => {
        try {
            if (!selectedLeague) return;

            // First try to get real player data from API
            let lineupData = [];

            try {
                // First get the user's lineup
                const currentLineup = await playerService.getCurrentLineup(selectedLeague._id);

                if (currentLineup && currentLineup.length > 0) {
                    // Get all available players for details
                    const allPlayers = await playerService.getAllPlayers();

                    // Convert lineup to player details
                    lineupData = await Promise.all(currentLineup.map(async (lineupPlayer) => {
                        // Find full player info
                        const playerInfo = allPlayers.find(p => p.id === lineupPlayer.playerId);

                        if (playerInfo) {
                            // Generate mock scores for the player
                            const weekPoints = Math.floor(10 + Math.random() * 20);
                            const totalPoints = weekPoints * (selectedMatchday + 2);

                            return {
                                id: playerInfo.id,
                                summonerName: playerInfo.summonerName || playerInfo.name,
                                team: playerInfo.team,
                                position: lineupPlayer.position || playerInfo.role,
                                imageUrl: playerInfo.image || playerInfo.imageUrl || playerInfo.profilePhotoUrl ||
                                    `https://am-a.akamaihd.net/image?f=https://lolstatic-a.akamaihd.net/esports-assets/production/player/${playerInfo.summonerName?.toLowerCase()}.png`,
                                weekPoints: weekPoints,
                                totalPoints: totalPoints,
                                matchStats: {
                                    kills: Math.floor(Math.random() * 5) + 1,
                                    deaths: Math.floor(Math.random() * 3) + 1,
                                    assists: Math.floor(Math.random() * 10) + 1,
                                    cs: Math.floor(Math.random() * 100) + 150,
                                    visionScore: Math.floor(Math.random() * 30) + 10,
                                    teamWin: Math.random() > 0.4
                                }
                            };
                        }
                        return null;
                    }));

                    // Filter out null values
                    lineupData = lineupData.filter(player => player !== null);
                }
            } catch (apiError) {
                console.error("Error fetching real player data:", apiError);
                // Continue with fallback data
            }

            // If no real data, use fallback data
            if (lineupData.length === 0) {
                lineupData = [
                    {
                        id: 'player1',
                        summonerName: 'Caps',
                        team: 'G2',
                        position: 'mid',
                        imageUrl: 'https://am-a.akamaihd.net/image?f=https://lolstatic-a.akamaihd.net/esports-assets/production/player/caps-90dg05ej.png',
                        weekPoints: 27,
                        totalPoints: 142,
                        matchStats: {
                            kills: 3,
                            deaths: 1,
                            assists: 6,
                            cs: 243,
                            visionScore: 21,
                            teamWin: true
                        }
                    },
                    // Other players...
                ];
            }

            // Adjust scores based on matchday to show some progression
            if (selectedMatchday > 1) {
                lineupData.forEach(player => {
                    const weekBonus = (selectedMatchday - 1) * 5;
                    player.weekPoints = Math.floor(player.weekPoints * (0.8 + Math.random() * 0.4));
                    player.totalPoints += weekBonus;

                    // Randomize match stats
                    player.matchStats.kills = Math.floor(player.matchStats.kills * (0.7 + Math.random() * 0.6));
                    player.matchStats.deaths = Math.floor(player.matchStats.deaths * (0.7 + Math.random() * 0.6));
                    player.matchStats.assists = Math.floor(player.matchStats.assists * (0.7 + Math.random() * 0.6));
                    player.matchStats.cs = Math.floor(player.matchStats.cs * (0.9 + Math.random() * 0.2));
                    player.matchStats.visionScore = Math.floor(player.matchStats.visionScore * (0.9 + Math.random() * 0.2));
                    player.matchStats.teamWin = Math.random() > 0.4;
                });
            }

            setUserLineup(lineupData);
        } catch (err) {
            console.error("Error fetching user lineup:", err);
            setError("Failed to load your lineup");
        }
    };

    // Function to fetch league standings
    const fetchLeagueStandings = async () => {
        try {
            if (!selectedLeague) return;

            // Try to get real league users
            let standingsData = [];

            try {
                // Get league users
                const leagueUsers = await playerService.getLeagueUsers(selectedLeague._id);

                if (leagueUsers && leagueUsers.length > 0) {
                    // Convert to standings format
                    standingsData = leagueUsers.map((leagueUser, index) => {
                        // Generate random scores
                        const weekPoints = Math.floor(65 + Math.random() * 40);
                        const totalPoints = weekPoints * (selectedMatchday + 4);
                        const winStreak = Math.floor(Math.random() * 3);

                        return {
                            userId: leagueUser.id,
                            username: leagueUser.username || `User ${index + 1}`,
                            position: index + 1,
                            weekPoints: weekPoints,
                            totalPoints: totalPoints,
                            winStreak: winStreak
                        };
                    });

                    // Sort by total points for season view or week points for weekly view
                    standingsData.sort((a, b) => {
                        if (activeStandingsView) {
                            return b.totalPoints - a.totalPoints;
                        } else {
                            return b.weekPoints - a.weekPoints;
                        }
                    });

                    // Update positions after sorting
                    standingsData.forEach((standing, index) => {
                        standing.position = index + 1;
                    });
                }
            } catch (apiError) {
                console.error("Error fetching league users:", apiError);
                // Continue with fallback data
            }

            // If no real data, use fallback data
            if (standingsData.length === 0) {
                standingsData = [
                    {
                        userId: 'user1',
                        username: 'G2Carlos',
                        isCurrentUser: true,
                        position: 1,
                        weekPoints: 102,
                        totalPoints: 571,
                        winStreak: 3
                    },
                    {
                        userId: 'user2',
                        username: 'FNCFanatic',
                        isCurrentUser: false,
                        position: 2,
                        weekPoints: 89,
                        totalPoints: 542,
                        winStreak: 0
                    },
                    {
                        userId: 'user3',
                        username: 'RekklesHaven',
                        isCurrentUser: false,
                        position: 3,
                        weekPoints: 76,
                        totalPoints: 523,
                        winStreak: 1
                    },
                    {
                        userId: 'user4',
                        username: 'LecLegendary',
                        isCurrentUser: false,
                        position: 4,
                        weekPoints: 81,
                        totalPoints: 507,
                        winStreak: 0
                    },
                    {
                        userId: 'user5',
                        username: 'MadLionsHeart',
                        isCurrentUser: false,
                        position: 5,
                        weekPoints: 65,
                        totalPoints: 488,
                        winStreak: 0
                    }
                ];

                // Different order if we're looking at the weekly view vs. season view
                if (!activeStandingsView) {
                    // For weekly view, shuffle the standings a bit for different matchdays
                    if (selectedMatchday > 1) {
                        const temp = standingsData[0];
                        standingsData[0] = standingsData[1];
                        standingsData[1] = temp;

                        // Adjust positions to match the new order
                        standingsData[0].position = 1;
                        standingsData[1].position = 2;

                        // Adjust the weekly points
                        standingsData.forEach(user => {
                            user.weekPoints = Math.floor(70 + Math.random() * 40);
                        });
                    }
                }
            }

            // Mark the current user for highlighting in UI
            if (user && user.id) {
                standingsData.forEach(standing => {
                    standing.isCurrentUser = standing.userId === user.id;
                });
            } else {
                // If no user ID available, just mark the first one as current user
                if (standingsData.length > 0) {
                    standingsData[0].isCurrentUser = true;
                }
            }

            setLeagueStandings(standingsData);
        } catch (err) {
            console.error("Error fetching league standings:", err);
            setError("Failed to load league standings");
        }
    };

    // Load available matchdays when component mounts
    useEffect(() => {
        fetchAvailableMatchdays();
    }, []);

    // Load all data when component mounts or league/matchday changes
    useEffect(() => {
        if (!selectedLeague) {
            setLoading(false);
            return;
        }

        // Set loading to true when we start fetching
        setLoading(true);

        // Execute all fetches in parallel
        Promise.all([
            fetchUpcomingMatches(),
            fetchUserLineup(),
            fetchLeagueStandings()
        ])
            .then(() => {
                // All data loaded successfully
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading data:", err);
                setError("Failed to load leaderboard data");
                setLoading(false);
            });

    }, [selectedLeague, selectedMatchday, activeStandingsView]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle matchday change
    const handleMatchdayChange = (matchday) => {
        setSelectedMatchday(matchday);
    };

    // Helper function to format date
    const formatMatchDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper function to get position color
    const getPositionColor = (position) => {
        const colors = {
            top: '#F44336',    // Red
            jungle: '#4CAF50', // Green
            mid: '#2196F3',    // Blue
            adc: '#FF9800',    // Orange
            bottom: '#FF9800', // Orange (same as ADC)
            support: '#9C27B0' // Purple
        };

        return colors[position?.toLowerCase()] || '#757575';
    };

    // If no league selected, show message
    if (!selectedLeague) {
        return (
            <Box className="leaderboard-container no-league">
                <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
                    You must select a league to view the leaderboard
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
        <div className="leaderboard-container">
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoringExplainer />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    {/* Upcoming Matches Banner */}
                    <Paper className="matches-banner" sx={{
                        p: 2,
                        mb: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarToday sx={{ mr: 1 }} /> Siguiente Matchday: Semana {selectedMatchday}
                            </Typography>
                            <Box>
                                {matchdays.map((day) => (
                                    <Button
                                        key={day}
                                        variant={selectedMatchday === day ? "contained" : "outlined"}
                                        color="primary"
                                        size="small"
                                        onClick={() => handleMatchdayChange(day)}
                                        sx={{ mx: 0.5 }}
                                    >
                                        Semana {day}
                                    </Button>
                                ))}
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

                        <Grid container spacing={2}>
                            {matches.map((match) => (
                                <Grid item xs={12} sm={6} md={4} lg={2.4} key={match.id}>
                                    <Paper className="match-card" sx={{
                                        p: 2,
                                        bgcolor: 'rgba(10, 20, 40, 0.7)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 5px 15px rgba(25, 118, 210, 0.4)'
                                        }
                                    }}>
                                        <Typography variant="caption" sx={{ textAlign: 'center', mb: 1 }}>
                                            Partido {match.matchNumber} • {formatMatchDate(match.date)}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' }}>
                                                <Avatar
                                                    src={match.team1.logo} // Usar directamente el logo proporcionado por la API
                                                    alt={match.team1.name}
                                                    sx={{
                                                        width: 50,
                                                        height: 50,
                                                        mb: 1,
                                                        bgcolor: 'transparent',
                                                        padding: '2px'
                                                    }}
                                                    imgProps={{
                                                        onError: (e) => {
                                                            console.log(`Error loading image for ${match.team1.code}`);
                                                            // Si hay algún error al cargar la imagen, intentar buscar de nuevo en el servicio
                                                            e.target.src = "https://www.leagueoflegends.com/static/favicon-0cf29ce019f7cd1e7b24f85ab6ff97da.ico";
                                                            e.target.onerror = null; // Prevenir bucle infinito
                                                        }
                                                    }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {match.team1.code}
                                                </Typography>
                                            </Box>

                                            {match.state === 'completed' ? (
                                                <Box sx={{ mx: 2, textAlign: 'center' }}>
                                                    <Typography variant="h6" sx={{
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <span style={{
                                                            color: match.team1Score > match.team2Score ? '#4CAF50' : 'rgba(255,255,255,0.7)',
                                                            fontWeight: match.team1Score > match.team2Score ? 'bold' : 'normal'
                                                        }}>
                                                            {match.team1Score}
                                                        </span>
                                                        <span style={{ margin: '0 5px' }}>-</span>
                                                        <span style={{
                                                            color: match.team2Score > match.team1Score ? '#4CAF50' : 'rgba(255,255,255,0.7)',
                                                            fontWeight: match.team2Score > match.team1Score ? 'bold' : 'normal'
                                                        }}>
                                                            {match.team2Score}
                                                        </span>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                                                        Final
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="h6" sx={{ mx: 2 }}>VS</Typography>
                                            )}

                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' }}>
                                                <Avatar
                                                    src={match.team2.logo} // Usar directamente el logo proporcionado por la API
                                                    alt={match.team2.name}
                                                    sx={{
                                                        width: 50,
                                                        height: 50,
                                                        mb: 1,
                                                        bgcolor: 'transparent',
                                                        padding: '2px'
                                                    }}
                                                    imgProps={{
                                                        onError: (e) => {
                                                            console.log(`Error loading image for ${match.team2.code}`);
                                                            // Si hay algún error al cargar la imagen, intentar buscar de nuevo en el servicio
                                                            e.target.src = "https://www.leagueoflegends.com/static/favicon-0cf29ce019f7cd1e7b24f85ab6ff97da.ico";
                                                            e.target.onerror = null; // Prevenir bucle infinito
                                                        }
                                                    }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {match.team2.code}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Tabs for My Team and Standings */}
                    <Paper sx={{ mb: 3, bgcolor: 'rgba(0, 0, 0, 0.7)' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            textColor="inherit"
                            sx={{
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#1976d2',
                                },
                            }}
                        >
                            <Tab
                                icon={<Person />}
                                label="Mi equipo"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<EmojiEvents />}
                                label="Clasificación en liga"
                                iconPosition="start"
                            />
                        </Tabs>
                    </Paper>

                    {/* Content for My Team tab */}
                    {activeTab === 0 && (
                        <Box className="my-team-points" sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'black' }}>
                                <Star sx={{ mr: 1, color: '#FFD700' }} />
                                Puntos de la semana: <span style={{ fontWeight: 'bold', marginLeft: '8px', color: 'black' }}>
                                    {userLineup.reduce((sum, player) => sum + player.weekPoints, 0)} pts
                                </span>
                            </Typography>

                            <Grid container spacing={3}>
                                {userLineup.map((player) => (
                                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={player.id}>
                                        <PlayerStatsCard player={player} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Content for League Standings tab */}
                    {activeTab === 1 && (
                        <Box className="league-standings">
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'black' }}>
                                    <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} /> Clasificación de liga
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Tooltip title="Weekly view shows rankings based on this week's performance only. Season view shows cumulative points from all weeks.">
                                        <Info fontSize="small" sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }} />
                                    </Tooltip>
                                    <Button
                                        variant={!activeStandingsView ? "contained" : "outlined"}
                                        color="primary"
                                        size="small"
                                        sx={{ mr: 1 }}
                                        onClick={() => {
                                            setActiveStandingsView(false);
                                            fetchLeagueStandings(); // Refresh standings with weekly view
                                        }}
                                    >
                                        Semana {selectedMatchday}
                                    </Button>
                                    <Button
                                        variant={activeStandingsView ? "contained" : "outlined"}
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            setActiveStandingsView(true);
                                            fetchLeagueStandings(); // Refresh standings with season view
                                        }}
                                    >
                                        Temporada
                                    </Button>
                                </Box>
                            </Box>

                            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ranking</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
                                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                                                Puntos semanales
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                                                Puntos totales
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                                                Racha
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {leagueStandings.map((standing) => (
                                            <TableRow
                                                key={standing.userId}
                                                sx={{
                                                    bgcolor: standing.isCurrentUser ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ color: 'white' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {standing.position === 1 && (
                                                            <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} />
                                                        )}
                                                        {standing.position}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{
                                                    color: 'white',
                                                    fontWeight: standing.isCurrentUser ? 'bold' : 'normal'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {standing.username}
                                                        {standing.isCurrentUser && (
                                                            <Chip
                                                                label="You"
                                                                size="small"
                                                                color="primary"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'white' }}>
                                                    {standing.weekPoints} pts
                                                </TableCell>
                                                <TableCell align="right" sx={{
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {standing.totalPoints} pts
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: 'white' }}>
                                                    {standing.winStreak > 0 ? (
                                                        <Chip
                                                            label={`${standing.winStreak} wins`}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Sin racha"
                                                            size="small"
                                                            color="default"
                                                            sx={{ opacity: 0.6 }}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
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

export default LeaderboardPage;