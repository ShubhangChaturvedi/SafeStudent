async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Verify admin status
  const [adminCheck] = await sql`
    SELECT is_admin FROM auth_users 
    WHERE id = ${session.user.id}
  `;

  if (!adminCheck?.is_admin) {
    return { error: "Unauthorized - Admin access required" };
  }

  try {
    const [stats] = await sql.transaction([
      sql`
        SELECT 
          (SELECT COUNT(*) FROM auth_users) as total_users,
          (SELECT COUNT(*) FROM sos_alerts WHERE status = 'active') as active_sos_count,
          (SELECT COUNT(*) FROM assistance_requests WHERE status = 'pending') as pending_assistance_count
      `,
    ]);

    return {
      totalUsers: parseInt(stats.total_users),
      activeSosCount: parseInt(stats.active_sos_count),
      pendingAssistanceCount: parseInt(stats.pending_assistance_count),
    };
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}