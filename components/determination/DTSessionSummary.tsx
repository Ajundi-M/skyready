'use client';

import {
  DT_STIMULUS_COLOUR,
  DT_VARIANT_NAMES,
  DT_VARIANT_STIMULI,
  type DTMetrics,
  type DTStimulus,
} from '@/lib/determination/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DTSessionSummaryProps = {
  metrics: DTMetrics;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
};

export default function DTSessionSummary({
  metrics,
  onSave,
  onDiscard,
  saving,
}: DTSessionSummaryProps) {
  const total = metrics.correct + metrics.errors + metrics.omissions;
  const pct = total === 0 ? 0 : (metrics.correct / total) * 100;

  const active = DT_VARIANT_STIMULI[metrics.variant];

  const worstStimulus = active.reduce<DTStimulus | null>((worst, s) => {
    if (worst === null) return metrics.per_stimulus[s].errors > 0 ? s : null;
    return metrics.per_stimulus[s].errors > metrics.per_stimulus[worst].errors
      ? s
      : worst;
  }, null);

  const modeLabel =
    metrics.mode.charAt(0).toUpperCase() + metrics.mode.slice(1);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Session Complete</h1>
          <p className="text-muted-foreground">
            {DT_VARIANT_NAMES[metrics.variant]} — {modeLabel} Mode
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.correct}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.errors}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pct.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg RT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metrics.mean_rt_ms === 0
                  ? '— ms'
                  : `${metrics.mean_rt_ms.toFixed(0)} ms`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-stimulus breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Breakdown by Stimulus</h2>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Stimulus</th>
                  <th className="text-right px-4 py-2 font-medium">Correct</th>
                  <th className="text-right px-4 py-2 font-medium">Errors</th>
                  <th className="text-right px-4 py-2 font-medium">
                    Avg RT (ms)
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.map((stimulus) => {
                  const stat = metrics.per_stimulus[stimulus];
                  const isWorst = stimulus === worstStimulus;
                  return (
                    <tr
                      key={stimulus}
                      className={`border-b last:border-0 ${isWorst ? 'bg-amber-950/50' : ''}`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: DT_STIMULUS_COLOUR[stimulus],
                            }}
                          />
                          <span className="capitalize">
                            {stimulus.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-2">{stat.correct}</td>
                      <td className="text-right px-4 py-2">{stat.errors}</td>
                      <td className="text-right px-4 py-2">
                        {stat.mean_rt_ms === 0
                          ? '—'
                          : stat.mean_rt_ms.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adaptive detail */}
        {metrics.mode === 'adaptive' && (
          <div>
            <p>Final window: {metrics.final_window_ms} ms</p>
            <p className="text-xs text-muted-foreground">
              Lower is better — the algorithm compressed your window to this
              pace.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>Saving…
              </>
            ) : (
              'Save & Finish'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
