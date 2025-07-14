"use client";

import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';

const activityLevels = [
  { value: 1.2, label: 'Sedentary (little or no exercise)' },
  { value: 1.375, label: 'Lightly active (light exercise/sports 1-3 days/week)' },
  { value: 1.55, label: 'Moderately active (moderate exercise/sports 3-5 days/week)' },
  { value: 1.725, label: 'Very active (hard exercise/sports 6-7 days a week)' },
  { value: 1.9, label: 'Super active (very hard exercise & physical job)' },
];

const goals = [
  { value: 'lose', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'gain', label: 'Gain Muscle' },
];

function calculateMacros({ age, gender, height, weight, activity, goal }: any) {
  // Mifflin-St Jeor Equation for BMR
  let bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  let tdee = bmr * activity;
  // Adjust for goal
  if (goal === 'lose') tdee -= 500;
  if (goal === 'gain') tdee += 300;
  // Macros: Protein 30%, Carbs 40%, Fat 30%
  const protein = Math.round((tdee * 0.3) / 4);
  const carbs = Math.round((tdee * 0.4) / 4);
  const fat = Math.round((tdee * 0.3) / 9);
  return { calories: Math.round(tdee), protein, carbs, fat };
}

export default function NutritionPage() {
  const [form, setForm] = React.useState({
    age: '', gender: 'male', height: '', weight: '', activity: 1.2, goal: 'maintain',
  });
  const [result, setResult] = React.useState<any | null>(null);
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ingredient, setIngredient] = React.useState('');
  const [meals, setMeals] = React.useState<any[]>([]);
  const [openNav, setOpenNav] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      ...form,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      activity: Number(form.activity),
    };
    setResult(calculateMacros(parsed));
    setRecipes([]);
    setError(null);
  };

  const handleGetRecipes = async () => {
    if (!result) return;
    setLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const params = new URLSearchParams({
        calories: String(result.calories),
        protein: String(result.protein),
        carbs: String(result.carbs),
        fat: String(result.fat),
        number: '5',
      });
      const res = await fetch(`/api/food/recipes?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Failed to fetch recipes');
      setRecipes(json.data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGetMeals = async () => {
    if (!ingredient) return;
    setLoading(true);
    setError(null);
    setMeals([]);
    try {
      const res = await fetch(`/api/food/meals?ingredient=${encodeURIComponent(ingredient)}`);
      const json = await res.json();
      if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Failed to fetch meals');
      setMeals(json.data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileNav open={openNav} onClose={() => setOpenNav(false)} />
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          {/* Left icons: sidebar open and home */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setOpenNav(true)}>
              <ListIcon fontSize="var(--icon-fontSize-lg)" />
            </IconButton>
            <Link href="/dashboard">
              <IconButton>
                <HouseIcon fontSize="var(--icon-fontSize-lg)" />
              </IconButton>
            </Link>
            <Typography variant="h4" sx={{ ml: 1 }}>
              Nutrition
            </Typography>
          </Stack>
          {/* Right icons: search, notifications, avatar */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton>
              <SearchIcon fontSize="var(--icon-fontSize-lg)" />
            </IconButton>
            <Tooltip title="Notifications">
              <IconButton>
                <BellIcon fontSize="var(--icon-fontSize-lg)" />
              </IconButton>
            </Tooltip>
            <Avatar src="/assets/avatar.png" sx={{ width: 40, height: 40, ml: 1, cursor: 'pointer' }} />
          </Stack>
        </Stack>
        <Paper sx={{ maxWidth: 500, mx: 'auto', mt: 2, p: 4 }}>
          <Typography variant="h5" mb={2}>Personalized Nutrition Recommendation</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Age" name="age" type="number" value={form.age} onChange={handleChange} required />
              <TextField label="Gender" name="gender" select value={form.gender} onChange={handleChange} required>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
              <TextField label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} required />
              <TextField label="Weight (kg)" name="weight" type="number" value={form.weight} onChange={handleChange} required />
              <TextField label="Activity Level" name="activity" select value={form.activity} onChange={handleChange} required>
                {activityLevels.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Goal" name="goal" select value={form.goal} onChange={handleChange} required>
                {goals.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained">Get Recommendation</Button>
            </Stack>
          </form>
          {result && (
            <Stack spacing={2} mt={4}>
              <Typography variant="h6">Your Daily Targets</Typography>
              <Typography>Calories: <b>{result.calories}</b> kcal</Typography>
              <Typography>Protein: <b>{result.protein}</b> g</Typography>
              <Typography>Carbs: <b>{result.carbs}</b> g</Typography>
              <Typography>Fat: <b>{result.fat}</b> g</Typography>
              <Button variant="outlined" onClick={handleGetRecipes} disabled={loading} sx={{ mt: 2 }}>
                {loading ? 'Loading...' : 'Get Recipe Suggestions'}
              </Button>
              {error && <Typography color="error">{error}</Typography>}
              {recipes.length > 0 && (
                <Stack spacing={2} mt={2}>
                  <Typography variant="h6">Recipe Suggestions</Typography>
                  {recipes.map((r: any) => (
                    <Card key={r.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {r.image && (
                        <CardMedia
                          component="img"
                          image={r.image}
                          alt={r.title}
                          sx={{ width: 80, height: 80, objectFit: 'cover', mr: 2 }}
                        />
                      )}
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">{r.title}</Typography>
                        <Typography variant="body2">Calories: {r.calories} kcal</Typography>
                        <Typography variant="body2">Protein: {r.protein}g | Carbs: {r.carbs}g | Fat: {r.fat}g</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
          <Stack spacing={2} mt={4}>
            <Typography variant="h6">Find Meals by Ingredient</Typography>
            <TextField label="Ingredient" value={ingredient} onChange={e => setIngredient(e.target.value)} placeholder="e.g. chicken, beef, rice" />
            <Button variant="outlined" onClick={handleGetMeals} disabled={loading || !ingredient} sx={{ mt: 1 }}>
              {loading ? 'Loading...' : 'Get Meal Suggestions'}
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            {meals.length > 0 && (
              <Stack spacing={2} mt={2}>
                <Typography variant="h6">Meal Suggestions</Typography>
                {meals.map((m: any) => (
                  <Card key={m.idMeal} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {m.strMealThumb && (
                      <CardMedia
                        component="img"
                        image={m.strMealThumb}
                        alt={m.strMeal}
                        sx={{ width: 80, height: 80, objectFit: 'cover', mr: 2 }}
                      />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{m.strMeal}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}
