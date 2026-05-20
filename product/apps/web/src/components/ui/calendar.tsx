'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/src/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** Single-month picker; styling via `react-day-picker/style.css` (imported in globals). */
function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn('rdp-root', className)} {...props} />;
}
Calendar.displayName = 'Calendar';

export { Calendar };
