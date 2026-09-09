"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  formatChartDate,
  formatVolumeTick,
  formatWeight,
  formatWeightReps,
} from "@/lib/progress/helpers";
import { formatDate } from "@/lib/workout/helpers";
import type { ProgressData } from "@/lib/progress/types";
import { cn, pressableClass } from "@/lib/utils";

const weightConfig = {
  value: {
    label: "kg",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const volumeConfig = {
  volume: {
    label: "Volume",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const weeklyConfig = {
  count: {
    label: "Workouts",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ProgressScreen({ data }: { data: ProgressData }) {
  const defaultExerciseId =
    data.maxWeightByExercise[0]?.exerciseId ?? data.prs[0]?.exerciseId ?? "";
  const [selectedId, setSelectedId] = useState(defaultExerciseId);

  const selectedSeries = useMemo(
    () =>
      data.maxWeightByExercise.find(
        (series) => series.exerciseId === selectedId,
      ) ?? data.maxWeightByExercise[0],
    [data.maxWeightByExercise, selectedId],
  );

  if (data.error) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-4 text-sm text-destructive" role="alert">
          {data.error}
        </p>
      </main>
    );
  }

  const empty =
    data.prs.length === 0 &&
    data.volume.length === 0 &&
    data.weekly.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>

      {empty ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Finish a workout to see personal records and charts.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Personal records
            </h2>
            {data.prs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No working-set PRs yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.prs.map((pr) => (
                  <li key={pr.exerciseId}>
                    <Link href={`/exercises/${pr.exerciseId}`} className="block">
                      <Card className={cn("py-0", pressableClass)}>
                        <CardContent className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                          <p className="min-w-0 truncate font-medium">{pr.name}</p>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium">
                              {formatWeightReps(pr.weight, pr.reps)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(pr.performedOn)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Max weight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.maxWeightByExercise.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No working-set weights yet.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="max-weight-exercise">Exercise</Label>
                    <select
                      id="max-weight-exercise"
                      value={selectedSeries?.exerciseId ?? ""}
                      onChange={(event) => setSelectedId(event.target.value)}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                    >
                      {data.maxWeightByExercise.map((series) => (
                        <option
                          key={series.exerciseId}
                          value={series.exerciseId}
                        >
                          {series.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChartContainer
                    config={weightConfig}
                    className="aspect-auto h-[200px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={selectedSeries?.points ?? []}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={24}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={36}
                        tickFormatter={(value) => formatWeight(Number(value))}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                              const date = payload[0]?.payload?.date as
                                | string
                                | undefined;
                              return date ? formatDate(date) : "";
                            }}
                          />
                        }
                      />
                      <Line
                        dataKey="value"
                        type="monotone"
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume per workout</CardTitle>
            </CardHeader>
            <CardContent>
              {data.volume.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No workout volume yet.
                </p>
              ) : (
                <ChartContainer
                  config={volumeConfig}
                  className="aspect-auto h-[200px] w-full"
                >
                  <BarChart accessibilityLayer data={data.volume}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, "auto"]}
                      tickFormatter={(value) =>
                        formatVolumeTick(Number(value))
                      }
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const point = payload[0]?.payload as
                              | ProgressData["volume"][number]
                              | undefined;
                            if (!point) return "";
                            return `${point.name} · ${formatDate(point.date)}`;
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="volume"
                      fill="var(--color-volume)"
                      radius={6}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workouts per week</CardTitle>
            </CardHeader>
            <CardContent>
              {data.weekly.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed weeks yet.
                </p>
              ) : (
                <ChartContainer
                  config={weeklyConfig}
                  className="aspect-auto h-[200px] w-full"
                >
                  <BarChart accessibilityLayer data={data.weekly}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={28}
                      allowDecimals={false}
                      domain={[0, "auto"]}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const weekStart = payload[0]?.payload?.weekStart as
                              | string
                              | undefined;
                            return weekStart
                              ? `Week of ${formatChartDate(weekStart)}`
                              : "";
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={6}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
