import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    HelpOutline,
    Close
} from '@mui/icons-material';

const ScoringExplainer = () => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const scoringRules = [
        { stat: 'Asesinato', points: '+3.0', description: 'Puntos otorgados por cada asesinato conseguido por el jugador' },
        { stat: 'Muerte', points: '-1.0', description: 'Puntos deducidos por cada muerte' },
        { stat: 'Asistencia', points: '+1.5', description: 'Puntos otorgados por cada asistencia' },
        { stat: 'CS (Súbditos)', points: '+0.02', description: 'Puntos por cada súbdito o monstruo eliminado' },
        { stat: 'Puntuación de Visión', points: '+0.05', description: 'Puntos por cada punto de puntuación de visión' },
        { stat: 'Victoria del Equipo', points: '+2.0', description: 'Puntos de bonificación si el equipo del jugador gana la partida' },
        { stat: 'Triple Kill', points: '+2.0', description: 'Bonificación por conseguir un triple asesinato' },
        { stat: 'Cuádruple Kill', points: '+5.0', description: 'Bonificación por conseguir un cuádruple asesinato' },
        { stat: 'Penta Kill', points: '+10.0', description: 'Bonificación por conseguir un penta asesinato' },
        { stat: 'Primera Sangre', points: '+2.0', description: 'Bonificación por conseguir o asistir en la primera sangre' }
    ];

    const bonusScoring = [
        { condition: 'Partida Perfecta (0 muertes)', points: '+3.0', applicable: 'Todas las posiciones' },
        { condition: '10+ Asesinatos', points: '+3.0', applicable: 'Todas las posiciones' },
        { condition: '10+ Asistencias', points: '+2.0', applicable: 'Support, Jungle' },
        { condition: '100+ Diferencia de CS @15', points: '+3.0', applicable: 'Todas las posiciones' },
        { condition: 'Alma de Dragón Asegurada', points: '+2.0', applicable: 'Bonificación de equipo' },
        { condition: 'Robo de Barón', points: '+3.0', applicable: 'Todas las posiciones' }
    ];

    return (
        <>
            <Tooltip title="Aprende cómo se calculan los puntos de fantasía">
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpen}
                    startIcon={<HelpOutline />}
                    sx={{
                        mt: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'gray',
                        color: 'white',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.8)',
                            backgroundColor: 'gray'
                        }
                    }}
                >
                    Sistema de puntuación
                </Button>
            </Tooltip>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1A2634',
                        color: 'white',
                        backgroundImage: 'linear-gradient(rgba(10, 20, 30, 0.8), rgba(10, 20, 30, 0.8))'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                        Sistema de Puntuación de Fantasy
                    </Typography>
                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Los jugadores ganan puntos de fantasía basados en su rendimiento en partidos oficiales de la LEC. Así es como se calculan los puntos:
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                        Puntuación Base
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 4, bgcolor: 'rgba(0, 0, 0, 0.3)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estadística</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Puntos</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scoringRules.map((rule) => (
                                    <TableRow key={rule.stat}>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{rule.stat}</TableCell>
                                        <TableCell sx={{
                                            color: rule.points.includes('-') ? '#F44336' : '#4CAF50',
                                            fontWeight: 'bold'
                                        }}>
                                            {rule.points}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white' }}>{rule.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                        Puntos de Bonificación
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 3, bgcolor: 'rgba(0, 0, 0, 0.3)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Condición</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Puntos de Bonificación</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aplicable a</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bonusScoring.map((bonus) => (
                                    <TableRow key={bonus.condition}>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{bonus.condition}</TableCell>
                                        <TableCell sx={{ color: '#4CAF50', fontWeight: 'bold' }}>{bonus.points}</TableCell>
                                        <TableCell sx={{ color: 'white' }}>{bonus.applicable}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>
                        Aspectos importantes a recordar:
                    </Typography>

                    <Box component="ul" sx={{ ml: 2 }}>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Los puntos solo se otorgan por partidos oficiales de la LEC.
                            </Typography>
                        </Box>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Los jugadores deben participar en un partido para ganar puntos.
                            </Typography>
                        </Box>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Diferentes roles tienden a destacar en diferentes estadísticas (por ejemplo, los Supports consiguen más asistencias, los ADCs más CS).
                            </Typography>
                        </Box>
                        <Box component="li">
                            <Typography variant="body2">
                                En caso de problemas técnicos o rehacimiento de partidas, los puntos se otorgarán basándose en las estadísticas oficiales de la LEC.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        ¡Entendido!
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ScoringExplainer;