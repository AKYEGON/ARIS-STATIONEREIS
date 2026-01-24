import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeliveryModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Delivery information — ARIS STATIONERIES</h3>

        <div className="text-sm leading-relaxed text-gray-700 space-y-3">
          <p className="text-base font-semibold text-emerald-700">
            ✓ FREE DELIVERY within campus areas
          </p>
          
          <p><strong>Free delivery includes:</strong> All UoN hostels, Qejani, and Qwetu — <strong>no minimum order required</strong>.</p>

          <p><strong>Payment:</strong> On pickup or on delivery.</p>

          <p className="text-muted-foreground"><strong>Need delivery outside these areas?</strong> Contact us before ordering so we can confirm availability, cost, and timing.</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-primary text-white">Close</button>
        </div>
      </div>
    </div>
  );
}
