"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/sos";
    }
  }, [user, userLoading]);

  const handleSubmit = async () => {
    if (!location.trim()) {
      setError("Please provide your location");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/create-sos-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          details: details.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send SOS alert");
      }

      setSuccess(true);
      setLocation("");
      setDetails("");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to send SOS alert. Please try again or seek help immediately through other means."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-red-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Emergency SOS</h1>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-300 text-sm">
            <i className="fas fa-exclamation-triangle mr-2" />
            Warning: This is for genuine emergencies only. False alarms may
            result in serious consequences.
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200" />
            <div className="relative px-16 py-16 bg-red-600 rounded-full hover:bg-red-700 transform hover:scale-105 transition duration-200">
              <i className="fas fa-exclamation-triangle text-6xl text-white" />
            </div>
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Your Location</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Room 101, Building A"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Additional Details
            </label>
            <textarea
              name="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe your emergency (optional)"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-green-300">
            SOS alert sent successfully. Help is on the way.
          </div>
        )}

        <div className="text-center text-gray-400 text-sm">
          <p>
            If you're in immediate danger, also call emergency services
            directly:
          </p>
          <p className="font-bold mt-2">Emergency: 911</p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;