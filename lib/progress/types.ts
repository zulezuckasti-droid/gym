export type ExercisePr = {
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
  performedOn: string;
};

export type ChartPoint = {
  date: string;
  label: string;
  value: number;
};

export type ExerciseWeightSeries = {
  exerciseId: string;
  name: string;
  points: ChartPoint[];
};

export type VolumePoint = {
  workoutId: string;
  name: string;
  date: string;
  label: string;
  volume: number;
};

export type WeekPoint = {
  weekStart: string;
  label: string;
  count: number;
};

export type ExerciseHistorySet = {
  setIndex: number;
  weight: number | null;
  reps: number;
  isWarmup: boolean;
  toFailure: boolean;
};

export type ExerciseHistoryGroup = {
  workoutId: string;
  workoutName: string;
  performedOn: string;
  sets: ExerciseHistorySet[];
};

export type ProgressData = {
  prs: ExercisePr[];
  volume: VolumePoint[];
  weekly: WeekPoint[];
  maxWeightByExercise: ExerciseWeightSeries[];
  error: string | null;
};

export type ExerciseProgressData = {
  pr: ExercisePr | null;
  maxWeight: ChartPoint[];
  history: ExerciseHistoryGroup[];
  error: string | null;
};
