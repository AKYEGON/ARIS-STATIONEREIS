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
