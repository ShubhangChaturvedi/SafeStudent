async function handler() {
  try {
    const guides = await sql`
      SELECT 
        id,
        title,
        content,
        category,
        steps,
        tag
      FROM first_aid_guides 
      WHERE deleted_at IS NULL
      ORDER BY category, title
    `;

    return {
      ok: true,
      json: guides,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Failed to fetch first aid guides",
    };
  }
}

function MainComponent() {
  // ... previous state ...
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showStepsModal, setShowStepsModal] = useState(false);

  // Add guides fetch to the existing useEffect or create a new one
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch("/api/get-first-aid-guides", {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to fetch guides");
        const data = await response.json();
        setGuides(data.guides || []);
      } catch (error) {
        console.error("Error fetching guides:", error);
        setError((prev) => ({
          ...prev,
          guides: "Failed to load first aid guides",
        }));
      }
    };

    fetchGuides();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ... previous sections ... */}

        {/* First Aid Guides */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            First Aid Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedGuide(guide);
                  setShowStepsModal(true);
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <i
                      className={`fas fa-${
                        guide.title.toLowerCase().includes("asthma")
                          ? "lungs text-blue-500"
                          : guide.title.toLowerCase().includes("cardiac")
                          ? "heartbeat text-red-500"
                          : guide.title.toLowerCase().includes("choking")
                          ? "child text-yellow-500"
                          : guide.title.toLowerCase().includes("fracture")
                          ? "bone text-gray-500"
                          : "first-aid text-green-500"
                      } text-2xl`}
                    ></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {guide.title}
                    </h3>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        guide.category === "burns"
                          ? "bg-red-900/50 text-red-300 border border-red-500"
                          : guide.category === "cuts"
                          ? "bg-blue-900/50 text-blue-300 border border-blue-500"
                          : "bg-green-900/50 text-green-300 border border-green-500"
                      }`}
                    >
                      {guide.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guide Steps Modal */}
        {showStepsModal && selectedGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedGuide.title}
                  </h2>
                  <button
                    onClick={() => setShowStepsModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedGuide.steps &&
                    selectedGuide.steps.map((step, index) => (
                      <div
                        key={index}
                        className="border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-200">{step.description}</p>
                            {step.image && (
                              <img
                                src={step.image}
                                alt={`Step ${index + 1}`}
                                className="mt-3 rounded-lg w-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowStepsModal(false)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export async function POST(request) {
  return handler(await request.json());
}