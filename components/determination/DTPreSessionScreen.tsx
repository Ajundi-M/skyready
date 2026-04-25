'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DT_DEFAULT_KEY_MAP,
  DT_MODES,
  DT_MODE_DESCRIPTIONS,
  DT_STIMULUS_COLOUR,
  DT_STIMULUS_LIMB,
  DT_TIER_DESCRIPTIONS,
  DT_TIER_NAMES,
  DT_TIER_STIMULI,
  DT_TIERS,
  type DTKeyMap,
  type DTMode,
  type DTTier,
} from '@/lib/determination/types';

type DTPreSessionScreenProps = {
  onStart: (config: { tier: DTTier; mode: DTMode; keyMap: DTKeyMap }) => void;
  onEditKeys: () => void;
};

type PreferencesResponse = {
  preferences?: {
    dt_last_tier?: DTTier;
    dt_last_mode?: DTMode;
    dt_keys?: Partial<DTKeyMap>;
  };
};

export default function DTPreSessionScreen({
  onStart,
  onEditKeys,
}: DTPreSessionScreenProps) {
  const [selectedTier, setSelectedTier] = useState<DTTier | null>(null);
  const [selectedMode, setSelectedMode] = useState<DTMode | null>(null);
  const [keyMap, setKeyMap] = useState<DTKeyMap>(DT_DEFAULT_KEY_MAP);
  const [loadingPrefs, setLoadingPrefs] = useState<boolean>(true);

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

        if (preferences.dt_last_tier) {
          setSelectedTier(preferences.dt_last_tier);
        }
        if (preferences.dt_last_mode) {
          setSelectedMode(preferences.dt_last_mode);
        }
        if (preferences.dt_keys) {
          setKeyMap({ ...DT_DEFAULT_KEY_MAP, ...preferences.dt_keys });
        }
      } catch {
        // Ignore preference fetch errors and keep defaults.
      } finally {
        setLoadingPrefs(false);
      }
    };

    void loadPreferences();
  }, []);

  const canStart = selectedTier !== null && selectedMode !== null;

  const getTierNumberClass = (tier: DTTier): string => {
    if (tier === 1) return 'text-green-400';
    if (tier === 2) return 'text-blue-400';
    return 'text-purple-400';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Determination Test</h1>
          <p className="text-muted-foreground">Configure your session</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Tier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DT_TIERS.map((tier) => {
              const isSelected = selectedTier === tier;
              return (
                <div
                  key={tier}
                  role="button"
                  tabIndex={0}
                  className={[
                    'rounded-xl border p-4 space-y-3 transition-colors cursor-pointer',
                    isSelected
                      ? 'border-white bg-accent'
                      : 'border-border bg-card hover:bg-accent/50',
                  ].join(' ')}
                  onClick={() => setSelectedTier(tier)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedTier(tier);
                    }
                  }}
                >
                  <div
                    className={`text-5xl font-bold ${getTierNumberClass(tier)}`}
                  >
                    {tier}
                  </div>
                  <div className="font-medium">{DT_TIER_NAMES[tier]}</div>
                  <p className="text-sm text-muted-foreground">
                    {DT_TIER_DESCRIPTIONS[tier]}
                  </p>
                  <div className="flex items-center gap-2">
                    {DT_TIER_STIMULI[tier].map((stimulus) => (
                      <span
                        key={stimulus}
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: DT_STIMULUS_COLOUR[stimulus],
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Mode</h2>
          <div className="flex flex-wrap gap-3">
            {DT_MODES.map((mode) => (
              <Button
                key={mode}
                variant={selectedMode === mode ? 'default' : 'outline'}
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => setSelectedMode(mode)}
              >
                <span className="font-semibold">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </span>
                <span className="text-xs opacity-70">
                  {DT_MODE_DESCRIPTIONS[mode]}
                </span>
              </Button>
            ))}
          </div>
        </section>

        {selectedTier !== null && (
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
                    {DT_TIER_STIMULI[selectedTier].map((stimulus) => (
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
                          {stimulus.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {DT_STIMULUS_LIMB[stimulus]}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {keyMap[stimulus] === ' '
                            ? 'Space'
                            : keyMap[stimulus]}
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

        <Button
          className="w-full"
          variant="default"
          size="lg"
          disabled={!canStart}
          onClick={() => {
            if (!selectedTier || !selectedMode) {
              return;
            }
            onStart({ tier: selectedTier, mode: selectedMode, keyMap });
          }}
        >
          Start Session
        </Button>
      </div>
    </div>
  );
}
