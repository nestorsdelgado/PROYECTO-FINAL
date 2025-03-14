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
        { stat: 'Kill', points: '+3.0', description: 'Points awarded for each kill secured by the player' },
        { stat: 'Death', points: '-1.0', description: 'Points deducted for each death' },
        { stat: 'Assist', points: '+1.5', description: 'Points awarded for each assist' },
        { stat: 'CS (Creep Score)', points: '+0.02', description: 'Points per minion or monster killed' },
        { stat: 'Vision Score', points: '+0.05', description: 'Points per point of vision score' },
        { stat: 'Team Win', points: '+2.0', description: 'Bonus points if the player\'s team wins the match' },
        { stat: 'Triple Kill', points: '+2.0', description: 'Bonus for achieving a triple kill' },
        { stat: 'Quadra Kill', points: '+5.0', description: 'Bonus for achieving a quadra kill' },
        { stat: 'Penta Kill', points: '+10.0', description: 'Bonus for achieving a penta kill' },
        { stat: 'First Blood', points: '+2.0', description: 'Bonus for securing or assisting in first blood' }
    ];

    const bonusScoring = [
        { condition: 'Flawless Game (0 deaths)', points: '+3.0', applicable: 'All positions' },
        { condition: '10+ Kills', points: '+3.0', applicable: 'All positions' },
        { condition: '10+ Assists', points: '+2.0', applicable: 'Support, Jungle' },
        { condition: '100+ CS Difference @15', points: '+3.0', applicable: 'All positions' },
        { condition: 'Drake Soul Secured', points: '+2.0', applicable: 'Team bonus' },
        { condition: 'Baron Steal', points: '+3.0', applicable: 'All positions' }
    ];

    return (
        <>
            <Tooltip title="Learn how fantasy points are calculated">
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
                        Fantasy Points Scoring System
                    </Typography>
                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Players earn fantasy points based on their performance in official LEC matches. Here's how points are calculated:
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                        Base Scoring
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 4, bgcolor: 'rgba(0, 0, 0, 0.3)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statistic</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Points</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
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
                        Bonus Points
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 3, bgcolor: 'rgba(0, 0, 0, 0.3)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Condition</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bonus Points</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Applicable To</TableCell>
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
                        Key things to remember:
                    </Typography>

                    <Box component="ul" sx={{ ml: 2 }}>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Points are only awarded for official LEC matches.
                            </Typography>
                        </Box>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Players must participate in a match to earn points.
                            </Typography>
                        </Box>
                        <Box component="li" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                                Different roles tend to excel in different stats (e.g., Supports get more assists, ADCs get more CS).
                            </Typography>
                        </Box>
                        <Box component="li">
                            <Typography variant="body2">
                                In case of technical issues or game remakes, points will be awarded based on official LEC statistics.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        Got it!
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ScoringExplainer;