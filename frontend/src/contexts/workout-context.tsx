'use client';

import * as React from "react";

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
}

export interface Workout {
  id: number;
  name: string;
  date: string;
  type?: string;
  exercises: Exercise[];
}

interface WorkoutContextValue {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, "id">) => void;
  addExercisesToWorkout: (workoutId: number, exercises: Exercise[]) => void;
}

const WorkoutContext = React.createContext<WorkoutContextValue | undefined>(undefined);

// Helper to get JWT token from localStorage
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('custom-auth-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function recordCalories(workoutId: number, date: string, exercises: Exercise[], weight_kg: number) {
  const token = localStorage.getItem('custom-auth-token');
  await fetch('/api/progress/record-calories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      workout_id: workoutId,
      date,
      exercises: exercises.map(ex => ({
        name: ex.name,
        met: 4, // Optionally map METS here or let backend handle
        duration_minutes: 30 // Default duration
      })),
      weight_kg,
    }),
  });
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = React.useState<Workout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch workouts from backend on mount
  React.useEffect(() => {
    setLoading(true);
    fetch('/api/workouts', {
      headers: {
        ...getAuthHeader()
      } as HeadersInit
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setWorkouts(data.data.map((workout: Workout) => ({ ...workout, date: workout.date })));
        } else {
          setError(data.message || 'Failed to fetch workouts');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Add new workout via POST
  // Only send fields the backend expects: name, description, date
  const addWorkout = async (workout: Omit<Workout, 'id' | 'exercises'> & { description?: string }) => {
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      } as HeadersInit,
      body: JSON.stringify({ name: workout.name, description: workout.description || '', date: workout.date }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setWorkouts(prev => [{ ...data.data, exercises: [] }, ...prev]);
      // Fetch user weight (optional, or use default)
      let weight_kg = 70;
      try {
        const token = localStorage.getItem('custom-auth-token');
        const res = await fetch('/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const userData = await res.json();
        if (userData.status === 'success' && userData.data && userData.data.weight_kg) {
          weight_kg = userData.data.weight_kg;
        }
      } catch {}
      // Trigger calories recording (empty exercises for now, will be updated after exercises are added)
      await recordCalories(data.data.id, data.data.date, [], weight_kg);
    } else {
      setError(data.message || 'Failed to add workout');
    }
  };


  // Update exercises in a workout (PUT)
  const addExercisesToWorkout = async (workoutId: number, exercises: Exercise[]) => {
    // Find the workout to get its name/description
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const res = await fetch(`/api/workouts/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      } as HeadersInit,
      body: JSON.stringify({
        name: workout.name,
        description: (workout as any).description || '',
        exercises
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setWorkouts(prev => prev.map(w => w.id === Number(workoutId) ? { ...w, exercises: data.data.exercises } : w));
      // Fetch user weight (optional, or use default)
      let weight_kg = 70;
      try {
        const token = localStorage.getItem('custom-auth-token');
        const res = await fetch('/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const userData = await res.json();
        if (userData.status === 'success' && userData.data && userData.data.weight_kg) {
          weight_kg = userData.data.weight_kg;
        }
      } catch {}
      // Trigger calories recording with new exercises
      await recordCalories(workoutId, workout.date, exercises, weight_kg);
    } else {
      setError(data.message || 'Failed to update exercises');
    }
  };

  // TODO: Add deleteWorkout, updateWorkout as needed

  return (
    <WorkoutContext.Provider value={{ workouts, addWorkout: addWorkout as any, addExercisesToWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}


export function useWorkouts() {
  const ctx = React.useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkouts must be used within a WorkoutProvider");
  return ctx;
}
