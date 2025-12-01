async function handler({ userId, userType }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  try {
    const [admin] = await sql`
      SELECT is_admin FROM auth_users WHERE id = ${session.user.id}
    `;

    if (!admin?.is_admin) {
      return { error: "Forbidden", status: 403 };
    }

    if (!userId || !userType) {
      return { error: "Missing required fields", status: 400 };
    }

    if (!["student", "teacher", "staff"].includes(userType)) {
      return { error: "Invalid user type", status: 400 };
    }

    const [updatedUser] = await sql`
      UPDATE auth_users 
      SET user_type = ${userType},
          is_admin = ${userType === "staff"}
      WHERE id = ${userId}
      RETURNING id, name, email, user_type, is_admin
    `;

    if (!updatedUser) {
      return { error: "User not found", status: 404 };
    }

    return { user: updatedUser, status: 200 };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Internal server error", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}