'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// MUI Components
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material';

// Icons
import {
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Pool as PoolIcon,
  SportsSoccer as SportsSoccerIcon,
  SportsTennis as SportsTennisIcon,
} from '@mui/icons-material';

// Custom Hooks
import { useUser } from '@/hooks/use-user';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('custom-auth-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Type definitions
interface Booking {
  id: number | string;
  facility: string;
  hours: number;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface BookingData {
  facility: string;
  date: string;
  hours: number;
}

const facilities = [
  {
    key: 'swimming',
    title: 'Swimming Pool',
    desc: 'Olympic-sized swimming pool with dedicated lanes',
    icon: <PoolIcon />,
  },
  {
    key: 'soccer',
    title: 'Soccer Field',
    desc: 'Full-sized professional soccer field with artificial turf',
    icon: <SportsSoccerIcon />,
  },
  {
    key: 'tennis',
    title: 'Tennis Courts',
    desc: 'Well-maintained tennis courts with night lighting',
    icon: <SportsTennisIcon />,
  }
];

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editBookingData, setEditBookingData] = useState<BookingData>({
    facility: '',
    date: '',
    hours: 1,
  });

  // Fetch user bookings
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;
      
      try {
        setBookingsLoading(true);
        const response = await fetch('/api/bookings', { 
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
          setBookings(data.data || data);
        } else if (response.status === 401) {
          setBookings([]);
        } else {
          throw new Error(data.message || 'Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load bookings. Please try again later.',
          severity: 'error',
        });
      } finally {
        setBookingsLoading(false);
      }
    };
    
    fetchUserBookings();
  }, [user]);

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle edit booking
  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookingData({
      facility: booking.facility,
      date: booking.booking_date,
      hours: booking.hours,
    });
    setEditDialogOpen(true);
  };

  // Handle update booking
  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editBookingData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Booking updated successfully!',
          severity: 'success',
        });
        
        // Refresh bookings
        const bookingsResponse = await fetch('/api/bookings', {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          credentials: 'include'
        });
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.data || bookingsData);
        
        setEditDialogOpen(false);
        setSelectedBooking(null);
      } else {
        throw new Error(data.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update booking. Please try again.',
        severity: 'error',
      });
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId: string | number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Booking cancelled successfully!',
          severity: 'success',
        });
        
        // Refresh bookings
        const bookingsResponse = await fetch('/api/bookings', {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          credentials: 'include'
        });
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.data || bookingsData);
      } else {
        throw new Error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setSnackbar({
        open: true,
        message: 'Failed to cancel booking. Please try again.',
        severity: 'error',
      });
    }
  };

  // Get facility icon
  const getFacilityIcon = (facilityName: string) => {
    const facility = facilities.find(f => f.title === facilityName);
    return facility?.icon || <CalendarIcon />;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const now = Date.now();
  const isStillActive = (b: Booking) => {
    if (b.status !== 'confirmed') return false;
    const hours = Number(b.hours) || 1;
    // robust timestamp from created_at or booking_date
    let start = Date.parse(b.created_at as unknown as string);
    if (Number.isNaN(start)) {
      // fallback to booking_date midnight
      start = Date.parse(b.booking_date + 'T00:00:00');
    }
    const durationMs = hours * 60 * 60 * 1000;
    const bufferMs = 60 * 1000; // 1-min grace
    return start + durationMs + bufferMs > now;
  };

  const activeBookings = bookings.filter(isStillActive)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const pastBookings = bookings.filter(b => !isStillActive(b))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const sortedBookings = [...bookings].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            My Bookings
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/subscriptions')}
            sx={{
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
            }}
          >
            Book New Facility
          </Button>
        </Stack>

        {bookingsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No bookings found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You haven't made any facility bookings yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/subscriptions')}
                sx={{
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                }}
              >
                Book Your First Facility
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Facility</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getFacilityIcon(booking.facility)}
                        <Typography fontWeight="bold">{booking.facility}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(booking.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</TableCell>
                    <TableCell>{booking.hours}</TableCell>
                    <TableCell>
                      <Chip label={booking.status} color={getStatusColor(booking.status) as any} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Facility</InputLabel>
              <Select
                value={editBookingData.facility}
                onChange={(e) => setEditBookingData(prev => ({ ...prev, facility: e.target.value }))}
                label="Facility"
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.key} value={facility.title}>
                    {facility.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Date"
              type="date"
              value={editBookingData.date}
              onChange={(e) => setEditBookingData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Duration (hours)</InputLabel>
              <Select
                value={editBookingData.hours}
                onChange={(e) => setEditBookingData(prev => ({ ...prev, hours: Number(e.target.value) }))}
                label="Duration (hours)"
              >
                {[1, 2, 3].map((hour) => (
                  <MenuItem key={hour} value={hour}>
                    {hour} hour{hour > 1 ? 's' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateBooking} variant="contained">Update Booking</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 