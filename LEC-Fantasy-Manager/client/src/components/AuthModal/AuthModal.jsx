import React, { useState, useContext } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Tab,
    Tabs,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { AuthContext } from '../../context/auth.context';
import authService from '../../services/auth.service';

// TabPanel component for the tabbed interface
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`auth-tabpanel-${index}`}
            aria-labelledby={`auth-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function AuthModal({ open, onClose }) {
    const { storeToken, storeUser, authenticateUser } = useContext(AuthContext);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });

    const [signupForm, setSignupForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Form validation states
    const [loginErrors, setLoginErrors] = useState({});
    const [signupErrors, setSignupErrors] = useState({});

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError('');
    };

    // Handle form changes
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginForm({
            ...loginForm,
            [name]: value
        });
        if (loginErrors[name]) {
            setLoginErrors({
                ...loginErrors,
                [name]: ''
            });
        }
    };

    const handleSignupChange = (e) => {
        const { name, value } = e.target;
        setSignupForm({
            ...signupForm,
            [name]: value
        });
        if (signupErrors[name]) {
            setSignupErrors({
                ...signupErrors,
                [name]: ''
            });
        }
    };

    // Validate login form
    const validateLoginForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!loginForm.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(loginForm.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!loginForm.password) {
            errors.password = 'Password is required';
        }

        setLoginErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Validate signup form
    const validateSignupForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!signupForm.username) {
            errors.username = 'Username is required';
        } else if (signupForm.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!signupForm.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(signupForm.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!signupForm.password) {
            errors.password = 'Password is required';
        } else if (signupForm.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!signupForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (signupForm.password !== signupForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setSignupErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle login submission
    const handleLogin = async () => {
        if (!validateLoginForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await authService.login(loginForm.email, loginForm.password);

            // Store token in localStorage
            storeToken(response.token);
            storeUser(response.user);

            // Update auth context
            authenticateUser();

            // Close the modal
            handleCloseModal();

        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to login. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Handle signup submission
    const handleSignup = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        if (!validateSignupForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await authService.register(
                signupForm.username,
                signupForm.email,
                signupForm.password,
                signupForm.username // Using username as name
            );

            // If we get a token back, auto-login
            if (response.token) {
                storeToken(response.token);
                storeUser(response.user);
                authenticateUser();
                handleCloseModal();
            } else {
                // Otherwise, switch to login tab
                setTabValue(0);
                setLoginForm({
                    email: signupForm.email,
                    password: ''
                });
                setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
            }

        } catch (err) {
            console.error('Signup error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to register. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        // Reset form states
        setLoginForm({ email: '', password: '' });
        setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
        setError('');
        setLoginErrors({});
        setSignupErrors({});

        // Close modal
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCloseModal} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab label="Login" />
                    <Tab label="Sign Up" />
                </Tabs>
            </DialogTitle>

            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Login Form */}
                <TabPanel value={tabValue} index={0}>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="login-email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        name="email"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        error={!!loginErrors.email}
                        helperText={loginErrors.email}
                        disabled={loading}
                    />
                    <TextField
                        margin="dense"
                        id="login-password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        error={!!loginErrors.password}
                        helperText={loginErrors.password}
                        disabled={loading}
                    />
                </TabPanel>

                {/* Signup Form */}
                <TabPanel value={tabValue} index={1}>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="signup-username"
                        label="Username"
                        type="text"
                        fullWidth
                        variant="outlined"
                        name="username"
                        value={signupForm.username}
                        onChange={handleSignupChange}
                        error={!!signupErrors.username}
                        helperText={signupErrors.username}
                        disabled={loading}
                    />
                    <TextField
                        margin="dense"
                        id="signup-email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        name="email"
                        value={signupForm.email}
                        onChange={handleSignupChange}
                        error={!!signupErrors.email}
                        helperText={signupErrors.email}
                        disabled={loading}
                    />
                    <TextField
                        margin="dense"
                        id="signup-password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        name="password"
                        value={signupForm.password}
                        onChange={handleSignupChange}
                        error={!!signupErrors.password}
                        helperText={signupErrors.password}
                        disabled={loading}
                    />
                    <TextField
                        margin="dense"
                        id="signup-confirm-password"
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        name="confirmPassword"
                        value={signupForm.confirmPassword}
                        onChange={handleSignupChange}
                        error={!!signupErrors.confirmPassword}
                        helperText={signupErrors.confirmPassword}
                        disabled={loading}
                    />
                </TabPanel>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleCloseModal} disabled={loading}>
                    Cancel
                </Button>

                {tabValue === 0 ? (
                    <Button
                        onClick={handleLogin}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                ) : (
                    <Button
                        onClick={handleSignup}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default AuthModal;