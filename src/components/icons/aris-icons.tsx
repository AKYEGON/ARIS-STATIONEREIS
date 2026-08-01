/**
 * ARIS icon family.
 *
 * One family, one grammar: 24x24 grid, 1.5 stroke, round caps and joins,
 * currentColor, no fills except deliberate accent dots. Every glyph is drawn
 * for the exact thing it labels - a drafting compass is a drafting compass,
 * not a generic "tools" mark. Do not mix another icon set into surfaces that
 * use these.
 */
import { SVGProps } from "react";

export type ArisIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const Svg = ({ size = 24, children, ...props }: ArisIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Category glyphs                                                     */
/* ------------------------------------------------------------------ */

/** Drafting compass, legs open, pencil leg tipped, arc it just drew. */
export const IconDraftingCompass = (p: ArisIconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="3.75" r="1.4" />
    <path d="M11.3 5.05 6.4 19.4" />
    <path d="M12.7 5.05l4 11.7" />
    <path d="m16.7 16.75 1.5 3.05-2.9-.7" />
    <path d="M5.4 19.9 7.4 20.6" />
    <path d="M5.7 15.2a11.6 11.6 0 0 0 12.6 0" opacity=".55" />
  </Svg>
);

/** Compass + set square over a sheet: technical drawing bench. */
export const IconTechnicalDrawing = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M4 20.2 11.4 3.6l7.4 16.6z" />
    <path d="M6.9 14.1h9" />
    <circle cx="11.4" cy="3.6" r="1.15" />
    <path d="M9.3 20.2v-3.1h4.2" opacity=".55" />
  </Svg>
);

/** Scientific calculator: wide display with a function row above the keys. */
export const IconScientificCalculator = (p: ArisIconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="2.5" width="15" height="19" rx="2.2" />
    <rect x="7" y="5" width="10" height="3.6" rx="0.8" />
    <path d="M7 11.2h1.6M11.2 11.2h1.6M15.4 11.2h1.6" />
    <path d="M7 14.6h1.6M11.2 14.6h1.6M15.4 14.6h1.6" />
    <path d="M7 18h1.6M11.2 18h1.6" />
    <path d="M15.4 18h1.6" />
  </Svg>
);

/** Protractor with set square: maths instrument box. */
export const IconMathSet = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3 15.5a8 8 0 0 1 16 0z" />
    <path d="M3 15.5h16" />
    <path d="M7.6 15.5a3.4 3.4 0 0 1 6.8 0" opacity=".55" />
    <path d="M14.6 21.2h6.6l-6.6-6.6z" />
  </Svg>
);

/** Exam sheet: answer bubbles and a pencil laid across the corner. */
export const IconExamPad = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M5.5 3h9.2l4 4v14H5.5z" />
    <path d="M14.5 3v4h4" />
    <circle cx="9" cy="11.5" r="1" />
    <circle cx="9" cy="15.5" r="1" />
    <path d="M11.5 11.5h4M11.5 15.5h4" />
    <path d="M8.4 19.4h7.2" opacity=".55" />
  </Svg>
);

/** Fountain pen nib, slit and breather hole. */
export const IconPenNib = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M8.4 3.2h7.2l2.1 9.4L12 21l-5.7-8.4z" />
    <path d="M12 8.6V21" />
    <circle cx="12" cy="6.4" r="1.1" />
    <path d="M6.3 12.6h11.4" opacity=".55" />
  </Svg>
);

/** Two writing instruments crossed at the desk: pen and pencil. */
export const IconWritingInstruments = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M7.8 2.8 4.2 17.4l3.6 3.8 3.6-3.8L7.8 2.8z" />
    <path d="M6 10.4h3.6" />
    <path d="M16.6 3.2c1.6 0 2.8 1.2 2.8 2.8v11.4l-2.8 3.4-2.8-3.4V6c0-1.6 1.2-2.8 2.8-2.8z" />
    <path d="M13.8 8.6h5.6" opacity=".55" />
  </Svg>
);

/** Spiral notebook stacked on a hardback. */
export const IconNotebooks = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M7.2 4.2h11v13.2h-11z" />
    <path d="M7.2 7.4h11M7.2 10.6h11M7.2 13.8h6.4" opacity=".7" />
    <path d="M5.2 4.2v13.2M5.2 6.2h2M5.2 9.4h2M5.2 12.6h2M5.2 15.8h2" />
    <path d="M4 19.8h15.6" />
  </Svg>
);

/** Hanging file in an open filing box. */
export const IconFiling = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.4 7.6h6.2l1.8 2.2h9.2v9.6a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="M8.4 9.8V4.4h9.6v5.4" />
    <path d="M11 6.6h4.4" opacity=".7" />
    <path d="M9.8 14.4h4.4" opacity=".55" />
  </Svg>
);

/** Painter's palette with thumb hole, brush resting on it. */
export const IconArtPalette = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M11.6 3.2c4.8 0 8.6 3.2 8.6 7.2 0 2.3-2 3-3.5 3h-1.5c-1.1 0-1.9.8-1.9 1.8 0 .5.2.9.5 1.3.3.4.5.8.5 1.3 0 1-.9 1.8-2 1.8-4.7 0-8.5-3.9-8.5-8.7 0-4.5 3.4-7.7 7.8-7.7z" />
    <circle cx="8.2" cy="8.4" r="1" />
    <circle cx="12.4" cy="6.8" r="1" />
    <circle cx="16.2" cy="9" r="1" />
    <circle cx="7.6" cy="13" r="1" />
  </Svg>
);

/** Brush and scissors: craft supplies. */
export const IconArtCraft = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.4 20.6c1.6.3 3.2-.3 3.9-1.6.8-1.4.3-3-.9-3.7-1.2-.7-2.7-.3-3.4.9" />
    <path d="M7.6 15.6 17 5.4a2 2 0 0 1 2.9 2.8L9.8 18.6" />
    <circle cx="16.8" cy="18.4" r="1.9" />
    <path d="M15.4 17 9.8 11.4" opacity=".55" />
  </Svg>
);

/** Stapler: the honest office-supplies mark. */
export const IconOfficeSupplies = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.2 17.2h17.6v2.6H3.2z" />
    <path d="M4.6 17.2v-2.4c0-.7.5-1.2 1.2-1.2h12.4c.7 0 1.2.5 1.2 1.2v2.4" />
    <path d="M6.4 13.6 5.2 7.4c-.2-1 .5-1.8 1.5-1.6l11 2.4c.8.2 1.3.9 1.1 1.7l-.8 3.7" />
    <path d="M9 20.4h6" opacity=".55" />
  </Svg>
);

/** Gift box, ribbon knot and tails. */
export const IconGiftBox = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.6 10.4h16.8v9.4a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4z" />
    <path d="M2.8 7h18.4v3.4H2.8z" />
    <path d="M12 7v14.2" />
    <path d="M12 7S10.9 3 8.7 3a2 2 0 0 0 0 4z" />
    <path d="M12 7s1.1-4 3.3-4a2 2 0 0 1 0 4z" />
  </Svg>
);

/** Desk lamp for room and living. */
export const IconDeskLamp = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M4.4 20.6h8.4" />
    <path d="M8.6 20.6V11" />
    <path d="M8.6 11 6.2 6.6" />
    <path d="m6.2 6.6 6.6-3.4 3 5.4-6.8 2.4z" />
    <path d="M16 12.4c1.9 0 3.4 1.6 3.4 3.5v4.7" opacity=".55" />
  </Svg>
);

/** Laptop, lid open, base lip. */
export const IconLaptop = (p: ArisIconProps) => (
  <Svg {...p}>
    <rect x="4.6" y="4.4" width="14.8" height="10" rx="1.4" />
    <path d="M2.6 17.2h18.8l-1.2 2.4H3.8z" />
    <path d="M10.4 17.2h3.2" opacity=".55" />
  </Svg>
);

/** Printer with a sheet feeding out. */
export const IconPrinter = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M7 8.6V3.4h10v5.2" />
    <path d="M4.4 8.6h15.2a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6H17" />
    <path d="M7 17H4.4a1.6 1.6 0 0 1-1.6-1.6v-5.2a1.6 1.6 0 0 1 1.6-1.6" />
    <path d="M7 13.6h10v7H7z" />
    <circle cx="18" cy="11.4" r=".9" />
  </Svg>
);

/** Desk tray of general stationery. */
export const IconDeskTray = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.4 13.4h4.2l1.4 2.4h6l1.4-2.4h4.2v5.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="M3.4 13.4 6 6.2h12l2.6 7.2" />
    <path d="M9.4 3.6v3.4M14.6 3.6v3.4" opacity=".55" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Delivery, payment and trust glyphs - each visually distinct         */
/* ------------------------------------------------------------------ */

/** Same-day Nairobi: delivery scooter with motion lines. Not a truck. */
export const IconSameDayScooter = (p: ArisIconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="17.4" r="2.6" />
    <circle cx="18.4" cy="17.4" r="2.6" />
    <path d="M8.6 17.4h7.2" />
    <path d="M6 17.4 9.2 9.4h3.4l2.6 6" />
    <path d="M12.6 9.4h4.2l1.6 8" />
    <path d="M15.6 5.6h2.4a1.6 1.6 0 0 1 1.6 1.6v2.2" />
    <path d="M1.6 8.2h3.6M2.6 11.4h3" opacity=".6" />
  </Svg>
);

/** Countrywide 48hrs: route arc across the country landing on a pin. */
export const IconCountrywideRoute = (p: ArisIconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M2.9 9.4h18.2M2.9 14.6h13" opacity=".5" />
    <path d="M12 2.8c2.6 2.6 3.9 5.7 3.9 9.2 0 1.3-.2 2.5-.5 3.7" opacity=".5" />
    <path d="M12 2.8C9.4 5.4 8.1 8.5 8.1 12s1.3 6.6 3.9 9.2" opacity=".5" />
    <path d="M18.4 21.4c1.7-2.4 2.6-4 2.6-5a2.6 2.6 0 0 0-5.2 0c0 1 .9 2.6 2.6 5z" fill="currentColor" stroke="none" />
  </Svg>
);

/** M-Pesa: phone with a shilling mark on screen. */
export const IconMpesaPhone = (p: ArisIconProps) => (
  <Svg {...p}>
    <rect x="6" y="2.4" width="12" height="19.2" rx="2.4" />
    <path d="M10.4 4.8h3.2" opacity=".6" />
    <path d="M10 9.4h4M10 12.2h4" />
    <path d="M11 9.4v4.6c0 1.5 1.1 2.4 2.6 2.4" />
    <path d="M11 19.2h2" opacity=".5" />
  </Svg>
);

/** Card payment: chip and contactless waves. */
export const IconCardPayment = (p: ArisIconProps) => (
  <Svg {...p}>
    <rect x="2.4" y="5.4" width="19.2" height="13.2" rx="2" />
    <path d="M2.4 9.6h19.2" />
    <rect x="5.2" y="12.4" width="3.6" height="2.8" rx=".6" />
    <path d="M15.6 13a2.6 2.6 0 0 1 0 3.4M17.8 11.8a4.6 4.6 0 0 1 0 5.8" opacity=".7" />
  </Svg>
);

/** Pickup point: storefront awning with a location pin above. */
export const IconPickupPoint = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M4 11.4v8.4h16v-8.4" />
    <path d="M3 11.4 5 7h14l2 4.4a2.6 2.6 0 0 1-4.5 1.8 2.6 2.6 0 0 1-4.5 0 2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 11.4z" />
    <path d="M9.6 19.8v-5h4.8v5" />
    <path d="M12 4.6V2.6" opacity=".6" />
  </Svg>
);

/** Verified buyer: a receipt with a tick, used on customer proof. */
export const IconVerifiedBuyer = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M5.6 2.8h9l4 4v11.6l-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4z" />
    <path d="M14.6 2.8v4h4" />
    <path d="m8.6 11.4 2.2 2.2 4.4-4.4" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Navigation and commerce glyphs                                      */
/* ------------------------------------------------------------------ */

export const IconHome = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M3.4 10.4 12 3.2l8.6 7.2" />
    <path d="M5.4 12v8.4h13.2V12" />
    <path d="M9.8 20.4v-5.6h4.4v5.6" />
  </Svg>
);

/** Shop: storefront with awning scallops and a door. */
export const IconStorefront = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M4.2 11.6v8.6h15.6v-8.6" />
    <path d="M2.8 11.2 4.8 6h14.4l2 5.2a2.5 2.5 0 0 1-4.4 1.7 2.5 2.5 0 0 1-4.4 0 2.5 2.5 0 0 1-4.4 0 2.5 2.5 0 0 1-4.4-1.7z" />
    <path d="M9.6 20.2v-5.4h3.2v5.4" />
    <path d="M15 15h3v3.4h-3z" opacity=".6" />
  </Svg>
);

/** Deals: a price tag with the number falling. Not a flame, not a star. */
export const IconPriceDrop = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M12.6 2.8H20a1.2 1.2 0 0 1 1.2 1.2v7.4a2 2 0 0 1-.6 1.4l-7.4 7.4a1.6 1.6 0 0 1-2.3 0l-6.7-6.7a1.6 1.6 0 0 1 0-2.3l7.4-7.4a2 2 0 0 1 1-.6z" />
    <circle cx="17" cy="7" r="1.3" />
    <path d="M9.4 10.6v5.2" />
    <path d="m7.4 13.8 2 2 2-2" />
  </Svg>
);

/** Customers: two people with a quote bubble. */
export const IconCustomers = (p: ArisIconProps) => (
  <Svg {...p}>
    <circle cx="8.8" cy="8" r="3.2" />
    <path d="M3 20.2c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4" />
    <path d="M15.4 4.4h5.4a1.4 1.4 0 0 1 1.4 1.4v3.6a1.4 1.4 0 0 1-1.4 1.4h-1.2l-2 2v-2h-.6" />
  </Svg>
);

/** Cart: shallow basket on wheels with a handle. */
export const IconCart = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M2.6 3.4h2.6l2.4 10.8h9.6" />
    <path d="M5.9 6.4h15.5l-2 6.2" />
    <circle cx="9.4" cy="19" r="1.7" />
    <circle cx="17.4" cy="19" r="1.7" />
  </Svg>
);

/** Search: lens with a short handle, matched weight to the family. */
export const IconSearch = (p: ArisIconProps) => (
  <Svg {...p}>
    <circle cx="10.6" cy="10.6" r="6.6" />
    <path d="m15.6 15.6 4.4 4.4" />
  </Svg>
);

export const IconArrowRight = (p: ArisIconProps) => (
  <Svg {...p}>
    <path d="M4 12h15.4" />
    <path d="m13.8 6.4 5.6 5.6-5.6 5.6" />
  </Svg>
);

export const IconStar = ({ filled, ...p }: ArisIconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path
      d="m12 3.4 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.8l6.1-.9z"
      fill={filled ? "currentColor" : "none"}
    />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Category slug -> glyph                                              */
/* ------------------------------------------------------------------ */

export const CATEGORY_ICONS: Record<string, (p: ArisIconProps) => JSX.Element> = {
  "course-equipment": IconDraftingCompass,
  "engineering-drawing": IconTechnicalDrawing,
  "scientific-calculators": IconScientificCalculator,
  "mathematics-equipments": IconMathSet,
  "exam-essentials": IconExamPad,
  "stationery-writing": IconPenNib,
  "writing-instruments": IconWritingInstruments,
  "notebooks-books": IconNotebooks,
  "filing-organization": IconFiling,
  "general-stationery": IconDeskTray,
  "art-design": IconArtPalette,
  "art-craft-supplies": IconArtCraft,
  "office-supplies": IconOfficeSupplies,
  "gifts-accessories": IconGiftBox,
  "room-living": IconDeskLamp,
  electronics: IconLaptop,
  printing: IconPrinter,
};

/** Falls back to a neutral desk tray so a brand-new category never renders blank. */
export const getCategoryIcon = (slug?: string | null) =>
  (slug && CATEGORY_ICONS[slug]) || IconDeskTray;
