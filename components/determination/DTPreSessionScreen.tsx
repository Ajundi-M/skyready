'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DT_DEFAULT_KEY_MAP,
  DT_MODES,
  DT_MODE_NAMES,
  DT_MODE_DESCRIPTIONS,
  DT_MODE_DETAILS,
  DT_STIMULUS_COLOUR,
  DT_STIMULUS_LIMB,
  DT_VARIANT_STIMULI,
  DT_VARIANTS,
  DT_VARIANT_NAMES,
  DT_VARIANT_COUNTS,
  type DTKeyMap,
  type DTMode,
  type DTVariant,
} from '@/lib/determination/types';

type DTPreSessionScreenProps = {
  onStart: (config: {
    variant: DTVariant;
    mode: DTMode;
    keyMap: DTKeyMap;
  }) => void;
  onEditKeys: () => void;
  keyMap: DTKeyMap;
  onKeyMapChange: (newMap: DTKeyMap) => void;
};

type PreferencesResponse = {
  preferences?: {
    dt_last_variant?: DTVariant;
    dt_last_mode?: DTMode;
    dt_keys?: Partial<DTKeyMap>;
  };
};

export default function DTPreSessionScreen({
  onStart,
  onEditKeys,
  keyMap,
  onKeyMapChange,
}: DTPreSessionScreenProps) {
  const [selectedVariant, setSelectedVariant] = useState<DTVariant | null>(
    null,
  );
  const [selectedMode, setSelectedMode] = useState<DTMode | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState<boolean>(true);
  const [learnMoreOpen, setLearnMoreOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/profile/preferences', {
          method: 'GET',
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as PreferencesResponse;
        const preferences = data.preferences;
        if (!preferences) {
          return;
        }

        if (preferences.dt_last_variant) {
          setSelectedVariant(preferences.dt_last_variant);
        }
        if (preferences.dt_last_mode) {
          setSelectedMode(preferences.dt_last_mode);
        }
        if (preferences.dt_keys) {
          onKeyMapChange({ ...DT_DEFAULT_KEY_MAP, ...preferences.dt_keys });
        }
      } catch {
        // Ignore preference fetch errors and keep defaults.
      } finally {
        setLoadingPrefs(false);
      }
    };

    void loadPreferences();
  }, []);

  function displayKey(key: string): string {
    if (key === ' ') return 'Space';
    if (key === 'enter') return 'Enter';
    return key;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Determination Test</h1>
          <p className="text-muted-foreground">Configure your session</p>
        </div>

        {/* Section 1 — Variant selector */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Test Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DT_VARIANTS.map((variant) => {
              const isSelected = selectedVariant === variant;
              return (
                <div
                  key={variant}
                  role="button"
                  tabIndex={0}
                  className={[
                    'rounded-xl border p-4 space-y-3 transition-colors cursor-pointer',
                    isSelected
                      ? 'border-white bg-accent'
                      : 'border-border bg-card hover:bg-accent/50',
                  ].join(' ')}
                  onClick={() => setSelectedVariant(variant)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedVariant(variant);
                    }
                  }}
                >
                  <div className="text-xl font-semibold">
                    {DT_VARIANT_NAMES[variant]}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {DT_VARIANT_COUNTS[variant]}
                  </div>
                  <div className="flex items-center gap-2">
                    {DT_VARIANT_STIMULI[variant].map((stim) => (
                      <span
                        key={stim}
                        className="inline-block rounded-full"
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: DT_STIMULUS_COLOUR[stim],
                        }}
                      />
                    ))}
                  </div>
                  {variant === 'visual_oral' && (
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-950/50 border border-amber-700/50 px-3 py-2">
                      <span className="text-amber-400 text-sm">🎧</span>
                      <span className="text-amber-300 text-xs">
                        Headphones required
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2 — Mode selector */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Mode</h2>
          <div className="space-y-3">
            {DT_MODES.map((mode) => {
              const isSelected = selectedMode === mode;
              return (
                <div
                  key={mode}
                  role="button"
                  tabIndex={0}
                  className={[
                    'rounded-xl border p-4 space-y-1 transition-colors cursor-pointer',
                    isSelected
                      ? 'border-white bg-accent'
                      : 'border-border bg-card hover:bg-accent/50',
                  ].join(' ')}
                  onClick={() => setSelectedMode(mode)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedMode(mode);
                    }
                  }}
                >
                  <div className="font-semibold">{DT_MODE_NAMES[mode]}</div>
                  <div className="text-sm text-muted-foreground">
                    {DT_MODE_DESCRIPTIONS[mode]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learn more accordion */}
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
            onClick={() => setLearnMoreOpen(!learnMoreOpen)}
          >
            <span>{learnMoreOpen ? '▲' : '▼'}</span>
            <span>
              {learnMoreOpen ? 'Hide details' : 'Learn more about the modes'}
            </span>
          </button>

          {learnMoreOpen && (
            <div className="mt-4 rounded-xl border border-border bg-card/50 overflow-hidden">
              {DT_MODES.map((mode) => {
                const details = DT_MODE_DETAILS[mode];
                return (
                  <div
                    key={mode}
                    className="p-4 border-b border-border last:border-0"
                  >
                    <p className="font-semibold mb-2">{DT_MODE_NAMES[mode]}</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Best for</dt>
                      <dd>{details.bestFor}</dd>
                      <dt className="text-muted-foreground">Measures</dt>
                      <dd>{details.measures}</dd>
                      <dt className="text-muted-foreground">Pressure</dt>
                      <dd>{details.pressure}</dd>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd>{details.duration}</dd>
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3 — Key assignments (only when a variant is selected) */}
        {selectedVariant !== null && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Key Assignments</h2>

            {loadingPrefs ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-accent/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Colour
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Stimulus
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Limb</th>
                      <th className="px-3 py-2 text-left font-medium">Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DT_VARIANT_STIMULI[selectedVariant].map((stimulus) => (
                      <tr key={stimulus} className="border-t border-border">
                        <td className="px-3 py-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: DT_STIMULUS_COLOUR[stimulus],
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 capitalize">
                          {stimulus.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {DT_STIMULUS_LIMB[stimulus]}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {displayKey(keyMap[stimulus])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={onEditKeys}>
              Edit Keys
            </Button>
          </section>
        )}

        {/* Start button */}
        <Button
          className="w-full"
          variant="default"
          size="lg"
          disabled={selectedVariant === null || selectedMode === null}
          onClick={() => {
            if (selectedVariant === null || selectedMode === null) {
              return;
            }
            onStart({ variant: selectedVariant, mode: selectedMode, keyMap });
          }}
        >
          Start Session
        </Button>
      </div>
    </div>
  );
}
