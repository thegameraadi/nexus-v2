import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check } from 'lucide-react';
import {
  BeatId,
  BEAT_DEFINITIONS,
  PRESET_PROFILES,
  PresetProfile
} from '../../lib/nexus/types';
import { storeBeats } from '../../lib/nexus/storage';

interface BeatPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBeats: BeatId[];
  onSaveBeats: (beats: BeatId[]) => void;
  isFirstVisit?: boolean;
}

export const BeatPicker: React.FC<BeatPickerProps> = ({
  isOpen,
  onClose,
  currentBeats,
  onSaveBeats,
  isFirstVisit = false,
}) => {
  const [selected, setSelected] = useState<BeatId[]>(currentBeats);

  // Sync with current beats when opened
  useEffect(() => {
    if (isOpen) {
      setSelected(currentBeats.length > 0 ? currentBeats : ['ai-venture']);
    }
  }, [isOpen, currentBeats]);

  const toggleBeat = (beatId: BeatId) => {
    if (selected.includes(beatId)) {
      // Prevent unselecting all (must have at least one)
      if (selected.length > 1) {
        setSelected(selected.filter((id) => id !== beatId));
      }
    } else {
      setSelected([...selected, beatId]);
    }
  };

  const applyPreset = (preset: PresetProfile) => {
    setSelected(preset.beats);
  };

  const handleSave = () => {
    storeBeats(selected);
    onSaveBeats(selected);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleSave()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity" />

        {/* Modal Container */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content className="nexus-card w-full max-w-xl p-6 sm:p-8 bg-[#0c0c0e] border border-white/[0.1] rounded-2xl shadow-2xl relative focus:outline-none max-h-[90vh] overflow-y-auto">
            {/* Close icon */}
            <Dialog.Close asChild>
              <button
                onClick={handleSave}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>

            {/* Header */}
            <div className="mb-6">
              <span className="nexus-meta text-zinc-500">
                {isFirstVisit ? 'INITIAL ONBOARDING' : 'READER CONFIGURATION'}
              </span>
              <Dialog.Title className="nexus-headline text-xl sm:text-2xl text-zinc-100 mt-1">
                What do you want briefed on?
              </Dialog.Title>
              <Dialog.Description className="nexus-body text-zinc-400 mt-1.5">
                Select your intelligence beats. All preferences are stored strictly in your browser&apos;s localStorage and never transmitted.
              </Dialog.Description>
            </div>

            {/* Presets */}
            <div className="mb-6 pb-6 border-b border-white/[0.07]">
              <span className="nexus-meta text-zinc-500 block mb-2.5">
                ONE-CLICK PRESETS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_PROFILES.map((preset) => {
                  const isPresetActive =
                    preset.beats.length === selected.length &&
                    preset.beats.every((b) => selected.includes(b));
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isPresetActive
                          ? 'bg-white/[0.08] border-white/[0.25] text-zinc-100'
                          : 'bg-white/[0.02] border-white/[0.05] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="nexus-meta text-zinc-200 font-medium">
                          {preset.label.toUpperCase()}
                        </span>
                        {isPresetActive && <Check className="w-3 h-3 text-zinc-200" />}
                      </div>
                      <p className="text-[11px] font-sans text-zinc-500 mt-1 leading-snug">
                        {preset.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beats Multi-Select Chips */}
            <div className="mb-8">
              <span className="nexus-meta text-zinc-500 block mb-3">
                INDIVIDUAL BEATS (MINIMUM 1)
              </span>
              <div className="space-y-2.5">
                {(Object.keys(BEAT_DEFINITIONS) as BeatId[]).map((id) => {
                  const beat = BEAT_DEFINITIONS[id];
                  const isChecked = selected.includes(id);
                  return (
                    <div
                      key={id}
                      onClick={() => toggleBeat(id)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-white/[0.05] border-white/[0.2]'
                          : 'bg-white/[0.015] border-white/[0.05] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                            : 'border-zinc-700 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="nexus-headline text-[14px] text-zinc-100">
                            {beat.label}
                          </span>
                          <span className="nexus-meta text-[11px] text-zinc-500">
                            [{beat.columns.join(' · ').toUpperCase()}]
                          </span>
                        </div>
                        <p className="nexus-body text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
                          {beat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
              <span className="nexus-meta text-zinc-500">
                {selected.length} OF 5 BEATS ACTIVE
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-sans font-medium text-[13px] hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                SAVE & COMMENCE
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
