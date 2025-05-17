import React, { useState, useContext } from 'react';
import { AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, Button, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { NotesContext } from '../context/NotesContext';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../context/AuthContext';

export default function Header({ createNote }) {
  const {logout} = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications } = useContext(NotesContext) || { notifications: [] };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Collaborative Notes
        </Typography>
        <Button color="inherit" onClick={() => createNote()}>
          New Note
        </Button>
        <IconButton color="inherit" onClick={handleNotificationClick}>
          <Badge badgeContent={notifications?.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            style: {
              maxHeight: 48 * 4.5,
              width: '30ch',
            },
          }}
        >
          {notifications?.length === 0 && (
            <MenuItem disabled>No notifications</MenuItem>
          )}
          {notifications?.map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationClose}>
              {notification.message}
            </MenuItem>
          ))}
        </Menu>
        <Button
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => logout()}
        >
        </Button>
      </Toolbar>
    </AppBar>
  );
}
