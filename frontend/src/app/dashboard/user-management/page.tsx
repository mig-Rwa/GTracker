"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

export default function UserManagementPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [editRoleOpen, setEditRoleOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [form, setForm] = React.useState({ username: '', email: '', password: '', role: 'user' });
  const [role, setRole] = React.useState('user');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) return; // Wait until loading is done
    if (!user) return;     // Wait until user is loaded
    if (user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch users (refactored to a function)
  const fetchUsers = React.useCallback(() => {
    if (user && user.role === 'admin') {
      setLoading(true);
      fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`
        }
      })
        .then(async res => {
          let json;
          try { json = await res.json(); } catch { throw new Error('Invalid JSON'); }
          if (json.status === 'success') setUsers(json.data);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Add User
  const handleAddUser = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`
        },
        body: JSON.stringify(form)
      });
      setAddOpen(false);
      setForm({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } finally { setSaving(false); }
  };

  // Update Role
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`
        },
        body: JSON.stringify({ role })
      });
      setEditRoleOpen(false);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`
        }
      });
      setDeleteOpen(false);
      fetchUsers();
    } finally { setSaving(false); }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', width: 180 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'role', headerName: 'Role', width: 100 },
    { field: 'age', headerName: 'Age', width: 80 },
    { field: 'gender', headerName: 'Gender', width: 100 },
    { field: 'weight_kg', headerName: 'Weight (kg)', width: 110 },
    { field: 'height_cm', headerName: 'Height (cm)', width: 110 },
    { field: 'created_at', headerName: 'Created', width: 160 },
    {
      field: 'actions',
      type: 'actions',
      width: 160,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Update Role" onClick={() => { setSelectedUser(params.row); setRole(params.row.role); setEditRoleOpen(true); }} />, 
        <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => { setSelectedUser(params.row); setDeleteOpen(true); }} />
      ]
    }
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h4" mb={2}>User Management</Typography>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={() => setAddOpen(true)}>Add User</Button>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </div>
      {/* Add User Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <TextField label="Username" fullWidth margin="normal" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          <TextField label="Email" fullWidth margin="normal" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      {/* Update Role Dialog */}
      <Dialog open={editRoleOpen} onClose={() => setEditRoleOpen(false)}>
        <DialogTitle>Update Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={e => setRole(e.target.value)}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Update'}</Button>
        </DialogActions>
      </Dialog>
      {/* Delete User Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete user <b>{selectedUser?.username}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteUser} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 