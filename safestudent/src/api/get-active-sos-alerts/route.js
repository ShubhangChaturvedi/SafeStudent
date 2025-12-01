async function handler({ status } = {}) {
  try {
    const session = getSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized access" };
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin 
      FROM auth_users 
      WHERE id = ${session.user.id}
    `;

    if (!adminCheck?.[0]?.is_admin) {
      return { error: "Unauthorized access" };
    }

    let queryStr = `
      SELECT 
        sa.*,
        creator.name as created_by_name,
        resolver.name as resolved_by_name
      FROM sos_alerts sa
      LEFT JOIN auth_users creator ON sa.created_by = creator.id
      LEFT JOIN auth_users resolver ON sa.resolved_by = resolver.id
    `;

    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryStr += ` WHERE sa.status = $${paramCount}`;
      values.push(status);
    }

    queryStr += ` ORDER BY sa.created_at DESC`;

    const alerts = await sql(queryStr, values);

    return {
      alerts: alerts.map((alert) => ({
        id: alert.id,
        status: alert.status,
        location: alert.location,
        created_at: alert.created_at,
        resolved_at: alert.resolved_at,
        created_by: alert.created_by,
        created_by_name: alert.created_by_name,
        resolved_by: alert.resolved_by,
        resolved_by_name: alert.resolved_by_name,
      })),
    };
  } catch (error) {
    console.error("Error fetching SOS alerts:", error);
    return { error: "Failed to fetch SOS alerts" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}