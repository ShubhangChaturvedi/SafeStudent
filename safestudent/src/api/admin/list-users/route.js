async function handler({ page = 1, limit = 10, filter } = {}) {
  const session = getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  try {
    const isAdmin = await sql`
      SELECT is_admin FROM auth_users WHERE id = ${session.user.id}
    `;

    if (!isAdmin?.[0]?.is_admin) {
      return { error: "Forbidden", status: 403 };
    }

    const offset = (page - 1) * limit;
    let queryString = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_admin,
        u.user_type,
        u.grade,
        u.section,
        u.has_completed_profile,
        COALESCE(s."sessionToken", '') as last_session,
        COALESCE(s.expires, NULL) as session_expires
      FROM auth_users u
      LEFT JOIN auth_sessions s ON s."userId" = u.id
    `;

    const values = [];
    let paramCount = 0;

    if (filter?.search) {
      queryString += ` WHERE u.name ILIKE $${++paramCount} OR u.email ILIKE $${paramCount}`;
      values.push(`%${filter.search}%`);
    }

    if (filter?.userType) {
      const connector = values.length ? "AND" : "WHERE";
      queryString += ` ${connector} u.user_type = $${++paramCount}`;
      values.push(filter.userType);
    }

    queryString += ` ORDER BY u.id DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const users = await sql(queryString, values);

    const totalCount = await sql`
      SELECT COUNT(*) FROM auth_users
    `;

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        userType: user.user_type,
        grade: user.grade,
        section: user.section,
        hasCompletedProfile: user.has_completed_profile,
        lastActive: user.last_session ? user.session_expires : null,
      })),
      pagination: {
        total: parseInt(totalCount[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(totalCount[0].count) / limit),
      },
    };
  } catch (error) {
    console.error("Error listing users:", error);
    return { error: "Internal server error", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}