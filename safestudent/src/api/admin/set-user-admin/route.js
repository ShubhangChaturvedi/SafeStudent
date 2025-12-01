async function handler({ userId }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const [currentUser] = await sql`
      SELECT is_admin FROM auth_users WHERE id = ${session.user.id}
    `;

    if (!currentUser?.is_admin) {
      return { error: "Unauthorized - Admin access required" };
    }

    const [targetUser] = await sql`
      SELECT is_admin FROM auth_users WHERE id = ${userId}
    `;

    if (!targetUser) {
      return { error: "User not found" };
    }

    if (targetUser.is_admin) {
      const [{ count }] = await sql`
        SELECT COUNT(*) as count FROM auth_users WHERE is_admin = true
      `;

      if (count <= 1) {
        return { error: "Cannot remove last admin" };
      }
    }

    const [updatedUser] = await sql`
      UPDATE auth_users 
      SET is_admin = NOT is_admin 
      WHERE id = ${userId}
      RETURNING id, email, name, is_admin
    `;

    return { user: updatedUser };
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return { error: "Failed to update admin status" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}