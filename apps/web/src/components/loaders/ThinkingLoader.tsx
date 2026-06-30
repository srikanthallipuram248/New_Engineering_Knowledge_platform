import { useEffect, useState } from "react";

const PHASES = [
  "Searching your documents",
  "Reading the most relevant sources",
  "Connecting the pieces",
  "Generating your answer",
];

export default function ThinkingLoader() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Advance through phases, then hold on the final one until the answer lands.
    const id = setInterval(() => {
      setPhase((p) => (p < PHASES.length - 1 ? p + 1 : p));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative h-5 w-5 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
      </div>

      <div className="flex flex-col">
        <span
          key={phase}
          className="text-sm font-medium animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {PHASES[phase]}
        </span>

        <span className="mt-0.5 flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 animate-bounce" />
        </span>
      </div>
    </div>
  );
}
