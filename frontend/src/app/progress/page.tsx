"use client";

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { getAuthHeader } from '@/lib/auth/client';

const workoutTypes = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength', label: 'Strength' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'rest', label: 'Rest/None' },
];

const onboardingSteps = ['Physical Info', 'Goal Selection', 'Goal Details', 'Review'];

// Helper to get JWT token from localStorage
function getAuthHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('custom-auth-token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function ProgressPage() {
  const [openNav, setOpenNav] = React.useState(false);
  const [form, setForm] = React.useState({
    date: dayjs().format('YYYY-MM-DD'),
    calories: '',
    workout: '',
    weeklyGoal: '',
    activeDay: '',
    notes: '',
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkins, setCheckins] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [onboarding, setOnboarding] = React.useState(false);
  const [onboardingStep, setOnboardingStep] = React.useState(0);
  const [physicalInfo, setPhysicalInfo] = React.useState({ age: '', gender: '', height_cm: '', weight_kg: '' });
  const [goalType, setGoalType] = React.useState('');
  const [goalDetails, setGoalDetails] = React.useState({ target_value: '', target_unit: '', target_date: '' });
  const [reviewing, setReviewing] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    // Check if user has completed onboarding
    async function fetchUser() {
      const res = await fetch('/api/auth/me', {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      setUser(data.data);
      if (data.data && !data.data.setup_complete) {
        setOnboarding(true);
      }
    }
    fetchUser();
  }, []);

  React.useEffect(() => {
    fetch('/api/progress/checkin', { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (json.status === 'success') setCheckins(json.data);
      });
  }, [submitted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (date: Dayjs | null) => {
    setForm(f => ({ ...f, date: date ? date.format('YYYY-MM-DD') : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSubmitted(false);
    // Check for duplicate
    if (checkins.some(c => c.date === form.date)) {
      setError('Check-in already exists for this date.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/progress/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to submit check-in');
      setSubmitted(true);
      setForm(f => ({ ...f, calories: '', workout: '', weeklyGoal: '', activeDay: '', notes: '' }));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Chart data for calories over time
  const chartData = {
    labels: checkins.map(c => c.date).reverse(),
    datasets: [
      {
        label: 'Calories Consumed',
        data: checkins.map(c => c.calories).reverse(),
        borderColor: '#7b61ff',
        backgroundColor: 'rgba(123,97,255,0.2)',
      },
    ],
  };

  // After onboarding, fetch goals and show personalized dashboard
  const [userGoals, setUserGoals] = React.useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = React.useState(false);

  React.useEffect(() => {
    if (user && user.setup_complete) {
      setGoalsLoading(true);
      fetch('/api/auth/goals', {
        headers: { ...getAuthHeader() },
      })
        .then(res => res.json())
        .then(json => {
          if (json.status === 'success') setUserGoals(json.data);
        })
        .finally(() => setGoalsLoading(false));
    }
  }, [user && user.setup_complete]);

  // Helper to get main goal
  const mainGoal = userGoals && userGoals.length > 0 ? userGoals[0] : null;

  if (onboarding) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" align="center">Welcome! Let's set up your progress tracking</Typography>
        <Stepper activeStep={onboardingStep} alternativeLabel>
          {onboardingSteps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {/* Step 1: Physical Info */}
        {onboardingStep === 0 && (
          <Stack spacing={2}>
            <TextField label="Age" name="age" type="number" value={physicalInfo.age} onChange={e => setPhysicalInfo({ ...physicalInfo, age: e.target.value })} />
            <FormControl>
              <FormLabel>Gender</FormLabel>
              <RadioGroup row value={physicalInfo.gender} onChange={e => setPhysicalInfo({ ...physicalInfo, gender: e.target.value })}>
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
            <TextField label="Height (cm)" name="height_cm" type="number" value={physicalInfo.height_cm} onChange={e => setPhysicalInfo({ ...physicalInfo, height_cm: e.target.value })} />
            <TextField label="Current Weight (kg)" name="weight_kg" type="number" value={physicalInfo.weight_kg} onChange={e => setPhysicalInfo({ ...physicalInfo, weight_kg: e.target.value })} />
            <Button variant="contained" onClick={() => setOnboardingStep(1)}>Next</Button>
          </Stack>
        )}
        {/* Step 2: Goal Selection */}
        {onboardingStep === 1 && (
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>What is your main goal?</FormLabel>
              <RadioGroup value={goalType} onChange={e => setGoalType(e.target.value)}>
                <FormControlLabel value="gain_weight" control={<Radio />} label="Gain Weight" />
                <FormControlLabel value="lose_weight" control={<Radio />} label="Lose Weight" />
                <FormControlLabel value="maintenance" control={<Radio />} label="Maintenance" />
                <FormControlLabel value="strength" control={<Radio />} label="Strength" />
                <FormControlLabel value="conditioning" control={<Radio />} label="Conditioning" />
              </RadioGroup>
            </FormControl>
            <Button variant="contained" onClick={() => setOnboardingStep(2)} disabled={!goalType}>Next</Button>
            <Button onClick={() => setOnboardingStep(0)}>Back</Button>
          </Stack>
        )}
        {/* Step 3: Goal Details */}
        {onboardingStep === 2 && (
          <Stack spacing={2}>
            {(goalType === 'gain_weight' || goalType === 'lose_weight') && (
              <TextField
                label={`How many kg do you want to ${goalType === 'gain_weight' ? 'gain' : 'lose'}?`}
                name="target_value"
                type="number"
                value={goalDetails.target_value}
                onChange={e => setGoalDetails({ ...goalDetails, target_value: e.target.value, target_unit: 'kg' })}
              />
            )}
            {(goalType === 'strength' || goalType === 'conditioning') && (
              <TextField
                label={goalType === 'strength' ? 'Strength target (e.g. bench press kg)' : 'Conditioning target (e.g. 5km time in min)'}
                name="target_value"
                value={goalDetails.target_value}
                onChange={e => setGoalDetails({ ...goalDetails, target_value: e.target.value, target_unit: goalType === 'strength' ? 'kg' : 'minutes' })}
              />
            )}
            {goalType === 'maintenance' && (
              <Typography>Your goal is to maintain your current weight and fitness.</Typography>
            )}
            <TextField
              label="Target Date (optional)"
              name="target_date"
              type="date"
              value={goalDetails.target_date}
              onChange={e => setGoalDetails({ ...goalDetails, target_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={() => setOnboardingStep(3)}>Next</Button>
            <Button onClick={() => setOnboardingStep(1)}>Back</Button>
          </Stack>
        )}
        {/* Step 4: Review & Confirm */}
        {onboardingStep === 3 && (
          <Stack spacing={2}>
            <Typography variant="h6">Review your info:</Typography>
            <Typography>Age: {physicalInfo.age}</Typography>
            <Typography>Gender: {physicalInfo.gender}</Typography>
            <Typography>Height: {physicalInfo.height_cm} cm</Typography>
            <Typography>Weight: {physicalInfo.weight_kg} kg</Typography>
            <Typography>Goal: {goalType.replace('_', ' ')}</Typography>
            {goalDetails.target_value && <Typography>Target: {goalDetails.target_value} {goalDetails.target_unit}</Typography>}
            {goalDetails.target_date && <Typography>Target Date: {goalDetails.target_date}</Typography>}
            <Button variant="contained" color="success" onClick={async () => {
              // Save physical info
              await fetch('/api/auth/me/physical-info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ ...physicalInfo, weight_kg: physicalInfo.weight_kg }),
              });
              // Save goal
              await fetch('/api/auth/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                  goal_type: goalType,
                  target_value: goalDetails.target_value,
                  target_unit: goalDetails.target_unit,
                  target_date: goalDetails.target_date,
                }),
              });
              // Refetch user info and goals, update state, and show dashboard
              const userRes = await fetch('/api/auth/me', {
                headers: { ...getAuthHeader() },
              });
              const userData = await userRes.json();
              setUser(userData.data);
              const goalsRes = await fetch('/api/auth/goals', {
                headers: { ...getAuthHeader() },
              });
              const goalsData = await goalsRes.json();
              setUserGoals(goalsData.data);
              setOnboarding(false);
            }}>Confirm & Start Tracking</Button>
            <Button onClick={() => setOnboardingStep(2)}>Back</Button>
          </Stack>
        )}
      </Stack>
    );
  }

  if (!onboarding && user && user.setup_complete) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
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
              Progress
            </Typography>
          </Stack>
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
        {/* Personalized Goal Dashboard */}
        <Stack sx={{ maxWidth: 600, mx: 'auto', mt: 2, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h5" mb={2}>Your Main Goal</Typography>
          {goalsLoading && <Typography>Loading goal...</Typography>}
          {!goalsLoading && mainGoal && (
            <>
              {mainGoal.goal_type === 'gain_weight' || mainGoal.goal_type === 'lose_weight' || mainGoal.goal_type === 'maintenance' ? (
                <>
                  <Typography>
                    {mainGoal.goal_type === 'gain_weight' && 'Gain Weight'}
                    {mainGoal.goal_type === 'lose_weight' && 'Lose Weight'}
                    {mainGoal.goal_type === 'maintenance' && 'Maintain Weight'}
                  </Typography>
                  <Typography>Current Weight: {user.weight_kg} kg</Typography>
                  {mainGoal.target_value && (
                    <Typography>Target Weight: {mainGoal.goal_type === 'gain_weight'
                      ? Number(user.weight_kg) + Number(mainGoal.target_value)
                      : mainGoal.goal_type === 'lose_weight'
                        ? Number(user.weight_kg) - Number(mainGoal.target_value)
                        : user.weight_kg} kg</Typography>
                  )}
                  {/* Progress bar scaffold */}
                  {mainGoal.target_value && (
                    <Stack direction="row" alignItems="center" spacing={2} mt={2}>
                      <Typography>Progress:</Typography>
                      {/* You can add a real progress bar here */}
                      <Typography>
                        {mainGoal.goal_type === 'gain_weight'
                          ? `${((Number(user.weight_kg) / (Number(user.weight_kg) + Number(mainGoal.target_value))) * 100).toFixed(1)}%` 
                          : mainGoal.goal_type === 'lose_weight'
                            ? `${((1 - (Number(user.weight_kg) - Number(mainGoal.target_value)) / Number(user.weight_kg)) * 100).toFixed(1)}%`
                            : '100%'}
                      </Typography>
                    </Stack>
                  )}
                </>
              ) : null}
              {mainGoal.goal_type === 'strength' && (
                <>
                  <Typography>Strength Goal: {mainGoal.target_value} {mainGoal.target_unit}</Typography>
                  {/* Add current strength metric and progress bar here */}
                </>
              )}
              {mainGoal.goal_type === 'conditioning' && (
                <>
                  <Typography>Conditioning Goal: {mainGoal.target_value} {mainGoal.target_unit}</Typography>
                  {/* Add current conditioning metric and progress bar here */}
                </>
              )}
              {mainGoal.target_date && (
                <Typography>Target Date: {mainGoal.target_date}</Typography>
              )}
            </>
          )}
          {!goalsLoading && !mainGoal && <Typography>No goal set.</Typography>}
        </Stack>
        {/* Existing tracking widgets below */}
        <Stack sx={{ maxWidth: 500, mx: 'auto', mt: 2, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h5" mb={2}>Daily Check-In</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <DatePicker
                label="Date"
                value={dayjs(form.date)}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                label="Calories Consumed"
                name="calories"
                type="number"
                value={form.calories}
                onChange={handleChange}
                required
              />
              <TextField
                label="Workout Type"
                name="workout"
                select
                value={form.workout}
                onChange={handleChange}
                required
              >
                {workoutTypes.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Did you meet your weekly goal?"
                name="weeklyGoal"
                select
                value={form.weeklyGoal}
                onChange={handleChange}
                required
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                label="Was today an active day?"
                name="activeDay"
                select
                value={form.activeDay}
                onChange={handleChange}
                required
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                multiline
                rows={2}
              />
              {error && <Typography color="error">{error}</Typography>}
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
            </Stack>
          </form>
        </Stack>
        {/* Chart and other widgets can go here */}
      </Stack>
    );
  }

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
              Progress
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
        <Stack sx={{ maxWidth: 500, mx: 'auto', mt: 2, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h5" mb={2}>Daily Check-In</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <DatePicker
                label="Date"
                value={dayjs(form.date)}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                label="Calories Consumed"
                name="calories"
                type="number"
                value={form.calories}
                onChange={handleChange}
                required
              />
              <TextField
                label="Workout Type"
                name="workout"
                select
                value={form.workout}
                onChange={handleChange}
                required
              >
                {workoutTypes.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Did you meet your weekly goal?"
                name="weeklyGoal"
                select
                value={form.weeklyGoal}
                onChange={handleChange}
                required
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                label="Was today an active day?"
                name="activeDay"
                select
                value={form.activeDay}
                onChange={handleChange}
                required
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                multiline
                minRows={2}
              />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
              {error && <Typography color="error.main">{error}</Typography>}
              {submitted && <Typography color="success.main" mt={2}>Check-in submitted!</Typography>}
            </Stack>
          </form>
        </Stack>
        <Stack sx={{ maxWidth: 700, mx: 'auto', mt: 2, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Calories Consumed Over Time</Typography>
          <Line data={chartData} />
        </Stack>
      </Stack>
    </>
  );
}
