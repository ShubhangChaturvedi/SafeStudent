"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [stats, setStats] = useState({
    activeSosCount: 0,
    pendingAssistanceCount: 0,
    totalUsers: 0,
    totalAlerts: 0,
    totalGuides: 0,
    totalTips: 0,
    recentActivity: [],
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [recentRequests, setRecentRequests] = useState([]);
  const [systemHealth, setSystemHealth] = useState("healthy");

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin";
    }
  }, [user, loading]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats", {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Redirect to login if unauthorized
          window.location.href = "/account/signin?callbackUrl=/admin";
          return;
        }
        throw new Error(`Error fetching stats: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        if (data.error.includes("Unauthorized")) {
          window.location.href = "/account/signin?callbackUrl=/admin";
          return;
        }
        throw new Error(data.error);
      }

      if (data) {
        setStats({
          activeSosCount: data.activeSosCount || 0,
          pendingAssistanceCount: data.pendingAssistanceCount || 0,
          totalUsers: data.totalUsers || 0,
          totalAlerts: data.totalAlerts || 0,
          totalGuides: data.totalGuides || 0,
          totalTips: data.totalTips || 0,
          recentActivity: data.recentActivity || [],
        });
        setSystemHealth(
          data.activeSosCount > 5
            ? "critical"
            : data.pendingAssistanceCount > 10
            ? "warning"
            : "healthy"
        );
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error.message);
      setSystemHealth("error");
    } finally {
      setIsLoadingStats(false);
      setLastUpdated(new Date());
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const response = await fetch("/api/get-active-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Don't redirect here, just log the error
          console.warn("Unauthorized access to recent requests");
          return;
        }
        throw new Error(`Error fetching requests: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        if (data.error.includes("Unauthorized")) {
          console.warn("Unauthorized access to recent requests");
          return;
        }
        throw new Error(data.error);
      }

      if (response.ok && data.requests) {
        setRecentRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      // Don't set error state for this, it's not critical
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentRequests();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentRequests();
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getHealthColor = () => {
    switch (systemHealth) {
      case "critical":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-orange-500";
      default:
        return "text-green-500";
    }
  };

  const getHealthIcon = () => {
    switch (systemHealth) {
      case "critical":
        return "fa-exclamation-triangle";
      case "warning":
        return "fa-exclamation-circle";
      case "error":
        return "fa-times-circle";
      default:
        return "fa-check-circle";
    }
  };

  const quickActions = [
    {
      title: "Send Emergency Alert",
      icon: "fa-bullhorn",
      color: "from-red-500 to-red-600",
      action: () => (window.location.href = "/admin/alerts"),
      urgent: true,
    },
    {
      title: "Add New Guide",
      icon: "fa-plus-circle",
      color: "from-green-500 to-green-600",
      action: () => (window.location.href = "/admin/guides"),
    },
    {
      title: "Manage Users",
      icon: "fa-users-cog",
      color: "from-blue-500 to-blue-600",
      action: () => (window.location.href = "/admin/users"),
    },
    {
      title: "System Settings",
      icon: "fa-cog",
      color: "from-purple-500 to-purple-600",
      action: () => (window.location.href = "/admin/settings"),
    },
  ];

  const managementCards = [
    {
      title: "SOS Alerts Management",
      icon: "fa-exclamation-triangle",
      link: "/admin/sos",
      description: "Monitor and respond to emergency SOS alerts",
      gradient: "from-red-500 to-red-600",
      count: stats.activeSosCount,
      urgent: stats.activeSosCount > 0,
      status: stats.activeSosCount > 0 ? "Active Alerts" : "All Clear",
    },
    {
      title: "Assistance Requests",
      icon: "fa-hands-helping",
      link: "/admin/assistance",
      description: "Handle student and staff assistance requests",
      gradient: "from-orange-500 to-orange-600",
      count: stats.pendingAssistanceCount,
      urgent: stats.pendingAssistanceCount > 5,
      status:
        stats.pendingAssistanceCount > 0 ? "Pending Requests" : "Up to Date",
    },
    {
      title: "Emergency Alerts",
      icon: "fa-bell",
      link: "/admin/alerts",
      description: "Create and manage emergency notifications",
      gradient: "from-yellow-500 to-yellow-600",
      count: stats.totalAlerts,
      status: "System Ready",
    },
    {
      title: "Emergency Contacts",
      icon: "fa-phone-alt",
      link: "/admin/contacts",
      description: "Maintain emergency contact database",
      gradient: "from-purple-500 to-purple-600",
      status: "Contacts Active",
    },
    {
      title: "First Aid Guides",
      icon: "fa-book-medical",
      link: "/admin/guides",
      description: "Manage medical emergency procedures",
      gradient: "from-teal-500 to-teal-600",
      count: stats.totalGuides,
      status: `${stats.totalGuides} Guides Available`,
    },
    {
      title: "Wellbeing Tips",
      icon: "fa-heart",
      link: "/admin/tips",
      description: "Curate daily wellness content",
      gradient: "from-pink-500 to-pink-600",
      count: stats.totalTips,
      status: `${stats.totalTips} Tips Active`,
    },
    {
      title: "User Management",
      icon: "fa-users",
      link: "/admin/users",
      description: "Manage student and staff accounts",
      gradient: "from-blue-500 to-blue-600",
      count: stats.totalUsers,
      status: `${stats.totalUsers} Users Registered`,
    },
    {
      title: "Assistance Options",
      icon: "fa-list-ul",
      link: "/admin/assistance-options",
      description: "Configure help request categories",
      gradient: "from-indigo-500 to-indigo-600",
      status: "Options Configured",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SafeStudent Admin
                  </h1>
                  <p className="text-sm text-gray-400">Control Center</p>
                </div>
              </div>
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-700/50 ${getHealthColor()}`}
              >
                <i className={`fas ${getHealthIcon()} text-sm`}></i>
                <span className="text-sm font-medium capitalize">
                  {systemHealth}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="font-medium">{user.name || user.email}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-white text-sm"></i>
              </div>
              <a
                href="/account/logout"
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`bg-gradient-to-br ${
              stats.activeSosCount > 0
                ? "from-red-500/20 to-red-600/20 border-red-500/50"
                : "from-gray-800/50 to-gray-700/50 border-gray-600/50"
            } backdrop-blur-sm rounded-xl p-6 border ${
              stats.activeSosCount > 0 ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active SOS</p>
                <p
                  className={`text-3xl font-bold ${
                    stats.activeSosCount > 0 ? "text-red-400" : "text-gray-300"
                  }`}
                >
                  {isLoadingStats ? (
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                  ) : (
                    stats.activeSosCount
                  )}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full ${
                  stats.activeSosCount > 0 ? "bg-red-500/20" : "bg-gray-600/20"
                } flex items-center justify-center`}
              >
                <i
                  className={`fas fa-exclamation-triangle text-xl ${
                    stats.activeSosCount > 0 ? "text-red-400" : "text-gray-400"
                  }`}
                ></i>
              </div>
            </div>
            {stats.activeSosCount > 0 && (
              <div className="mt-4">
                <a
                  href="/admin/sos"
                  className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center"
                >
                  View Details <i className="fas fa-arrow-right ml-2"></i>
                </a>
              </div>
            )}
          </div>

          <div
            className={`bg-gradient-to-br ${
              stats.pendingAssistanceCount > 5
                ? "from-orange-500/20 to-orange-600/20 border-orange-500/50"
                : "from-gray-800/50 to-gray-700/50 border-gray-600/50"
            } backdrop-blur-sm rounded-xl p-6 border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Pending Help
                </p>
                <p
                  className={`text-3xl font-bold ${
                    stats.pendingAssistanceCount > 5
                      ? "text-orange-400"
                      : "text-gray-300"
                  }`}
                >
                  {isLoadingStats ? (
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                  ) : (
                    stats.pendingAssistanceCount
                  )}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full ${
                  stats.pendingAssistanceCount > 5
                    ? "bg-orange-500/20"
                    : "bg-gray-600/20"
                } flex items-center justify-center`}
              >
                <i
                  className={`fas fa-hands-helping text-xl ${
                    stats.pendingAssistanceCount > 5
                      ? "text-orange-400"
                      : "text-gray-400"
                  }`}
                ></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-400">
                  {isLoadingStats ? (
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                  ) : (
                    stats.totalUsers
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <i className="fas fa-users text-xl text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  System Status
                </p>
                <p className={`text-lg font-bold ${getHealthColor()}`}>
                  {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <i
                  className={`fas ${getHealthIcon()} text-xl ${getHealthColor()}`}
                ></i>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <i className="fas fa-bolt text-yellow-500 mr-2"></i>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`bg-gradient-to-r ${
                  action.color
                } hover:scale-105 transform transition-all duration-200 rounded-xl p-4 text-white shadow-lg ${
                  action.urgent ? "animate-pulse" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`fas ${action.icon} text-xl`}></i>
                  <span className="font-medium">{action.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <i className="fas fa-cogs text-blue-500 mr-2"></i>
            System Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {managementCards.map((card, index) => (
              <a
                key={index}
                href={card.link}
                className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300 hover:transform hover:scale-105 ${
                  card.urgent ? "ring-2 ring-red-500/50 animate-pulse" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <i className={`fas ${card.icon} text-white text-xl`}></i>
                  </div>
                  {card.count !== undefined && (
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        card.urgent
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-600/50 text-gray-300"
                      }`}
                    >
                      {card.count}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-white text-lg mb-2 group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {card.description}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      card.urgent ? "text-red-400" : "text-gray-500"
                    }`}
                  >
                    {card.status}
                  </span>
                  <i className="fas fa-arrow-right text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300"></i>
                </div>
              </a>
            ))}
          </div>
        </div>

        {recentRequests.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <i className="fas fa-clock text-green-500 mr-2"></i>
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentRequests.slice(0, 5).map((request, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        request.type === "sos"
                          ? "bg-red-500/20"
                          : "bg-orange-500/20"
                      }`}
                    >
                      <i
                        className={`fas ${
                          request.type === "sos"
                            ? "fa-exclamation-triangle text-red-400"
                            : "fa-hands-helping text-orange-400"
                        } text-sm`}
                      ></i>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {request.type === "sos"
                          ? "SOS Alert"
                          : "Assistance Request"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {request.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        request.status === "pending"
                          ? "text-yellow-400"
                          : request.status === "resolved"
                          ? "text-green-400"
                          : "text-blue-400"
                      }`}
                    >
                      {request.status}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(request.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a
                href="/admin/assistance"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View All Requests <i className="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;