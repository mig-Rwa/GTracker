"use client";
import * as React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import Image from 'next/image';

// Categorized body parts (ExerciseDB main categories + Cardio)
type BodyPart = {
  key: string;
  label: string;
  category: string;
  image?: string;
  icon?: React.ReactNode;
};

const bodyParts: BodyPart[] = [
  { key: 'chest', label: 'Chest', category: 'Body Part Workout', image: '/images/chestmain.jpg' },
  { key: 'back', label: 'Back', category: 'Body Part Workout', image: '/images/backmain.JPG' },
  { key: 'shoulders', label: 'Shoulders', category: 'Body Part Workout', image: '/images/shouldersmain.JPG' },
  { key: 'arms', label: 'Arms', category: 'Body Part Workout', image: '/images/armsmain.JPG' },
  { key: 'legs', label: 'Legs', category: 'Body Part Workout', image: '/images/legsmain.JPG' },
  { key: 'waist', label: 'Core/Waist', category: 'Body Part Workout', image: '/images/coremain.JPG' },
  { key: 'cardio', label: 'Cardio', category: 'Cardio', image: '/images/cardiomain.jpg' },
];

const categories = [
  { key: 'Body Part Workout', label: 'Body Part Workouts' },
  { key: 'Cardio', label: 'Cardio' },
];

import ChestExerciseDialog from './ChestExerciseDialog';

export default function BodyPartCards() {
  const [chestDialogOpen, setChestDialogOpen] = React.useState(false);

  // Handler for adding exercises (could be passed up or to backend)
  const handleAddChestExercises = (workoutId: number, chestPart: string, exercises: any[]) => {
    // TODO: Implement actual add logic (API call, state update, etc)
    console.log('Add to workout', workoutId, 'Chest part', chestPart, 'Exercises', exercises);
  };

  return (
    <>
      <ChestExerciseDialog
        open={chestDialogOpen}
        onClose={() => setChestDialogOpen(false)}
        onAddExercises={handleAddChestExercises}
      />
      <Stack spacing={5} sx={{ px: { xs: 1, sm: 4 }, py: 4 }}>
        {categories.map((cat) => (
          <Box key={cat.key}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 900, letterSpacing: 1 }}>
            {cat.label}
          </Typography>
          <Grid container spacing={4} sx={{
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 2,
          }}>
            {bodyParts.filter(bp => bp.category === cat.key).map(bp => (
              <Grid item xs={10} sm={6} md={4} lg={3} key={bp.key} sx={{ minWidth: 260 }}>
                <Card
                  sx={{
                    borderRadius: 5,
                    boxShadow: 6,
                    minHeight: 340,
                    height: 340,
                    width: '100%',
                    p: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: 12,
                    },
                    '&:hover .card-name-overlay': {
                      opacity: 1,
                      pointerEvents: 'auto',
                    },
                  }}
                  elevation={0}
                  onClick={bp.key === 'chest' ? () => setChestDialogOpen(true) : undefined}
                >
                  {bp.image ? (
                    <Box sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 1,
                      bgcolor: '#f0f4f8',
                      border: '2px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Image
                        src={bp.image}
                        alt={bp.label}
                        fill
                        style={{ objectFit: 'cover', transition: 'opacity 0.3s' }}
                        sizes="(max-width: 600px) 100vw, 33vw"
                        onError={(e: any) => {
                          // If you want to handle image errors, you could use state here
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      bgcolor: '#f0f4f8',
                      border: '2px solid #e0e0e0',
                    }}>
                      {bp.icon}
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      pointerEvents: 'none',
                    }}
                    className="card-name-overlay"
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        color: '#fff',
                        fontWeight: 900,
                        letterSpacing: 2,
                        textShadow: '0 4px 24px rgba(0,0,0,0.8)',
                        textAlign: 'center',
                        px: 2,
                      }}
                    >
                      {bp.label}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Stack>
    </>
  );
}

