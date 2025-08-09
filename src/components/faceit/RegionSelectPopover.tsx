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
      <header className="px-5 py-4 border-b border-border bg-card/60">
        <h3 className="text-sm font-semibold text-foreground">Alege regiunea</h3>
        <p className="mt-1 text-xs text-muted-foreground">Vezi clasamentele pe regiuni</p>
      </header>

      <div className="p-5 grid grid-cols-2 gap-3">
        {regions.map((region) => {
          const selected = currentRegion === region.id;
          return (
            <button
              key={region.id}
              onClick={() => onSelect(region.id)}
              className={`group relative w-full rounded-xl border ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-card/60"
              } p-3 text-left transition-all hover-scale`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`relative w-10 h-10 rounded-full ring-1 ${
                    selected ? "ring-primary/60" : "ring-border"
                  } overflow-hidden bg-muted`}
                >
                  <img
                    src={region.flag}
                    alt={`Steagul ${region.name}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {selected && (
                    <div className="absolute -right-1 -bottom-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-[var(--shadow-elegant)]">
                      <Check size={12} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{region.name}</div>
                  {region.desc && (
                    <div className="text-xs text-muted-foreground truncate">{region.desc}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RegionSelectPopover;
