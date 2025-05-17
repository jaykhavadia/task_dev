import React, { useContext, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

export default function NoteCard({ note, onEdit, onDelete, onShare, isReadOnly }) {
  const { user } = useContext(AuthContext);
  const [hasWritePermission, setHasWritePermission] = useState(false)
  useEffect(() => {
    note?.collaborators.forEach(
      (collab) => {
        if (collab.userId === user?._id) {
          setHasWritePermission(() => collab.permission === 'write');
        }
      })
  }, [user, note])
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {note.label}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {note.content.length > 100 ? note.content.slice(0, 100) + '...' : note.content}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {note.sharedWith && note.sharedWith.length > 0 &&
            note.sharedWith.map((email) => (
              <Chip key={email} label={`Shared with ${email}`} size="small" />
            ))}
        </Stack>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onEdit}>
          {hasWritePermission ? 'Edit' : 'View'}
        </Button>
        {note?.createdBy._id === user?._id && <Button size="small" onClick={onDelete}>
          Delete
        </Button>}
        {!isReadOnly &&
          <Button size="small" onClick={onShare}>
            Share
          </Button>
        }
      </CardActions>
    </Card>
  );
}
