import * as React from 'react';
import { WorkoutProvider } from '@/contexts/workout-context';

export default function ExerciseLibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkoutProvider>
      {children}
    </WorkoutProvider>
  );
}
