// LearnLynk Tech Test - Task 3: Edge Function create-task
// Deno + Supabase Edge Functions style

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Parse body
    let body: Partial<CreateTaskPayload>;
    try {
      body = (await req.json()) as Partial<CreateTaskPayload>;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { application_id, task_type, due_at } = body;

    // Basic required fields
    if (!application_id || !task_type || !due_at) {
      return jsonResponse(
        { error: "application_id, task_type, and due_at are required" },
        400
      );
    }

    // Validate task_type
    if (!VALID_TYPES.includes(task_type as any)) {
      return jsonResponse(
        { error: "task_type must be one of: call, email, review" },
        400
      );
    }

    // Validate due_at
    const dueDate = new Date(due_at);
    if (isNaN(dueDate.getTime())) {
      return jsonResponse({ error: "due_at must be a valid datetime" }, 400);
    }

    const now = new Date();
    if (dueDate <= now) {
      return jsonResponse(
        { error: "due_at must be a future datetime" },
        400
      );
    }

    // Insert into tasks table
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        application_id,
        type: task_type,
        due_at,
        // tenant_id and status can rely on defaults/RLS
      })
      .select("id")
      .single();

    if (error) {
      console.error("DB insert error:", error);
      return jsonResponse({ error: "Failed to create task" }, 500);
    }

    // Success response
    return jsonResponse(
      {
        success: true,
        task_id: data.id,
      },
      200
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
