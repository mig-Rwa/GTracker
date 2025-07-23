'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import PoolIcon from '@mui/icons-material/Pool';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function SubscriptionsPage() {
  const [openNav, setOpenNav] = React.useState(false);
  const [currentMembership, setCurrentMembership] = React.useState<string | null>(null);
  const [bookingDropdown, setBookingDropdown] = React.useState<string | null>(null);
  const [bookingHours, setBookingHours] = React.useState<{ [key: string]: number }>({});
  const [activeBooking, setActiveBooking] = React.useState<string | null>(null);
  const [appliedBookings, setAppliedBookings] = React.useState<{ [key: string]: number }>({});

  // Memberships data
  const memberships = [
    {
      key: 'basic',
      title: 'Basic',
      price: '$20/mo',
      features: ['Gym Access', 'Locker'],
    },
    {
      key: 'premium',
      title: 'Premium',
      price: '$35/mo',
      features: ['Gym Access', 'Locker', 'Personal Trainer'],
    },
    {
      key: 'student',
      title: 'Premium',
      price: '$15/mo',
      features: ['Gym Access', 'Limited Hours', 'Student ID required'],
    },
  ];

  const bookings = [
    {
      key: 'pool',
      icon: <PoolIcon color="primary" />,
      title: 'Swimming Pool',
      desc: 'Available Slots\nLifeguard included',
    },
    {
      key: 'football',
      icon: <SportsSoccerIcon color="primary" />,
      title: 'Football Pitch',
      desc: '1 Hour per session\nTeam slots (max.)',
    },
    {
      key: 'tennis',
      icon: <SportsTennisIcon color="primary" />,
      title: 'Tennis Court',
      desc: 'Indoor/Outdoor options\nRackets available',
    },
  ];

  const hourOptions = [1, 2, 3];
  const hourPrices = { 1: 100, 2: 175, 3: 250 };

  const handleBookingHourChange = (courtKey: string, hour: number) => {
    setBookingHours(h => ({ ...h, [courtKey]: hour }));
  };

  const handleApplyBooking = (courtKey: string) => {
    const hour = bookingHours[courtKey] || 1;
    setAppliedBookings(prev => ({ ...prev, [courtKey]: hour }));
    setBookingDropdown(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#fafbfc' }}>
      <MobileNav open={openNav} onClose={() => setOpenNav(false)} />
      {/* Header matching Workouts page */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1, mb: 2, width: '100%', maxWidth: '100%' }}>
        {/* Left icons: sidebar open and home */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setOpenNav(true)}>
            <ListIcon fontSize="large" />
          </IconButton>
          <Link href="/dashboard">
            <IconButton>
              <HomeIcon fontSize="large" />
            </IconButton>
          </Link>
          <Typography variant="h4" sx={{ ml: 1 }}>
            Subscription Options
          </Typography>
        </Stack>
        {/* Right icons: search, notifications, avatar */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton>
            <SearchIcon fontSize="var(--icon-fontSize-lg)" />
          </IconButton>
          <Tooltip title="Notifications">
            <IconButton>
              <BellIcon fontSize="var(--icon-fontSize-lg)" />
            </IconButton>
          </Tooltip>
          <Avatar src="/assets/avatar.png" sx={{ width: 40, height: 40, ml: 1, cursor: 'pointer' }} />
        </Stack>
      </Stack>
      <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 2 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 4 }}>
          {/* Gym Memberships */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Gym Memberships
          </Typography>
          <Grid container spacing={2} direction="row" justifyContent="flex-start" alignItems="stretch" sx={{ mb: 3 }}>
            {memberships.map((m) => {
              const isCurrent = currentMembership === m.key;
              return (
                <Grid item xs={12} md={4} key={m.key}>
                  <Card
                    variant={isCurrent ? 'elevation' : 'outlined'}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: isCurrent ? 'primary.main' : 'background.paper',
                      color: isCurrent ? 'primary.contrastText' : 'text.primary',
                      boxShadow: isCurrent ? 6 : undefined,
                      borderColor: isCurrent ? 'primary.main' : undefined,
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardContent sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{m.title}</Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>{m.price}</Typography>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {m.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2, bgcolor: 'common.white', color: 'primary.main', fontWeight: 700, boxShadow: 0, '&:hover': { bgcolor: 'grey.100' } }}
                          disabled
                        >
                          CURRENT SUBSCRIPTION
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => setCurrentMembership(m.key)}
                        >
                          Subscribe
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          <Divider sx={{ my: 3 }} />
          {/* Court Bookings */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Court Bookings
          </Typography>
          <Stack spacing={2}>
            {bookings.map((b) => {
              const isOpen = bookingDropdown === b.key;
              const selectedHour = bookingHours[b.key] || 1;
              const isActive = appliedBookings[b.key] !== undefined;
              return (
                <Card
                  variant={isActive ? 'elevation' : 'outlined'}
                  sx={{
                    borderRadius: 3,
                    boxShadow: isActive ? 8 : undefined,
                    borderColor: isActive ? 'primary.main' : undefined,
                    bgcolor: isActive ? 'primary.lighter' : 'background.paper',
                    transition: 'all 0.2s',
                  }}
                  key={b.key}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {b.icon}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{b.title}</Typography>
                        <Typography variant="body2" color="text.secondary" style={{ whiteSpace: 'pre-line' }}>{b.desc}</Typography>
                      </Box>
                    </Stack>
                    <Box>
                      <Button
                        variant="contained"
                        onClick={() => setBookingDropdown(isOpen ? null : b.key)}
                        sx={{ mb: isOpen ? 1 : 0 }}
                      >
                        Book Now
                      </Button>
                      {isOpen && (
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                          <Select
                            size="small"
                            value={selectedHour}
                            onChange={e => handleBookingHourChange(b.key, Number(e.target.value))}
                          >
                            {hourOptions.map(opt => (
                              <MenuItem key={opt} value={opt}>{opt} hour{opt > 1 ? 's' : ''}</MenuItem>
                            ))}
                          </Select>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {hourPrices[selectedHour as 1 | 2 | 3]} TL
                          </Typography>
                          <Button
                            variant="outlined"
                            color="primary"
                            sx={{ ml: 2 }}
                            onClick={() => handleApplyBooking(b.key)}
                          >
                            Apply
                          </Button>
                        </Stack>
                      )}
                      {isActive && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'common.white', borderRadius: 2, boxShadow: 1, textAlign: 'center' }}>
                          <Typography variant="body2" color="primary" fontWeight={700}>
                            Current: {appliedBookings[b.key]} hour{appliedBookings[b.key] > 1 ? 's' : ''} - {hourPrices[appliedBookings[b.key] as 1 | 2 | 3]} TL
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
} 