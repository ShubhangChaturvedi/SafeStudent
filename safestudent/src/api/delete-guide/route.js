async function handler({ id }) {
  const response = await fetch("/api/admin/delete-guide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return response.json();
}
export async function POST(request) {
  return handler(await request.json());
}