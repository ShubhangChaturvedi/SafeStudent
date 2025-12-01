"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/sos";
    }
  }, [user, userLoading]);

  const fetchAlerts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const response = await fetch("/api/get-active-sos-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching SOS alerts:", err);
      setError("Failed to load SOS alerts. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateAlertStatus = async (alertId, status) => {
    try {
      const response = await fetch("/api/update-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: alertId,
          status: status,
          acknowledged_by: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await fetchAlerts();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error updating alert:", err);
      alert("Failed to update alert status. Please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
      const interval = setInterval(() => fetchAlerts(true), 15000); // Auto-refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesFilter = filter === "all" || alert.status === filter;
    const matchesSearch =
      !searchTerm ||
      alert.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeAlertsCount = alerts.filter(
    (alert) => alert.status === "active"
  ).length;
  const resolvedAlertsCount = alerts.filter(
    (alert) => alert.status === "resolved"
  ).length;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SOS Management...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a
                href="/admin"
                className="text-gray-400 hover:text-white transition-colors"
                title="Back to Admin Dashboard"
              >
                <i className="fas fa-arrow-left text-xl"></i>
              </a>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    SOS Alert Management
                  </h1>
                  <p className="text-sm text-gray-400">
                    Monitor Emergency Alerts
                  </p>
                </div>
              </div>
              {activeAlertsCount > 0 && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500/50 animate-pulse">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle text-red-400"></i>
                    <span className="text-red-400 font-bold">
                      {activeAlertsCount} Active Alert
                      {activeAlertsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchAlerts(true)}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/50 transition-colors disabled:opacity-50"
              >
                <i
                  className={`fas fa-sync-alt ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                ></i>
                <span>Refresh</span>
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-400">Last updated:</p>
                <p className="text-xs text-gray-500">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className={`bg-gradient-to-br ${
              activeAlertsCount > 0
                ? "from-red-500/20 to-red-600/20 border-red-500/50"
                : "from-gray-800/50 to-gray-700/50 border-gray-600/50"
            } backdrop-blur-sm rounded-xl p-6 border ${
              activeAlertsCount > 0 ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Active Alerts
                </p>
                <p
                  className={`text-3xl font-bold ${
                    activeAlertsCount > 0 ? "text-red-400" : "text-gray-300"
                  }`}
                >
                  {activeAlertsCount}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full ${
                  activeAlertsCount > 0 ? "bg-red-500/20" : "bg-gray-600/20"
                } flex items-center justify-center`}
              >
                <i
                  className={`fas fa-exclamation-triangle text-xl ${
                    activeAlertsCount > 0 ? "text-red-400" : "text-gray-400"
                  }`}
                ></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Resolved Today
                </p>
                <p className="text-3xl font-bold text-green-400">
                  {resolvedAlertsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <i className="fas fa-check-circle text-xl text-green-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Total Alerts
                </p>
                <p className="text-3xl font-bold text-blue-400">
                  {alerts.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <i className="fas fa-list text-xl text-blue-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "active"
                    ? "bg-red-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Active ({activeAlertsCount})
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "resolved"
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Resolved ({resolvedAlertsCount})
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by location, user, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-600/50 text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading SOS alerts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/50">
            <div className="flex items-center space-x-3">
              <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
              <div>
                <p className="text-red-400 font-medium">Error Loading Alerts</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchAlerts()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-600/50 text-center">
            <i className="fas fa-shield-alt text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-400 text-lg">
              {searchTerm || filter !== "all"
                ? "No alerts match your criteria"
                : "No SOS alerts found"}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === "active"
                ? "All clear - no active emergencies"
                : "This is a good thing!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-gradient-to-r backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer ${
                  alert.status === "active"
                    ? "from-red-500/20 to-red-600/20 border-red-500/50 animate-pulse"
                    : "from-gray-800/50 to-gray-700/50 border-gray-600/50"
                }`}
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        alert.status === "active"
                          ? "bg-red-500/20"
                          : "bg-green-500/20"
                      }`}
                    >
                      <i
                        className={`fas ${
                          alert.status === "active"
                            ? "fa-exclamation-triangle text-red-400"
                            : "fa-check-circle text-green-400"
                        } text-xl`}
                      ></i>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-white text-lg">
                          Emergency SOS Alert
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            alert.status === "active"
                              ? "bg-red-500/20 text-red-400 border border-red-500"
                              : "bg-green-500/20 text-green-400 border border-green-500"
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                        {alert.status === "active" && (
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs border border-yellow-500 animate-pulse">
                            URGENT
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">User:</p>
                          <p className="text-white font-medium">
                            {alert.user_name || "Unknown User"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Location:</p>
                          <p className="text-white font-medium">
                            {alert.location || "Location not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Time:</p>
                          <p className="text-white font-medium">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {alert.description && (
                        <div className="mt-3">
                          <p className="text-gray-400 text-sm">Description:</p>
                          <p className="text-gray-300">{alert.description}</p>
                        </div>
                      )}

                      {alert.acknowledged_by && (
                        <div className="mt-3 flex items-center space-x-2">
                          <i className="fas fa-user-check text-blue-400"></i>
                          <span className="text-blue-400 text-sm">
                            Acknowledged by admin
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {alert.status === "active" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAlertStatus(alert.id, "acknowledged");
                          }}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAlertStatus(alert.id, "resolved");
                          }}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                        setShowDetailModal(true);
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    SOS Alert Details
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        selectedAlert.status === "active"
                          ? "bg-red-500/20 text-red-400 border border-red-500"
                          : "bg-green-500/20 text-green-400 border border-green-500"
                      }`}
                    >
                      {selectedAlert.status.toUpperCase()}
                    </span>
                    {selectedAlert.status === "active" && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs border border-yellow-500 animate-pulse">
                        URGENT
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Alert Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Alert ID:</p>
                      <p className="text-white font-mono">{selectedAlert.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Created:</p>
                      <p className="text-white">
                        {new Date(selectedAlert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Location:</p>
                      <p className="text-white">
                        {selectedAlert.location || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">User:</p>
                      <p className="text-white">
                        {selectedAlert.user_name || "Unknown User"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">User ID:</p>
                      <p className="text-white font-mono">
                        {selectedAlert.user_id || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAlert.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Description
                  </h3>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-300">{selectedAlert.description}</p>
                  </div>
                </div>
              )}

              {selectedAlert.acknowledged_by && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Admin Actions
                  </h3>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-user-check text-blue-400"></i>
                      <span className="text-blue-400">
                        Acknowledged by admin
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex justify-end space-x-3">
                {selectedAlert.status === "active" && (
                  <>
                    <button
                      onClick={() =>
                        updateAlertStatus(selectedAlert.id, "acknowledged")
                      }
                      className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
                    >
                      <i className="fas fa-check mr-2"></i>
                      Acknowledge
                    </button>
                    <button
                      onClick={() =>
                        updateAlertStatus(selectedAlert.id, "resolved")
                      }
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                    >
                      <i className="fas fa-check-circle mr-2"></i>
                      Mark Resolved
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;