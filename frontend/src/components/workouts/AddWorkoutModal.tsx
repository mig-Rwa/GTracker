import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { X as CloseIcon } from '@phosphor-icons/react';
import IconButton from '@mui/material/IconButton';

export interface AddWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (workout: { name: string; type: string; date: string }) => void;
}

const workoutTypes = ['Push', 'Pull', 'Legs', 'Full Body', 'Cardio'];

export default function AddWorkoutModal({ open, onClose, onAdd }: AddWorkoutModalProps) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState(workoutTypes[0]);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name, type, date });
    setName('');
    setType(workoutTypes[0]);
    setDate(new Date().toISOString().slice(0, 10));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Add Workout
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Workout Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Type"
              select
              value={type}
              onChange={e => setType(e.target.value)}
              fullWidth
            >
              {workoutTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Add Workout
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
