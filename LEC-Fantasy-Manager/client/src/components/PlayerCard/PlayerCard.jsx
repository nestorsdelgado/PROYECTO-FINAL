import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Chip,
    Tooltip,
    Avatar
} from '@mui/material';
import {
    ShoppingCart,
    CheckCircle,
    Block,
    Person
} from '@mui/icons-material';

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

const PlayerCard = ({ player, onBuy, isOwned, userPlayers, otherOwnersMap = {} }) => {
    // Adapt fields from LoL Esports API
    const adaptedPlayer = {
        id: player.id,
        name: player.summonerName || player.name,
        position: player.role,
        team: player.team,
        teamName: player.teamName,
        champion: player.champions && player.champions.length > 0 ? player.champions[0].name : 'Unknown',
        imageUrl: player.image || player.profilePhotoUrl,
        price: player.price || 5, // Default price if not defined
        kda: player.kda || (Math.random() * 3 + 2).toFixed(1), // Simulated KDA if not available
        csPerMin: player.csPerMin || (Math.random() * 3 + 7).toFixed(1) // Simulated CS/min
    };

    // Check if already have 2 players from same team
    const teamPlayersCount = userPlayers.filter(p => p.team === adaptedPlayer.team).length;
    const maxTeamPlayersReached = teamPlayersCount >= 2 && !isOwned;

    // Check if player is owned by another user
    const isOwnedByOther = !isOwned && otherOwnersMap[adaptedPlayer.id];
    const ownerName = isOwnedByOther ? otherOwnersMap[adaptedPlayer.id] : null;

    // Button state (purchased, blocked, owned by other, or available)
    const getButtonState = () => {
        if (isOwned) {
            return {
                text: "Comprado",
                color: "success",
                disabled: true,
                icon: <CheckCircle />
            };
        } else if (isOwnedByOther) {
            return {
                text: `Pertenece a ${ownerName}`,
                color: "warning",
                disabled: true,
                icon: <Person />
            };
        } else if (maxTeamPlayersReached) {
            return {
                text: "Limite por equipo",
                color: "error",
                disabled: true,
                icon: <Block />
            };
        } else {
            return {
                text: `Comprar (${adaptedPlayer.price}M€)`,
                color: "primary",
                disabled: false,
                icon: <ShoppingCart />
            };
        }
    };

    const buttonState = getButtonState();

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                bgcolor: isOwned ? 'rgba(76, 175, 80, 0.08)' : (isOwnedByOther ? 'rgba(255, 152, 0, 0.08)' : 'white'),
                border: isOwned ? '1px solid #4caf50' : (isOwnedByOther ? '1px solid #ff9800' : 'none'),
            }}
        >
            {/* Visual indicator for owned players */}
            {isOwned && (
                <Chip
                    label="En tu equipo"
                    color="success"
                    icon={<CheckCircle />}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1
                    }}
                />
            )}

            {/* Visual indicator for players owned by others */}
            {isOwnedByOther && (
                <Chip
                    label={`Pertenece a ${ownerName}`}
                    color="warning"
                    icon={<Person />}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1
                    }}
                />
            )}

            {/* Player image */}
            <CardMedia
                component="img"
                height="200"
                image={adaptedPlayer.imageUrl || `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg`}
                alt={adaptedPlayer.name}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1 }}>
                {/* Name and team */}
                <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {adaptedPlayer.name}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                        label={adaptedPlayer.team}
                        variant="outlined"
                        size="small"
                    />

                    <Chip
                        label={getPositionName(adaptedPlayer.position)}
                        sx={{
                            backgroundColor: getPositionColor(adaptedPlayer.position),
                            color: 'white'
                        }}
                        size="small"
                    />
                </Box>

                {/* Player stats */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Team: {adaptedPlayer.teamName || adaptedPlayer.team}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        KDA:
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight="bold">
                        {adaptedPlayer.kda}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        CS/min:
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight="bold">
                        {adaptedPlayer.csPerMin}
                    </Typography>
                </Box>
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
                <Tooltip
                    title={
                        isOwnedByOther
                            ? `Este jugador ya pertenece a ${ownerName}`
                            : maxTeamPlayersReached
                                ? "Ya tienes 2 jugadores del mismo equipo"
                                : isOwned
                                    ? "Este jugador ya está en tu equipo"
                                    : `Precio: ${adaptedPlayer.price} millones de €`
                    }
                >
                    <span style={{ width: '100%' }}>
                        <Button
                            variant="contained"
                            color={buttonState.color}
                            fullWidth
                            disabled={buttonState.disabled}
                            startIcon={buttonState.icon}
                            onClick={() => onBuy(adaptedPlayer.id)}
                        >
                            {buttonState.text}
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Card>
    );
};

export default PlayerCard;