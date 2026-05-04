'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import NotificationCard from '../components/NotificationCard';

interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
  score: number;
  read?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function PriorityInbox() {
  const [topN, setTopN] = useState(10);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchPriority = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ n: topN.toString() });
      if (filterType !== 'all') params.append('notification_type', filterType);
      const res = await fetch(`${API_BASE}/notifications/priority?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const withReadStatus = data.notifications.map((n: Notification) => ({
        ...n,
        read: localStorage.getItem(`read_${n.ID}`) !== 'true',
      }));
      setNotifications(withReadStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, [topN, filterType]);

  const toggleRead = (id: string) => {
    const newRead = !localStorage.getItem(`read_${id}`) === 'true';
    localStorage.setItem(`read_${id}`, newRead.toString());
    setNotifications(nots => nots.map(n => 
      n.ID === id ? { ...n, read: newRead } : n
    ));
  };

  const typeColors = {
    Placement: 'success',
    Result: 'warning',
    Event: 'info',
  } as const;

  if (loading) return <Container maxWidth="md" sx={{ py: 4 }}><CircularProgress /></Container>;
  if (error) return <Container maxWidth="md" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Priority Inbox
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small">
          <InputLabel>Top N</InputLabel>
          <Select value={topN} label="Top N" onChange={(e) => setTopN(parseInt(e.target.value as string))}>
            <MenuItem value={5}>Top 5</MenuItem>
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {notifications.map((notification) => (
          <NotificationCard
            key={notification.ID}
            notification={notification}
            read={notification.read || false}
            onToggleRead={() => toggleRead(notification.ID)}
          />
        ))}

      {notifications.length === 0 && (
        <Alert severity="info">No priority notifications found</Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2">
          <a href="/">← Back to All Notifications</a>
        </Typography>
      </Box>
    </Container>
  );
}
