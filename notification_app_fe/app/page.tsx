'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
  read?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function AllNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        page: (page + 1).toString(), // API uses 1-based
      });
      if (filterType !== 'all') {
        params.append('notification_type', filterType);
      }
      const res = await fetch(`${API_BASE}/notifications?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Merge with local read status
      const withReadStatus = data.notifications.map((n: Notification) => ({
        ...n,
        read: localStorage.getItem(`read_${n.ID}`) !== 'true',
      }));
      setNotifications(withReadStatus);
      setTotalCount(data.count || data.notifications.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, rowsPerPage, filterType]);

  const toggleRead = (id: string) => {
    const newRead = !localStorage.getItem(`read_${id}`) === 'true';
    localStorage.setItem(`read_${id}`, newRead.toString());
    setNotifications(nots => nots.map(n => 
      n.ID === id ? { ...n, read: newRead } : n
    ));
  };

  const typeColors = {
    Placement: 'success' as const,
    Result: 'warning' as const,
    Event: 'info' as const,
  };

  if (loading) return <Container maxWidth="lg" sx={{ py: 4 }}><CircularProgress /></Container>;
  if (error) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Notifications ({totalCount})
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.ID} hover>
                <TableCell>
                  <Chip label={notification.Type} color={typeColors[notification.Type]} size="small" />
                </TableCell>
                <TableCell>{notification.Message}</TableCell>
                <TableCell>{new Date(notification.Timestamp.replace(' ', 'T') + 'Z').toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={notification.read ? 'Read' : 'Unread'} 
                    color={notification.read ? 'default' : 'secondary'}
                    onClick={() => toggleRead(notification.ID)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <a href="/priority">View Priority Inbox →</a>
        </Typography>
      </Box>
    </Container>
  );
}
