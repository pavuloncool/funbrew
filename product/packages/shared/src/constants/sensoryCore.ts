export const SENSORY_CORE_SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

export type SensoryCoreMetric = {
  id: 'acidity' | 'sweetness' | 'body' | 'bitter' | 'aftertaste';
  label: 'Acidity' | 'Sweet' | 'Body' | 'Bitter' | 'Finish';
  leftLabel: string;
  rightLabel: string;
  telemetryKey:
    | 'sensoryAcidity'
    | 'sensorySweetness'
    | 'sensoryBody'
    | 'sensoryBitter'
    | 'sensoryAftertaste';
  declaredKey:
    | 'declaredSensoryAcidity'
    | 'declaredSensorySweetness'
    | 'declaredSensoryBody'
    | 'declaredSensoryBitter'
    | 'declaredSensoryAftertaste';
  averageKey:
    | 'avgSensoryAcidity'
    | 'avgSensorySweetness'
    | 'avgSensoryBody'
    | 'avgSensoryBitter'
    | 'avgSensoryAftertaste';
};

export const SENSORY_CORE_METRICS: readonly SensoryCoreMetric[] = [
  {
    id: 'acidity',
    label: 'Acidity',
    leftLabel: 'naturally plain',
    rightLabel: 'bright and lifting',
    telemetryKey: 'sensoryAcidity',
    declaredKey: 'declaredSensoryAcidity',
    averageKey: 'avgSensoryAcidity',
  },
  {
    id: 'sweetness',
    label: 'Sweet',
    leftLabel: 'dimmed and earthy',
    rightLabel: 'ripe and crunchy',
    telemetryKey: 'sensorySweetness',
    declaredKey: 'declaredSensorySweetness',
    averageKey: 'avgSensorySweetness',
  },
  {
    id: 'body',
    label: 'Body',
    leftLabel: 'subtle and tea-like',
    rightLabel: 'syrupy and smooth',
    telemetryKey: 'sensoryBody',
    declaredKey: 'declaredSensoryBody',
    averageKey: 'avgSensoryBody',
  },
  {
    id: 'bitter',
    label: 'Bitter',
    leftLabel: 'dry tobacco',
    rightLabel: 'pleasant cocoa',
    telemetryKey: 'sensoryBitter',
    declaredKey: 'declaredSensoryBitter',
    averageKey: 'avgSensoryBitter',
  },
  {
    id: 'aftertaste',
    label: 'Finish',
    leftLabel: 'faint and elusive',
    rightLabel: 'long and pleasant',
    telemetryKey: 'sensoryAftertaste',
    declaredKey: 'declaredSensoryAftertaste',
    averageKey: 'avgSensoryAftertaste',
  },
] as const;
