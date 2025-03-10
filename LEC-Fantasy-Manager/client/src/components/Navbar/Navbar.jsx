import React, { useState, useContext, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import './Navbar.css';
import { AccountCircle } from '@mui/icons-material';
import {
  Menu as Dropdown,
  MenuItem,
  IconButton,
  Typography
} from '@mui/material';
import { AuthContext } from '../../context/auth.context';

const Navbar = ({ isSidebarOpen, toggleSidebar, openAuthModal }) => {
  const { isLoggedIn, user, logOutUser } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logOutUser();
    handleCloseMenu();
  };

  const handleOpenAuth = () => {
    handleCloseMenu();
    if (openAuthModal) {
      openAuthModal();
    }
  };

  // Get username from the user object
  const username = user ? (user.username || 'User') : 'User';

  return (
    <nav className="navbar" style={{height: '10vh'}}>
      <button
        className="navbar-toggle"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      <img
        src="/logo.png"
        alt="LEC Fantasy Logo"
        className="navbar-logo"
      />

      {/* User Avatar with Dropdown */}
      <IconButton
        aria-controls="user-menu"
        aria-haspopup="true"
        onClick={handleOpenMenu}
        sx={{ color: 'white' }}
      >
        <AccountCircle sx={{ fontSize: 40 }} />
      </IconButton>

      {/* Dropdown Menu */}
      <Dropdown
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {isLoggedIn ? (
          [
            <MenuItem key="user-info" disabled>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Hello, {username}
              </Typography>
            </MenuItem>,
            <MenuItem key="logout" onClick={handleLogout}>Log Out</MenuItem>
          ]
        ) : (
          <MenuItem onClick={handleOpenAuth}>Log In / Sign Up</MenuItem>
        )}
      </Dropdown>
    </nav>
  );
};

export default Navbar;