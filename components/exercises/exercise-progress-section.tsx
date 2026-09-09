"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatWeight,
  formatWeightReps,
} from "@/lib/progress/helpers";
import { formatDate } from "@/lib/workout/helpers";
import type { ChartPoint, ExerciseHistoryGroup, ExercisePr } from "@/lib/progress/types";
import Link from "next/link";

const weightConfig = {
  value: {
    label: "kg",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ExerciseProgressSection({
  pr,
  maxWeight,
  history,
}: {
  pr: ExercisePr | null;
  maxWeight: ChartPoint[];
  history: ExerciseHistoryGroup[];
}) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal record</CardTitle>
        </CardHeader>
        <CardContent>
          {pr ? (
            <div>
              <p className="text-2xl font-semibold">
                {formatWeightReps(pr.weight, pr.reps)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(pr.performedOn)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No working-set PR yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Max weight</CardTitle>
        </CardHeader>
        <CardContent>
          {maxWeight.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete a working set to see this chart.
            </p>
          ) : (
            <ChartContainer
              config={weightConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <LineChart accessibilityLayer data={maxWeight}>
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
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed sets for this exercise.
          </p>
        ) : (
          history.map((group) => (
            <Card key={`${group.workoutId}-${group.performedOn}`}>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  <Link
                    href={`/history/${group.workoutId}`}
                    className="hover:text-primary active:text-primary"
                  >
                    {group.workoutName}
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(group.performedOn)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-3">
                {group.sets.map((set) => (
                  <p key={`${group.workoutId}-${set.setIndex}`} className="text-sm">
                    Set {set.setIndex}
                    <span className="ml-3 text-muted-foreground">
                      {formatWeightReps(set.weight, set.reps)}
                      {set.isWarmup ? " · Warm-up" : ""}
                      {set.toFailure ? " · Failure" : ""}
                    </span>
                  </p>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
