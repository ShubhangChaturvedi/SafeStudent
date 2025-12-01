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
        contact_type,
        sort_order
      FROM emergency_contacts 
      WHERE deleted_at IS NULL 
      ORDER BY sort_order ASC, created_at DESC
    `;

    return { contacts: contacts || [] };
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    return { contacts: [] };
  }
}
export async function POST(request) {
  return handler(await request.json());
}