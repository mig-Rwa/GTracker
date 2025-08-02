"use client";

import * as React from 'react';
import type { Metadata } from 'next';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { Chart } from '@/components/core/chart';

import { config } from '@/config';
import { Budget } from '@/components/dashboard/overview/budget';
import { LatestOrders } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts } from '@/components/dashboard/overview/latest-products';
import { CaloriesBurnedOverTime } from '@/components/dashboard/overview/sales';
import { TasksProgress } from '@/components/dashboard/overview/tasks-progress';
import { TotalCustomers } from '@/components/dashboard/overview/total-customers';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { WorkoutTypeDistribution } from '@/components/dashboard/overview/traffic';

function CaloriesLostGraph() {
  const [period, setPeriod] = React.useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = React.useState<{ label: string; calories: number }[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const token = localStorage.getItem('custom-auth-token');
      const res = await fetch(`/api/progress/calories-burned?period=${period}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data || []);
      } else {
        setData([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [period]);

  const chartSeries = [
    {
      name: 'Calories Lost',
      data: data.map(row => row.calories || 0),
    },
  ];
  const chartOptions = {
    chart: { background: 'transparent', stacked: false, toolbar: { show: false } },
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
    grid: { borderColor: '#eee', strokeDashArray: 2 },
    legend: { show: false },
    plotOptions: { bar: { columnWidth: '40px' } },
    stroke: { colors: ['transparent'], show: true, width: 2 },
    xaxis: {
      categories: data.map(row => row.label),
      labels: { offsetY: 5 },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => (value > 0 ? `${value}` : `${value}`),
        offsetX: -10,
      },
    },
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardHeader
        title="Calories Lost Over Time"
        action={
          <Select
            size="small"
            value={period}
            onChange={e => setPeriod(e.target.value as 'day' | 'week' | 'month')}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </Select>
        }
      />
      <CardContent>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
        )}
      </CardContent>
    </Card>
  );
}

export default function Page(): React.JSX.Element {
  // State for each dashboard widget
  const [calories, setCalories] = React.useState<number | null>(null);
  const [workouts, setWorkouts] = React.useState<number | null>(null);
  const [goalProgress, setGoalProgress] = React.useState<number | null>(null);
  const [activeDays, setActiveDays] = React.useState<number | null>(null);
  const [caloriesChart, setCaloriesChart] = React.useState<any[]>([]);
  const [workoutTypes, setWorkoutTypes] = React.useState<any[]>([]);
  const [recentExercises, setRecentExercises] = React.useState<any[]>([]);
  const [recentWorkouts, setRecentWorkouts] = React.useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = React.useState<any[]>([]);
  const [workoutsPeriod, setWorkoutsPeriod] = React.useState<'week' | 'month' | 'year'>('week');

  // Pagination state for workouts and exercises
  const [workoutPage, setWorkoutPage] = React.useState(0);
  const [workoutTotal, setWorkoutTotal] = React.useState(0);
  const [exercisePage, setExercisePage] = React.useState(0);
  const [exerciseTotal, setExerciseTotal] = React.useState(0);
  const rowsPerPage = 5;

  // Helper to build Authorization header once
  const authHeaders = () => {
    const token = localStorage.getItem('custom-auth-token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch paginated workouts
  const fetchWorkouts = React.useCallback((page = 0) => {
    fetch(`/api/workouts/recent?limit=${rowsPerPage}&offset=${page * rowsPerPage}`, { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        setRecentWorkouts(json.data || []);
        setWorkoutTotal(json.total || 0);
      });
  }, []);

  // Fetch paginated exercises
  const fetchExercises = React.useCallback((page = 0) => {
    fetch(`/api/exercises/recent?limit=${rowsPerPage}&offset=${page * rowsPerPage}`, { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        setRecentExercises(json.data || []);
        setExerciseTotal(json.total || 0);
      });
  }, []);

  // Fetch workouts completed for selected period
  const fetchWorkoutsCompleted = React.useCallback((period: 'week' | 'month' | 'year') => {
    fetch(`/api/workouts/completed?period=${period}`, { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setWorkouts(json.count));
  }, []);

  // Fetch all other dashboard data
  const fetchDashboardData = React.useCallback(() => {
    // Calories Consumed
    fetch('/api/food/total-calories?period=week', { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setCalories(json.total));
    // Workouts Completed
    fetchWorkoutsCompleted(workoutsPeriod);
    // Weekly Goal Progress
    fetch('/api/progress/weekly-goal', { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setGoalProgress(json.percent));
    // Active Days
    fetch('/api/progress/active-days?period=week', { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setActiveDays(json.count));
    // Calories Burned Over Time
    fetch('/api/progress/calories-burned', { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setCaloriesChart(json.data));
    // Workout Type Distribution
    fetch('/api/progress/workout-types', { headers: authHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(json => setWorkoutTypes(json.data));
    // Fetch weekly health metrics
    const token = localStorage.getItem('custom-auth-token');
    fetch('/api/health-metrics/weekly', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include'
    })
      .then(res => res.json())
      .then(json => setHealthMetrics(json.data || []));
    // Paginated lists
    fetchWorkouts(workoutPage);
    fetchExercises(exercisePage);
  }, [fetchWorkouts, fetchExercises, workoutPage, exercisePage, workoutsPeriod, fetchWorkoutsCompleted]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refetch whenever period changes
  React.useEffect(() => {
    fetchWorkoutsCompleted(workoutsPeriod);
  }, [workoutsPeriod, fetchWorkoutsCompleted]);

  // Pagination handlers
  const handleNextWorkouts = () => setWorkoutPage(p => p + 1);
  const handlePrevWorkouts = () => setWorkoutPage(p => Math.max(0, p - 1));
  const handleNextExercises = () => setExercisePage(p => p + 1);
  const handlePrevExercises = () => setExercisePage(p => Math.max(0, p - 1));

  React.useEffect(() => {
    fetchWorkouts(workoutPage);
  }, [fetchWorkouts, workoutPage]);
  React.useEffect(() => {
    fetchExercises(exercisePage);
  }, [fetchExercises, exercisePage]);

  // Mock data for fallback
  const mockCalories = 1234;
  const mockWorkouts = 5;
  const mockGoalProgress = 80;
  const mockActiveDays = 6;
  const mockCaloriesChart = [
    { calories: 2000 }, { calories: 2200 }, { calories: 2100 }, { calories: 2300 }, { calories: 1800 }, { calories: 2500 }, { calories: 2400 }
  ];
  const mockWorkoutTypes = [
    { workout: 'Cardio', count: 3 },
    { workout: 'Strength', count: 2 },
    { workout: 'Yoga', count: 1 }
  ];

  // Use mock data if real data is missing
  const caloriesValue = calories !== null && calories !== undefined ? calories : mockCalories;
  const workoutsValue = workouts !== null && workouts !== undefined ? workouts : mockWorkouts;
  const goalProgressValue = goalProgress !== null && goalProgress !== undefined ? goalProgress : mockGoalProgress;
  const activeDaysValue = activeDays !== null && activeDays !== undefined ? activeDays : mockActiveDays;
  const caloriesChartData = (caloriesChart && caloriesChart.length > 0) ? caloriesChart : mockCaloriesChart;
  const workoutTypesData = (workoutTypes && workoutTypes.length > 0) ? workoutTypes : mockWorkoutTypes;

  // Prepare chart data for CaloriesBurnedOverTime
  const caloriesChartSeries = [
    {
      name: 'Calories',
      data: (caloriesChartData || []).map((row: any) => Number(row.calories) || 0),
    },
  ];

  // Prepare chart data for WorkoutTypeDistribution
  const workoutTypeLabels = (workoutTypesData || []).map((w: any) => w.workout);
  const workoutTypeSeries = (workoutTypesData || []).map((w: any) => w.count);

  // Get latest health metrics for display
  const latestMetrics = healthMetrics.length ? healthMetrics[healthMetrics.length - 1] : null;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <img src="/images/gtracker-logo.JPG" alt="GTracker logo" height={96} style={{ marginLeft: 8, maxWidth: '100%', objectFit: 'contain' }} />
      </Box>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div />
        <div style={{ display: 'flex', gap: 12 }}>
          <Select size="small" value={workoutsPeriod} onChange={e => setWorkoutsPeriod(e.target.value as 'week' | 'month' | 'year')}> 
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
          <button onClick={fetchDashboardData} style={{ padding: '8px 16px', borderRadius: 4, background: '#7b61ff', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>
      <Grid container spacing={3}>
        <Grid size={{ lg: 6, xs: 12 }}>
          <Budget diff={12} trend="up" sx={{ height: '100%' }} value={`${caloriesValue} kcal`} />
        </Grid>
        <Grid size={{ lg: 6, xs: 12 }}>
          <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value={String(workoutsValue)} />
        </Grid>
        <Grid size={{ lg: 6, xs: 12 }} />
        <Grid size={{ lg: 12, xs: 12 }}>
          <CaloriesLostGraph />
        </Grid>
        <Grid size={{ lg: 4, xs: 12 }}>
          <WorkoutTypeDistribution chartSeries={workoutTypeSeries} labels={workoutTypeLabels} sx={{ height: '100%' }} />
        </Grid>
        <Grid size={{ lg: 4, xs: 12 }}>
          <TasksProgress sx={{ height: '100%' }} value={goalProgressValue} />
          {latestMetrics && (
            <Box mt={2}>
              <Typography variant="subtitle2">BMI: {latestMetrics.bmi?.toFixed(1) ?? '—'}</Typography>
              <Typography variant="subtitle2">Body Fat %: {latestMetrics.body_fat_percentage?.toFixed(1) ?? '—'}</Typography>
            </Box>
          )}
        </Grid>
        <Grid size={{ lg: 4, xs: 12 }}>
          <TotalProfit sx={{ height: '100%' }} value={String(activeDaysValue)} />
        </Grid>
      </Grid>
    </>
  );
}
