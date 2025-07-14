// Utility to fetch exercises from RapidAPI ExercisesDB

export interface ExerciseApi {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
}

const EXERCISES_API_URL = 'https://exercisedb.p.rapidapi.com/exercises/bodyPart/chest?limit=40';

export async function fetchChestExercises(apiKey: string): Promise<ExerciseApi[]> {
  const res = await fetch(EXERCISES_API_URL, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
}
