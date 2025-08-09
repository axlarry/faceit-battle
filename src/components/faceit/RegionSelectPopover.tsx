import React from "react";
import { Check } from "lucide-react";

type Region = {
  id: string;
  name: string;
  flag: string;
  desc?: string;
};

interface RegionSelectPopoverProps {
  regions: Region[];
  currentRegion: string;
  onSelect: (id: string) => void;
}

export const RegionSelectPopover: React.FC<RegionSelectPopoverProps> = ({
  regions,
  currentRegion,
  onSelect,
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      <header className="px-5 py-4 border-b border-border bg-card/70 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Alege regiunea</h3>
            <p className="mt-1 text-xs text-muted-foreground">Clasamente disponibile pe zone</p>
          </div>
        </div>
      </header>

      {/* Regions */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {regions.map((region) => {
          const selected = currentRegion === region.id;
          return (
            <button
              key={region.id}
              onClick={() => onSelect(region.id)}
              aria-label={`Alege regiunea ${region.name}`}
              aria-pressed={selected}
              className={`group relative w-full rounded-2xl border ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-card/60"
              } p-4 text-left transition-all hover-scale focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <div className="flex items-center gap-4">
                {/* Flag avatar */}
                <div className={`relative w-14 h-14 rounded-full ring-1 ${selected ? "ring-primary/60" : "ring-border"} overflow-hidden bg-muted shadow-md`}>
                  <img
                    src={region.flag}
                    alt={`Steagul ${region.name}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {/* Glow on hover/selected */}
                  <div className={`absolute inset-0 rounded-full transition-opacity ${selected ? "opacity-30 bg-primary/30" : "opacity-0 group-hover:opacity-20 bg-accent/30"}`}></div>
                </div>

                {/* Copy */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{region.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${selected ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
                      {region.id}
                    </span>
                  </div>
                  {region.desc && (
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">{region.desc}</div>
                  )}
                </div>

                {/* Selected mark */}
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${selected ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
                  {selected && <Check size={14} className="text-primary" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer subtle note */}
      <div className="px-5 pb-5">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="mt-3 text-center text-xs text-muted-foreground">Selectează o regiune pentru a actualiza clasamentul</p>
      </div>
    </div>
  );
};

export default RegionSelectPopover;
