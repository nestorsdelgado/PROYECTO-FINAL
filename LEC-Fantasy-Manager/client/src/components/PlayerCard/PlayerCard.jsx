import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Chip,
    Tooltip
} from '@mui/material';
import {
    ShoppingCart,
    CheckCircle,
    Block
} from '@mui/icons-material';

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

const PlayerCard = ({ player, onBuy, isOwned, userPlayers }) => {
    // Adaptación de campos de la API de LoL Esports
    const adaptedPlayer = {
        id: player.id,
        name: player.summonerName || player.name,
        position: player.role,
        team: player.team,
        teamName: player.teamName,
        champion: player.champions && player.champions.length > 0 ? player.champions[0].name : 'Unknown',
        imageUrl: player.image || player.profilePhotoUrl,
        price: player.price || 5, // Precio por defecto si no está definido
        kda: player.kda || (Math.random() * 3 + 2).toFixed(1), // KDA simulado si no está disponible
        csPerMin: player.csPerMin || (Math.random() * 3 + 7).toFixed(1) // CS/min simulado
    };

    // Verificar si ya tenemos 2 jugadores del mismo equipo
    const teamPlayersCount = userPlayers.filter(p => p.team === adaptedPlayer.team).length;
    const maxTeamPlayersReached = teamPlayersCount >= 2 && !isOwned;

    // Estado del botón (comprado, bloqueado o disponible)
    const getButtonState = () => {
        if (isOwned) {
            return {
                text: "Comprado",
                color: "success",
                disabled: true,
                icon: <CheckCircle />
            };
        } else if (maxTeamPlayersReached) {
            return {
                text: "Límite equipo",
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
                bgcolor: isOwned ? 'rgba(76, 175, 80, 0.08)' : 'white',
                border: isOwned ? '1px solid #4caf50' : 'none',
            }}
        >
            {/* Indicador visual para jugadores propios */}
            {isOwned && (
                <Chip
                    label="Tu jugador"
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

            {/* Imagen del jugador */}
            <CardMedia
                component="img"
                height="200"
                image={adaptedPlayer.imageUrl || `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg`}
                alt={adaptedPlayer.name}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1 }}>
                {/* Nombre y equipo */}
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

                {/* Stats del jugador */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Equipo: {adaptedPlayer.teamName || adaptedPlayer.team}
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
                        maxTeamPlayersReached
                            ? "Ya tienes 2 jugadores de este equipo"
                            : isOwned
                                ? "Este jugador ya es tuyo"
                                : `Precio: ${adaptedPlayer.price} millones €`
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