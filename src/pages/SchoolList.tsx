import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const schema = z
  .object({
    customer_name: z.string().trim().min(2, "Enter your name").max(100),
    customer_phone: z
      .string()
      .trim()
      .regex(/^(\+?254|0)7\d{8}$|^(\+?254|0)1\d{8}$/, "Enter a valid Kenyan phone number"),
    customer_email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
    school_or_course: z.string().trim().max(150).optional(),
    list_text: z.string().trim().max(5000).optional(),
  })
  .refine((v) => (v.list_text || "").length >= 10 || true, { message: "" });

const SchoolList = () => {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    school_or_course: "",
    list_text: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (e: any) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Upload a photo (JPG, PNG, WEBP) or a PDF");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast.error("File must be under 5MB");
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!form.list_text.trim() && !file) {
      toast.error("Type your list or attach a photo of it");
      return;
    }

    setSubmitting(true);
    try {
      let file_url: string | null = null;
      let file_name: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("school-lists")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        file_url = path;
        file_name = file.name;
      }

      const { error } = await supabase.from("school_list_submissions").insert({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        school_or_course: form.school_or_course.trim() || null,
        list_text: form.list_text.trim() || null,
        file_url,
        file_name,
      });
      if (error) throw error;

      setDone(true);
    } catch (err: any) {
      console.error(err);
      toast.error("We could not send your list. Please try again or WhatsApp us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEO
        title="Send Your School or Course List | ARIS"
        description="Send ARIS your school or course requirement list and we will price it, pack it, and deliver it in Nairobi. Type it out or send a photo."
        canonicalUrl="/school-list"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "School List", url: "/school-list" },
        ]}
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Send us your list</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Type your requirement list or send a photo of it. We price every item, tell you what is
            in stock, and pack it as one order. No account needed.
          </p>
        </header>

        {done ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h2 className="font-semibold text-lg">List received</h2>
              <p className="text-sm text-muted-foreground">
                We will go through it and reply on WhatsApp with a priced quote, usually the same
                day.
              </p>
              <Button variant="outline" onClick={() => window.location.assign("/shop")}>
                Browse the shop while you wait
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your name *</Label>
                <Input id="name" value={form.customer_name} onChange={set("customer_name")} maxLength={100} />
              </div>
              <div>
                <Label htmlFor="phone">WhatsApp number *</Label>
                <Input id="phone" value={form.customer_phone} onChange={set("customer_phone")} placeholder="07XX XXX XXX" maxLength={15} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={form.customer_email} onChange={set("customer_email")} maxLength={255} />
              </div>
              <div>
                <Label htmlFor="school">School, campus or course</Label>
                <Input id="school" value={form.school_or_course} onChange={set("school_or_course")} placeholder="e.g. JKUAT, BSc Nursing Year 1" maxLength={150} />
              </div>
            </div>

            <div>
              <Label htmlFor="list">Type your list</Label>
              <Textarea
                id="list"
                value={form.list_text}
                onChange={set("list_text")}
                rows={8}
                maxLength={5000}
                placeholder={"2 x A4 counter books\n1 x Oxford maths set\n5 x manila paper"}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                One item per line works best. {form.list_text.length}/5000
              </p>
            </div>

            <div>
              <Label>Or attach a photo or PDF of the list</Label>
              {file ? (
                <div className="flex items-center gap-2 mt-1 rounded-md border p-2 text-sm">
                  <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 ml-auto"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={pickFile}
                  className="mt-1"
                />
              )}
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WEBP or PDF. Max 5MB.</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Sending..." : "Send my list"}
            </Button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SchoolList;
