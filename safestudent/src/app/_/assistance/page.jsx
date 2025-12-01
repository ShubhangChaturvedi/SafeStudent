"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    urgency: "normal",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/assistance";
    }
  }, [user, userLoading]);

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/list-assistance-options", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to fetch assistance options");
      const data = await response.json();
      setOptions(data.options || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assistance options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOptions();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/create-assistance-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: selectedOption.id,
          description: formData.description,
          location: formData.location,
          urgency: formData.urgency,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit request");

      setSubmitSuccess(true);
      setFormData({
        description: "",
        location: "",
        urgency: "normal",
      });
      setSelectedOption(null);

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      setError("Failed to submit assistance request");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const categories = Array.from(
    new Set(options.map((option) => option.category))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-inter font-bold text-gray-900 dark:text-white mb-2">
            Request Assistance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select the type of assistance you need and provide details about
            your situation
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300">
            Your assistance request has been submitted successfully
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {!selectedOption ? (
              <div className="grid gap-6">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                  >
                    <h2 className="text-xl font-inter font-bold text-gray-900 dark:text-white mb-4">
                      {category}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {options
                        .filter((option) => option.category === category)
                        .map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedOption(option)}
                            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                          >
                            <div className="flex-1 text-left">
                              <h3 className="font-inter font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </h3>
                              {option.urgency === "urgent" && (
                                <span className="inline-block mt-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded-full">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <i className="fas fa-chevron-right text-gray-400" />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                  >
                    <i className="fas fa-arrow-left" />
                    Back to options
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-inter font-bold text-gray-900 dark:text-white mb-2">
                      {selectedOption.label}
                    </h2>
                    {selectedOption.urgency === "urgent" && (
                      <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm rounded-full">
                        Urgent Assistance
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Please describe your situation..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Where are you located?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Urgency Level
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={(e) =>
                        setFormData({ ...formData, urgency: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;