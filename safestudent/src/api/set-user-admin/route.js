async function handler({ email }) {
  const session = getSession();

  if (!session?.user?.is_admin) {
    return { error: "Unauthorized" };
  }

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const result = await sql`
      UPDATE auth_users 
      SET is_admin = true 
      WHERE email = ${email}
      RETURNING id, email, is_admin`;

    if (result.length === 0) {
      return { error: "User not found" };
    }

    return { success: true, user: result[0] };
  } catch (error) {
    return { error: "Failed to update user" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}