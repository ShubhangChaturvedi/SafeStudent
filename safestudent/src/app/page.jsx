"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser(); // Add user data
  const [sectionErrors, setSectionErrors] = useState({
    alerts: null,
    wellbeing: null,
    guides: null,
  });
  const [alerts, setAlerts] = useState([]);
  const [activeSOSAlerts, setActiveSOSAlerts] = useState([]);
  const [wellbeingTip, setWellbeingTip] = useState(null);
  const [guides, setGuides] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsError, setContactsError] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [assistanceOptions, setAssistanceOptions] = useState([]);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [loadingAssistanceOptions, setLoadingAssistanceOptions] =
    useState(false);
  const [assistanceError, setAssistanceError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const chatContainerRef = useRef(null);
  const suggestions = [
    "How can I manage test anxiety?",
    "What are some stress relief techniques?",
    "How do I help a friend who seems depressed?",
  ];
  const updateSectionData = useCallback(async (fetcher, setter, errorKey) => {
    try {
      const response = await fetcher();
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      if (errorKey === "wellbeing" && Array.isArray(data)) {
        setter(data[0] || null);
      } else {
        setter(Array.isArray(data) ? data : []);
      }
      setSectionErrors((prev) => ({ ...prev, [errorKey]: null }));
      return true;
    } catch (err) {
      console.error(`Error fetching ${errorKey}:`, err);
      setSectionErrors((prev) => ({
        ...prev,
        [errorKey]: `Unable to load ${errorKey}. Please try again later.`,
      }));
      setter(errorKey === "wellbeing" ? null : []);
      return false;
    }
  }, []);
  const fetchWellbeingTip = useCallback(async () => {
    setIsLoadingTip(true);
    try {
      const response = await fetch("/api/get-random-wellbeing-tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setWellbeingTip(data.tip);
      setSectionErrors((prev) => ({ ...prev, wellbeing: null }));
    } catch (err) {
      console.error("Error fetching wellbeing tip:", err);
      setSectionErrors((prev) => ({
        ...prev,
        wellbeing: "Unable to load wellbeing tip. Please try again later.",
      }));
      setWellbeingTip(null);
    } finally {
      setIsLoadingTip(false);
      setIsRefreshingTip(false);
    }
  }, []);

  const handleManualTipRefresh = async () => {
    setIsRefreshingTip(true);
    await fetchWellbeingTip();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        updateSectionData(
          () => fetch("/api/emergency-alerts", { method: "POST" }),
          setAlerts,
          "alerts"
        ),
        updateSectionData(
          async () => {
            const response = await fetch("/api/get-first-aid-guides", {
              method: "POST",
            });
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return {
              ok: true,
              json: () => Promise.resolve(data.guides),
            };
          },
          setGuides,
          "guides"
        ),
        updateSectionData(
          () => fetch("/api/get-active-sos-alerts", { method: "POST" }),
          setActiveSOSAlerts,
          "sos"
        ),
      ]);

      const allFailed = results.every(
        (result) => result.status === "rejected" || !result.value
      );

      if (allFailed) {
        setError(
          "We're having trouble connecting to our servers. Please check your internet connection and try again."
        );
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [updateSectionData]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setContacts(data.contacts || []);
      setContactsError(null);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      setContactsError("Unable to load emergency contacts");
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };
  const handleSendMessage = useCallback(
    async (messageText) => {
      if (!messageText || isTyping) return;

      setMessages((prev) => [
        ...(prev || []),
        { role: "user", content: messageText },
      ]);
      setIsTyping(true);

      try {
        const response = await fetch(
          "/integrations/anthropic-claude-sonnet-3-5/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "system",
                  content:
                    "You are a concise well-being assistant. Keep all responses under 2-3 sentences. Be direct and practical.",
                },
                ...(messages || []),
                { role: "user", content: messageText },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setMessages((prev) => [
          ...(prev || []),
          {
            role: "assistant",
            content: data.choices[0].message.content,
          },
        ]);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...(prev || []),
          {
            role: "assistant",
            content: "Sorry, I had trouble responding. Please try again.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping]
  );
  const fetchWeather = async () => {
    if (!location) return;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const response = await fetch("/api/get-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: location.city }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to fetch weather");
      }

      setWeatherData(result.data);
    } catch (error) {
      console.error("Weather error:", error);
      setWeatherError("Unable to load weather data");
    } finally {
      setWeatherLoading(false);
    }
  };
  const getWeatherIcon = (conditions) => {
    const conditionMap = {
      "Clear sky": "sun",
      "Mainly clear": "cloud-sun",
      "Partly cloudy": "cloud",
      Overcast: "cloud",
      Foggy: "smog",
      "Light drizzle": "cloud-rain",
      "Moderate drizzle": "cloud-rain",
      "Dense drizzle": "cloud-showers-heavy",
      "Slight rain": "cloud-rain",
      "Moderate rain": "cloud-rain",
      "Heavy rain": "cloud-showers-heavy",
      "Slight snow": "snowflake",
      "Moderate snow": "snowflake",
      "Heavy snow": "snowflake",
      "Snow grains": "snowflake",
      Thunderstorm: "bolt",
    };
    return conditionMap[conditions] || "cloud";
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    fetchData();
    fetchWellbeingTip(); // Initial fetch
    const mainInterval = setInterval(fetchData, 30 * 60 * 1000);
    const tipInterval = setInterval(async () => {
      await updateSectionData(
        () =>
          fetch("/api/get-wellbeing-tip", {
            method: "POST",
            body: JSON.stringify({
              sql: "SELECT * FROM wellbeing_tips ORDER BY RANDOM() LIMIT 1",
            }),
          }),
        setWellbeingTip,
        "wellbeing"
      );
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(mainInterval);
      clearInterval(tipInterval);
    };
  }, [fetchData, fetchWellbeingTip, updateSectionData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            city: "Dubai",
          });
        },
        (error) => {
          console.error("Location error:", error);
          setLocation({
            city: "Dubai",
          });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather();
      const interval = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [location]);

  useEffect(() => {
    console.log("Current location:", location);
    console.log("Weather data:", weatherData);
    console.log("Weather error:", weatherError);
  }, [location, weatherData, weatherError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
          <div className="h-16 sm:h-20 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-32 sm:h-40 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-64 sm:h-96 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const handleAssistanceRequest = async (type) => {
    try {
      const response = await fetch("/api/create-assistance-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          location: location?.city || "Unknown",
          description:
            type === "sos"
              ? "Emergency SOS Request"
              : "General Assistance Request",
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || `Failed to send ${type} request`);
      }

      alert(
        type === "sos"
          ? "Emergency services have been notified. Help is on the way."
          : "Your request for assistance has been sent. Someone will assist you shortly."
      );
    } catch (error) {
      console.error(`Error creating ${type} request:`, error);
      alert(
        type === "sos"
          ? "Failed to send SOS alert. Please try emergency contacts directly."
          : "Failed to send assistance request. Please try again or contact help directly."
      );
    }
  };

  const fetchAssistanceOptions = async () => {
    setLoadingAssistanceOptions(true);
    try {
      const response = await fetch("/api/get-assistance-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error || "Failed to fetch assistance options");
      }

      setAssistanceOptions(data.options || []);
      setFilteredOptions(data.options || []);
      setAssistanceError(null);
    } catch (err) {
      console.error("Failed to fetch assistance options:", err);
      setAssistanceError("Unable to load assistance options");
      setAssistanceOptions([]);
      setFilteredOptions([]);
    } finally {
      setLoadingAssistanceOptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 pb-28">
        <div className="flex flex-wrap items-center justify-between bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 mb-6 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center space-x-3">
            <i className="fas fa-shield-heart text-4xl sm:text-5xl bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent"></i>
            <h1 className="font-inter font-bold text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              SafeStudent
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 animate-fadeIn">
            {/* Admin indicator */}
            {user?.is_admin && (
              <a
                href="/admin"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/50 rounded-lg px-3 py-2 transition-all duration-200 group"
              >
                <i className="fas fa-crown text-purple-400 text-sm"></i>
                <span className="text-purple-300 text-sm font-medium">
                  Admin
                </span>
                <i className="fas fa-external-link-alt text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </a>
            )}
            <span className="hidden sm:block mx-4 text-gray-400 opacity-50">
              •
            </span>
            <p className="text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 font-inter">
              Well-being at Your Fingertips!
            </p>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <i className="fas fa-bell text-yellow-500 text-2xl"></i>
                <h2 className="font-inter font-bold text-2xl text-white relative">
                  Smart Notifications
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-red-500"></div>
                </h2>
              </div>
              {activeSOSAlerts.length > 0 && (
                <div className="bg-red-900/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-700/50">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                    <span className="text-red-400">
                      Active SOS: {activeSOSAlerts.length}
                    </span>
                    <a
                      href="/manage-sos-alerts"
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      View All →
                    </a>
                  </div>
                </div>
              )}
            </div>
            {sectionErrors.alerts || sectionErrors.sos ? (
              <div className="p-4 bg-red-500/20 rounded-lg border border-red-500 shadow-lg">
                <p className="text-red-300">
                  {sectionErrors.alerts || sectionErrors.sos}
                </p>
                <button
                  onClick={fetchData}
                  className="mt-2 text-sm text-red-300 hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${
                    alert.severity === "high"
                      ? "bg-red-500/20 border-2 border-red-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-500/20 border-2 border-yellow-500"
                      : "bg-blue-500/20 border-2 border-blue-500"
                  }`}
                >
                  <h3 className="font-inter font-bold text-white">
                    {alert.title}
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No current alerts</p>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-500/20 shadow-lg transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            {weatherData ? (
              <div className="flex flex-col space-y-2 relative z-10">
                <div className="flex items-center space-x-2">
                  <i
                    className={`fas fa-${getWeatherIcon(
                      weatherData.conditions
                    )} text-2xl text-blue-400`}
                  ></i>
                  <span className="text-white text-lg">
                    {weatherData.conditions}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-4 text-center">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">TEMP</div>
                    <div className="text-white">
                      {weatherData.temperature}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">FEELS</div>
                    <div className="text-white">{weatherData.feelsLike}°C</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">HUM</div>
                    <div className="text-white">{weatherData.humidity}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">WIND</div>
                    <div className="text-white">
                      {weatherData.windSpeed}km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">UV</div>
                    <div
                      className={`text-white ${
                        weatherData.uvIndex > 6 ? "text-red-400" : ""
                      }`}
                    >
                      {weatherData.uvIndex}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">VIS</div>
                    <div className="text-white">{weatherData.visibility}km</div>
                  </div>
                  {weatherData.precipitationChance !== undefined && (
                    <div>
                      <div className="text-gray-400 text-xs mb-1">PRECIP</div>
                      <div className="text-white">
                        {weatherData.precipitationChance}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : weatherError ? (
              <p className="text-red-400">{weatherError}</p>
            ) : (
              <div className="animate-pulse flex space-x-4">
                <div className="h-6 w-6 bg-blue-400/20 rounded"></div>
                <div className="h-4 w-full bg-blue-400/20 rounded"></div>
              </div>
            )}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <div className="weather-shimmer absolute inset-0"></div>
              {weatherData?.conditions?.toLowerCase().includes("cloud") && (
                <>
                  <div className="cloud-1 absolute opacity-15"></div>
                  <div className="cloud-2 absolute opacity-15"></div>
                </>
              )}
              {weatherData?.conditions?.toLowerCase().includes("rain") && (
                <div className="rain-container absolute inset-0">
                  {[...Array.from({ length: 3 })].map((_, i) => (
                    <div
                      key={i}
                      className="raindrop"
                      style={{
                        left: `${i * 30}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}
              {weatherData?.conditions?.toLowerCase().includes("clear") && (
                <div className="sun-container absolute top-1/2 -translate-y-1/2 left-0">
                  <div className="sun-body opacity-15"></div>
                  <div className="sun-rays opacity-08"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {sectionErrors.wellbeing ? (
          <div className="p-4 bg-red-500/20 rounded-lg border border-red-500">
            <p className="text-red-300">{sectionErrors.wellbeing}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-red-300 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50">
            <h2 className="font-inter font-bold text-2xl text-white mb-4 relative inline-block">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              Daily Wellbeing Tip
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-green-500"></div>
            </h2>

            {isLoadingTip ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : !wellbeingTip ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No wellbeing tip available</p>
              </div>
            ) : (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <p className="text-lg text-white">{wellbeingTip.tip}</p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {wellbeingTip.category && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
                        wellbeingTip.category === "mental"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500"
                          : wellbeingTip.category === "physical"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500"
                          : wellbeingTip.category === "emotional"
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500"
                          : wellbeingTip.category === "social"
                          ? "bg-green-500/20 text-green-300 border border-green-500"
                          : wellbeingTip.category === "environmental"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500"
                          : wellbeingTip.category === "spiritual"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500"
                          : wellbeingTip.category === "occupational"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500"
                          : "bg-gray-500/20 text-gray-300 border border-gray-500"
                      }`}
                    >
                      {wellbeingTip.category.charAt(0).toUpperCase() +
                        wellbeingTip.category.slice(1) +
                        " Wellness"}
                    </span>
                  )}
                  {wellbeingTip.is_featured && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm border border-yellow-500">
                      Featured
                    </span>
                  )}
                  {wellbeingTip.importance_level &&
                    wellbeingTip.importance_level !== "normal" && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          wellbeingTip.importance_level === "high"
                            ? "bg-red-500/20 text-red-300 border border-red-500"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500"
                        }`}
                      >
                        {wellbeingTip.importance_level.charAt(0).toUpperCase() +
                          wellbeingTip.importance_level.slice(1)}{" "}
                        Priority
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {sectionErrors.guides ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <p className="text-red-700 dark:text-red-300">
              {sectionErrors.guides}
            </p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : !guides || guides.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="font-inter font-bold text-2xl text-gray-900 dark:text-white mb-4">
              First Aid Guides
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              No first aid guides available at the moment.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="font-inter font-bold text-xl sm:text-2xl text-gray-900 dark:text-white mb-4 relative inline-block">
              First Aid Guides
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {guides &&
                guides.map((guide) => {
                  console.log("Guide title:", guide.title);
                  return (
                    <div
                      key={guide.id}
                      onClick={() => {
                        setSelectedGuide(guide);
                        setShowStepsModal(true);
                      }}
                      className="relative border-2 border-gray-200/10 dark:border-gray-700/50 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer min-h-[120px] bg-gradient-to-br hover:from-gray-800 hover:to-gray-700 group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start space-x-3 relative z-10">
                        <div className="flex-shrink-0">
                          {guide.icon_name ? (
                            <i
                              className={`fas fa-${guide.icon_name} text-${
                                guide.category === "burns"
                                  ? "red"
                                  : guide.category === "cuts"
                                  ? "blue"
                                  : guide.category === "cpr"
                                  ? "yellow"
                                  : "green"
                              }-500 text-2xl sm:text-3xl animate-pulse`}
                            ></i>
                          ) : (
                            <i className="fas fa-first-aid text-green-500 text-2xl sm:text-3xl animate-pulse"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-inter font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                            {guide.title}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mt-2">
                            Click to view detailed steps
                          </p>
                          {guide.category && (
                            <span
                              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                                guide.category.toLowerCase() === "burns"
                                  ? "bg-red-500/20 text-red-300 border border-red-500"
                                  : guide.category.toLowerCase() === "cuts"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500"
                                  : guide.category.toLowerCase() === "cpr"
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500"
                                  : "bg-green-500/20 text-green-300 border border-green-500"
                              }`}
                            >
                              {guide.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {guide.image_url && (
                        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                          <img
                            src={guide.image_url}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {showStepsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg border border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-inter text-2xl font-bold text-white">
                        {selectedGuide.title}
                      </h2>
                      <button
                        onClick={() => setShowStepsModal(false)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <i className="fas fa-times text-xl"></i>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {selectedGuide.steps &&
                        selectedGuide.steps.map((step, index) => (
                          <div
                            key={index}
                            className="border border-gray-700 rounded-lg p-4 bg-gray-800/50"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-200">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setShowStepsModal(false)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 group z-50">
          <button
            onClick={() => setChatOpen(true)}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 shadow-blue-500/25"
            aria-label="Chat Support"
          >
            <i className="fas fa-comments text-white text-lg sm:text-2xl"></i>
          </button>
          <span className="absolute opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
            Chat Support
          </span>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            fetchContacts();
          }}
          className="fixed bottom-20 sm:bottom-6 left-20 sm:left-28 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group z-50 shadow-purple-500/25"
          aria-label="Emergency Contacts"
        >
          <i className="fas fa-phone-alt text-white text-lg sm:text-2xl"></i>
          <span className="absolute opacity-0 group-hover:opacity-100 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
            Emergency Contacts
          </span>
        </button>
        <button
          onClick={() => {
            setShowAssistanceModal(true);
            fetchAssistanceOptions();
          }}
          className="fixed bottom-20 sm:bottom-6 right-24 sm:right-32 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group z-50 shadow-yellow-500/25"
          aria-label="Request Assistance"
        >
          <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 animate-pulse opacity-75"></div>
          <span className="text-white text-sm sm:text-base font-bold relative z-10">
            Help
          </span>
          <span className="absolute opacity-0 group-hover:opacity-100 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
            Request Assistance
          </span>
        </button>
        <button
          onClick={async () => {
            // Play SOS sound
            const audio = document.getElementById("sosMessage");
            if (audio) {
              try {
                await audio.play();
              } catch (error) {
                console.log("Could not play audio:", error);
              }
            }

            try {
              // Create SOS assistance request
              const response = await fetch("/api/create-assistance-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "sos",
                  location: location?.city || "Unknown",
                  description: "Emergency SOS Request",
                  urgency: "urgent",
                }),
              });

              if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
              }

              const data = await response.json();

              if (data.error) {
                throw new Error(data.error);
              }

              // Show success message
              alert(
                "🚨 EMERGENCY ALERT SENT! 🚨\n\nEmergency services have been notified. Help is on the way.\n\nStay where you are and wait for assistance."
              );

              // Also open emergency contacts modal
              setIsModalOpen(true);
              fetchContacts();
            } catch (error) {
              console.error("Error creating SOS request:", error);
              alert(
                "⚠️ SOS Alert Failed!\n\nWe couldn't send your emergency alert automatically. Please call emergency services directly or use the contacts below."
              );

              // Still show emergency contacts as fallback
              setIsModalOpen(true);
              fetchContacts();
            }
          }}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group z-50 shadow-red-500/25"
          aria-label="SOS Emergency"
        >
          <audio id="sosMessage" preload="auto">
            <source
              src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
              type="audio/wav"
            />
            <source
              src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"
              type="audio/mpeg"
            />
          </audio>
          <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 animate-ping opacity-75"></div>
          <span className="text-white text-lg sm:text-xl font-bold relative z-10">
            SOS
          </span>
          <span className="absolute opacity-0 group-hover:opacity-100 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
            Emergency SOS
          </span>
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-inter text-2xl font-bold text-gray-900">
                    Emergency Contacts
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                {loadingContacts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : contactsError ? (
                  <div className="text-red-600 text-center py-4">
                    {contactsError}
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-gray-600 text-center py-4">
                    No emergency contacts available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-inter font-bold text-gray-900">
                              {contact.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {contact.role}
                            </p>
                          </div>
                          {contact.is_available && (
                            <span className="text-green-500 text-xs">
                              Available
                            </span>
                          )}
                        </div>

                        {contact.description && (
                          <p className="text-gray-600 text-sm mt-2">
                            {contact.description}
                          </p>
                        )}

                        {contact.available_hours && (
                          <p className="text-gray-500 text-xs mt-1">
                            <i className="fas fa-clock mr-1"></i>{" "}
                            {contact.available_hours}
                          </p>
                        )}

                        <div className="mt-3 space-y-2">
                          {contact.phone && (
                            <p className="text-gray-700 text-sm">
                              <i className="fas fa-phone-alt mr-2"></i>
                              <a
                                href={`tel:${contact.phone}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </p>
                          )}

                          {contact.email && (
                            <p className="text-gray-700 text-sm">
                              <i className="fas fa-envelope mr-2"></i>
                              <a
                                href={`mailto:${contact.email}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {contact.email}
                              </a>
                            </p>
                          )}
                        </div>

                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              contact.contact_type
                                ? contact.contact_type === "emergency"
                                  ? "bg-red-100 text-red-800"
                                  : contact.contact_type === "medical"
                                  ? "bg-blue-100 text-blue-800"
                                  : contact.contact_type === "counseling"
                                  ? "bg-purple-100 text-purple-800"
                                  : contact.contact_type === "crisis"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {contact.contact_type
                              ? contact.contact_type.charAt(0).toUpperCase() +
                                contact.contact_type.slice(1)
                              : "General"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {chatOpen && (
          <div className="fixed bottom-36 sm:bottom-24 left-4 sm:left-6 w-[280px] sm:w-[320px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col h-[400px] sm:h-[500px] border border-gray-700/50">
            <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900 shadow-sm">
              <h3 className="font-inter font-bold text-white text-base sm:text-lg">
                Well-being Chat
              </h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-3 sm:p-4"
              ref={chatContainerRef}
            >
              <div className="space-y-3">
                {messages &&
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2 sm:p-3 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20"
                            : "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20"
                        }`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed text-white">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-2 shadow-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-xs bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 px-3 py-1 rounded-full hover:from-gray-600 hover:to-gray-500 transition-all duration-200 shadow-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.message;
                    if (input.value.trim()) {
                      handleSendMessage(input.value);
                      input.value = "";
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Ask a question..."
                    className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner"
                  />
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {showAssistanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-inter text-2xl font-bold text-white mb-2">
                    How can we help you?
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Select the type of assistance you need
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssistanceModal(false);
                    setSelectedCategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingAssistanceOptions ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                  <p className="mt-4 text-gray-400">
                    Loading assistance options...
                  </p>
                </div>
              ) : assistanceError ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                    <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                  </div>
                  <p className="text-red-400 mb-2">{assistanceError}</p>
                  <button
                    onClick={fetchAssistanceOptions}
                    className="text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {assistanceOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            "/api/create-assistance-request",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                type: "assistance",
                                category: option.category,
                                location: location?.city || "Unknown",
                                description: option.label,
                                urgency: option.urgency,
                              }),
                            }
                          );

                          const data = await response.json();
                          if (!data.ok) {
                            throw new Error(
                              data.error || "Failed to send assistance request"
                            );
                          }

                          setShowAssistanceModal(false);
                          alert(
                            "Your request for assistance has been sent. Someone will assist you shortly."
                          );
                        } catch (error) {
                          console.error(
                            "Error creating assistance request:",
                            error
                          );
                          alert(
                            "Failed to send assistance request. Please try again or contact help directly."
                          );
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 group hover:transform hover:scale-[1.02] ${
                        option.urgency === "urgent"
                          ? "bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/50"
                          : "bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-600/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            option.urgency === "urgent"
                              ? "bg-red-500/20"
                              : "bg-gray-600/20"
                          }`}
                        >
                          <i
                            className={`fas ${
                              option.category === "Student Assistance"
                                ? "fa-user-graduate"
                                : option.category ===
                                  "Student/Teacher Assistance"
                                ? "fa-hands-helping"
                                : "fa-question-circle"
                            } text-xl ${
                              option.urgency === "urgent"
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-inter font-semibold text-white text-lg mb-1">
                              {option.label}
                            </h3>
                            {option.urgency === "urgent" && (
                              <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs border border-red-500/50">
                                <i className="fas fa-exclamation-circle"></i>
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {option.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full ${
                                option.category === "Student Assistance"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : option.category ===
                                    "Student/Teacher Assistance"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {option.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 self-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800/50">
              <p className="text-center text-gray-400 text-sm">
                For immediate emergency assistance, use the SOS button
              </p>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .weather-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.05),
            transparent
          );
          animation: shimmer 3s infinite linear;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .cloud-1 {
          width: 60px;
          height: 20px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          animation: float-cloud 12s infinite linear;
        }

        .cloud-2 {
          width: 40px;
          height: 15px;
          background: rgba(255,255,255,0.15);
          border-radius: 15px;
          animation: float-cloud 16s infinite linear;
        }

        @keyframes float-cloud {
          from { transform: translateX(-100%); }
          to { transform: translateX(400%); }
        }

        .raindrop {
          position: absolute;
          width: 1px;
          height: 8px;
          background: linear-gradient(transparent, rgba(255,255,255,0.3));
          animation: fall-rain 1.5s infinite linear;
        }

        @keyframes fall-rain {
          from { transform: translateY(-100%); }
          to { transform: translateY(200%); }
        }

        .sun-body {
          width: 30px;
          height: 30px;
          background: #ffd700;
          border-radius: 50%;
          animation: glow 3s infinite alternate;
        }

        .sun-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%);
          animation: rotate-rays 15s infinite linear;
        }

        .assistance-pulse {
          animation: assistance-pulse 2s infinite;
        }
        
        @keyframes assistance-pulse {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0.75;
          }
        }

        @keyframes glow {
          from { box-shadow: 0 0 5px rgba(255,215,0,0.3); }
          to { box-shadow: 0 0 10px rgba(255,215,0,0.3); }
        }

        @keyframes rotate-rays {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default MainComponent;