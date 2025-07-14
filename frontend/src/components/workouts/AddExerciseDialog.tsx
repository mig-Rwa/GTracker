"use client";
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExerciseLibraryTable from "../exercise-library/ExerciseLibraryTable";
import { useWorkouts, Exercise } from "@/contexts/workout-context";

interface AddExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  workoutId: number;
}

export default function AddExerciseDialog({ open, onClose, workoutId }: AddExerciseDialogProps) {
  const { addExercisesToWorkout } = useWorkouts();
  const [selectedExercises, setSelectedExercises] = React.useState<Exercise[]>([]);

  const handleSelectExercise = (exercise: Exercise) => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Exercises to Workout</DialogTitle>
      <DialogContent>
        <ExerciseLibraryTable onSelectExercise={handleSelectExercise} />
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
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={selectedExercises.length === 0}>
          Add to Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
}
