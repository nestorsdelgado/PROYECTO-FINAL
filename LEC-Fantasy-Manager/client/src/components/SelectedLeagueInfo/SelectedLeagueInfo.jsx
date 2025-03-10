import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { SportsSoccer } from '@mui/icons-material';
import useSelectedLeague from '../../hooks/useSelectedLeague';


const SelectedLeagueInfo = () => {
    const { selectedLeague, isLeagueLoading } = useSelectedLeague();

    if (isLeagueLoading) {
        return null; // Don't show anything while loading
    }

    if (!selectedLeague) {
        return (
            <Paper
                sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'white'
                }}
            >
                <Typography variant="subtitle2" sx={{ fontStyle: 'italic' }}>
                    No league selected. Please select a league from the leagues page.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                p: 2,
                mb: 2,
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: '8px'
            }}
            elevation={3}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SportsSoccer sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Liga Activa
                </Typography>
            </Box>

            <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedLeague.Nombre}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                    size="small"
                    label={`ID: ${selectedLeague.Code}`}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                />
            </Box>
        </Paper>
    );
};

export default SelectedLeagueInfo;