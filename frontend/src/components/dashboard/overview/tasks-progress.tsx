import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { ChartLineUpIcon } from '@phosphor-icons/react/dist/ssr/ChartLineUp';

export interface TasksProgressProps {
  sx?: SxProps;
  value: number;
}

export function TasksProgress({ value, sx }: TasksProgressProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
            <Avatar sx={{ backgroundColor: 'var(--mui-palette-warning-main)', height: '40px', width: '40px' }}>
              <ChartLineUpIcon fontSize="var(--icon-fontSize-md)" />
            </Avatar>
            <Stack spacing={1}>
              <Typography color="text.secondary" gutterBottom variant="overline">
                Weekly Goal Progress
              </Typography>
              <Typography variant="h4">{value}%</Typography>
            </Stack>
          </Stack>
          <div>
            <LinearProgress value={value ?? 0} variant="determinate" />
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}
