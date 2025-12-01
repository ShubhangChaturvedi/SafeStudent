async function handler() {
  try {
    console.log("Fetching assistance options...");

    const existingOptions = await sql`
      SELECT * FROM assistance_request_options 
      WHERE is_active = true 
      ORDER BY 
        CASE urgency 
          WHEN 'urgent' THEN 1 
          WHEN 'normal' THEN 2 
          ELSE 3 
        END,
        sort_order ASC,
        label ASC
    `;

    console.log("Found existing options:", existingOptions.length);

    if (existingOptions.length === 0) {
      console.log("No options found, creating defaults...");

      const defaultOptions = [
        {
          label: "Medical Emergency",
          category: "Student Assistance",
          urgency: "urgent",
          sort_order: 1,
        },
        {
          label: "Mental Health Crisis",
          category: "Student Assistance",
          urgency: "urgent",
          sort_order: 2,
        },
        {
          label: "Bullying or Harassment",
          category: "Student Assistance",
          urgency: "normal",
          sort_order: 3,
        },
        {
          label: "Academic Support",
          category: "Student Assistance",
          urgency: "normal",
          sort_order: 4,
        },
        {
          label: "Family Issues",
          category: "Student Assistance",
          urgency: "normal",
          sort_order: 5,
        },
        {
          label: "Classroom Management",
          category: "Teacher Assistance",
          urgency: "normal",
          sort_order: 6,
        },
        {
          label: "Student Behavior Issues",
          category: "Teacher Assistance",
          urgency: "normal",
          sort_order: 7,
        },
        {
          label: "Technical Support",
          category: "Teacher Assistance",
          urgency: "normal",
          sort_order: 8,
        },
        {
          label: "Counseling Request",
          category: "Student/Teacher Assistance",
          urgency: "normal",
          sort_order: 9,
        },
        {
          label: "Safety Concern",
          category: "Student/Teacher Assistance",
          urgency: "urgent",
          sort_order: 10,
        },
        {
          label: "Other",
          category: "Other",
          urgency: "normal",
          sort_order: 11,
        },
      ];

      const insertQueries = defaultOptions.map(
        (option) =>
          sql`
          INSERT INTO assistance_request_options (label, category, urgency, sort_order, is_active)
          VALUES (${option.label}, ${option.category}, ${option.urgency}, ${option.sort_order}, true)
        `
      );

      await sql.transaction(insertQueries);
      console.log("Default options created");

      const newOptions = await sql`
        SELECT * FROM assistance_request_options 
        WHERE is_active = true 
        ORDER BY 
          CASE urgency 
            WHEN 'urgent' THEN 1 
            WHEN 'normal' THEN 2 
            ELSE 3 
          END,
          sort_order ASC,
          label ASC
      `;

      console.log("Returning new options:", newOptions.length);
      return {
        options: newOptions,
        message: "Default assistance options created and retrieved",
      };
    }

    console.log("Returning existing options:", existingOptions.length);
    return {
      options: existingOptions,
    };
  } catch (error) {
    console.error("Error in getAssistanceOptions:", error);
    console.error("Error stack:", error.stack);
    return {
      error: "Failed to fetch assistance options",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}