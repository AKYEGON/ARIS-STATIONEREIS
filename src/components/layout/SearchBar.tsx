import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { IconSearch } from "@/components/icons/aris-icons";
import { X } from "lucide-react";

const PROMPTS = [
  "Search scientific calculators...",
  "Search drawing sets and T-squares...",
  "Search A4 counter books...",
  "Search geometry sets...",
  "Search box files and dividers...",
  "Search sketchbooks and brushes...",
];

interface Props {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

/**
 * Persistent search, present on every page. The rotating prompt is purely
 * presentational: it stops the moment there is text in the field.
 */
const SearchBar = ({ className = "", autoFocus, onSubmitted }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("q") || "");
  const [promptIdx, setPromptIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  // Reflect the URL when arriving on /shop from elsewhere.
  useEffect(() => {
    setValue(params.get("q") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % PROMPTS.length), 3200);
    return () => clearInterval(t);
  }, [value]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    onSubmitted?.();
    inputRef.current?.blur();
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <label htmlFor={fieldId} className="sr-only">
        Search ARIS products
      </label>
      <IconSearch
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={fieldId}
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PROMPTS[promptIdx]}
        className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-9 text-sm outline-none transition-all placeholder:text-muted-foreground/80 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
};

export default SearchBar;
