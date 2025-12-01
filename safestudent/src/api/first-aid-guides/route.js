async function handler() {
  try {
    const guides = await sql`
      SELECT 
        id,
        title,
        content,
        category,
        steps::json as steps,
        created_at
      FROM first_aid_guides 
      WHERE deleted_at IS NULL
      ORDER BY category, title
    `;

    return guides;
  } catch (error) {
    console.error("Error fetching first aid guides:", error);
    return { error: "Failed to fetch first aid guides" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}