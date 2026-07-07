import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, KeyRound, Check, Ban } from "lucide-react";
import { toast } from "sonner";

interface PartnerKey {
  id: string;
  partner_name: string;
  key_prefix: string;
  is_active: boolean;
  revoked_at: string | null;
  last_used_at: string | null;
  notes: string | null;
  created_at: string;
}

const FUNCTION_BASE = `https://ryiwclzfoctbgmkhgept.supabase.co/functions/v1/marketplace-api`;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `aris_live_${hex}`;
}

export const MarketplaceApiKeysTab = () => {
  const [keys, setKeys] = useState<PartnerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ partner_name: "", notes: "" });
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partner_api_keys")
      .select("id, partner_name, key_prefix, is_active, revoked_at, last_used_at, notes, created_at")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Failed to load API keys");
      return;
    }
    setKeys(data as PartnerKey[]);
  };

  useEffect(() => {
    load();
  }, []);

  const createKey = async () => {
    if (!form.partner_name.trim()) {
      toast.error("Partner name is required");
      return;
    }
    setCreating(true);
    try {
      const raw = generateRawKey();
      const hash = await sha256Hex(raw);
      const prefix = raw.slice(0, 14); // "aris_live_" + 4 hex
      const { error } = await supabase.from("partner_api_keys").insert({
        partner_name: form.partner_name.trim(),
        notes: form.notes.trim() || null,
        key_prefix: prefix,
        key_hash: hash,
      });
      if (error) throw error;
      setNewlyCreated(raw);
      setForm({ partner_name: "", notes: "" });
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (k: PartnerKey) => {
    if (!confirm(`Revoke API key for ${k.partner_name}? This cannot be undone.`)) return;
    const { error } = await supabase
      .from("partner_api_keys")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", k.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Key revoked");
    load();
  };

  const remove = async (k: PartnerKey) => {
    if (!confirm(`Permanently delete this key record for ${k.partner_name}?`)) return;
    const { error } = await supabase.from("partner_api_keys").delete().eq("id", k.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    load();
  };

  const copyKey = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-3 sm:p-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <KeyRound className="h-4 w-4 text-primary" /> Marketplace API Keys
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Generate a key for each partner (Jumia, Kilimall, etc.) to read the ARIS catalog.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Key
        </Button>
      </CardHeader>

      <CardContent className="p-2 sm:p-6 pt-0 space-y-4">
        <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold">Endpoint</p>
            <a
              href="/ARIS-Marketplace-API-Partner-Guide.pdf"
              download
              className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
            >
              📄 Download Partner Integration Guide (PDF)
            </a>
          </div>
          <code className="block bg-background rounded px-2 py-1 break-all">{FUNCTION_BASE}</code>
          <p>
            Send header <code className="bg-background px-1 rounded">X-API-Key: &lt;the key&gt;</code>. Available routes:
            <span className="ml-1">/products, /products/&#123;id_or_slug&#125;, /categories, /stock</span>
          </p>
        </div>


        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No API keys yet. Click "New Key" to create one for a partner.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="hidden sm:table-cell">Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="p-2 sm:p-4">
                      <div className="font-medium text-xs sm:text-sm">{k.partner_name}</div>
                      {k.notes && <div className="text-[10px] text-muted-foreground line-clamp-1">{k.notes}</div>}
                    </TableCell>
                    <TableCell className="p-2 sm:p-4">
                      <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{k.key_prefix}...</code>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      {k.is_active ? (
                        <Badge variant="default" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right p-2 sm:p-4">
                      <div className="flex justify-end gap-1">
                        {k.is_active && (
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => revoke(k)} title="Revoke">
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="outline" className="h-7 w-7 text-destructive" onClick={() => remove(k)} title="Delete record">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* New key dialog */}
      <Dialog open={openNew} onOpenChange={(o) => { setOpenNew(o); if (!o) { setNewlyCreated(null); setForm({ partner_name: "", notes: "" }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{newlyCreated ? "Save this key now" : "Create Partner API Key"}</DialogTitle>
          </DialogHeader>

          {!newlyCreated ? (
            <div className="space-y-3">
              <div>
                <Label>Partner name</Label>
                <Input
                  value={form.partner_name}
                  onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  placeholder="e.g. Jumia Kenya"
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Contact person, purpose, integration URL..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button>
                <Button onClick={createKey} disabled={creating}>
                  {creating ? "Creating..." : "Generate Key"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-primary">
                  This key will only be shown once. Copy it and share it securely with the partner.
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={newlyCreated} className="font-mono text-[11px]" />
                  <Button size="icon" variant="outline" onClick={() => copyKey(newlyCreated)}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setOpenNew(false); setNewlyCreated(null); }}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MarketplaceApiKeysTab;
