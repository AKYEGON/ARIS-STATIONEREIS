// E2E test for agent zone RLS isolation.
// Creates: 2 zones (if needed), 2 ephemeral agent users each assigned a zone,
// seeds orders across zones with statuses Pending / Delivered / Cancelled,
// signs in as each agent and asserts each only sees their own zone orders
// across all status filters. Cleans up everything at the end.
// SECURITY: requires admin caller (verified via JWT + has_role).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StepResult { step: string; ok: boolean; detail?: string; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const results: StepResult[] = [];
  const cleanup: Array<() => Promise<void>> = [];
  const log = (step: string, ok: boolean, detail?: string) => {
    results.push({ step, ok, detail });
    console.log(`[${ok ? "PASS" : "FAIL"}] ${step}${detail ? " — " + detail : ""}`);
  };

  // --- AuthN: only admin allowed ---
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) throw new Error("Missing bearer token");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) throw new Error("Invalid token");
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some(r => r.role === "admin")) throw new Error("Caller is not admin");
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tag = `e2e-${Date.now()}`;
  const zoneIds: string[] = [];
  const agentCreds: Array<{ email: string; password: string; userId: string; zoneId: string }> = [];
  const orderIds: string[] = [];

  try {
    // 1. Create 2 test zones
    const { data: zones, error: zErr } = await admin.from("agent_zones").insert([
      { name: `${tag}-ZoneA`, display_order: 999, is_active: true },
      { name: `${tag}-ZoneB`, display_order: 999, is_active: true },
    ]).select("id");
    if (zErr) throw new Error("create zones: " + zErr.message);
    zones!.forEach(z => zoneIds.push(z.id));
    cleanup.push(async () => { await admin.from("agent_zones").delete().in("id", zoneIds); });
    log("create 2 test zones", true, zoneIds.join(","));

    // 2. Create 2 ephemeral agent users, assign zones + agent role
    for (let i = 0; i < 2; i++) {
      const email = `${tag}-agent${i}@test.local`;
      const password = `Test-${crypto.randomUUID()}`;
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (cErr) throw new Error(`create agent ${i}: ` + cErr.message);
      const userId = created.user!.id;
      cleanup.push(async () => { await admin.auth.admin.deleteUser(userId); });

      const { error: rErr } = await admin.from("user_roles").insert({ user_id: userId, role: "agent" });
      if (rErr) throw new Error(`assign agent role ${i}: ` + rErr.message);

      const { error: aErr } = await admin.from("agent_zone_assignments").insert({
        user_id: userId, zone_id: zoneIds[i],
      });
      if (aErr) throw new Error(`assign zone ${i}: ` + aErr.message);

      agentCreds.push({ email, password, userId, zoneId: zoneIds[i] });
    }
    log("create 2 agent users + zone assignments", true);

    // 3. Seed 6 orders: 3 per zone × {Pending, Delivered, Cancelled}
    const statuses = ["Pending", "Delivered", "Cancelled"];
    const orderRows = [];
    for (const z of zoneIds) {
      for (const s of statuses) {
        orderRows.push({
          customer_name: `${tag}-cust`,
          customer_email: `${tag}@test.local`,
          customer_phone: "0700000000",
          delivery_address: `${tag}-addr`,
          total: 100, subtotal: 100, status: s, agent_zone_id: z,
        });
      }
    }
    const { data: orders, error: oErr } = await admin.from("orders").insert(orderRows).select("id, agent_zone_id, status");
    if (oErr) throw new Error("seed orders: " + oErr.message);
    orders!.forEach(o => orderIds.push(o.id));
    cleanup.push(async () => { await admin.from("orders").delete().in("id", orderIds); });
    log("seed 6 orders (3 per zone × 3 statuses)", true);

    // 4. For each agent, sign in and verify isolation
    for (let i = 0; i < agentCreds.length; i++) {
      const cred = agentCreds[i];
      const agentClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data: session, error: sErr } = await agentClient.auth.signInWithPassword({
        email: cred.email, password: cred.password,
      });
      if (sErr || !session.session) throw new Error(`signin agent ${i}: ` + (sErr?.message ?? "no session"));

      // 4a. ALL orders this agent can see
      const { data: allOrders, error: allErr } = await agentClient.from("orders").select("id, agent_zone_id, status");
      if (allErr) throw new Error(`agent ${i} list orders: ` + allErr.message);
      const allInZone = allOrders!.every(o => o.agent_zone_id === cred.zoneId);
      const seenCount = allOrders!.length;
      log(`agent${i} sees only own zone (all statuses)`, allInZone && seenCount === 3,
        `count=${seenCount} allInZone=${allInZone}`);

      // 4b. Per-status filter
      for (const s of statuses) {
        const { data: filt } = await agentClient.from("orders").select("id, agent_zone_id, status").eq("status", s);
        const ok = (filt?.length === 1) && filt![0].agent_zone_id === cred.zoneId;
        log(`agent${i} status=${s} returns 1 own-zone order`, ok, `count=${filt?.length ?? 0}`);
      }

      // 4c. Cannot see the OTHER zone's order even by direct id lookup
      const otherZoneOrderId = orders!.find(o => o.agent_zone_id !== cred.zoneId)!.id;
      const { data: leak } = await agentClient.from("orders").select("id").eq("id", otherZoneOrderId);
      log(`agent${i} cannot read other-zone order by id`, (leak?.length ?? 0) === 0);

      // 4d. Cannot update other-zone order
      const { data: upd } = await agentClient.from("orders").update({ status: "Pending" }).eq("id", otherZoneOrderId).select();
      log(`agent${i} cannot update other-zone order`, (upd?.length ?? 0) === 0);

      await agentClient.auth.signOut();
    }
  } catch (e) {
    log("FATAL", false, (e as Error).message);
  } finally {
    // Cleanup in reverse order
    for (const fn of cleanup.reverse()) {
      try { await fn(); } catch (e) { console.error("cleanup err:", e); }
    }
    log("cleanup completed", true);
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;
  return new Response(JSON.stringify({ passed, failed, results }, null, 2), {
    status: failed === 0 ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
