"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSosCount: 0,
    pendingAssistanceCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        window.location.href = "/account/signin?callbackUrl=/admin/dashboard";
        return;
      }
      if (user.is_admin === false) {
        window.location.href = "/";
        return;
      }
    }
  }, [user, userLoading]);

  const fetchStats = useCallback(async () => {
    if (!user?.is_admin) return;

    try {
      const response = await fetch("/api/admin/dashboard-stats", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Error fetching stats: ${response.status}`);
      }
      const data = await response.json();
      if (data) {
        setStats({
          totalUsers: data.totalUsers || 0,
          activeSosCount: data.activeSosCount || 0,
          pendingAssistanceCount: data.pendingAssistanceCount || 0,
        });
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error.message);
    } finally {
      setIsLoadingStats(false);
      setLastUpdated(new Date());
    }
  }, [user]);

  // Modal management functions
  const openModal = async (modalType) => {
    setActiveModal(modalType);
    setModalLoading(true);
    setModalError(null);
    setEditingItem(null);
    setFormData({});

    try {
      let endpoint = "";
      switch (modalType) {
        case "users":
          endpoint = "/api/list-users";
          break;
        case "alerts":
          endpoint = "/api/emergency-alerts";
          break;
        case "guides":
          endpoint = "/api/get-first-aid-guides";
          break;
        case "tips":
          endpoint = "/api/list-tips";
          break;
        case "contacts":
          endpoint = "/api/emergency-contacts";
          break;
        case "assistance":
          endpoint = "/api/list-assistance-requests";
          break;
        case "sos":
          endpoint = "/api/get-active-sos-alerts";
          break;
        default:
          throw new Error("Unknown modal type");
      }

      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Error fetching ${modalType}: ${response.status}`);
      }

      const data = await response.json();
      setModalData(
        Array.isArray(data)
          ? data
          : data.guides ||
              data.tips ||
              data.contacts ||
              data.users ||
              data.requests ||
              data.alerts ||
              []
      );
    } catch (error) {
      console.error(`Error fetching ${modalType}:`, error);
      setModalError(`Failed to load ${modalType}. Please try again.`);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData([]);
    setEditingItem(null);
    setFormData({});
    setModalError(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
  };

  const handleSave = async () => {
    setModalLoading(true);
    try {
      let endpoint = "";
      let method = editingItem ? "PUT" : "POST";

      switch (activeModal) {
        case "alerts":
          endpoint = editingItem ? "/api/update-alert" : "/api/create-alert";
          break;
        case "guides":
          endpoint = editingItem ? "/api/update-guide" : "/api/create-guide";
          break;
        case "tips":
          endpoint = editingItem ? "/api/update-tip" : "/api/create-tip";
          break;
        case "contacts":
          endpoint = editingItem
            ? "/api/update-contact"
            : "/api/create-contact";
          break;
        case "users":
          endpoint = "/api/update-user-role";
          break;
        default:
          throw new Error("Save not supported for this modal type");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error saving: ${response.status}`);
      }

      // Refresh data
      await openModal(activeModal);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error("Error saving:", error);
      setModalError(`Failed to save. Please try again.`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setModalLoading(true);
    try {
      let endpoint = "";
      switch (activeModal) {
        case "alerts":
          endpoint = "/api/delete-alert";
          break;
        case "guides":
          endpoint = "/api/delete-guide";
          break;
        case "tips":
          endpoint = "/api/delete-tip";
          break;
        case "contacts":
          endpoint = "/api/delete-contact";
          break;
        default:
          throw new Error("Delete not supported for this modal type");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Error deleting: ${response.status}`);
      }

      // Refresh data
      await openModal(activeModal);
    } catch (error) {
      console.error("Error deleting:", error);
      setModalError(`Failed to delete. Please try again.`);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchStats]);

  if (userLoading || isLoadingStats) {
    return (
      <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#E54D4D] mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  const adminCards = [
    {
      title: "User Management",
      icon: "fa-users",
      modalType: "users",
      description: "Manage users and roles",
      gradient: "from-[#4D8BFF] to-[#6C63FF]",
      iconColor: "#4D8BFF",
      bgGradient: "from-[#4D8BFF]/10 to-[#6C63FF]/10",
      stat: stats.totalUsers,
      statLabel: "Total Users",
    },
    {
      title: "SOS Alerts",
      icon: "fa-exclamation-triangle",
      modalType: "sos",
      description: "View and manage SOS alerts",
      gradient: "from-[#E54D4D] to-[#FF3366]",
      iconColor: "#E54D4D",
      bgGradient: "from-[#E54D4D]/10 to-[#FF3366]/10",
      stat: stats.activeSosCount,
      statLabel: "Active Alerts",
      urgent: stats.activeSosCount > 0,
    },
    {
      title: "Assistance Requests",
      icon: "fa-hands-helping",
      modalType: "assistance",
      description: "Handle assistance requests",
      gradient: "from-[#FFA500] to-[#FF8C42]",
      iconColor: "#FFA500",
      bgGradient: "from-[#FFA500]/10 to-[#FF8C42]/10",
      stat: stats.pendingAssistanceCount,
      statLabel: "Pending Requests",
      urgent: stats.pendingAssistanceCount > 0,
    },
    {
      title: "Emergency Alerts",
      icon: "fa-bell",
      modalType: "alerts",
      description: "Manage emergency notifications",
      gradient: "from-[#FF4D4D] to-[#FF8C42]",
      iconColor: "#FF4D4D",
      bgGradient: "from-[#FF4D4D]/10 to-[#FF8C42]/10",
    },
    {
      title: "First Aid Guides",
      icon: "fa-book-medical",
      modalType: "guides",
      description: "Edit first aid guides",
      gradient: "from-[#2EC4B6] to-[#3BBA9C]",
      iconColor: "#2EC4B6",
      bgGradient: "from-[#2EC4B6]/10 to-[#3BBA9C]/10",
    },
    {
      title: "Wellbeing Tips",
      icon: "fa-heart",
      modalType: "tips",
      description: "Manage wellbeing content",
      gradient: "from-[#845EC2] to-[#D65DB1]",
      iconColor: "#845EC2",
      bgGradient: "from-[#845EC2]/10 to-[#D65DB1]/10",
    },
    {
      title: "Emergency Contacts",
      icon: "fa-phone-alt",
      modalType: "contacts",
      description: "Manage emergency contacts",
      gradient: "from-[#FF6B6B] to-[#4ECDC4]",
      iconColor: "#FF6B6B",
      bgGradient: "from-[#FF6B6B]/10 to-[#4ECDC4]/10",
    },
  ];

  // Render modal content based on type
  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (modalError) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <p className="text-red-400 mb-4">{modalError}</p>
          <button
            onClick={() => openModal(activeModal)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeModal) {
      case "users":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">User Management</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {user.name || "No Name"}
                      </h4>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.user_type === "student"
                              ? "bg-blue-500/20 text-blue-400"
                              : user.user_type === "teacher"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {user.user_type || "Unknown"}
                        </span>
                        {user.is_admin && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Edit Role
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Emergency Alerts</h3>
              <button
                onClick={() => setEditingItem({})}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Add Alert
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-4 border ${
                    alert.severity === "high"
                      ? "bg-red-500/10 border-red-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-500/10 border-yellow-500"
                      : "bg-blue-500/10 border-blue-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {alert.title}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {alert.message}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            alert.severity === "high"
                              ? "bg-red-500/20 text-red-400"
                              : alert.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {alert.severity} priority
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(alert)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "guides":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">First Aid Guides</h3>
              <button
                onClick={() => setEditingItem({})}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Add Guide
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {guide.title}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {guide.content?.substring(0, 100)}...
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                          {guide.category}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                          {guide.steps?.length || 0} steps
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(guide)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guide.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "tips":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Wellbeing Tips</h3>
              <button
                onClick={() => setEditingItem({})}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Add Tip
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white">{tip.tip}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tip.category === "mental"
                              ? "bg-purple-500/20 text-purple-400"
                              : tip.category === "physical"
                              ? "bg-blue-500/20 text-blue-400"
                              : tip.category === "emotional"
                              ? "bg-pink-500/20 text-pink-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {tip.category}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tip.importance_level === "high"
                              ? "bg-red-500/20 text-red-400"
                              : tip.importance_level === "low"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {tip.importance_level} priority
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tip)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tip.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Emergency Contacts
              </h3>
              <button
                onClick={() => setEditingItem({})}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Add Contact
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {contact.name}
                      </h4>
                      <p className="text-gray-400 text-sm">{contact.role}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-300">
                          <i className="fas fa-phone mr-1"></i>
                          {contact.phone}
                        </span>
                        <span className="text-gray-300">
                          <i className="fas fa-envelope mr-1"></i>
                          {contact.email}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            contact.contact_type === "emergency"
                              ? "bg-red-500/20 text-red-400"
                              : contact.contact_type === "medical"
                              ? "bg-blue-500/20 text-blue-400"
                              : contact.contact_type === "counseling"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {contact.contact_type}
                        </span>
                        {contact.is_available && (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "assistance":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Assistance Requests
              </h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-lg p-4 border ${
                    request.status === "pending"
                      ? "bg-yellow-500/10 border-yellow-500"
                      : request.status === "acknowledged"
                      ? "bg-blue-500/10 border-blue-500"
                      : "bg-green-500/10 border-green-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {request.description}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Location: {request.location}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : request.status === "acknowledged"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {request.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.urgency === "urgent"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {request.urgency}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                "/api/update-request-status",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: request.id,
                                    status: "acknowledged",
                                  }),
                                }
                              );
                              if (response.ok) {
                                await openModal(activeModal);
                              }
                            } catch (error) {
                              console.error("Error updating status:", error);
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {request.status !== "resolved" && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                "/api/update-request-status",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: request.id,
                                    status: "resolved",
                                  }),
                                }
                              );
                              if (response.ok) {
                                await openModal(activeModal);
                              }
                            } catch (error) {
                              console.error("Error updating status:", error);
                            }
                          }}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sos":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">SOS Alerts</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {modalData.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-500/10 border border-red-500 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        Emergency SOS Alert
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Location: {alert.location}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            alert.status === "active"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {alert.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "active" && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                "/api/update-sos-status",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: alert.id,
                                    status: "resolved",
                                  }),
                                }
                              );
                              if (response.ok) {
                                await openModal(activeModal);
                                fetchStats(); // Refresh stats
                              }
                            } catch (error) {
                              console.error(
                                "Error updating SOS status:",
                                error
                              );
                            }
                          }}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-400">
            Select a management option
          </div>
        );
    }
  };

  // Render edit form
  const renderEditForm = () => {
    if (!editingItem) return null;

    const isNew = !editingItem.id;

    switch (activeModal) {
      case "users":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isNew ? "Add User" : "Edit User Role"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  User Type
                </label>
                <select
                  value={formData.user_type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, user_type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin || false}
                  onChange={(e) =>
                    setFormData({ ...formData, is_admin: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="is_admin" className="text-sm text-gray-300">
                  Admin Access
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isNew ? "Add Alert" : "Edit Alert"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alert title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Alert message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Severity
                </label>
                <select
                  value={formData.severity || "low"}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case "tips":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isNew ? "Add Tip" : "Edit Tip"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tip Content
                </label>
                <textarea
                  value={formData.tip || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tip: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter wellbeing tip"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="mental">Mental</option>
                  <option value="physical">Physical</option>
                  <option value="emotional">Emotional</option>
                  <option value="social">Social</option>
                  <option value="environmental">Environmental</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="occupational">Occupational</option>
                  <option value="financial">Financial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.importance_level || "normal"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      importance_level: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isNew ? "Add Contact" : "Edit Contact"}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={formData.role || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact role"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contact Type
                </label>
                <select
                  value={formData.contact_type || "general"}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="emergency">Emergency</option>
                  <option value="medical">Medical</option>
                  <option value="counseling">Counseling</option>
                  <option value="crisis">Crisis</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available !== false}
                  onChange={(e) =>
                    setFormData({ ...formData, is_available: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="is_available" className="text-sm text-gray-300">
                  Available
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gray-900/30 p-6 rounded-xl border border-gray-800">
          <div>
            <h1 className="text-4xl font-inter font-bold bg-gradient-to-r from-[#FF4D4D] via-[#845EC2] to-[#4D8BFF] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-[#FF4D4D] via-[#845EC2] to-[#4D8BFF] rounded-full mt-2 opacity-50" />
            <p className="text-gray-400 mt-2">
              Manage your school well-being services
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <button
                onClick={fetchStats}
                className="ml-2 hover:text-blue-400 transition-colors"
                title="Refresh data"
              >
                <i className="fas fa-sync-alt" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/50 py-2 px-4 rounded-full border border-gray-800">
              <span className="text-gray-400">{user.email}</span>
              <div className="h-4 w-[1px] bg-gray-700" />
              <a
                href="/account/logout"
                className="text-sm bg-gradient-to-r from-[#FF4D4D] to-[#FF8C42] bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                Logout
                <i className="fas fa-sign-out-alt ml-1" />
              </a>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <button
              key={card.title}
              onClick={() => openModal(card.modalType)}
              className={`relative group transform hover:scale-[1.02] transition-all duration-300 text-left ${
                card.urgent ? "animate-pulse" : ""
              }`}
            >
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-xl
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                `}
              />
              <div
                className={`
                  relative bg-gray-900/50 rounded-xl p-6
                  transition-all duration-300 border border-gray-800
                  hover:shadow-lg
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div
                      className={`
                        w-14 h-14 rounded-full bg-gradient-to-br ${card.bgGradient}
                        flex items-center justify-center mb-4
                        group-hover:scale-110 transition-transform duration-300
                      `}
                    >
                      <i
                        className={`fas ${card.icon} text-2xl`}
                        style={{ color: card.iconColor }}
                      />
                    </div>
                    <h3 className="font-inter font-bold text-xl text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{card.description}</p>
                    {card.stat !== undefined && (
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                          {card.stat}
                        </span>
                        <span className="text-sm text-gray-400">
                          {card.statLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="transform group-hover:translate-x-2 transition-transform duration-300"
                    style={{ color: card.iconColor }}
                  >
                    <i className="fas fa-arrow-right text-xl" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Management Modal */}
        {activeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    {
                      adminCards.find((card) => card.modalType === activeModal)
                        ?.title
                    }
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {editingItem ? renderEditForm() : renderModalContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;