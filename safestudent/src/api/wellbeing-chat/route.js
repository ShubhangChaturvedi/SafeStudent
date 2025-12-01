async function handler({ message }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!message?.trim()) {
    return { error: "Message is required" };
  }

  try {
    const systemPrompt = `You are a supportive AI assistant focused on wellbeing. Your role is to:
- Provide empathetic, non-judgmental responses
- Encourage positive coping strategies
- Recognize signs of distress and suggest professional help when appropriate
- Never provide medical advice or diagnosis
- Always maintain appropriate boundaries
- Keep responses brief and focused
- If user expresses thoughts of self-harm or harm to others, immediately direct them to emergency services

You must include a suggestion to seek professional help if the user mentions:
- Severe depression or anxiety
- Suicidal thoughts
- Self-harm
- Violence
- Substance abuse
- Eating disorders
- Trauma
- Persistent mental health struggles`;

    const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Invalid AI response");
    }

    await sql`
      INSERT INTO assistance_requests 
      (type, description, created_by, category)
      VALUES 
      ('assistance', ${message}, ${session.user.id}, 'Student/Teacher Assistance')
    `;

    return {
      response: aiResponse,
    };
  } catch (error) {
    console.error("Wellbeing chat error:", error);
    return {
      error: "Unable to process your request. Please try again later.",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}