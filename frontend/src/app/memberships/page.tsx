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
  Button,
  Snackbar,
  Alert
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
  const [snackbar, setSnackbar] = useState<{open:boolean;message:string;severity:'success'|'error'|'info'|'warning'}>({open:false,message:'',severity:'info'});
  const handleCloseSnackbar = () => setSnackbar(prev=>({...prev,open:false}));

  const cancelMembership = async (id: string) => {
    try {
      const res = await fetch('/api/memberships', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (res.ok) {
        setSnackbar({open:true,message:'Membership cancelled',severity:'success'});
        // Refresh list
        setHistory(prev=>prev.map(m=>m.id===id?{...m,status:'cancelled'}:m));
      } else {
        const data = await res.json();
        throw new Error(data.message||data.error||'Failed');
      }
    } catch(e:any) {
      setSnackbar({open:true,message:e.message||'Error',severity:'error'});
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/memberships', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json();
      if (res.ok) {
        const historyArr = data.history ?? data.data?.history ?? [];
        const current = data.current ?? data.data?.current;
        const combined = current ? [current, ...historyArr] : historyArr;
        setHistory(combined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Past Memberships
        </Typography>
        <Button variant="outlined" size="small" onClick={fetchHistory}>Refresh</Button>
      </Box>
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
                    {m.status==='active' && (
                      <Button size="small" color="secondary" onClick={()=>cancelMembership(m.id)} sx={{ml:1}}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{vertical:'bottom',horizontal:'center'}}> 
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
