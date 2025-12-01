"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "medium",
    scheduled_for: "",
    expires_at: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/alerts";
    }
  }, [user, loading]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/list-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/create-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      await fetchAlerts();
      setShowCreateModal(false);
      resetForm();
      alert("Alert created successfully!");
    } catch (err) {
      console.error("Error creating alert:", err);
      alert("Failed to create alert. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAlert = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/update-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: selectedAlert.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      await fetchAlerts();
      setShowEditModal(false);
      setSelectedAlert(null);
      resetForm();
      alert("Alert updated successfully!");
    } catch (err) {
      console.error("Error updating alert:", err);
      alert("Failed to update alert. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/delete-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedAlert.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      await fetchAlerts();
      setShowDeleteModal(false);
      setSelectedAlert(null);
      alert("Alert deleted successfully!");
    } catch (err) {
      console.error("Error deleting alert:", err);
      alert("Failed to delete alert. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAlerts.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedAlerts.length} alert(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      await Promise.all(
        selectedAlerts.map((id) =>
          fetch("/api/delete-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      );

      await fetchAlerts();
      setSelectedAlerts([]);
      alert(`${selectedAlerts.length} alert(s) deleted successfully!`);
    } catch (err) {
      console.error("Error deleting alerts:", err);
      alert("Failed to delete some alerts. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      severity: "medium",
      scheduled_for: "",
      expires_at: "",
      is_active: true,
    });
  };

  const openEditModal = (alert) => {
    setSelectedAlert(alert);
    setFormData({
      title: alert.title || "",
      message: alert.message || "",
      severity: alert.severity || "medium",
      scheduled_for: alert.scheduled_for
        ? new Date(alert.scheduled_for).toISOString().slice(0, 16)
        : "",
      expires_at: alert.expires_at
        ? new Date(alert.expires_at).toISOString().slice(0, 16)
        : "",
      is_active: alert.is_active !== false,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (alert) => {
    setSelectedAlert(alert);
    setShowDeleteModal(true);
  };

  const openPreviewModal = (alert) => {
    setSelectedAlert(alert);
    setShowPreviewModal(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-400 bg-red-500/20 border-red-500";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500";
      case "low":
        return "text-blue-400 bg-blue-500/20 border-blue-500";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return "fa-exclamation-triangle";
      case "medium":
        return "fa-exclamation-circle";
      case "low":
        return "fa-info-circle";
      default:
        return "fa-bell";
    }
  };

  const filteredAlerts = alerts
    .filter((alert) => {
      const matchesSeverity =
        filterSeverity === "all" || alert.severity === filterSeverity;
      const matchesSearch =
        !searchTerm ||
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (filterDate !== "all") {
        const alertDate = new Date(alert.created_at);
        const now = new Date();
        switch (filterDate) {
          case "today":
            matchesDate = alertDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = alertDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = alertDate >= monthAgo;
            break;
        }
      }

      return matchesSeverity && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSelectAlert = (alertId) => {
    setSelectedAlerts((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedAlerts((prev) =>
      prev.length === filteredAlerts.length
        ? []
        : filteredAlerts.map((alert) => alert.id)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Emergency Alerts...</p>
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
              >
                <i className="fas fa-arrow-left"></i>
              </a>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bullhorn text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Emergency Alerts
                  </h1>
                  <p className="text-sm text-gray-400">
                    Manage system-wide notifications
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Create Alert</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date Range
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="severity-desc">Severity (High to Low)</option>
                <option value="severity-asc">Severity (Low to High)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedAlerts.length > 0 && (
            <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
              <span className="text-sm text-gray-300">
                {selectedAlerts.length} alert(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <i className="fas fa-trash mr-1"></i>
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchAlerts}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-gray-700/50">
            <i className="fas fa-bullhorn text-gray-500 text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-gray-300 mb-2">
              No Alerts Found
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterSeverity !== "all" || filterDate !== "all"
                ? "No alerts match your current filters."
                : "Create your first emergency alert to get started."}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              <i className="fas fa-plus mr-2"></i>
              Create First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedAlerts.length === filteredAlerts.length &&
                    filteredAlerts.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-400">
                  Select All ({filteredAlerts.length} alerts)
                </span>
              </label>
            </div>

            {/* Alerts */}
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 ${
                  selectedAlerts.includes(alert.id)
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-gray-700/50 hover:border-gray-600/50"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => toggleSelectAlert(alert.id)}
                    className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            alert.severity
                          )}`}
                        >
                          <i
                            className={`fas ${getSeverityIcon(
                              alert.severity
                            )} mr-1`}
                          ></i>
                          {alert.severity?.toUpperCase() || "MEDIUM"}
                        </div>
                        {alert.scheduled_for &&
                          new Date(alert.scheduled_for) > new Date() && (
                            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500">
                              <i className="fas fa-clock mr-1"></i>
                              Scheduled
                            </div>
                          )}
                        {!alert.is_active && (
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500">
                            <i className="fas fa-pause mr-1"></i>
                            Inactive
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openPreviewModal(alert)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          title="Preview"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => openEditModal(alert)}
                          className="text-gray-400 hover:text-yellow-400 transition-colors"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => openDeleteModal(alert)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {alert.title || "Untitled Alert"}
                    </h3>

                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {alert.message || "No message provided"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                        {alert.scheduled_for && (
                          <span>
                            <i className="fas fa-paper-plane mr-1"></i>
                            Scheduled:{" "}
                            {new Date(alert.scheduled_for).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {alert.expires_at && (
                        <span
                          className={
                            new Date(alert.expires_at) < new Date()
                              ? "text-red-400"
                              : ""
                          }
                        >
                          <i className="fas fa-hourglass-end mr-1"></i>
                          Expires: {new Date(alert.expires_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Create Emergency Alert
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAlert} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alert Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter alert title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alert Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  required
                  rows={4}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter detailed alert message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Severity Level
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-400">Active Alert</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Schedule For (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_for: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {showEditModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Edit Emergency Alert
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateAlert} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alert Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter alert title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alert Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  required
                  rows={4}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter detailed alert message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Severity Level
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-400">Active Alert</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Schedule For (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_for: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Update Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Alert</h3>
                  <p className="text-sm text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete the alert "{selectedAlert.title}
                "? This will permanently remove the alert from the system.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAlert}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>
                      Delete Alert
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Alert Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div
                className={`p-4 rounded-lg border-2 ${getSeverityColor(
                  selectedAlert.severity
                )} mb-4`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <i
                    className={`fas ${getSeverityIcon(
                      selectedAlert.severity
                    )} text-lg`}
                  ></i>
                  <span className="font-bold text-lg">
                    {selectedAlert.title}
                  </span>
                </div>
                <p className="text-gray-200">{selectedAlert.message}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Severity:</span>
                  <span className="capitalize">{selectedAlert.severity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{selectedAlert.is_active ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>
                    {new Date(selectedAlert.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedAlert.scheduled_for && (
                  <div className="flex justify-between">
                    <span>Scheduled:</span>
                    <span>
                      {new Date(selectedAlert.scheduled_for).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedAlert.expires_at && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>
                      {new Date(selectedAlert.expires_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;