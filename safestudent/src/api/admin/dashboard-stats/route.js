async function handler() {
  try {
    const session = getSession();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const isAdmin = await sql`
      SELECT is_admin FROM auth_users WHERE id = ${session.user.id}
    `;

    if (!isAdmin?.[0]?.is_admin) {
      return { error: "Unauthorized - Admin access required" };
    }

    const [
      sosRequests,
      assistanceRequests,
      totalUsers,
      totalAlerts,
      totalGuides,
      totalTips,
      recentActivity,
    ] = await sql.transaction([
      sql`
        SELECT COUNT(*) as count 
        FROM assistance_requests 
        WHERE type = 'sos' AND status != 'resolved'
      `,
      sql`
        SELECT COUNT(*) as count 
        FROM assistance_requests 
        WHERE type = 'assistance' AND status = 'pending'
      `,
      sql`
        SELECT COUNT(*) as count 
        FROM auth_users
      `,
      sql`
        SELECT COUNT(*) as count 
        FROM emergency_alerts 
        WHERE deleted_at IS NULL
      `,
      sql`
        SELECT COUNT(*) as count 
        FROM first_aid_guides 
        WHERE deleted_at IS NULL
      `,
      sql`
        SELECT COUNT(*) as count 
        FROM wellbeing_tips 
        WHERE deleted_at IS NULL
      `,
      sql`
        SELECT 
          ar.type,
          ar.status,
          ar.description,
          ar.created_at,
          u.name as created_by_name
        FROM assistance_requests ar
        LEFT JOIN auth_users u ON ar.created_by = u.id
        ORDER BY ar.created_at DESC
        LIMIT 10
      `,
    ]);

    return {
      activeSosCount: parseInt(sosRequests[0].count),
      pendingAssistanceCount: parseInt(assistanceRequests[0].count),
      totalUsers: parseInt(totalUsers[0].count),
      totalAlerts: parseInt(totalAlerts[0].count),
      totalGuides: parseInt(totalGuides[0].count),
      totalTips: parseInt(totalTips[0].count),
      recentActivity: recentActivity || [],
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}