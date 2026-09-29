const FAQS = [
  {
    q: "Do you deliver to the University of Nairobi?",
    a: "Yes, ARIS delivers to the University of Nairobi and all major universities in Nairobi including Kenyatta University, Strathmore University and USIU. We also deliver nationwide across Kenya.",
  },
  {
    q: "Are your stationery prices the cheapest in Kenya?",
    a: "ARIS offers some of the most competitive stationery prices in Kenya. We benchmark against campus bookshops and major retailers to ensure our prices are significantly lower.",
  },
  {
    q: "How do I order stationery online in Kenya?",
    a: "Visit arisstationaries.co.ke, browse products, add items to your cart and complete checkout. You can also reach us on WhatsApp at +254119774470.",
  },
  {
    q: "What stationery do you sell?",
    a: "We sell pens, notebooks, counter books, scientific calculators, drawing sets, engineering sets, rulers, files and much more - all at affordable prices.",
  },
];

/** Visible copy for the FAQPage JSON-LD in index.html. Keep the two in sync. */
const HomeFaq = () => {
  return (
    <section className="border-t border-border py-10 sm:py-14" aria-labelledby="home-faq-heading">
      <div className="container px-4">
        <h2 id="home-faq-heading" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Questions students ask
        </h2>
        <div className="mt-5 divide-y divide-border rounded-xl border border-border">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-4 py-3">
              <summary className="cursor-pointer font-medium text-sm sm:text-base">{item.q}</summary>
              <p className="pb-2 pt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeFaq;
