import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Verify caller's token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: callerRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "add") {
      const { email, name, phone, role } = body;

      if (!email || !name || !role) {
        return new Response(JSON.stringify({ error: "Email, name, and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up user by email using admin API
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
      
      if (listError) {
        return new Response(JSON.stringify({ error: "Failed to look up users" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetUser = users.find(u => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "No user found with that email. They must sign up first." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already has a staff role
      const { data: existingRole } = await supabaseClient
        .from("user_roles")
        .select("*")
        .eq("user_id", targetUser.id)
        .in("role", ["employee", "manager"])
        .maybeSingle();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "This user already has a staff role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add role
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id: targetUser.id, role });

      if (roleError) {
        return new Response(JSON.stringify({ error: "Failed to assign role: " + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create employee profile
      const { error: profileError } = await supabaseClient
        .from("employee_profiles")
        .insert({
          user_id: targetUser.id,
          name,
          phone: phone || null,
          is_active: true,
        });

      if (profileError) {
        // Rollback role if profile creation fails
        await supabaseClient.from("user_roles").delete().eq("user_id", targetUser.id).eq("role", role);
        return new Response(JSON.stringify({ error: "Failed to create profile: " + profileError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-role") {
      const { user_id, role } = body;

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete existing employee/manager role
      await supabaseClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .in("role", ["employee", "manager"]);

      // Insert new role
      const { error } = await supabaseClient
        .from("user_roles")
        .insert({ user_id, role });

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to update role: " + error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      const { user_id } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete role
      await supabaseClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .in("role", ["employee", "manager"]);

      // Delete employee profile
      await supabaseClient
        .from("employee_profiles")
        .delete()
        .eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
