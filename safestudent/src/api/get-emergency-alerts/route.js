async function handler() {
  try {
    const alerts = await sql`
      SELECT id, title, message, severity, created_at, timestamp
      FROM emergency_alerts
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    return {
      alerts: alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        created_at: alert.created_at,
        timestamp: alert.timestamp,
        is_active: true, // Since we're only selecting non-deleted alerts, they're considered active
      })),
    };
  } catch (error) {
    console.error("Error fetching emergency alerts:", error);
    return { error: "Failed to fetch emergency alerts" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}