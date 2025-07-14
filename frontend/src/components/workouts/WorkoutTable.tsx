'use client';
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Plus as AddIcon, PencilSimple as EditIcon, Trash as DeleteIcon, DotsNine } from '@phosphor-icons/react/dist/ssr';
import AddWorkoutModal from './AddWorkoutModal';

// Removed initialWorkouts; use context instead.

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';

const workoutTypes = ['All', 'Push', 'Pull', 'Legs'];

import { useWorkouts } from '@/contexts/workout-context';

import AddExerciseDialog from './AddExerciseDialog';

// MET lookup table for common exercises
const METS: Record<string, number> = {
  "Running": 8,
  "Push-ups": 3.8,
  "Cycling": 7.5,
  "Squats": 5,
  "Pull-ups": 8,
  "Bench Press": 6,
  "Deadlift": 6,
  "Jump Rope": 12.3,
  // Add more as needed
};

export default function WorkoutTable() {
  const { workouts, addWorkout } = useWorkouts();
  const [addOpen, setAddOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [expandedWorkout, setExpandedWorkout] = React.useState<number | null>(null);
  const [addExerciseOpen, setAddExerciseOpen] = React.useState<number | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter and search logic
  const filteredWorkouts = workouts.filter(w =>
    (filter === 'All' || w.name.toLowerCase().includes(filter.toLowerCase())) &&
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Paper elevation={3} sx={{ borderRadius: 4, boxShadow: 4, p: 3, mt: 2, minWidth: 340 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search workouts"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="var(--icon-fontSize-md)" />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 260 }}
            />
            <TextField
              select
              size="small"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              sx={{ width: 100 }}
            >
              {workoutTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Workout</Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <TableContainer sx={{ boxShadow: 'none', borderRadius: 3 }}>
          <Table sx={{ minWidth: 600 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                <TableCell sx={{ width: 40, fontWeight: 700, color: 'text.secondary' }}>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Exercises</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkouts.length ? (
                filteredWorkouts.map((workout, idx) => {
                  const isToday = workout.date && workout.date.slice(0, 10) === todayStr;
                  return (
                    <React.Fragment key={workout.id}>
                      <TableRow
                        hover
                        sx={{
                          transition: 'background 0.2s',
                          cursor: 'pointer',
                          background: idx % 2 ? 'var(--mui-palette-background-default)' : 'inherit',
                          borderBottom: '1px solid var(--mui-palette-divider)',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: 'text.disabled' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                              <DotsNine size={22} />
                            </Avatar>
                            {workout.name}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 400 }}>
                          {dayjs(workout.date).format('D MMM YYYY')}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
  <Button
    size="small"
    variant="outlined"
    startIcon={<AddIcon />}
    onClick={() => setAddExerciseOpen(workout.id)}
  >
    Add Exercise
  </Button>
  {workout.exercises.length > 0 && (
    <>
      <Button
        size="small"
        variant="contained"
        sx={{ ml: 1 }}
        onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
      >
        {expandedWorkout === workout.id ? 'Hide' : 'Show Exercises'}
      </Button>
    </>
  )}
</Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton color="primary" size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" size="small">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {expandedWorkout === workout.id && workout.exercises.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ bgcolor: 'background.paper', p: 2 }}>
                            <Stack spacing={1}>
                              <strong>Exercises in this workout:</strong>
                              {workout.exercises.map(ex => (
                                <Stack key={ex.id} direction="row" spacing={2} alignItems="center">
                                  {ex.gifUrl ? (
                                    <img src={ex.gifUrl} alt={ex.name} width={40} height={40} style={{ borderRadius: 6 }} />
                                  ) : null}
                                  <span><b>{ex.name}</b> ({ex.target}, {ex.equipment})</span>
                                </Stack>
                              ))}
                              <CaloriesLostField 
                                exerciseNames={workout.exercises.map(ex => ex.name)} 
                                workoutId={workout.id}
                                workoutDate={workout.date}
                              />
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No workouts found. Click "Add Workout" to create your first workout!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <AddWorkoutModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={workout => {
          setAddOpen(false);
          // Map type to description, do not send exercises field
          addWorkout({ name: workout.name, description: workout.type, date: workout.date });
        }}
      />
      {addExerciseOpen !== null && (
        <AddExerciseDialog
          open={addExerciseOpen !== null}
          onClose={() => setAddExerciseOpen(null)}
          workoutId={addExerciseOpen!}
        />
      )}
    </>
  );
}

function CaloriesLostField({ exerciseNames, workoutId, workoutDate }: { exerciseNames: string[]; workoutId: number; workoutDate: string }) {
  const [calories, setCalories] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function calculateAndPersistCalories() {
      if (!exerciseNames.length) return;
      setLoading(true);
      // 1. Fetch user profile to get weight
      let weight_kg = 70;
      try {
        const token = localStorage.getItem('custom-auth-token');
        const res = await fetch('/api/auth/me', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (data.status === 'success' && data.data && data.data.weight_kg) {
          weight_kg = data.data.weight_kg;
        }
      } catch (err) {
        // fallback to default
      }
      // 2. Calculate calories lost
      const exercises = exerciseNames.map(name => ({
        name,
        met: METS[name] || 4,
        duration_minutes: 15
      }));
      let totalCalories = 0;
      exercises.forEach(ex => {
        totalCalories += ex.met * weight_kg * (ex.duration_minutes / 60);
      });
      // 3. Persist to backend
      try {
        const token = localStorage.getItem('custom-auth-token');
        const res = await fetch("/api/progress/record-calories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ exercises, weight_kg, date: workoutDate, workout_id: workoutId })
        });
        const data = await res.json();
        if (data.status === "success") {
          setCalories(Math.round(data.total_calories_burned));
        }
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }
    calculateAndPersistCalories();
    // Only recalculate if exercises or date change
  }, [JSON.stringify(exerciseNames), workoutId, workoutDate]);

  return (
    <div style={{ marginTop: 16 }}>
      {loading ? (
        <span>Calculating calories lost...</span>
      ) : calories !== null ? (
        <div style={{ fontWeight: 600, color: '#333' }}>Calories lost: {calories} kcal</div>
      ) : null}
    </div>
  );
}
