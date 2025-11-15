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
        <h3 className="text-lg font-semibold mb-3">Delivery information — ARIS STATIONARIES</h3>

        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p><strong>UoN hostels, Qejani & Qwetu:</strong> Delivery is <strong>FREE for all orders</strong> — no minimum required.</p>

          <p><strong>Other locations:</strong> Delivery is <strong>FREE for orders of KSH 500 or more</strong>. For orders below KSH 500, the delivery fee will be <strong>negotiated</strong> between ARIS STATIONARIES and the buyer.</p>

          <p><strong>Payment:</strong> On pickup or on delivery.</p>

          <p><strong>Need delivery outside these areas?</strong> Contact us before ordering so we can confirm cost and timing.</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-primary text-white">Close</button>
        </div>
      </div>
    </div>
  );
}
