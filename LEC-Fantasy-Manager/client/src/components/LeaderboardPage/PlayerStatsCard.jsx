import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Avatar,
    Typography,
    Chip,
    Divider,
    IconButton,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip
} from '@mui/material';
import {
    ExpandMore,
    ExpandLess,
    EmojiEvents,
    ThumbUp,
    ThumbDown,
    VisibilityOutlined,
    Agriculture
} from '@mui/icons-material';

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

// Detailed scoring formula explanation
const SCORING_FORMULAS = {
    kills: { value: 3, description: "3 points per kill" },
    deaths: { value: -1, description: "-1 point per death" },
    assists: { value: 1.5, description: "1.5 points per assist" },
    cs: { value: 0.02, description: "0.02 points per minion killed" },
    visionScore: { value: 0.05, description: "0.05 points per vision score" },
    teamWin: { value: 2, description: "2 points for team win" }
};

const PlayerStatsCard = ({ player }) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    // Calculate points from match stats using the scoring formula
    const calculatePointsBreakdown = (stats) => {
        if (!stats) return [];

        const breakdown = [
            { label: "Kills", value: stats.kills, points: stats.kills * SCORING_FORMULAS.kills.value },
            { label: "Deaths", value: stats.deaths, points: stats.deaths * SCORING_FORMULAS.deaths.value },
            { label: "Assists", value: stats.assists, points: stats.assists * SCORING_FORMULAS.assists.value },
            { label: "CS", value: stats.cs, points: stats.cs * SCORING_FORMULAS.cs.value },
            { label: "Vision Score", value: stats.visionScore, points: stats.visionScore * SCORING_FORMULAS.visionScore.value },
            { label: "Team Win", value: stats.teamWin ? "Yes" : "No", points: stats.teamWin ? SCORING_FORMULAS.teamWin.value : 0 }
        ];

        // Calculate total points
        const total = breakdown.reduce((sum, item) => sum + item.points, 0);

        return { breakdown, total: parseFloat(total.toFixed(2)) };
    };

    const pointsBreakdown = player.matchStats ? calculatePointsBreakdown(player.matchStats) : null;

    return (
        <Card sx={{
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            borderLeft: `4px solid ${getPositionColor(player.position)}`,
            height: '100%',
            transition: 'transform 0.2s ease',
            '&:hover': {
                transform: 'translateY(-5px)'
            }
        }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            src={player.imageUrl}
                            alt={player.summonerName}
                            sx={{
                                width: 60,
                                height: 60,
                                mr: 2,
                                border: '2px solid',
                                borderColor: getPositionColor(player.position)
                            }}
                        />
                        <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {player.summonerName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label={player.team}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                />
                                <Chip
                                    label={player.position.toUpperCase()}
                                    size="small"
                                    sx={{
                                        bgcolor: getPositionColor(player.position),
                                        color: 'white'
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                            {player.weekPoints} pts
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Total: {player.totalPoints} pts
                        </Typography>
                    </Box>
                </Box>

                {player.matchStats && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                Match Statistics
                            </Typography>
                            <IconButton
                                onClick={handleExpandClick}
                                sx={{ p: 0, color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Box>

                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ bgcolor: 'rgba(0, 0, 0, 0.3)', p: 1.5, borderRadius: 1, mt: 1 }}>
                                <Table size="small">
                                    <TableBody>
                                        {pointsBreakdown.breakdown.map((item) => (
                                            <TableRow key={item.label} sx={{
                                                '& td': {
                                                    borderBottom: 'none',
                                                    padding: '4px 8px',
                                                    color: 'white'
                                                }
                                            }}>
                                                <TableCell>
                                                    <Tooltip title={SCORING_FORMULAS[item.label.toLowerCase().replace(' ', '')]?.description || ''}>
                                                        <Typography variant="body2">
                                                            {item.label}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {item.label === "Team Win" ? (
                                                        item.value === "Yes" ? (
                                                            <ThumbUp fontSize="small" color="success" />
                                                        ) : (
                                                            <ThumbDown fontSize="small" color="error" />
                                                        )
                                                    ) : (
                                                        item.value
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {item.points > 0 ? '+' : ''}{item.points.toFixed(1)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{
                                            '& td': {
                                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                                padding: '8px',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }
                                        }}>
                                            <TableCell colSpan={2}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Total Points
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: '#1976d2' }}>
                                                {pointsBreakdown.total}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Tooltip title="Kills / Deaths / Assists">
                                <Chip
                                    label={`${player.matchStats.kills}/${player.matchStats.deaths}/${player.matchStats.assists}`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(25, 118, 210, 0.2)' }}
                                />
                            </Tooltip>
                            <Tooltip title="CS (Minions killed)">
                                <Chip
                                    icon={<Agriculture sx={{ fontSize: '1rem' }} />}
                                    label={player.matchStats.cs}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)' }}
                                />
                            </Tooltip>
                            <Tooltip title="Vision Score">
                                <Chip
                                    icon={<VisibilityOutlined sx={{ fontSize: '1rem' }} />}
                                    label={player.matchStats.visionScore}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(156, 39, 176, 0.2)' }}
                                />
                            </Tooltip>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default PlayerStatsCard;