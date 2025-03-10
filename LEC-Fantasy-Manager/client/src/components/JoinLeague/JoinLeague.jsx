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
    CircularProgress
} from '@mui/material';
import leagueService from '../../services/leagues.service';

const JoinLeague = ({ open, onClose, onLeagueJoined }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCodeChange = (e) => {
        setCode(e.target.value.toUpperCase());
        if (error) setError('');
    };

    const handleJoinLeague = async () => {
        if (!code) {
            setError('Please enter a league code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Use the league service to join a league
            await leagueService.joinLeague(code);

            // Call the callback to refresh leagues in parent component
            if (onLeagueJoined) {
                onLeagueJoined();
            }

            // Close the dialog
            onClose();
        } catch (err) {
            console.error('Error joining league:', err);

            // Extract the most specific error message possible
            const errorMessage =
                err.response?.data?.message ||
                'Failed to join the league. Please try again.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Join a League</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Typography variant="body2" sx={{ mb: 2 }}>
                    Enter the league code provided by the league creator to join.
                </Typography>

                <TextField
                    autoFocus
                    margin="dense"
                    id="league-code"
                    label="League Code"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={code}
                    onChange={handleCodeChange}
                    disabled={loading}
                    placeholder="ABCDEF"
                    inputProps={{
                        style: { textTransform: 'uppercase' }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleJoinLeague}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Join League'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JoinLeague;