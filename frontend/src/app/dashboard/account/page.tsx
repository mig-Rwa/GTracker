"use client";

import type { Metadata } from 'next';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Box, TextField, Button, Alert, Avatar, IconButton, Typography } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

import { config } from '@/config';
import { AccountDetailsForm } from '@/components/dashboard/account/account-details-form';
import { AccountInfo } from '@/components/dashboard/account/account-info';
import React, { useEffect, useState } from 'react';

export default function AccountPage() {
  const [user, setUser] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    weight_kg: '',
    avatar: '',
  });
  const [input, setInput] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    weight_kg: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('custom-auth-token');
      const res = await fetch('/api/auth/me', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setUser(data.data);
        setInput({
          username: data.data.username || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          weight_kg: data.data.weight_kg ? String(data.data.weight_kg) : '',
        });
        setAvatarPreview(data.data.avatar || '');
      }
    }
    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    setLoading(true);
    try {
      // Update user info (except avatar)
      const token = localStorage.getItem('custom-auth-token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          username: input.username,
          email: input.email,
          phone: input.phone,
          address: input.address,
          weight_kg: parseFloat(input.weight_kg)
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccess(true);
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Failed to update profile.');
      }
      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await fetch('/api/auth/avatar', {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData
        });
        const avatarData = await avatarRes.json();
        if (avatarData.status === 'success') {
          setAvatarPreview(avatarData.avatar);
          setSuccess(true);
          setMessage('Profile and avatar updated!');
        } else {
          setMessage((msg) => msg + ' (Avatar upload failed)');
        }
      }
    } catch (err) {
      setMessage('Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={4} display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h4" gutterBottom>Account</Typography>
      <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
        <Avatar src={avatarPreview} sx={{ width: 80, height: 80, mb: 1 }} />
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="avatar-upload"
          type="file"
          onChange={handleAvatarChange}
        />
        <label htmlFor="avatar-upload">
          <IconButton color="primary" component="span" size="large">
            <PhotoCamera />
          </IconButton>
        </label>
      </Box>
      <Box component="form" onSubmit={handleSave} width="100%" display="flex" flexDirection="column" alignItems="center" gap={2}>
        <TextField
          label="Username"
          name="username"
          value={input.username}
          onChange={handleInputChange}
          sx={{ width: 300 }}
        />
        <TextField
          label="Email"
          name="email"
          value={input.email}
          onChange={handleInputChange}
          sx={{ width: 300 }}
        />
        <TextField
          label="Phone"
          name="phone"
          value={input.phone}
          onChange={handleInputChange}
          sx={{ width: 300 }}
        />
        <TextField
          label="Address"
          name="address"
          value={input.address}
          onChange={handleInputChange}
          sx={{ width: 300 }}
        />
        <TextField
          label="Weight (kg)"
          name="weight_kg"
          type="number"
          inputProps={{ min: 1 }}
          value={input.weight_kg}
          onChange={handleInputChange}
          sx={{ width: 300 }}
        />
        <Button type="submit" variant="contained" sx={{ width: 150 }} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      {message && (
        <Alert severity={success ? 'success' : 'error'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}
