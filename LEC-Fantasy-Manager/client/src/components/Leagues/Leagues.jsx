import React, { useState, useContext } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Box, Chip, Tooltip, IconButton, Snackbar, Alert } from '@mui/material';
import { ContentCopy, SportsSoccer, Logout, CheckCircle } from '@mui/icons-material';
import LeaveLeague from '../LeaveLeague/LeaveLeague';
import { LeagueContext } from '../../context/league.context';

const Leagues = ({ leagues, onLeagueChange }) => {
    // Simple validation to ensure leagues is an array
    const leaguesArray = Array.isArray(leagues) ? leagues : [];

    // Access the league context
    const { selectedLeague, selectLeague } = useContext(LeagueContext);

    const [copiedLeague, setCopiedLeague] = useState(null);
    const [leaveLeagueDialog, setLeaveLeagueDialog] = useState({
        open: false,
        leagueId: null,
        leagueName: ''
    });

    // State for showing notification when a league is selected
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCopyCode = (leagueId, code) => {
        navigator.clipboard.writeText(code)
            .then(() => {
                setCopiedLeague(leagueId);
                setTimeout(() => setCopiedLeague(null), 2000);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
            });
    };

    // Get current user ID to check if user is the creator
    const getCurrentUserId = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                return userData.id;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const currentUserId = getCurrentUserId();

    // Handle opening leave league dialog
    const handleOpenLeaveDialog = (leagueId, leagueName) => {
        setLeaveLeagueDialog({
            open: true,
            leagueId,
            leagueName
        });
    };

    // Handle closing leave league dialog
    const handleCloseLeaveDialog = () => {
        setLeaveLeagueDialog({
            open: false,
            leagueId: null,
            leagueName: ''
        });
    };

    // Handle after successfully leaving a league
    const handleLeagueLeft = () => {
        if (onLeagueChange) {
            onLeagueChange();
        }

        // If the user left the currently selected league, clear the selection
        if (selectedLeague && leaveLeagueDialog.leagueId === selectedLeague._id) {
            selectLeague(null);
        }
    };

    // Handle selecting a league
    const handleSelectLeague = (league) => {
        selectLeague(league);
        setSnackbar({
            open: true,
            message: `Liga "${league.Nombre}" seleccionada`,
            severity: 'success'
        });
    };

    // Handle closing the snackbar
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    return (
        <div className='ligas-box' style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            minHeight: '65vh',
            gap: '30px',
            padding: '20px'
        }}>
            {leaguesArray.length === 0 ? (
                <Typography variant="body1" sx={{ color: 'white' }}>No leagues available.</Typography>
            ) : (
                leaguesArray.map((league, index) => {
                    const isCreator = league.createdBy === currentUserId;
                    const isSelected = selectedLeague && selectedLeague._id === league._id;

                    return (
                        <Card
                            sx={{
                                maxWidth: 700,
                                width: '100%',
                                border: isSelected ? '2px solid #1976d2' : 'none',
                                position: 'relative'
                            }}
                            key={league._id || league.id || index}
                        >
                            {isSelected && (
                                <Chip
                                    icon={<CheckCircle />}
                                    label="Liga Activa"
                                    color="primary"
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 120,
                                        zIndex: 10
                                    }}
                                />
                            )}
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography gutterBottom variant="h5" component="div">
                                        {league.Nombre}
                                    </Typography>

                                    {isCreator && (
                                        <Chip
                                            icon={<SportsSoccer />}
                                            label="Anfitrión"
                                            color="primary"
                                            size="small"
                                        />
                                    )}
                                </Box>

                                {/* Only show the league code to the creator */}
                                {isCreator && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            p: 1,
                                            bgcolor: '#f5f5f5',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                            League Code:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                                            {league.Code}
                                        </Typography>
                                        <Tooltip title={copiedLeague === league._id ? "Copied!" : "Copy Code"}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyCode(league._id, league.Code)}
                                                color={copiedLeague === league._id ? "success" : "default"}
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}

                                <div className='columna-liga' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Número de participantes
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Cantidad de dinero actual
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Fecha de siguiente jornada
                                    </Typography>
                                </div>

                                <div className='columna-liga' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Puntos actuales
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Posición en liga
                                    </Typography>
                                </div>
                            </CardContent>

                            <CardActions style={{ justifyContent: "space-between" }}>
                                <Button
                                    size="small"
                                    color={isSelected ? "success" : "primary"}
                                    variant={isSelected ? "contained" : "outlined"}
                                    onClick={() => handleSelectLeague(league)}
                                    startIcon={isSelected ? <CheckCircle /> : null}
                                >
                                    {isSelected ? "Liga Seleccionada" : "Seleccionar Liga"}
                                </Button>
                                {isCreator ? (
                                    <Button
                                        size="small"
                                        color="error"
                                        /* onClick={() => handleOpenLeaveDialog(league._id, league.Nombre)} */
                                    >
                                        Anfitrión de la liga
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        color="warning"
                                        startIcon={<Logout />}
                                        onClick={() => handleOpenLeaveDialog(league._id, league.Nombre)}
                                    >
                                        Salir de liga
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    );
                })
            )}

            {/* Leave League Dialog */}
            <LeaveLeague
                open={leaveLeagueDialog.open}
                onClose={handleCloseLeaveDialog}
                leagueId={leaveLeagueDialog.leagueId}
                leagueName={leaveLeagueDialog.leagueName}
                onLeagueLeft={handleLeagueLeft}
            />

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Leagues;