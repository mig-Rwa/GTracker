"use client";

import * as React from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material';

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export default function BmiCalculatorPage() {
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [bmi, setBmi] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height) / 100; // convert cm to m
    const w = parseFloat(weight);
    if (!h || !w) {
      setBmi(null);
      setCategory('');
      return;
    }
    const bmiValue = w / (h * h);
    setBmi(bmiValue);
    setCategory(getBmiCategory(bmiValue));
    // Record BMI in backend
    const token = localStorage.getItem('custom-auth-token');
    const today = new Date().toISOString().slice(0, 10);
    await fetch('/api/health-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ date: today, bmi: bmiValue }),
    });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: 'background.default' }}>
      <Card sx={{ minWidth: 340, p: 3, borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>BMI Calculator</Typography>
          <form onSubmit={handleCalculate}>
            <Stack spacing={3}>
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
              <Button type="submit" variant="contained" size="large">Calculate BMI</Button>
            </Stack>
          </form>
          {bmi !== null && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h5">Your BMI: {bmi.toFixed(1)}</Typography>
              <Typography variant="subtitle1" color="primary">Category: {category}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 