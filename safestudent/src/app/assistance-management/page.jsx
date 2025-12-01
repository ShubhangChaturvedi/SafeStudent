"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    urgency: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/assistance";
    }
  }, [user, loading]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/list-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const requestsData = data.assistance || [];
      setRequests(requestsData);
      setFilteredRequests(requestsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load assistance requests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/list-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "staff" }),
      });

      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching staff members:", err);
    }
  };

  const updateRequestStatus = async (
    requestId,
    newStatus,
    assignedTo = null,
    requestNotes = null
  ) => {
    try {
      const response = await fetch("/api/update-request-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status: newStatus,
          assignedTo,
          notes: requestNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }

      await fetchRequests();
      return true;
    } catch (err) {
      console.error("Error updating request status:", err);
      alert("Failed to update request status");
      return false;
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRequests.length === 0) {
      alert("Please select requests to perform bulk action");
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedRequests.length} request(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      const promises = selectedRequests.map((requestId) =>
        updateRequestStatus(requestId, action)
      );

      await Promise.all(promises);
      setSelectedRequests([]);
      alert(`Successfully ${action}ed ${selectedRequests.length} request(s)`);
    } catch (err) {
      console.error("Error performing bulk action:", err);
      alert("Failed to perform bulk action");
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filters.status !== "all") {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((req) => req.category === filters.category);
    }

    if (filters.urgency !== "all") {
      filtered = filtered.filter((req) => req.urgency === filters.urgency);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.description?.toLowerCase().includes(searchLower) ||
          req.location?.toLowerCase().includes(searchLower) ||
          req.type?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRequests(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, requests, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
    fetchStaffMembers();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500";
      case "acknowledged":
        return "text-blue-400 bg-blue-500/20 border-blue-500";
      case "resolved":
        return "text-green-400 bg-green-500/20 border-green-500";
      case "cancelled":
        return "text-gray-400 bg-gray-500/20 border-gray-500";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "text-red-400 bg-red-500/20 border-red-500";
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-500";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500";
      case "low":
        return "text-green-400 bg-green-500/20 border-green-500";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500";
    }
  };

  const categories = [
    ...new Set(requests.map((req) => req.category).filter(Boolean)),
  ];
  const urgencyLevels = ["urgent", "high", "medium", "low"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Assistance Management...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Assistance Management
                </h1>
                <p className="text-sm text-gray-400">
                  Manage student and staff assistance requests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="font-bold text-xl">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={filters.urgency}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, urgency: e.target.value }))
                }
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Urgency</option>
                {urgencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRequests.length > 0 && (
            <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4 mb-4">
              <span className="text-gray-300">
                {selectedRequests.length} request(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("acknowledged")}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition-colors"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => handleBulkAction("resolved")}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm transition-colors"
                >
                  Resolve
                </button>
                <button
                  onClick={() => setSelectedRequests([])}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700/50">
            <i className="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-gray-300 mb-2">
              No Requests Found
            </h3>
            <p className="text-gray-400">
              {requests.length === 0
                ? "No assistance requests have been submitted yet."
                : "No requests match your current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:bg-gray-800/70 ${
                  request.urgency === "urgent"
                    ? "border-red-500/50 shadow-lg shadow-red-500/10"
                    : "border-gray-700/50"
                } ${
                  selectedRequests.includes(request.id)
                    ? "ring-2 ring-orange-500/50"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests((prev) => [...prev, request.id]);
                        } else {
                          setSelectedRequests((prev) =>
                            prev.filter((id) => id !== request.id)
                          );
                        }
                      }}
                      className="mt-1 w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {request.type === "sos"
                            ? "SOS Alert"
                            : "Assistance Request"}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(
                            request.urgency
                          )}`}
                        >
                          {request.urgency}
                        </span>
                        {request.urgency === "urgent" && (
                          <i className="fas fa-exclamation-triangle text-red-400 animate-pulse"></i>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">Category</p>
                          <p className="text-white">
                            {request.category || "General"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Location</p>
                          <p className="text-white">
                            {request.location || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Submitted</p>
                          <p className="text-white">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-1">
                          Description
                        </p>
                        <p className="text-gray-300">{request.description}</p>
                      </div>

                      {request.assigned_to && (
                        <div className="mb-4">
                          <p className="text-gray-400 text-sm">Assigned to</p>
                          <p className="text-blue-400">{request.assigned_to}</p>
                        </div>
                      )}

                      {request.notes && (
                        <div className="mb-4">
                          <p className="text-gray-400 text-sm">Notes</p>
                          <p className="text-gray-300 bg-gray-700/30 rounded p-2">
                            {request.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700/50">
                  {request.status === "pending" && (
                    <button
                      onClick={() =>
                        updateRequestStatus(request.id, "acknowledged")
                      }
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition-colors"
                    >
                      <i className="fas fa-check mr-2"></i>
                      Acknowledge
                    </button>
                  )}

                  {request.status !== "resolved" && (
                    <button
                      onClick={() =>
                        updateRequestStatus(request.id, "resolved")
                      }
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm transition-colors"
                    >
                      <i className="fas fa-check-double mr-2"></i>
                      Resolve
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setAssignee(request.assigned_to || "");
                      setShowAssignModal(true);
                    }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm transition-colors"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Assign
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setNotes(request.notes || "");
                      setShowNotesModal(true);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                  >
                    <i className="fas fa-sticky-note mr-2"></i>
                    Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Assign Request</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Assign to Staff Member
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select staff member...</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.name || staff.email}>
                    {staff.name || staff.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (
                    await updateRequestStatus(
                      selectedRequest.id,
                      selectedRequest.status,
                      assignee
                    )
                  ) {
                    setShowAssignModal(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
              >
                Assign
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Notes</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                placeholder="Add notes about this request..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (
                    await updateRequestStatus(
                      selectedRequest.id,
                      selectedRequest.status,
                      selectedRequest.assigned_to,
                      notes
                    )
                  ) {
                    setShowNotesModal(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Save Notes
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;