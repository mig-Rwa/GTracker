'use client';
import * as React from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Plus as AddIcon } from '@phosphor-icons/react/dist/ssr';
import WorkoutTable from '@/components/workouts/WorkoutTable';

import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';

import { WorkoutProvider } from '@/contexts/workout-context';

export default function WorkoutsPage() {
  const [openNav, setOpenNav] = React.useState(false);

  return (
    <WorkoutProvider>
      <MobileNav open={openNav} onClose={() => setOpenNav(false)} />
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          {/* Left icons: sidebar open and home */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setOpenNav(true)}>
              <ListIcon fontSize="var(--icon-fontSize-lg)" />
            </IconButton>
            <Link href="/dashboard">
              <IconButton>
                <HouseIcon fontSize="var(--icon-fontSize-lg)" />
              </IconButton>
            </Link>
            <Typography variant="h4" sx={{ ml: 1 }}>
              Workouts
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
        <WorkoutTable />
      </Stack>
    </WorkoutProvider>
  );
}
