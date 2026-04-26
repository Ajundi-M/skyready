'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DT_DEFAULT_KEY_MAP,
  DT_RESERVED_KEYS,
  DT_STIMULI,
  DT_STIMULUS_COLOUR,
  DT_STIMULUS_LIMB,
  DT_VARIANT_STIMULI,
  type DTKeyMap,
  type DTStimulus,
  type DTVariant,
} from '@/lib/determination/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DTKeyRemapModalProps = {
  open: boolean;
  activeVariant: DTVariant;
  initialKeyMap: DTKeyMap;
  onSave: (newKeyMap: DTKeyMap) => void;
  onClose: () => void;
};

function createEmptyRowErrors(): Record<DTStimulus, string | null> {
  return DT_STIMULI.reduce(
    (acc, stimulus) => {
      acc[stimulus] = null;
      return acc;
    },
    {} as Record<DTStimulus, string | null>,
  );
}

export default function DTKeyRemapModal({
  open,
  activeVariant,
  initialKeyMap,
  onSave,
  onClose,
}: DTKeyRemapModalProps) {
  const [localMap, setLocalMap] = useState<DTKeyMap>(initialKeyMap);
  const [listening, setListening] = useState<DTStimulus | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<DTStimulus, string | null>>(
    createEmptyRowErrors(),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const preListenKey = useRef<string>('');

  const clearError = (stimulus: DTStimulus) => {
    setRowErrors((prev) => ({ ...prev, [stimulus]: null }));
  };

  const clearAllErrors = () => {
    setRowErrors(createEmptyRowErrors());
  };

  useEffect(() => {
    if (!open || listening === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key.toLowerCase();

      // Rule 1: Escape cancels and restores key before listening mode.
      if (key === 'escape') {
        setLocalMap((prev) => ({ ...prev, [listening]: preListenKey.current }));
        setRowErrors((prev) => ({ ...prev, [listening]: null }));
        setListening(null);
        return;
      }

      // Rule 2: Reserved keys are blocked.
      if (DT_RESERVED_KEYS.has(key)) {
        setRowErrors((prev) => ({ ...prev, [listening]: 'Key not allowed' }));
        return;
      }

      // Rule 3: Conflicts must consider all 7 stimuli.
      const conflict = DT_STIMULI.find(
        (stimulus) => stimulus !== listening && localMap[stimulus] === key,
      );

      if (conflict) {
        setRowErrors((prev) => ({
          ...prev,
          [listening]: `Already assigned to ${conflict}`,
        }));
        return;
      }

      // Rule 4: Valid assignment.
      setLocalMap((prev) => ({ ...prev, [listening]: key }));
      setRowErrors((prev) => ({ ...prev, [listening]: null }));
      setListening(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, listening, localMap]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Key Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {DT_STIMULI.map((stimulus) => {
            const isActive =
              DT_VARIANT_STIMULI[activeVariant].includes(stimulus);

            return (
              <div key={stimulus}>
                <div
                  className={`flex items-center gap-3 ${
                    !isActive ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: DT_STIMULUS_COLOUR[stimulus] }}
                  />
                  <span className="w-20 text-sm capitalize">{stimulus}</span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    {DT_STIMULUS_LIMB[stimulus]}
                  </span>

                  {!isActive && (
                    <span
                      className="opacity-40 text-xs"
                      title="Not active in this tier"
                    >
                      🔒
                    </span>
                  )}

                  {isActive && listening === stimulus && (
                    <button
                      type="button"
                      className="w-16 rounded border-2 border-blue-500 px-2 py-1 text-center font-mono text-sm animate-pulse"
                    >
                      ...
                    </button>
                  )}

                  {isActive && listening !== stimulus && (
                    <button
                      type="button"
                      className="w-16 rounded border px-2 py-1 text-center font-mono text-sm hover:border-blue-400"
                      onClick={() => {
                        preListenKey.current = localMap[stimulus];
                        setListening(stimulus);
                        clearError(stimulus);
                      }}
                    >
                      {localMap[stimulus] === ' '
                        ? 'Space'
                        : localMap[stimulus] === 'enter'
                          ? 'Enter'
                          : localMap[stimulus].toUpperCase()}
                    </button>
                  )}
                </div>

                {rowErrors[stimulus] && (
                  <p className="mt-1 text-xs text-red-500">
                    {rowErrors[stimulus]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalMap({ ...DT_DEFAULT_KEY_MAP });
              clearAllErrors();
              setListening(null);
            }}
          >
            Reset to defaults
          </Button>

          <div className="flex flex-col items-end gap-2">
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={listening !== null}
                onClick={() => {
                  setSaveError(null);
                  try {
                    onSave(localMap);
                    onClose();
                  } catch {
                    setSaveError('Failed to save. Please try again.');
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
