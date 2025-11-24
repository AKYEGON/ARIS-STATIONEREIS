import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ViewPayload {
  testimonialId: string;
  completed: boolean;
  viewDuration?: number;
  sessionId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { testimonialId, completed, viewDuration, sessionId }: ViewPayload = await req.json();

    if (!testimonialId) {
      return new Response(
        JSON.stringify({ error: 'Missing testimonialId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tracking view for testimonial:', testimonialId, 'Completed:', completed);

    // Insert detailed view record
    const { error: insertError } = await supabaseClient
      .from('story_views')
      .insert({
        testimonial_id: testimonialId,
        completed: completed,
        view_duration: viewDuration,
        user_session_id: sessionId
      });

    if (insertError) {
      console.error('Error inserting view record:', insertError);
      throw insertError;
    }

    // Increment view counter using the database function
    const { error: incrementError } = await supabaseClient.rpc('increment_testimonial_view', {
      testimonial_id: testimonialId,
      is_completed: completed
    });

    if (incrementError) {
      console.error('Error incrementing view count:', incrementError);
      throw incrementError;
    }

    // Calculate enhanced analytics metrics
    const { data: testimonialData } = await supabaseClient
      .from('customer_testimonials')
      .select('views, completed_views')
      .eq('id', testimonialId)
      .single();

    if (testimonialData) {
      const completionRate = testimonialData.views > 0 
        ? (testimonialData.completed_views / testimonialData.views) * 100 
        : 0;

      // Get average view duration from all views
      const { data: viewsData } = await supabaseClient
        .from('story_views')
        .select('view_duration')
        .eq('testimonial_id', testimonialId)
        .not('view_duration', 'is', null);

      const avgDuration = viewsData && viewsData.length > 0
        ? Math.round(viewsData.reduce((sum, v) => sum + (v.view_duration || 0), 0) / viewsData.length)
        : 0;

      // Calculate engagement score (0-100)
      // Formula: (completion_rate * 0.6) + (views_score * 0.4)
      const viewsScore = Math.min((testimonialData.views / 50) * 100, 100); // Normalize to 100 max
      const engagementScore = (completionRate * 0.6) + (viewsScore * 0.4);

      // Update testimonial with calculated metrics
      await supabaseClient
        .from('customer_testimonials')
        .update({
          completion_rate: Math.round(completionRate * 100) / 100,
          average_view_duration: avgDuration,
          engagement_score: Math.round(engagementScore * 100) / 100
        })
        .eq('id', testimonialId);

      console.log('Analytics updated:', { completionRate, avgDuration, engagementScore });
    }

    console.log('View tracked successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in track-story-view:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
