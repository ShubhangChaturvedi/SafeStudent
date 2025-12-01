"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/contacts";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/get-emergency-contacts", {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }
        const data = await response.json();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load emergency contacts");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContacts();
    }
  }, [user]);

  const isCurrentlyAvailable = (hours) => {
    if (!hours) return false;
    const now = new Date();
    const currentHour = now.getHours();
    const [start, end] = hours.split("-").map((time) => parseInt(time));
    return currentHour >= start && currentHour < end;
  };

  const categories = [
    { id: "all", label: "All Contacts", icon: "fa-address-book" },
    { id: "emergency", label: "Emergency", icon: "fa-exclamation-circle" },
    { id: "counseling", label: "Counseling", icon: "fa-heart" },
    { id: "medical", label: "Medical", icon: "fa-hospital" },
    { id: "security", label: "Security", icon: "fa-shield-alt" },
  ];

  const filteredContacts = contacts.filter(
    (contact) => activeCategory === "all" || contact.category === activeCategory
  );

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Emergency Contacts
            </h1>
            <p className="text-gray-400 mt-2">
              Quick access to help when you need it
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/20 p-3 rounded-lg border border-red-500">
            <i className="fas fa-phone-alt text-red-500" />
            <span className="text-red-300 font-bold">Emergency: 911</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                activeCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <i className={`fas ${category.icon}`} />
              <span className="hidden md:inline">{category.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => {
              const available = isCurrentlyAvailable(contact.hours);
              return (
                <div
                  key={contact.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {contact.name}
                      </h3>
                      <p className="text-gray-400">{contact.role}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${
                        available
                          ? "bg-green-500/20 text-green-300 border border-green-500"
                          : "bg-gray-700/50 text-gray-400 border border-gray-600"
                      }`}
                    >
                      {available ? "Available" : "Unavailable"}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <i className="fas fa-clock w-5" />
                      <span>{contact.hours || "24/7"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <i className="fas fa-phone w-5" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <i className="fas fa-envelope w-5" />
                      <span>{contact.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <i className="fas fa-phone" />
                      Call
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <i className="fas fa-envelope" />
                      Email
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;