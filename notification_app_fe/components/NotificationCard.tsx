'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
  score: number;
}

interface Props {
  notification: Notification;
  read: boolean;
  onToggleRead: () => void;
}

export default function NotificationCard({ notification, read, onToggleRead }: Props) {
  const typeColors = {
    Placement: 'success' as const,
    Result: 'warning' as const,
    Event: 'info' as const,
  };

  const priority = Math.round(notification.score / 10000);

  return (
    <Card sx={{ mb: 2, opacity: read ? 0.7 : 1 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Score: {notification.score.toLocaleString()} | Priority: {priority}/100
        </Typography>
        <Chip 
          label={notification.Type} 
          color={typeColors[notification.Type]} 
          size="small"
          sx={{ mb: 1 }}
        />
        <Typography variant="h6">{notification.Message}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(notification.Timestamp.replace(' ', 'T') + 'Z').toLocaleString()}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton onClick={onToggleRead} size="small">
          {read ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
      </CardActions>
    </Card>
  );
}
