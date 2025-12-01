async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { isAdmin: false };
  }

  const userId = session.user.id;

  const [user] = await sql`
    SELECT is_admin 
    FROM auth_users 
    WHERE id = ${userId}
  `;

  return {
    isAdmin: Boolean(user?.is_admin),
  };
}
export async function POST(request) {
  return handler(await request.json());
}