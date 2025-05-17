import React, { useContext, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Fab,
  CircularProgress,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { NotesContext } from '../context/NotesContext';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import ShareModal from '../components/ShareModal';
import Header from '../components/Header';
import NotificationToast from '../components/NotificationToast';

export default function Dashboard() {
  const { myNotes, sharedNotes, loading, notifications, deleteNote } = useContext(NotesContext);
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const [toastNotifications, setToastNotifications] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const notesToShow = tabIndex === 0 ? myNotes : sharedNotes;

  // Sync toastNotifications with notifications from context
  React.useEffect(() => {
    if (notifications.length > 0) {
      setToastNotifications((prev) => {
        // Add new notifications that are not already in toastNotifications
        const newNotifs = notifications.filter(
          (n) => !prev.some((t) => t.id === n.id)
        );
        return [...prev, ...newNotifs];
      });
    }
  }, [notifications]);

  const handleRemoveToast = (id) => {
    setToastNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <>
      <Header createNote={() => setIsCreating(true)} />
      <Container sx={{ mt: 4 }}>

        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="My Notes" />
          <Tab label="Shared with Me" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {notesToShow.length === 0 && (
                <Typography sx={{ m: 2 }}>No notes found.</Typography>
              )}
              {notesToShow.map((note) => (
                <Grid item xs={12} sm={6} md={4} key={note.id}>
                  <NoteCard
                    note={note}
                    onEdit={() => setEditingNote(note)}
                    onDelete={() => deleteNote(note._id)}
                    onShare={() => setSharingNote(note)}
                    isReadOnly={tabIndex === 1}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Create/Edit Modal */}
            {(isCreating || editingNote) && (
              <NoteEditor
                note={editingNote}
                onClose={() => {
                  setEditingNote(null);
                  setIsCreating(false);
                }}
              />
            )}

            {/* Share Modal */}
            {sharingNote && (
              <ShareModal
                note={sharingNote}
                onClose={() => setSharingNote(null)}
              />
            )}
          </>
        )}
      </Container>
      <NotificationToast notifications={toastNotifications} onRemove={handleRemoveToast} />
    </>
  );
}
