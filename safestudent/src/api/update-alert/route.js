async function handler({ id, title, message, severity }) {
  const session = getSession();

  if (!session?.user?.is_admin) {
    return { error: "Unauthorized - Admin access required" };
  }

  if (!id) {
    return { error: "Alert ID is required" };
  }

  if (!title || title.length < 3) {
    return { error: "Title must be at least 3 characters long" };
  }

  if (!message) {
    return { error: "Message is required" };
  }

  if (!severity || !["low", "medium", "high"].includes(severity)) {
    return { error: "Invalid severity level" };
  }

  try {
    const [updatedAlert] = await sql`
      UPDATE emergency_alerts 
      SET 
        title = ${title},
        message = ${message},
        severity = ${severity},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!updatedAlert) {
      return { error: "Alert not found" };
    }

    return { alert: updatedAlert };
  } catch (error) {
    console.error("Error updating alert:", error);
    return { error: "Failed to update alert" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}