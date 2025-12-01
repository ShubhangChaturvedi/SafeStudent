async function handler({
  type,
  sort = "newest",
  status,
  dateStart,
  dateEnd,
  search,
}) {
  const session = getSession();

  if (!session?.user?.is_admin) {
    return { error: "Unauthorized access" };
  }

  try {
    let queryStr = `
      SELECT 
        ar.*,
        u.name as creator_name,
        u.email as creator_email
      FROM assistance_requests ar
      LEFT JOIN auth_users u ON ar.created_by = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filter by type if specified
    if (type) {
      queryStr += ` AND ar.type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    if (status) {
      queryStr += ` AND ar.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (dateStart) {
      queryStr += ` AND ar.created_at >= $${paramCount}`;
      values.push(new Date(dateStart));
      paramCount++;
    }

    if (dateEnd) {
      queryStr += ` AND ar.created_at <= $${paramCount}`;
      values.push(new Date(dateEnd));
      paramCount++;
    }

    if (search && search.trim()) {
      queryStr += ` AND (
        LOWER(ar.description) LIKE LOWER($${paramCount}) OR
        LOWER(ar.location) LIKE LOWER($${paramCount}) OR
        LOWER(u.name) LIKE LOWER($${paramCount})
      )`;
      values.push(`%${search.trim()}%`);
      paramCount++;
    }

    // Add sorting
    switch (sort) {
      case "oldest":
        queryStr += " ORDER BY ar.created_at ASC";
        break;
      case "urgency_desc":
        queryStr += " ORDER BY ar.urgency DESC, ar.created_at DESC";
        break;
      case "urgency_asc":
        queryStr += " ORDER BY ar.urgency ASC, ar.created_at DESC";
        break;
      case "status_desc":
        queryStr += " ORDER BY ar.status DESC, ar.created_at DESC";
        break;
      case "status_asc":
        queryStr += " ORDER BY ar.status ASC, ar.created_at DESC";
        break;
      default: // newest
        queryStr += " ORDER BY ar.created_at DESC";
    }

    const requests = await sql(queryStr, values);

    return {
      ok: true,
      data: requests.map((req) => ({
        id: req.id,
        type: req.type,
        status: req.status,
        location: req.location,
        description: req.description,
        created_at: req.created_at,
        urgency: req.urgency,
        category: req.category,
        creator_name: req.creator_name,
        creator_email: req.creator_email,
      })),
    };
  } catch (error) {
    console.error("Error fetching assistance requests:", error);
    return { error: "Failed to fetch assistance requests" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}