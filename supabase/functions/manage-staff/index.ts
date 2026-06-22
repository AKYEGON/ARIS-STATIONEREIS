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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    
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

    // List all registered users with their roles
    if (action === "list-users") {
      const allUsers: any[] = [];
      let page = 1;
      const perPage = 100;
      
      while (true) {
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers({
          page,
          perPage,
        });
        
        if (listError) {
          return new Response(JSON.stringify({ error: "Failed to list users" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        allUsers.push(...users);
        if (users.length < perPage) break;
        page++;
      }

      // Get all roles
      const { data: roles } = await supabaseClient
        .from("user_roles")
        .select("*");

      // Get all employee profiles
      const { data: profiles } = await supabaseClient
        .from("employee_profiles")
        .select("*");

      // Get all agent zone assignments + zone names
      const { data: zoneAssignments } = await supabaseClient
        .from("agent_zone_assignments")
        .select("user_id, zone_id, agent_zones(id, name)");

      const usersWithRoles = allUsers
        .filter(u => u.id !== caller.id) // Exclude the admin themselves
        .map(user => {
          const userRoles = (roles || []).filter(r => r.user_id === user.id);
          const profile = (profiles || []).find(p => p.user_id === user.id);
          const za = (zoneAssignments || []).find((z: any) => z.user_id === user.id);
          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at,
            roles: userRoles.map(r => r.role),
            profile: profile || null,
            zone: za ? { id: (za as any).zone_id, name: (za as any).agent_zones?.name || null } : null,
          };
        });

      return new Response(JSON.stringify({ users: usersWithRoles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve user - assign role and create employee profile
    if (action === "approve") {
      const { user_id, role, name, phone, zone_id } = body;
      const ALLOWED_STAFF_ROLES = ["employee", "manager", "agent"];

      if (!user_id || !role || !name) {
        return new Response(JSON.stringify({ error: "user_id, role, and name are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!ALLOWED_STAFF_ROLES.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role. Allowed: employee, manager, agent" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (role === "agent" && !zone_id) {
        return new Response(JSON.stringify({ error: "zone_id is required for agent role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already has a staff role
      const { data: existingRole } = await supabaseClient
        .from("user_roles")
        .select("*")
        .eq("user_id", user_id)
        .in("role", ["employee", "manager", "agent"])
        .maybeSingle();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "This user already has a staff role" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add role
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id, role });

      if (roleError) {
        return new Response(JSON.stringify({ error: "Failed to assign role: " + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create or update employee profile
      const { error: profileError } = await supabaseClient
        .from("employee_profiles")
        .upsert({
          user_id,
          name,
          phone: phone || null,
          is_active: true,
        }, { onConflict: "user_id" });

      if (profileError) {
        await supabaseClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
        return new Response(JSON.stringify({ error: "Failed to create profile: " + profileError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If agent, assign zone
      if (role === "agent" && zone_id) {
        const { error: zoneError } = await supabaseClient
          .from("agent_zone_assignments")
          .insert({ user_id, zone_id });

        if (zoneError) {
          // Rollback
          await supabaseClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
          await supabaseClient.from("employee_profiles").delete().eq("user_id", user_id);
          return new Response(JSON.stringify({ error: "Failed to assign zone: " + zoneError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-role") {
      const { user_id, role } = body;
      const ALLOWED_STAFF_ROLES = ["employee", "manager", "agent"];

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!ALLOWED_STAFF_ROLES.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role. Allowed: employee, manager, agent" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .in("role", ["employee", "manager", "agent"]);

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

      await supabaseClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .in("role", ["employee", "manager", "agent"]);

      // Also remove agent zone assignments
      await supabaseClient
        .from("agent_zone_assignments")
        .delete()
        .eq("user_id", user_id);

      await supabaseClient
        .from("employee_profiles")
        .delete()
        .eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set-zone") {
      const { user_id, zone_id } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify target user is an agent
      const { data: agentRole } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .eq("role", "agent")
        .maybeSingle();

      if (!agentRole) {
        return new Response(JSON.stringify({ error: "Target user is not an agent" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear existing assignments
      await supabaseClient
        .from("agent_zone_assignments")
        .delete()
        .eq("user_id", user_id);

      // Insert new one if provided (null = unassign)
      if (zone_id) {
        const { error: insertError } = await supabaseClient
          .from("agent_zone_assignments")
          .insert({ user_id, zone_id });

        if (insertError) {
          return new Response(JSON.stringify({ error: "Failed to assign zone: " + insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

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
