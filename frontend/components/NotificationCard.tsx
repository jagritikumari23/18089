'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Chip, 
  Box, 
  IconButton, 
  Divider 
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// date-fns not installed - using native Date


interface NotificationCardProps {
  notification: {
    ID: string;
    Type: string;
    Message: string;
    Timestamp: string;
    score: number;
  };
  read: boolean;
  onToggleRead: () => void;
}

export default function NotificationCard({ notification, read, onToggleRead }: NotificationCardProps) {
  const timestamp = new Date(notification.Timestamp.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  let timeLabel = '';
  if (diffHours < 24) {
    timeLabel = `${Math.round(diffHours)}h ago`;
  } else if (diffHours < 48) {
    timeLabel = 'Tomorrow';
  } else {
    timeLabel = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Priority tier
  const normalizedScore = notification.score / 1000000;
  let priorityTier: 'high' | 'medium' | 'low' = 'low';
  let priorityIcon = '⭐';
  let priorityColor = 'info';
  
  if (normalizedScore > 0.8) {
    priorityTier = 'high';
    priorityIcon = '🔥';
    priorityColor = 'error';
  } else if (normalizedScore > 0.6) {
    priorityTier = 'medium';
    priorityIcon = '⭐';
    priorityColor = 'warning';
  }

  const typeColors = {
    Placement: 'success',
    Result: 'warning' as const,
    Event: 'info' as const,
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        borderLeft: 5,
        borderLeftColor: priorityColor === 'error' ? 'error.main' : priorityColor === 'warning' ? 'warning.main' : 'info.main',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        backgroundColor: priorityTier === 'high' ? 'error.50' : priorityTier === 'medium' ? 'warning.50' : 'grey.50',
      }}
      elevation={read ? 1 : 3}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip 
            label={priorityIcon} 
            size="small" 
            color={priorityColor}
            sx={{ fontSize: '1rem' }}
          />
          <Chip 
            label={notification.Type} 
            color={typeColors[notification.Type as keyof typeof typeColors] || 'default'}
            size="small" 
          />
          <Typography variant="caption" color="text.secondary">
            {timeLabel}
          </Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom noWrap>
          {notification.Message}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Score: {(notification.score / 1000000).toFixed(2)}
        </Typography>
      </CardContent>
      
      <Divider />
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Chip 
            label={read ? 'Read' : 'Unread'} 
            color={read ? 'default' : 'secondary'}
            size="small"
            clickable
            onClick={onToggleRead}
          />
        </Box>
        <Box>
          <IconButton size="small">
            {read ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
}
