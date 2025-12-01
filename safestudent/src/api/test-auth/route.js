function handler() {
  const session = getSession();

  if (!session) {
    return {
      authenticated: false,
      user: null,
      isAdmin: false,
      error: "No session found",
    };
  }

  if (!session.user) {
    return {
      authenticated: false,
      user: null,
      isAdmin: false,
      error: "No user in session",
    };
  }

  return {
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      userType: session.user.user_type,
    },
    isAdmin: session.user.is_admin || false,
    sessionValid: true,
  };
}
export async function POST(request) {
  return handler(await request.json());
}