import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
} from '@mui/material';

export default function NoteCard({ note, onEdit, onShare, isReadOnly }) {
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
          Edit
        </Button>
        {!isReadOnly &&
          <Button size="small" onClick={onShare}>
            Share
          </Button>
        }
      </CardActions>
    </Card>
  );
}
