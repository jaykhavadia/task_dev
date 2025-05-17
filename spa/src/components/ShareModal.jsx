import React, { useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { NotesContext } from '../context/NotesContext';

export default function ShareModal({ note, onClose }) {
  const { updateNote, shareNote } = useContext(NotesContext);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [error, setError] = useState('');

  const handleShare = () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    // Check if email already in collaborators
    if (note.collaborators.some((c) => c.userEmail === email.trim())) {
      setError('User already a collaborator');
      return;
    }
    shareNote(note.id, email.trim(), permission);
    setEmail('');
    onClose();
  };

  const handleRemoveShare = (userEmailToRemove) => {
    const newCollaborators = note.collaborators.filter((c) => c.userEmail !== userEmailToRemove);
    updateNote(note.id, { collaborators: newCollaborators });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Share Note: {note.title}</DialogTitle>
      <DialogContent>
        <TextField
          label="Email to share with"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(error)}
          helperText={error}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="permission-label">Permission</InputLabel>
          <Select
            labelId="permission-label"
            value={permission}
            label="Permission"
            onChange={(e) => setPermission(e.target.value)}
          >
            <MenuItem value="read">Read</MenuItem>
            <MenuItem value="write">Write</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" fullWidth onClick={handleShare}>
          Share
        </Button>
        <Typography sx={{ mt: 2, mb: 1 }} variant="subtitle1">
          Shared With:
        </Typography>
        <List dense>
          {note.collaborators.length === 0 && <Typography>No one yet.</Typography>}
          {note.collaborators.map((collab, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleRemoveShare(collab.userEmail)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${collab.userEmail} (${collab.permission})`} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
