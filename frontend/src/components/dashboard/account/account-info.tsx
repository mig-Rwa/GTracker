'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth/client';

export function AccountInfo(): React.JSX.Element {
  const { user, isLoading, error, checkSession } = useUser();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!user) {
    return <Typography>No user data found</Typography>;
  }

  // Prepare location string
  const city = typeof user.city === 'string' ? user.city.trim() : '';
  const country = typeof user.country === 'string' ? user.country.trim() : '';
  const location = [city, country].filter(Boolean).join(' ');
  const timezone = typeof user.timezone === 'string' ? user.timezone.trim() : '';

  // Handle file input change and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const token = localStorage.getItem('custom-auth-token');
        const res = await fetch('/api/auth/avatar', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.status === 'success' && data.avatar) {
          // Refresh user context to get new avatar
          await checkSession?.();
        } else {
          setUploadError(data.message || 'Failed to upload avatar');
        }
      } catch (err: any) {
        setUploadError(err.message || 'Network error');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar src={preview || user.avatar || '/assets/avatar.png'} sx={{ height: '80px', width: '80px' }} />
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{String(user.name || user.username || user.email || 'User')}</Typography>
            {location !== '' ? (
              <Typography color="text.secondary" variant="body2">{location}</Typography>
            ) : null}
            {timezone !== '' ? (
              <Typography color="text.secondary" variant="body2">{timezone}</Typography>
            ) : null}
          </Stack>
        </Stack>
        {uploadError && <Typography color="error" variant="body2">{uploadError}</Typography>}
      </CardContent>
      <Divider />
      <CardActions>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="profile-picture-upload"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label htmlFor="profile-picture-upload" style={{ width: '100%' }}>
          <Button fullWidth variant="text" component="span" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload picture'}
          </Button>
        </label>
      </CardActions>
    </Card>
  );
}
