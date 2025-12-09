import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Task = {
  id: string;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: get start & end of today in ISO strings
  function getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getTodayRange();

      const { data, error } = await supabase
        .from("tasks")
        .select("id, type, status, application_id, due_at")
        .gte("due_at", start)
        .lte("due_at", end)
        .neq("status", "completed")
        .order("due_at", { ascending: true });

      if (error) throw error;

      setTasks(data ?? []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      // Re-fetch the tasks after updating
      await fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update task");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Today&apos;s Tasks</h1>

      {tasks.length === 0 && <p>No tasks due today 🎉</p>}

      {tasks.length > 0 && (
        <table
          style={{
            borderCollapse: "collapse",
            marginTop: "1rem",
            minWidth: "60%",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>
                Type
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>
                Application
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>
                Due At
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>
                Status
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td style={{ padding: "8px" }}>{t.type}</td>
                <td style={{ padding: "8px" }}>{t.application_id}</td>
                <td style={{ padding: "8px" }}>
                  {new Date(t.due_at).toLocaleString()}
                </td>
                <td style={{ padding: "8px" }}>{t.status}</td>
                <td style={{ padding: "8px" }}>
                  {t.status !== "completed" && (
                    <button onClick={() => markComplete(t.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
