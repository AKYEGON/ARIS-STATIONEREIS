import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variantId?: string | null;
  variantLabel?: string | null;
}

const RestockNotifyDialog = ({ open, onClose, productId, productName, variantId, variantLabel }: Props) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = contact.trim();
    if (value.length < 5) {
      toast.error("Enter a phone number or email we can reach you on");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("restock_requests").insert({
      product_id: productId,
      variant_id: variantId || null,
      contact: value,
      contact_type: value.includes("@") ? "email" : "phone",
      customer_name: name.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save that. Please try again.");
      return;
    }
    toast.success("You are on the list. We will reach out the moment it is back.");
    setName("");
    setContact("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tell me when it is back</DialogTitle>
          <DialogDescription>
            {productName}
            {variantLabel ? ` (${variantLabel})` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="restock-name">Name (optional)</Label>
            <Input id="restock-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="restock-contact">Phone or email</Label>
            <Input
              id="restock-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="07xx xxx xxx or you@email.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Notify me"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestockNotifyDialog;
