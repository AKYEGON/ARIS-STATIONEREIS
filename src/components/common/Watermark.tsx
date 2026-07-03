import logo from "@/assets/aris-icon.png.asset.json";

interface WatermarkProps {
  /** Visual size preset. `sm` for cards, `md` for product detail, `lg` for fullscreen viewer. */
  size?: "sm" | "md" | "lg";
  /** Opacity 0-1. Default 0.55 - visible without obscuring product. */
  opacity?: number;
}

/**
 * Bottom-right brand watermark overlay.
 * Place inside any `relative` container that holds a product/bundle image.
 * Purely presentational - `pointer-events-none` so it never blocks clicks.
 */
const Watermark = ({ size = "sm", opacity = 0.55 }: WatermarkProps) => {
  const sizing =
    size === "lg"
      ? { logo: "h-6 sm:h-7", text: "text-[11px] sm:text-xs", gap: "gap-1.5", pad: "bottom-3 right-3" }
      : size === "md"
        ? { logo: "h-5", text: "text-[10px]", gap: "gap-1", pad: "bottom-2 right-2" }
        : { logo: "h-3.5 sm:h-4", text: "text-[8px] sm:text-[9px]", gap: "gap-0.5", pad: "bottom-1 right-1" };

  return (
    <div
      className={`pointer-events-none absolute ${sizing.pad} z-10 flex items-center ${sizing.gap} select-none`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <img
        src={logo.url}
        alt=""
        className={`${sizing.logo} w-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]`}
        loading="lazy"
      />
      <span
        className={`${sizing.text} font-display font-black uppercase tracking-tight text-primary`}
        style={{ textShadow: "0 1px 2px rgba(255,255,255,0.7)" }}
      >
        ARIS
      </span>
    </div>
  );
};

export default Watermark;
