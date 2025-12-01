"use client";
import React from "react";

function MainComponent() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const { data: user, loading: authLoading } = useUser();
  const audioRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/get-active-sos-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data);

      // Play sound for new active alerts
      if (
        data.some(
          (alert) =>
            alert.status === "active" && !alerts.find((a) => a.id === alert.id)
        )
      ) {
        audioRef.current?.play();
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [alerts]);

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      const response = await fetch("/api/update-request-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert status");
      }

      await fetchAlerts();
      setSelectedAlert(null);
    } catch (err) {
      console.error("Error updating alert:", err);
      setError("Failed to update alert status");
    }
  };

  useEffect(() => {
    if (!authLoading && !user?.is_admin) {
      window.location.href = "/account/signin?callbackUrl=/admin/sos";
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-red-500 mb-4" />
          <p className="text-gray-400">Loading SOS alerts...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) return null;

  const filteredAlerts = alerts
    .filter((alert) => filterStatus === "all" || alert.status === filterStatus)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="min-h-screen bg-[#0A0B14] p-4 md:p-8">
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <a
              href="/admin"
              className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
            >
              <i className="fas fa-arrow-left" />
              Back to Admin Portal
            </a>
            <h1 className="text-4xl font-inter font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              SOS Alerts Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-4 text-left text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-gray-400">Time</th>
                  <th className="px-6 py-4 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      <i className="fas fa-spinner fa-spin text-2xl" />
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No SOS alerts found
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-gray-700/50 hover:bg-gray-800/30"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            alert.status === "active"
                              ? "bg-red-500/20 text-red-400 border border-red-500"
                              : "bg-green-500/20 text-green-400 border border-green-500"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              alert.status === "active"
                                ? "bg-red-400"
                                : "bg-green-400"
                            }`}
                          />
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {alert.location || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <i className="fas fa-eye" />
                          </button>
                          {alert.status === "active" && (
                            <button
                              onClick={() =>
                                updateAlertStatus(alert.id, "resolved")
                              }
                              className="text-green-400 hover:text-green-300"
                            >
                              <i className="fas fa-check" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Alert Details</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <div
                  className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    selectedAlert.status === "active"
                      ? "bg-red-500/20 text-red-400 border border-red-500"
                      : "bg-green-500/20 text-green-400 border border-green-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      selectedAlert.status === "active"
                        ? "bg-red-400"
                        : "bg-green-400"
                    }`}
                  />
                  {selectedAlert.status}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Location</label>
                <p className="text-white">
                  {selectedAlert.location || "Unknown"}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Time</label>
                <p className="text-white">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedAlert.description && (
                <div>
                  <label className="text-sm text-gray-400">Description</label>
                  <p className="text-white">{selectedAlert.description}</p>
                </div>
              )}

              {selectedAlert.status === "active" && (
                <button
                  onClick={() =>
                    updateAlertStatus(selectedAlert.id, "resolved")
                  }
                  className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;