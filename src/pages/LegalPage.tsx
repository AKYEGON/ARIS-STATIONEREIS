import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";

interface Doc {
  path: string;
  label: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

const WHATSAPP = "+254 119 774470";
const EMAIL = "arisstationeries@gmail.com";

export const LEGAL_DOCS: Doc[] = [
  {
    path: "/about",
    label: "About Us",
    title: "About ARIS",
    description:
      "ARIS packs stationery and course equipment for Kenyan university students. Nairobi counter, same-day dispatch, countrywide delivery.",
    intro:
      "ARIS started at a counter in Nairobi, filling lists that campus bookshops kept getting wrong. Today we stock the equipment courses actually ask for and get it moving the same day.",
    sections: [
      {
        heading: "What we stock",
        body: [
          "Course equipment first: drawing sets, T-squares, scientific calculators, geometry sets, lab and exam essentials. Around that sits the everyday stationery a student, office or school runs through - pens, notebooks, files, art supplies.",
          "If a lecturer asks for something we do not carry, message us. We source specific items regularly.",
        ],
      },
      {
        heading: "How we work",
        body: [
          "Orders placed before 11am in Nairobi reach you the same day. Anywhere else in Kenya lands inside 48 hours through our courier partners.",
          "Payment is M-Pesa. Confirmation is instant and we only dispatch against a confirmed order.",
        ],
      },
      {
        heading: "Talk to a person",
        body: [`WhatsApp ${WHATSAPP} or email ${EMAIL}. A human answers during business hours, Monday to Saturday, 8am to 6pm.`],
      },
    ],
  },
  {
    path: "/contact",
    label: "Contact Us",
    title: "Contact ARIS",
    description:
      "Reach ARIS on WhatsApp, phone or email for orders, bulk quotes, pickup arrangements and delivery questions.",
    intro: "The fastest route is WhatsApp. Orders, quotes and delivery follow-ups all move through there.",
    sections: [
      {
        heading: "WhatsApp and phone",
        body: [`${WHATSAPP} - Monday to Saturday, 8am to 6pm.`],
      },
      { heading: "Email", body: [EMAIL] },
      {
        heading: "Where we are",
        body: [
          "Nairobi, Kenya. Pickup points are listed at checkout and change as we add coverage, so check the current list when you order.",
        ],
      },
      {
        heading: "Bulk and institutional orders",
        body: [
          "Schools, offices, clinics and resellers: message us with your list and quantities and we will send a quote with wholesale pricing.",
        ],
      },
    ],
  },
  {
    path: "/privacy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    description:
      "How ARIS collects, uses and protects the personal information you share when ordering stationery online in Kenya.",
    intro: "We collect the minimum needed to get an order to you, and we do not sell it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Name, phone number, email address and delivery or pickup details you enter at checkout. Order contents and totals. Basic analytics about how pages are used.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "To pack and deliver your order, to contact you about it, to handle returns or refunds, and to understand which products students need more of.",
        ],
      },
      {
        heading: "Who sees it",
        body: [
          "Our team and the courier handling your delivery. Analytics and advertising tools we use, including Google Analytics and Meta Pixel, receive usage data. We do not sell personal information to anyone.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          `Ask us to correct or delete your details at any time by emailing ${EMAIL}. Browser settings and ad-blockers can stop analytics and pixel tracking without affecting your ability to order.`,
        ],
      },
    ],
  },
  {
    path: "/returns",
    label: "Return Policy",
    title: "Return Policy",
    description:
      "Damaged, wrong or faulty item from ARIS? Here is the return window, what qualifies and how a refund or replacement is handled.",
    intro: "If we sent the wrong thing or it arrived damaged, that is on us and we fix it.",
    sections: [
      {
        heading: "Window",
        body: [
          "Tell us within 48 hours of delivery or pickup. Message a photo of the item on WhatsApp and we will confirm the next step immediately.",
        ],
      },
      {
        heading: "What qualifies",
        body: [
          "Wrong item sent, item damaged in transit, or a manufacturing fault on a sealed product such as a calculator.",
          "Items must be in their original packaging and unused, except where the fault is the reason for the return.",
        ],
      },
      {
        heading: "What does not",
        body: [
          "Opened writing materials, used art supplies, and items damaged after delivery. Custom and branded orders cannot be returned once production has started.",
        ],
      },
      {
        heading: "Refunds and replacements",
        body: [
          "Replacements go out on the next dispatch. Refunds are sent back to the paying M-Pesa number within three business days of the returned item reaching us.",
        ],
      },
    ],
  },
  {
    path: "/terms",
    label: "Terms & Conditions",
    title: "Terms and Conditions",
    description:
      "The terms that apply when you place an order with ARIS: pricing, payment, delivery, stock and liability.",
    intro: "Plain terms for buying from ARIS. Placing an order means you accept them.",
    sections: [
      {
        heading: "Pricing and stock",
        body: [
          "Prices are in Kenyan shillings and include VAT where applicable. Stock moves fast; if something sells out between your order and dispatch, we will contact you to swap it or refund that line.",
          "Discounted prices apply only while the sale window shown on the product is open.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "M-Pesa only at this time. An order is confirmed once payment is received. We do not accept card payments yet, and no card details are ever collected on this site.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "Same-day within Nairobi for orders placed before 11am. Up to 48 hours elsewhere in Kenya. Delivery timing depends on courier availability and the address you provide.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Our responsibility is limited to the value of the goods ordered. Product images are indicative; packaging and revisions can differ slightly from the photo.",
        ],
      },
      {
        heading: "Changes",
        body: ["We may update these terms. The version on this page at the time of your order is the one that applies."],
      },
    ],
  },
];

const LegalPage = () => {
  const { pathname } = useLocation();
  const { getCartItemCount } = useCart();
  const doc = LEGAL_DOCS.find((d) => d.path === pathname) || LEGAL_DOCS[0];

  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <SEO
        title={`${doc.title} | ARIS`}
        description={doc.description}
        canonicalUrl={doc.path}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: doc.label, url: doc.path }]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="container flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span className="text-foreground">{doc.label}</span>
          </nav>

          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{doc.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{doc.intro}</p>

          <div className="mt-8 space-y-8">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg font-semibold">{s.heading}</h2>
                {s.body.map((b, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-5">
            <p className="text-sm font-medium">Still need a person?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              WhatsApp {WHATSAPP} and we will pick it up from there.
            </p>
            <a
              href="https://wa.me/254119774470"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Message ARIS
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
