"use client";

import * as React from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, MenuItem } from '@mui/material';

function calculateBodyFat({ gender, height, neck, waist, hip }: { gender: string, height: number, neck: number, waist: number, hip?: number }) {
  if (gender === 'male') {
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + (hip || 0) - neck) + 0.22100 * Math.log10(height)) - 450;
  }
}

function getBodyFatCategory(gender: string, bf: number) {
  if (gender === 'male') {
    if (bf < 6) return 'Essential fat';
    if (bf < 14) return 'Athletes';
    if (bf < 18) return 'Fitness';
    if (bf < 25) return 'Average';
    return 'Obese';
  } else {
    if (bf < 14) return 'Essential fat';
    if (bf < 21) return 'Athletes';
    if (bf < 25) return 'Fitness';
    if (bf < 32) return 'Average';
    return 'Obese';
  }
}

export default function BodyFatCalculatorPage() {
  const [gender, setGender] = React.useState('male');
  const [age, setAge] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [waist, setWaist] = React.useState('');
  const [neck, setNeck] = React.useState('');
  const [hip, setHip] = React.useState('');
  const [bodyFat, setBodyFat] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const hp = parseFloat(hip);
    if (!h || !n || !w || (gender === 'female' && !hp)) {
      setBodyFat(null);
      setCategory('');
      return;
    }
    const bf = calculateBodyFat({ gender, height: h, neck: n, waist: w, hip: gender === 'female' ? hp : undefined });
    setBodyFat(bf);
    setCategory(getBodyFatCategory(gender, bf));
    // Record body fat % in backend
    const token = localStorage.getItem('custom-auth-token');
    const today = new Date().toISOString().slice(0, 10);
    await fetch('/api/health-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ date: today, body_fat_percentage: bf }),
    });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: 'background.default' }}>
      <Card sx={{ minWidth: 340, p: 3, borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>Body Fat % Calculator</Typography>
          <form onSubmit={handleCalculate}>
            <Stack spacing={3}>
              <TextField
                select
                label="Gender"
                value={gender}
                onChange={e => setGender(e.target.value)}
                fullWidth
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
              <TextField
                label="Age"
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 1 }}
              />
              <TextField
                label="Height (cm)"
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
              <TextField
                label="Waist (cm)"
                type="number"
                value={waist}
                onChange={e => setWaist(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
              <TextField
                label="Neck (cm)"
                type="number"
                value={neck}
                onChange={e => setNeck(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
              {gender === 'female' && (
                <TextField
                  label="Hip (cm)"
                  type="number"
                  value={hip}
                  onChange={e => setHip(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.1 }}
                />
              )}
              <Button type="submit" variant="contained" size="large">Calculate Body Fat %</Button>
            </Stack>
          </form>
          {bodyFat !== null && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h5">Body Fat %: {bodyFat.toFixed(1)}%</Typography>
              <Typography variant="subtitle1" color="primary">Category: {category}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 