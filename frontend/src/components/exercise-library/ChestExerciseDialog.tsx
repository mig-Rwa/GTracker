"use client";
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExerciseLibraryTable from "./ExerciseLibraryTable";
import { fetchChestExercises, ExerciseApi } from "@/utils/exercisesApi";

// Mock: List of workouts (should be fetched from backend or context in real app)
const mockWorkouts = [
  { id: 1, name: "Push Day" },
  { id: 2, name: "Upper Body" },
  { id: 3, name: "Chest Focus" },
];

const chestParts = [
  { key: "upper", label: "Upper Chest" },
  { key: "middle", label: "Middle Chest" },
  { key: "lower", label: "Lower Chest" },
  { key: "inner", label: "Inner Chest" },
  { key: "outer", label: "Outer Chest" },
];

export interface ChestExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onAddExercises: (workoutId: number, chestPart: string, exercises: any[]) => void;
}

import { useWorkouts } from '@/contexts/workout-context';

export default function ChestExerciseDialog({ open, onClose, onAddExercises }: ChestExerciseDialogProps) {
  const { workouts, addExercisesToWorkout } = useWorkouts();
  const [workoutId, setWorkoutId] = React.useState<number>(workouts[0]?.id || 1);
  const [chestPart, setChestPart] = React.useState<string>(chestParts[0].key);
  const [selectedExercises, setSelectedExercises] = React.useState<any[]>([]);
  const [apiExercises, setApiExercises] = React.useState<ExerciseApi[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // TODO: Replace with secure env variable or user input
  const RAPID_API_KEY = "59e75cdb1fmshead49eb375543a2p1ec0b5jsneaeeffa9e399";

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchChestExercises(RAPID_API_KEY)
      .then(data => setApiExercises(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  React.useEffect(() => {
    if (workouts.length && !workouts.find(w => w.id === workoutId)) {
      setWorkoutId(workouts[0].id);
    }
  }, [workouts]);

  // Filter exercises for chest part (mock logic)
  const handleSelectExercise = (exercise: any) => {
    if (!selectedExercises.find((ex) => ex.id === exercise.id)) {
      setSelectedExercises((prev) => [...prev, exercise]);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleAdd = () => {
    addExercisesToWorkout(workoutId, selectedExercises);
    setSelectedExercises([]);
    onClose();
  };

  // TODO: Filter ExerciseLibraryTable by chest body part and chestPart (target)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Chest Exercises</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2} mb={2}>

          <TextField
            select
            label="Workout"
            value={workoutId}
            onChange={(e) => setWorkoutId(Number(e.target.value))}
            sx={{ minWidth: 220, whiteSpace: 'nowrap', mt: 2 }}
          >
            {workouts.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Chest Sub-Part"
            value={chestPart}
            onChange={e => setChestPart(e.target.value)}
            sx={{ minWidth: 220, whiteSpace: 'nowrap' }}
          >
            {chestParts.map((p) => (
              <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
        {loading && <Typography>Loading exercises...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}
        {!loading && !error && (
          <ExerciseLibraryTable exercises={apiExercises} onSelectExercise={handleSelectExercise} />
        )}
        {selectedExercises.length > 0 && (
          <Stack spacing={1} mt={2}>
            <Typography variant="subtitle1">Selected Exercises:</Typography>
            {selectedExercises.map((ex) => (
              <Stack direction="row" spacing={2} alignItems="center" key={ex.id}>
                <Typography>{ex.name}</Typography>
                <Button size="small" color="error" onClick={() => handleRemoveExercise(ex.id)}>
                  Remove
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={selectedExercises.length === 0}>Add to Workout</Button>
      </DialogActions>
    </Dialog>
  );
}
