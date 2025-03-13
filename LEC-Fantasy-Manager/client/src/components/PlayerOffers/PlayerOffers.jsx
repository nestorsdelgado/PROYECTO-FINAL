import React, { useState, useEffect } from 'react';
import './PlayerOffers.css';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Divider,
    CircularProgress,
    Tabs,
    Tab,
    Alert,
    Snackbar
} from '@mui/material';
import { CheckCircle, Cancel, DoubleArrow, Notifications, Send } from '@mui/icons-material';
import playerService from '../../services/players.service';

const PlayerOffers = ({ leagueId, onOfferAction, onRefresh }) => {
    const [offers, setOffers] = useState({ incoming: [], outgoing: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Load offers when component mounts or when leagueId/onRefresh changes
    useEffect(() => {
        if (!leagueId) return;

        const fetchOffers = async () => {
            setLoading(true);
            try {
                console.log("Fetching offers for leagueId:", leagueId);
                const offersData = await playerService.getPendingOffers(leagueId);
                console.log("Fetched offers:", offersData);
                setOffers(offersData);
            } catch (err) {
                console.error('Error fetching offers:', err);

                // Log more detailed error information
                if (err.response) {
                    console.error("Error response:", err.response);
                    console.error("Error details:", err.response.data);
                }

                setError('Failed to load offers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [leagueId, onRefresh]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle accepting offer
    const handleAcceptOffer = async (offerId) => {
        try {
            console.log("Accepting offer:", offerId);

            // Find the offer with this ID to get player info
            const offer = offers.incoming.find(o => o._id === offerId);
            const playerInfo = offer ? offer.player : null;

            // Show loading notification
            setNotification({
                open: true,
                message: 'Processing offer acceptance...',
                severity: 'info'
            });

            // Call the API to accept the offer
            const response = await playerService.acceptOffer(offerId);
            console.log("Offer accepted response:", response);

            // Filter out the accepted offer from the list
            setOffers(prev => ({
                ...prev,
                incoming: prev.incoming.filter(offer => offer._id !== offerId)
            }));

            // Show success notification
            setNotification({
                open: true,
                message: 'Offer accepted! Player has been added to your team.',
                severity: 'success'
            });

            // Trigger parent refresh if provided
            if (onOfferAction) onOfferAction('accept', playerInfo);
        } catch (err) {
            console.error('Error accepting offer:', err);

            // Log detailed error information for debugging
            if (err.response) {
                console.error("Error response:", err.response);
                console.error("Error details:", err.response.data);
                console.error("Error status:", err.response.status);
            }

            setNotification({
                open: true,
                message: err.response?.data?.message || 'Failed to accept offer. Please try again.',
                severity: 'error'
            });
        }
    };

    // Handle rejecting offer
    const handleRejectOffer = async (offerId) => {
        try {
            console.log("Rejecting offer:", offerId);

            // Show loading notification
            setNotification({
                open: true,
                message: 'Processing rejection...',
                severity: 'info'
            });

            // Call the API to reject the offer
            const response = await playerService.rejectOffer(offerId);
            console.log("Offer rejected response:", response);

            // Filter out the rejected offer from the list
            setOffers(prev => ({
                ...prev,
                incoming: prev.incoming.filter(offer => offer._id !== offerId)
            }));

            // Show success notification
            setNotification({
                open: true,
                message: 'Offer rejected successfully.',
                severity: 'info'
            });

            // Trigger parent refresh if provided
            if (onOfferAction) onOfferAction('reject');
        } catch (err) {
            console.error('Error rejecting offer:', err);

            // Log detailed error information for debugging
            if (err.response) {
                console.error("Error response:", err.response);
                console.error("Error details:", err.response.data);
                console.error("Error status:", err.response.status);
            }

            setNotification({
                open: true,
                message: err.response?.data?.message || 'Failed to reject offer. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Helper function to get player image URL
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

    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                mb: 3
            }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="inherit"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1976d2',
                        },
                    }}
                >
                    <Tab
                        icon={<Notifications />}
                        label={`Entrantes (${offers.incoming.length})`}
                        iconPosition="start"
                    />
                    <Tab
                        icon={<Send />}
                        label={`Salientes (${offers.outgoing.length})`}
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Incoming Offers
                    </Typography>

                    {offers.incoming.length === 0 ? (
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white'
                            }}
                        >
                            <Typography>
                                No tienes ninguna oferta entrante.
                            </Typography>
                        </Paper>
                    ) : (
                        <List sx={{ width: '100%' }}>
                            {offers.incoming.map((offer) => (
                                <Paper
                                    key={offer._id}
                                    sx={{
                                        mb: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white'
                                    }}
                                >
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar
                                                src={getPlayerImageUrl(offer.player)}
                                                alt={offer.player?.summonerName || offer.player?.name || 'Player'}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6">
                                                    {offer.player?.summonerName || offer.player?.name || 'Unknown Player'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <Typography component="span" variant="body2">
                                                        Oferta de: {offer.sellerUserId?.username || 'Another user'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Precio: <strong>{offer.price}M€</strong>
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Enviado: {formatDate(offer.createdAt)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider sx={{ my: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleAcceptOffer(offer._id)}
                                        >
                                            Aceptar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => handleRejectOffer(offer._id)}
                                        >
                                            Rechazar
                                        </Button>
                                    </Box>
                                </Paper>
                            ))}
                        </List>
                    )}
                </Box>
            )}

            {activeTab === 1 && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Outgoing Offers
                    </Typography>

                    {offers.outgoing.length === 0 ? (
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white'
                            }}
                        >
                            <Typography>
                                No has enviado ninguna oferta.
                            </Typography>
                        </Paper>
                    ) : (
                        <List sx={{ width: '100%' }}>
                            {offers.outgoing.map((offer) => (
                                <Paper
                                    key={offer._id}
                                    sx={{
                                        mb: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white'
                                    }}
                                >
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar
                                                src={getPlayerImageUrl(offer.player)}
                                                alt={offer.player?.summonerName || offer.player?.name || 'Player'}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6">
                                                    {offer.player?.summonerName || offer.player?.name || 'Unknown Player'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <Typography component="span" variant="body2">
                                                        Ofrecido a: {offer.buyerUserId?.username || 'Another user'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Precio: <strong>{offer.price}M€</strong>
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Enviado: {formatDate(offer.createdAt)}
                                                    </Typography>
                                                    <Typography variant="body2"
                                                        sx={{
                                                            color: 'orange',
                                                            mt: 1,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <DoubleArrow sx={{ mr: 1, fontSize: 16 }} />
                                                        Esperando respuesta
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>
                    )}
                </Box>
            )}

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PlayerOffers;