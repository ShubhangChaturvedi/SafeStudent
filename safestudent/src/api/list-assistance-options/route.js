async function handler() {
  try {
    // First check if we have any options
    const count = await sql`
      SELECT COUNT(*) as count 
      FROM assistance_request_options
    `;

    // If no options exist, let's create some default ones
    if (count[0].count === 0) {
      await sql`
        INSERT INTO assistance_request_options 
        (label, category, urgency, sort_order, is_active) 
        VALUES 
        ('Medical Emergency', 'Student/Teacher Assistance', 'urgent', 1, true),
        ('Counseling Support', 'Student Assistance', 'normal', 2, true),
        ('Academic Help', 'Student Assistance', 'normal', 3, true),
        ('Technical Support', 'Student/Teacher Assistance', 'normal', 4, true),
        ('Safety Concern', 'Student/Teacher Assistance', 'urgent', 5, true),
        ('General Inquiry', 'Other', 'normal', 6, true)
      `;
    }

    // Now fetch all active options
    const options = await sql`
      SELECT 
        id,
        label,
        category,
        urgency,
        sort_order,
        is_active
      FROM assistance_request_options
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `;

    return {
      ok: true,
      options,
    };
  } catch (error) {
    console.error("Error in list-assistance-options:", error);
    return {
      ok: false,
      error: "Failed to fetch assistance request options",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}