async function handler({ tip, category, importance_level }) {
  const session = getSession();

  if (!session?.user?.is_admin) {
    return {
      error: "Unauthorized - Admin access required",
      status: 401,
    };
  }

  if (!tip || !category || !importance_level) {
    return {
      error: "Missing required fields",
      status: 400,
    };
  }

  const validCategories = [
    "mental",
    "physical",
    "emotional",
    "social",
    "environmental",
    "spiritual",
    "occupational",
    "financial",
  ];

  const validImportanceLevels = ["high", "normal", "low"];

  if (!validCategories.includes(category)) {
    return {
      error: "Invalid category",
      status: 400,
    };
  }

  if (!validImportanceLevels.includes(importance_level)) {
    return {
      error: "Invalid importance level",
      status: 400,
    };
  }

  try {
    const [newTip] = await sql`
      INSERT INTO wellbeing_tips (
        tip,
        category,
        importance_level
      ) VALUES (
        ${tip},
        ${category},
        ${importance_level}
      )
      RETURNING *
    `;

    return {
      tip: newTip,
      status: 201,
    };
  } catch (error) {
    console.error("Error creating wellbeing tip:", error);
    return {
      error: "Failed to create wellbeing tip",
      status: 500,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}