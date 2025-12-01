"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: authLoading } = useUser();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [filters, setFilters] = useState({
    severity: "",
    status: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "low",
    status: "active",
  });

  useEffect(() => {
    if (!authLoading && !user?.is_admin) {
      window.location.href = "/account/signin?callbackUrl=/admin/alerts";
      return;
    }
  }, [user, authLoading]);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/list-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAlerts();
    }
  }, [fetchAlerts, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingAlert ? "/api/update-alert" : "/api/create-alert";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingAlert?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save alert");
      }

      setShowModal(false);
      setEditingAlert(null);
      setFormData({
        title: "",
        message: "",
        severity: "low",
        status: "active",
      });
      fetchAlerts();
    } catch (err) {
      console.error("Error saving alert:", err);
      setError("Failed to save alert. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      const response = await fetch("/api/delete-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      fetchAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert. Please try again.");
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity =
        !filters.severity || alert.severity === filters.severity;
      const matchesStatus = !filters.status || alert.status === filters.status;
      const matchesSearch =
        !filters.search ||
        alert.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        alert.message.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [alerts, filters]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#4D8BFF]"></i>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0B14] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <a
              href="/admin"
              className="text-gray-400 hover:text-white mb-4 inline-flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </a>
            <h1 className="text-3xl font-bold text-white">
              Emergency Alerts Management
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#4D8BFF] hover:bg-[#357ABD] text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            New Alert
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search alerts..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <select
              value={filters.severity}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, severity: e.target.value }))
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Loading alerts...
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      No alerts found
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-white">{alert.title}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {alert.message}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            alert.severity === "high"
                              ? "bg-red-500/20 text-red-400"
                              : alert.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            alert.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingAlert(alert);
                              setFormData(alert);
                              setShowModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingAlert ? "Edit Alert" : "Create New Alert"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAlert(null);
                  setFormData({
                    title: "",
                    message: "",
                    severity: "low",
                    status: "active",
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#4D8BFF] hover:bg-[#357ABD] text-white px-6 py-2 rounded-lg transition-colors"
              >
                {editingAlert ? "Update Alert" : "Create Alert"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;