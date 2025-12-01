"use client";
import React from "react";

function MainComponent() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    dateRange: { start: "", end: "" },
    sort: "newest",
    search: "",
  });
  const { data: user, loading: authLoading } = useUser();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/list-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "sos",
          status: filters.status || undefined,
          sort: filters.sort,
          search: filters.search || undefined,
          dateStart: filters.dateRange.start || undefined,
          dateEnd: filters.dateRange.end || undefined,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/account/signin?callbackUrl=/admin/sos";
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.ok) {
        setAlerts(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch SOS alerts");
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching SOS alerts:", err);
      if (err.message === "Unauthorized") {
        window.location.href = "/account/signin?callbackUrl=/admin/sos";
      } else {
        setError(
          "We couldn't load the SOS alerts right now. Please refresh the page or try again later."
        );
      }
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/sos";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, user]);

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/update-request-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: alertId,
          type: "sos",
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setSuccessMessage(`SOS alert successfully ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh the alerts list
      fetchAlerts();
    } catch (err) {
      console.error("Error updating status:", err);
      setError(`Could not update alert status: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "acknowledged":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-600/30 text-red-300 border-red-600/50";
      default:
        return "bg-orange-600/30 text-orange-300 border-orange-600/50";
    }
  };

  if (authLoading) {
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
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a
                href="/admin"
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <i className="fas fa-arrow-left"></i>
                Back to Admin Portal
              </a>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    SOS Alerts Management
                  </h1>
                  <p className="text-sm text-gray-400">
                    Emergency Response Center
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Admin:</p>
              <p className="font-medium">{user?.name || user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500/50 text-green-300 p-4 rounded-lg flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-200"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-medium">Active SOS</p>
                <p className="text-3xl font-bold text-red-400">
                  {alerts.filter((alert) => alert.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-xl text-red-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">
                  Acknowledged
                </p>
                <p className="text-3xl font-bold text-yellow-400">
                  {
                    alerts.filter((alert) => alert.status === "acknowledged")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <i className="fas fa-eye text-xl text-yellow-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Resolved</p>
                <p className="text-3xl font-bold text-green-400">
                  {alerts.filter((alert) => alert.status === "resolved").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <i className="fas fa-check-double text-xl text-green-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total SOS</p>
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

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <i className="fas fa-filter text-blue-500 mr-2"></i>
            Filters & Search
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sort: e.target.value }))
              }
              className="bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="urgency_desc">Most Urgent First</option>
              <option value="status_desc">Status Priority</option>
            </select>

            <input
              type="text"
              placeholder="Search by location, description, or creator..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="flex-1 bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
            />

            <button
              onClick={() =>
                setFilters({
                  status: "",
                  dateRange: { start: "", end: "" },
                  sort: "newest",
                  search: "",
                })
              }
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-undo"></i>
              Clear
            </button>
          </div>
        </div>

        {/* SOS Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-800/50 h-32 rounded-xl"></div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-gray-500"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">
                No SOS Alerts Found
              </h3>
              <p className="text-gray-400">
                {filters.status || filters.search
                  ? "Try adjusting your filters to see more results."
                  : "All clear - no emergency alerts at this time."}
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:bg-gray-700/50 ${
                  alert.status === "pending"
                    ? "border-red-500/50 shadow-red-500/10 shadow-lg"
                    : alert.status === "acknowledged"
                    ? "border-yellow-500/50"
                    : "border-gray-600/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          <i
                            className={`fas ${
                              alert.status === "pending"
                                ? "fa-exclamation-triangle"
                                : alert.status === "acknowledged"
                                ? "fa-eye"
                                : "fa-check-double"
                            } mr-1`}
                          ></i>
                          {alert.status.charAt(0).toUpperCase() +
                            alert.status.slice(1)}
                        </span>

                        {alert.urgency && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(
                              alert.urgency
                            )}`}
                          >
                            <i className="fas fa-bolt mr-1"></i>
                            {alert.urgency.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <span className="text-gray-400 text-sm flex items-center">
                        <i className="fas fa-clock mr-1"></i>
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                          <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                          SOS Alert #{alert.id}
                        </h3>
                        <div className="space-y-2">
                          <div className="text-gray-300 flex items-center">
                            <i className="fas fa-map-marker-alt text-blue-400 mr-2 w-4"></i>
                            Location: {alert.location || "Unknown"}
                          </div>
                          {alert.creator_name && (
                            <div className="text-gray-300 flex items-center">
                              <i className="fas fa-user text-green-400 mr-2 w-4"></i>
                              Requested by: {alert.creator_name}
                            </div>
                          )}
                          {alert.creator_email && (
                            <div className="text-gray-300 flex items-center">
                              <i className="fas fa-envelope text-purple-400 mr-2 w-4"></i>
                              Email: {alert.creator_email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">
                          Description
                        </h4>
                        <p className="text-gray-300 bg-gray-700/30 p-3 rounded-lg">
                          {alert.description || "Emergency SOS Request"}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {alert.status === "pending" && (
                        <button
                          onClick={() =>
                            handleStatusChange(alert.id, "acknowledged")
                          }
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <i className="fas fa-eye"></i>
                          Acknowledge Alert
                        </button>
                      )}

                      {alert.status === "acknowledged" && (
                        <button
                          onClick={() =>
                            handleStatusChange(alert.id, "resolved")
                          }
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <i className="fas fa-check-double"></i>
                          Mark as Resolved
                        </button>
                      )}

                      {alert.status === "resolved" && (
                        <div className="flex items-center text-green-400">
                          <i className="fas fa-check-circle mr-2"></i>
                          <span className="font-medium">
                            Emergency Resolved
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
          >
            <i
              className={`fas ${
                loading ? "fa-spinner fa-spin" : "fa-sync-alt"
              }`}
            ></i>
            {loading ? "Refreshing..." : "Refresh Alerts"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;