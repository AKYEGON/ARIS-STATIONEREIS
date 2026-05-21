import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endsAt: string;
  className?: string;
  compact?: boolean;
}

const calc = (target: number) => {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
};

const CountdownTimer = ({ endsAt, className = "", compact = false }: CountdownTimerProps) => {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState(() => calc(target));

  useEffect(() => {
    const i = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (!t) return null;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 ${className}`}>
        <Clock className="h-3 w-3" />
        {t.days > 0 ? `${t.days}d ` : ""}{String(t.hours).padStart(2, "0")}:{String(t.mins).padStart(2, "0")}:{String(t.secs).padStart(2, "0")}
      </span>
    );
  }

  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center bg-red-600 text-white rounded px-2 py-1 min-w-[40px]">
      <span className="text-base font-bold leading-none tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-[8px] uppercase opacity-80">{l}</span>
    </div>
  );

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {t.days > 0 && <Box v={t.days} l="d" />}
      <Box v={t.hours} l="h" />
      <Box v={t.mins} l="m" />
      <Box v={t.secs} l="s" />
    </div>
  );
};

export default CountdownTimer;
