async function handler({ title, message, severity }) {
  const session = getSession();

  if (!session?.user?.is_admin) {
    return { error: "Unauthorized - Admin access required" };
  }

  if (!title || typeof title !== "string" || title.length < 3) {
    return { error: "Title is required and must be at least 3 characters" };
  }

  if (!message || typeof message !== "string") {
    return { error: "Message is required" };
  }

  if (!severity || !["low", "medium", "high"].includes(severity)) {
    return { error: "Invalid severity level" };
  }

  try {
    const [alert] = await sql`
      INSERT INTO emergency_alerts (
        title,
        message, 
        severity
      )
      VALUES (
        ${title},
        ${message},
        ${severity}
      )
      RETURNING *
    `;

    return { alert };
  } catch (error) {
    console.error("Failed to create alert:", error);
    return { error: "Failed to create emergency alert" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}