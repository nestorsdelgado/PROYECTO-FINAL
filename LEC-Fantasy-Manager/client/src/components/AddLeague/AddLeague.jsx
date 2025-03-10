import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Paper
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import leagueService from '../../services/leagues.service';

const AddLeague = ({ open, onClose, onLeagueAdded }) => {
    const [leagueName, setLeagueName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [createdLeague, setCreatedLeague] = useState(null);
    const [codeCopied, setCodeCopied] = useState(false);

    const handleNameChange = (e) => {
        setLeagueName(e.target.value);
        if (error) setError('');
    };

    const handleCreateLeague = async () => {
        if (!leagueName) {
            setError('Please enter a league name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await leagueService.createLeague(leagueName);

            // Save the created league data to show code
            setCreatedLeague(response.league);

        } catch (err) {
            console.error('Error creating league:', err);
            setError(err.response?.data?.message || 'Failed to create the league. Please try again.');
            setCreatedLeague(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (createdLeague?.Code) {
            navigator.clipboard.writeText(createdLeague.Code)
                .then(() => {
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Failed to copy code:', err);
                });
        }
    };

    const handleClose = () => {
        if (createdLeague) {
            onLeagueAdded();
        }
        setLeagueName('');
        setCreatedLeague(null);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {createdLeague ? 'League Created Successfully' : 'Create a New League'}
            </DialogTitle>

            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!createdLeague ? (
                    // League creation form
                    <>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Enter a name for your new league.
                        </Typography>

                        <TextField
                            autoFocus
                            margin="dense"
                            id="league-name"
                            label="League Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={leagueName}
                            onChange={handleNameChange}
                            disabled={loading}
                        />
                    </>
                ) : (
                    // League created success view with code
                    <>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Your league has been created successfully!
                        </Alert>

                        <Typography variant="body1" sx={{ mb: 1 }}>
                            League Name: <strong>{createdLeague.Nombre}</strong>
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Share this code with others so they can join your league:
                        </Typography>

                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                                bgcolor: '#f5f5f5'
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                                {createdLeague.Code}
                            </Typography>

                            <Button
                                startIcon={<ContentCopy />}
                                onClick={handleCopyCode}
                                color={codeCopied ? "success" : "primary"}
                            >
                                {codeCopied ? "Copied!" : "Copy"}
                            </Button>
                        </Paper>

                        <Typography variant="body2" color="text.secondary">
                            Remember to save this code. Anyone with this code can join your league.
                        </Typography>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                {!createdLeague ? (
                    // Buttons for creation form
                    <>
                        <Button onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateLeague}
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create League'}
                        </Button>
                    </>
                ) : (
                    // Button for success screen
                    <Button
                        onClick={handleClose}
                        variant="contained"
                        color="primary"
                    >
                        Done
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddLeague;