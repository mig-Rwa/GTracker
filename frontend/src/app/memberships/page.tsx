'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useUser } from '@/hooks/use-user';

interface Membership {
  id: string;
  plan_key: string;
  label?: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'expired' | 'cancelled';
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('custom-auth-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function MembershipsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Membership[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/memberships', {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });
        const data = await res.json();
        if (res.ok) {
          setHistory(data.data?.history || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (userLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/subscriptions')} sx={{ mb: 2 }}>
        Back to Subscriptions
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Past Memberships
      </Typography>
      {history.length === 0 ? (
        <Typography>No past memberships.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.plan_key}</TableCell>
                  <TableCell>{m.start_date}</TableCell>
                  <TableCell>{m.end_date ?? '-'}</TableCell>
                  <TableCell>
                    <Chip label={m.status} color={m.status === 'expired' ? 'default' : m.status === 'cancelled' ? 'error' : 'success'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
