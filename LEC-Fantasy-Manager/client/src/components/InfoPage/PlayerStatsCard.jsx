import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    Divider,
    Grid,
    LinearProgress,
    Tooltip
} from '@mui/material';

// Helper function to get position color
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

// Helper function to get full position name
const getPositionName = (position) => {
    const names = {
        top: 'Top Laner',
        jungle: 'Jungler',
        mid: 'Mid Laner',
        adc: 'ADC',
        bottom: 'ADC', // Mapear "bottom" a "ADC" para consistencia en la visualización
        support: 'Support'
    };

    return names[position?.toLowerCase()] || position;
};

const getPlayerImageUrl = (player) => {
    if (!player) return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';

    if (player.imageUrl && player.imageUrl.startsWith('http')) {
        return player.imageUrl;
    } else if (player.image && player.image.startsWith('http')) {
        return player.image;
    } else if (player.profilePhotoUrl && player.profilePhotoUrl.startsWith('http')) {
        return player.profilePhotoUrl;
    }
    return 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg';
};

// Helper function to normalize values to percentages for progress bars
const normalizeValue = (value, min, max) => {
    return ((value - min) / (max - min)) * 100;
};

// Stat group components
const GeneralStats = ({ stats }) => (
    <>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Estadísticas Generales
        </Typography>

        <StatItem
            label="Partidas Jugadas"
            value={stats.gamesPlayed}
            unit="partidas"
        />

        <StatItem
            label="Winrate"
            value={stats.winRate}
            unit="%"
            normalizedValue={stats.winRate}
            color={stats.winRate > 50 ? 'success' : (stats.winRate > 45 ? 'warning' : 'error')}
        />

        <StatItem
            label="KDA"
            value={stats.kda}
            normalizedValue={normalizeValue(stats.kda, 0, 6)}
            color={stats.kda > 4 ? 'success' : (stats.kda > 2.5 ? 'warning' : 'error')}
        />
    </>
);

const CombatStats = ({ stats }) => (
    <>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Estadísticas de Combate
        </Typography>

        <StatItem
            label="Kills/Partida"
            value={stats.kills}
            normalizedValue={normalizeValue(stats.kills, 0, 8)}
            color="error"
        />

        <StatItem
            label="Deaths/Partida"
            value={stats.deaths}
            normalizedValue={normalizeValue(stats.deaths, 0, 8)}
            color="primary"
            invertColor
        />

        <StatItem
            label="Asistencias/Partida"
            value={stats.assists}
            normalizedValue={normalizeValue(stats.assists, 0, 15)}
            color="info"
        />

        <StatItem
            label="Participación en Kills"
            value={stats.killParticipation}
            unit="%"
            normalizedValue={stats.killParticipation}
            color="success"
        />

        {stats.soloKills && (
            <StatItem
                label="Solo Kills/Partida"
                value={stats.soloKills}
                normalizedValue={normalizeValue(stats.soloKills, 0, 3)}
                color="error"
            />
        )}

        {stats.firstBloodParticipation && (
            <StatItem
                label="First Blood Participation"
                value={stats.firstBloodParticipation}
                unit="%"
                normalizedValue={stats.firstBloodParticipation}
                color="warning"
            />
        )}
    </>
);

const EconomyStats = ({ stats }) => (
    <>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Estadísticas Económicas
        </Typography>

        <StatItem
            label="CS por minuto"
            value={stats.csPerMin}
            normalizedValue={normalizeValue(stats.csPerMin, 0, 12)}
            color="info"
        />

        <StatItem
            label="Oro por minuto"
            value={stats.goldPerMin}
            normalizedValue={normalizeValue(stats.goldPerMin, 200, 500)}
            color="warning"
        />

        <StatItem
            label="% de daño del equipo"
            value={stats.damageShare}
            unit="%"
            normalizedValue={stats.damageShare}
            color="error"
        />

        {stats.goldShare && (
            <StatItem
                label="% de oro del equipo"
                value={stats.goldShare}
                unit="%"
                normalizedValue={stats.goldShare}
                color="warning"
            />
        )}
    </>
);

const VisionStats = ({ stats }) => (
    <>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Estadísticas de Visión
        </Typography>

        <StatItem
            label="Wards por minuto"
            value={stats.wardsPlaced}
            normalizedValue={normalizeValue(stats.wardsPlaced, 0, 3)}
            color="success"
        />

        <StatItem
            label="Control Wards por minuto"
            value={stats.wardsCleared}
            normalizedValue={normalizeValue(stats.wardsCleared, 0, 1.5)}
            color="error"
        />

        <StatItem
            label="Visión Score"
            value={Math.round(stats.visionScore)}
            normalizedValue={normalizeValue(stats.visionScore, 0, 100)}
            color="info"
        />
    </>
);

// Reusable stat item with progress bar
const StatItem = ({ label, value, unit = '', normalizedValue, color = 'primary', invertColor = false }) => (
    <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {value}{unit && ` ${unit}`}
            </Typography>
        </Box>

        {normalizedValue !== undefined && (
            <Tooltip title={`${value}${unit}`}>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, normalizedValue))}
                    color={color}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: invertColor ? 'rgba(220, 0, 0, 0.1)' : undefined
                    }}
                />
            </Tooltip>
        )}
    </Box>
);

const PlayerStatsCard = ({ player, statCategory = 0 }) => {
    // Get player stats
    const stats = player.stats || {};

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'visible'
            }}
        >
            {/* Player image */}
            <CardMedia
                component="img"
                height="180"
                image={getPlayerImageUrl(player)}
                alt={player.name}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                {/* Name and team */}
                <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {player.summonerName || player.name}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                        label={player.team}
                        variant="outlined"
                        size="small"
                    />

                    <Chip
                        label={getPositionName(player.role)}
                        sx={{
                            backgroundColor: getPositionColor(player.role),
                            color: 'white'
                        }}
                        size="small"
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Display different stat sections based on selected category */}
                {statCategory === 0 && <GeneralStats stats={stats} />}
                {statCategory === 1 && <CombatStats stats={stats} />}
                {statCategory === 2 && <EconomyStats stats={stats} />}
                {statCategory === 3 && <VisionStats stats={stats} />}
            </CardContent>
        </Card>
    );
};

export default PlayerStatsCard;