async function handler() {
  try {
    const contacts = await sql`
      SELECT 
        id,
        name,
        role,
        phone,
        email,
        description,
        available_hours,
        is_available,
        sort_order,
        contact_type
      FROM emergency_contacts
      WHERE deleted_at IS NULL
      ORDER BY sort_order ASC, name ASC
    `;

    return {
      contacts,
    };
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    return {
      error: "Failed to fetch emergency contacts",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}