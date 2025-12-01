async function handler() {
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

    const alerts = await sql`
      SELECT 
        a.*,
        c.name as creator_name,
        r.name as resolver_name
      FROM sos_alerts a
      LEFT JOIN auth_users c ON a.created_by = c.id
      LEFT JOIN auth_users r ON a.resolved_by = r.id
      WHERE a.status = 'active'
      ORDER BY a.created_at DESC
    `;

    return { alerts };
  } catch (error) {
    console.error("Error fetching SOS alerts:", error);
    return { error: "Failed to fetch SOS alerts" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}