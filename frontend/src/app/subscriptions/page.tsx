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
  CardActions,
  Button,
  Grid,
  Stack,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';

// Icons
import {
  Pool as PoolIcon,
  SportsSoccer as SportsSoccerIcon,
  SportsTennis as SportsTennisIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  EventAvailable as CalendarTodayIcon,
} from '@mui/icons-material';

// Custom Hooks
import { useUser } from '@/hooks/use-user';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('custom-auth-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Type definitions
interface Membership {
  id: string;
  user_id: string;
  plan_key: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  days_remaining?: number;
}

interface Booking {
  id: number | string;
  facility: string;
  hours: number;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

interface MembershipPlan {
  id: string;
  plan_key: string;
  label: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Facility {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
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

const hourPrices: Record<number, number> = {
  1: 100,
  2: 180,
  3: 250,
};

// Predefined hourly time slots for the soccer field
const soccerTimeSlots: string[] = [
  '12:05 PM - 1:00 PM',
  '1:05 PM - 2:00 PM',
  '2:05 PM - 3:00 PM',
  '3:05 PM - 4:00 PM',
  '4:05 PM - 5:00 PM',
  '5:05 PM - 6:00 PM',
  '6:05 PM - 7:00 PM',
  '7:05 PM - 8:00 PM',
  '8:05 PM - 9:00 PM',
  '9:05 PM - 10:00 PM',
];

// Facilities data
const facilities = [
  {
    key: 'swimming',
    title: 'Swimming Pool',
    desc: 'Olympic-sized swimming pool with dedicated lanes',
    icon: <PoolIcon />
  },
  {
    key: 'soccer',
    title: 'Soccer Field',
    desc: 'Full-sized professional soccer field with artificial turf',
    icon: <SportsSoccerIcon />
  },
  {
    key: 'tennis',
    title: 'Tennis Courts',
    desc: 'Well-maintained tennis courts with night lighting',
    icon: <SportsTennisIcon />
  }
];

// This component is wrapped with the layout defined in layout.tsx
export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  // State
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [membershipHistory, setMembershipHistory] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingDropdown, setBookingDropdown] = useState<string | null>(null);
  const [bookingHours, setBookingHours] = useState<Record<string, number>>({});
  const [bookingSlots, setBookingSlots] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });
  
  const [bookingData, setBookingData] = useState<BookingData>({
    facility: '',
    date: new Date().toISOString().split('T')[0],
    hours: 1,
  });
  
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [hasActiveMembership, setHasActiveMembership] = useState<boolean>(false);

  // Initialize booking hours
  useEffect(() => {
    const initialBookingHours = facilities.reduce((acc, facility) => {
      acc[facility.key] = 1;
      return acc;
    }, {} as Record<string, number>);
    
    setBookingHours(initialBookingHours);
  }, []);
  
  // Fetch membership plans
  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        setPlansLoading(true);
        console.log('Fetching membership plans...');
        const response = await fetch('/api/memberships/plans');
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          console.log('Membership plans:', result.data);
          setMembershipPlans(result.data);
          if (result.data.length > 0) {
            setSelectedPlan(result.data[0].plan_key);
          }
        } else {
          const errorMessage = result.message || 'Failed to fetch membership plans';
          console.error('API Error:', errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error fetching membership plans:', error);
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : 'Failed to load membership plans. Please try again later.',
          severity: 'error',
        });
      } finally {
        setPlansLoading(false);
      }
    };
    
    fetchMembershipPlans();
  }, []);

  // API helpers
  const fetchMemberships = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/memberships', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const json = await response.json();
      const payload = json.data || json; // backend wraps result under .data
      if (response.ok) {
        const active = payload.current && payload.current.status === 'active' ? payload.current : null;
        setCurrentMembership(active);
        setMembershipHistory(payload.history || []);
        setHasActiveMembership(!!active);
      } else if (response.status === 401) {
        setCurrentMembership(null);
        setMembershipHistory([]);
        setHasActiveMembership(false);
      } else {
        throw new Error(payload.message || 'Failed to fetch memberships');
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load memberships. Please try again later.',
        severity: 'error',
      });
    }
  };

  // Fetch user memberships
  useEffect(() => {
    fetchMemberships();
  }, [user]);

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
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setBookings(data.data || data);
        } else if (response.status === 401) {
          // User not logged in – treat as no bookings without spamming errors
          setBookings([]);
        } else {
          throw new Error(data.message || 'Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Only show snackbar if it wasn't an auth issue we purposely ignored
        setSnackbar({
          open: true,
          message: 'Failed to load bookings. Please try again.',
          severity: 'error',
        });
      } finally {
        setBookingsLoading(false);
      }
    };
    
    fetchUserBookings();
  }, [user]);

  // Handle subscription
  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    try {
      setActionLoading(true);
      const body = { plan_key: selectedPlan };
      const response = await fetch('/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });
      // Robustly parse the response – backend may return an empty body on error
      const rawText = await response.text();
      let data: any = null;
      try {
        if (rawText) {
          data = JSON.parse(rawText);
        }
      } catch (parseErr) {
        // Non-JSON or malformed, keep data as null and log for debugging
        console.warn('Non-JSON response from /api/memberships:', rawText);
      }
      if (response.ok) {
        if (data && data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
          return; // further code will execute after redirect on success page
        }
        // Fallback (dev mode or no url returned)
        setSelectedPlan('');
        await fetchMemberships();
        setSnackbar({ open: true, message: 'Membership activated!', severity: 'success' });
      } else {
        const errMsg = (data && (data.message || data.error)) || rawText || 'Failed to activate membership';
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Failed to process membership.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel current membership
  const handleCancelMembership = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/memberships', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const rawText = await response.text();
      let data: any = null;
      try {
        if (rawText) data = JSON.parse(rawText);
      } catch (e) {
        console.warn('Non-JSON response:', rawText);
      }
      if (response.ok) {
        await fetchMemberships();
        setSnackbar({ open: true, message: 'Membership cancelled.', severity: 'success' });
      } else {
        throw new Error((data && data.message) || rawText || 'Failed to cancel membership');
      }
    } catch (error) {
      console.error('Error cancelling membership:', error);
      setSnackbar({ open: true, message: 'Unable to cancel membership. Please try again.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle booking
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingData.facility || !bookingData.date || !bookingData.hours) {
      setSnackbar({
        open: true,
        message: 'Please fill in all booking details',
        severity: 'warning',
      });
      return;
    }
    
    try {
      setBookingLoading(true);
              const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            facility: bookingData.facility,
            hours: bookingData.hours,
            booking_date: bookingData.date,
          }),
        });
      
      const data = await response.json();
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Booking successful!',
          severity: 'success',
        });
        // Refresh bookings
        const bookingsResponse = await fetch('/api/bookings', {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          }
        });
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.data || bookingsData);
      } else {
        throw new Error(data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create booking. Please try again.',
        severity: 'error',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle booking hour change
  const handleBookingHourChange = (facilityKey: string, hours: number) => {
    setBookingHours(prev => ({
      ...prev,
      [facilityKey]: hours,
    }));
  };

  // Handle slot change
  const handleSlotChange = (facilityKey: string, slot: string) => {
    setBookingSlots(prev => ({
      ...prev,
      [facilityKey]: slot,
    }));
  };

  // Handle apply booking
  const handleApplyBooking = (facilityKey: string) => {
    const selectedFacility = facilities.find(f => f.key === facilityKey);
    if (!selectedFacility) return;
    
    setBookingData(prev => ({
      ...prev,
      facility: selectedFacility.title,
      hours: facilityKey === 'soccer' ? 1 : (bookingHours[facilityKey] || 1),
      // additional slot info could be sent later
    }));
    
    // Show booking form
    setBookingDropdown(facilityKey);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Function to test the API endpoint
  const testMembershipPlans = async () => {
    try {
      console.log('Testing /api/memberships/plans endpoint...');
      const response = await fetch('/api/memberships/plans');
      const result = await response.json();
      console.log('API Response:', result);
      
      setSnackbar({
        open: true,
        message: `Success! Found ${result.data?.length || 0} plans`,
        severity: 'success',
      });
      
      return result;
    } catch (error) {
      console.error('Test failed:', error);
      setSnackbar({
        open: true,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
      throw error;
    }
  };

  // Initiate Stripe checkout for a booking
  const initiateBookingPayment = async (facilityKey: string) => {
    const facilityInfo = facilities.find(f => f.key === facilityKey);
    if (!facilityInfo || !user) return;
    
    const hours = facilityKey === 'soccer' ? 1 : (bookingHours[facilityKey] || 1);
    const booking_date = new Date().toISOString().split('T')[0];
    
    try {
      setActionLoading(true);
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          facility: facilityInfo.title,
          hours,
          booking_date,
          userEmail: user.email,
        }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        // Fallback to direct booking creation if Stripe session creation fails
        const fallbackRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            facility: facilityInfo.title,
            hours,
            booking_date,
          }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok) {
          // Refresh bookings list
          const bookingsRes2 = await fetch('/api/bookings', {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
          });
          const bookingsJson2 = await bookingsRes2.json();
          setBookings(bookingsJson2.data || bookingsJson2);
          setSnackbar({
            open: true,
            message: 'Booking created successfully!',
            severity: 'success',
          });
        } else {
          throw new Error(fallbackData.message || 'Failed to create booking');
        }
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      setSnackbar({
        open: true,
        message: 'Unable to process booking. Please try again.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const now = Date.now();
  const isBookingActive = (b: Booking) => {
    if (b.status !== 'confirmed') return false;
    const start = new Date(b.created_at).getTime();
    const durationMs = b.hours * 60 * 60 * 1000;
    const bufferMs = 60 * 1000; // 1-min grace
    return start + durationMs + bufferMs > now;
  };

  const activeBookings = bookings.filter(isBookingActive)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Membership & Bookings
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={testMembershipPlans}
              disabled={plansLoading}
              startIcon={plansLoading ? <CircularProgress size={20} /> : null}
            >
              {plansLoading ? 'Testing...' : 'Test API'}
            </Button>
          </Box>
              
              {/* Membership Status */}
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Membership Status
                  </Typography>
                  {currentMembership && (
                    <Chip 
                      label={currentMembership.status.toUpperCase()} 
                      color={currentMembership.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  )}
                </Box>
                
                {currentMembership ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1">
                          <strong>Plan:</strong> {currentMembership.plan_type}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Start Date:</strong> {new Date(currentMembership.start_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body1">
                          <strong>End Date:</strong> {new Date(currentMembership.end_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1">
                          <strong>Days Remaining:</strong> {currentMembership.days_remaining}
                        </Typography>
                        <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={handleCancelMembership}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Processing...' : 'Cancel Membership'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            sx={{ ml: 2 }}
                            onClick={() => router.push('/memberships')}
                          >
                            Past Memberships
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      You don't have an active membership
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleSubscribe}
                      disabled={actionLoading || plansLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{ ml: 2, mt: { xs: 2, sm: 0 } }}
                      onClick={() => router.push('/memberships')}
                    >
                      Past Memberships
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {/* Membership Plans */}
              <Box sx={{ mb: 4, width: '100%', position: 'relative', opacity: hasActiveMembership ? 0.4 : 1, pointerEvents: hasActiveMembership ? 'none' : 'auto' }}>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Membership Plans
                </Typography>
                
                {plansLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, width: '100%', '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '3px' } }}>
                    {membershipPlans.map((plan) => (
                      <Box key={plan.plan_key} sx={{ width: 260, flex: '0 0 260px' }}>
                        <Card 
                          variant="outlined"
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderColor: selectedPlan === plan.plan_key ? 'primary.main' : 'divider',
                            borderWidth: selectedPlan === plan.plan_key ? 2 : 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2,
                            },
                            minHeight: 380,
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 1.25, '&:last-child': { pb: 1.25 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {plan.label}
                              </Typography>
                              <Chip 
                                label={
                                  plan.duration_days >= 30 ? 'Popular' : 
                                  plan.duration_days >= 14 ? 'Standard' : 'Basic'
                                }
                                color={
                                  plan.duration_days >= 30 ? 'primary' : 
                                  plan.duration_days >= 14 ? 'secondary' : 'default'
                                }
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.6rem', fontWeight: 'medium' }}
                              />
                            </Box>
                            
                            <Box sx={{ mb: 0.75 }}>
                              <Box display="flex" alignItems="baseline" gap={0.5}>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                  ₺{(plan.price / 100).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  /{plan.duration_days >= 30 ? 'mo' : plan.duration_days >= 14 ? '2w' : 'wk'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                INCLUDED FEATURES:
                              </Typography>
                              <List dense disablePadding sx={{ '& .MuiListItem-root': { minHeight: 24 } }}>
                                {plan.features ? (
                                  (typeof plan.features === 'string' 
                                    ? plan.features.split('\n').filter(Boolean)
                                    : Array.isArray(plan.features) 
                                      ? plan.features 
                                      : []
                                  ).map((feature, index) => (
                                    <ListItem key={index} disableGutters disablePadding sx={{ py: 0 }}>
                                      <ListItemIcon sx={{ minWidth: 28, color: 'primary.main' }}>
                                        <CheckCircleOutlineIcon sx={{ fontSize: '0.85rem' }} />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={
                                          <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                                            {feature.trim()}
                                          </Typography>
                                        } 
                                      />
                                    </ListItem>
                                  ))
                                ) : (
                                  <>
                                    <ListItem disableGutters disablePadding>
                                      <ListItemIcon sx={{ minWidth: 28 }}>
                                        <CheckCircleOutlineIcon color="primary" sx={{ fontSize: '0.85rem' }} />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={
                                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                            Access to all facilities
                                          </Typography>
                                        } 
                                      />
                                    </ListItem>
                                    <ListItem disableGutters disablePadding>
                                      <ListItemIcon sx={{ minWidth: 28 }}>
                                        <CheckCircleOutlineIcon color="primary" sx={{ fontSize: '0.85rem' }} />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={
                                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                            {plan.duration_days >= 30 
                                              ? 'Free personal training session' 
                                              : '10% discount on personal training'}
                                          </Typography>
                                        } 
                                      />
                                    </ListItem>
                                  </>
                                )}
                              </List>
                            </Box>
                          </CardContent>
                          
                          <CardActions sx={{ p: 0.75, pt: 0 }}>
                            <Button
                              fullWidth
                              variant={selectedPlan === plan.plan_key ? 'contained' : 'outlined'}
                              color="primary"
                              size="medium"
                              onClick={() => setSelectedPlan(plan.plan_key)}
                              sx={{
                                py: 0.4,
                                fontWeight: 'medium',
                                borderRadius: 1,
                                textTransform: 'none',
                                fontSize: '0.75rem',
                              }}
                            >
                              {selectedPlan === plan.plan_key ? 'Selected' : 'Select Plan'}
                            </Button>
                          </CardActions>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {membershipPlans.length > 0 && (
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleSubscribe}
                      disabled={hasActiveMembership || !selectedPlan || actionLoading || plansLoading}
                      startIcon={actionLoading ? <CircularProgress size={24} color="inherit" /> : null}
                      sx={{
                        py: 1.5,
                        px: 6,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        minWidth: 250,
                      }}
                    >
                      {actionLoading ? 'Processing...' : 'Activate'}
                    </Button>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Cancel anytime. No hidden fees.
                      </Typography>
                    </Box>
                    
                    {hasActiveMembership && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        You already have an active membership. Manage it above.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              {/* Court Bookings */}
              <Box>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Book a Facility
                </Typography>
                
                <Grid container spacing={3}>
                  {facilities.map((facility) => {
                    const isOpen = bookingDropdown === facility.key;
                    const hours = bookingHours[facility.key] || 1;
                    
                    return (
                      <Grid item xs={12} md={4} key={facility.key}>
                        <Card 
                          variant="outlined"
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 3,
                            },
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                              <Box sx={{ color: 'primary.main' }}>{facility.icon}</Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {facility.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {facility.desc}
                                </Typography>
                              </Box>
                            </Stack>
                            
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => setBookingDropdown(isOpen ? null : facility.key)}
                              startIcon={<CalendarTodayIcon />}
                              sx={{
                                py: 1.2,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '0.95rem',
                              }}
                            >
                              {isOpen ? 'Close' : 'Book Now'}
                            </Button>
                            
                            {isOpen && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                {facility.key === 'soccer' ? (
                                  <>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      Time Slot:
                                    </Typography>
                                    <Select
                                      value={bookingSlots[facility.key] || soccerTimeSlots[0]}
                                      onChange={(e) => handleSlotChange(facility.key, e.target.value as string)}
                                      fullWidth
                                      size="small"
                                      sx={{ mb: 2 }}
                                    >
                                      {soccerTimeSlots.map((slot) => (
                                        <MenuItem key={slot} value={slot}>
                                          {slot}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                      Duration:
                                    </Typography>
                                    <Select
                                      value={hours}
                                      onChange={(e) => handleBookingHourChange(facility.key, Number(e.target.value))}
                                      fullWidth
                                      size="small"
                                      sx={{ mb: 2 }}
                                    >
                                      {[1, 2, 3].map((h) => (
                                        <MenuItem key={h} value={h}>
                                          {h} hour{h > 1 ? 's' : ''}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </>
                                )}
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                  <Typography variant="body1" fontWeight="medium">
                                    Price:
                                  </Typography>
                                  <Typography variant="h6" color="primary" fontWeight="bold">
                                    {hourPrices[facility.key === 'soccer' ? 1 : hours]} TL
                                  </Typography>
                                </Box>
                                
                                <Button 
                                  variant="contained" 
                                  color="primary" 
                                  fullWidth 
                                  onClick={() => initiateBookingPayment(facility.key)}
                                  startIcon={<CheckCircleOutlineIcon />}
                                  sx={{
                                    py: 1,
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                  }}
                                >
                                  {facility.key === 'soccer' ? 'Done' : 'Confirm Booking'}
                                </Button>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
              
              {/* List existing bookings */}
              <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CalendarTodayIcon />}
                  onClick={() => router.push('/bookings')}
                  sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                >
                  My Bookings
                </Button>
              </Box>
            </Grid>
          </Grid>

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
