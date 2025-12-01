async function handler() {
  try {
    const result = await sql`
      SELECT 
        id,
        title,
        message,
        severity,
        timestamp,
        created_at
      FROM emergency_alerts 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `;
    return result;
  } catch (error) {
    console.error("Error fetching emergency alerts:", error);
    return { error: "Failed to fetch emergency alerts" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}