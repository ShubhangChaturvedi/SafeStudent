async function handler({ title, content, category, steps, tag = "General" }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized - Please sign in" };
  }

  try {
    // Check if user is admin
    const [adminCheck] = await sql`
      SELECT is_admin FROM auth_users 
      WHERE id = ${session.user.id} AND is_admin = true
    `;

    if (!adminCheck) {
      return { error: "Unauthorized - Admin access required" };
    }

    // Validate required fields
    if (!title?.trim() || !content?.trim() || !category?.trim()) {
      return { error: "Title, content and category are required" };
    }

    // Validate and process steps
    const processedSteps = [];
    if (Array.isArray(steps)) {
      for (const step of steps) {
        if (!step.description?.trim()) {
          return { error: "Each step must have a description" };
        }

        const processedStep = {
          description: step.description,
          imageUrl: null,
        };

        if (step.image) {
          const uploadResult = await upload(step.image);
          if (uploadResult.error) {
            return { error: `Failed to upload image: ${uploadResult.error}` };
          }
          processedStep.imageUrl = uploadResult.url;
        }

        processedSteps.push(processedStep);
      }
    }

    // Create guide
    const [guide] = await sql`
      INSERT INTO first_aid_guides (
        title,
        content,
        category,
        steps,
        tag,
        created_by,
        updated_by
      )
      VALUES (
        ${title},
        ${content},
        ${category},
        ${JSON.stringify(processedSteps)},
        ${tag},
        ${session.user.id},
        ${session.user.id}
      )
      RETURNING *
    `;

    return { guide };
  } catch (error) {
    console.error("Error creating guide:", error);
    return { error: "Failed to create guide" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}