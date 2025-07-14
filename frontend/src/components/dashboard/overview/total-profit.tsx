import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { HeartbeatIcon } from '@phosphor-icons/react/dist/ssr/Heartbeat';

export interface TotalProfitProps {
  sx?: SxProps;
  value: string;
}

export function TotalProfit({ value, sx }: TotalProfitProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
          <Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '40px', width: '40px' }}>
            <HeartbeatIcon fontSize="var(--icon-fontSize-md)" />
          </Avatar>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="overline">
              Active Days
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
