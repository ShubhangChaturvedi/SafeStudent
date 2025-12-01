async function handler() {
  try {
    const tips = await sql`
      SELECT id, tip, category, importance_level, is_featured
      FROM wellbeing_tips
      WHERE deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (!tips.length) {
      return {
        tip: null,
      };
    }

    return {
      tip: tips[0],
    };
  } catch (error) {
    console.error("Error fetching random wellbeing tip:", error);
    return {
      error: "Failed to fetch wellbeing tip",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}