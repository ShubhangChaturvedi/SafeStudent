"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    staff: 0,
    admins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/users";
    }
  }, [user, userLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/list-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);

      // Calculate stats
      const totalUsers = data.users?.length || 0;
      const students =
        data.users?.filter((u) => u.user_type === "student").length || 0;
      const teachers =
        data.users?.filter((u) => u.user_type === "teacher").length || 0;
      const staff =
        data.users?.filter((u) => u.user_type === "staff").length || 0;
      const admins = data.users?.filter((u) => u.is_admin).length || 0;
      const activeUsers =
        data.users?.filter((u) => u.is_active !== false).length || 0;
      const inactiveUsers = totalUsers - activeUsers;

      setStats({
        totalUsers,
        students,
        teachers,
        staff,
        admins,
        activeUsers,
        inactiveUsers,
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      let endpoint = "";
      let body = { userId, ...data };

      switch (action) {
        case "toggleAdmin":
          endpoint = "/api/set-user-admin";
          body = { userId, isAdmin: data.isAdmin };
          break;
        case "updateRole":
          endpoint = "/api/update-user-role";
          body = { userId, role: data.role };
          break;
        case "updateProfile":
          endpoint = "/api/update-user-profile";
          break;
        case "resetPassword":
          // This would typically send a password reset email
          alert("Password reset email would be sent to the user.");
          return;
        default:
          throw new Error("Unknown action");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await fetchUsers(); // Refresh the list
      setShowUserModal(false);
      setIsEditing(false);
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action}. Please try again.`);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      const promises = selectedUsers.map((userId) => {
        switch (bulkAction) {
          case "activate":
            return handleUserAction(userId, "updateProfile", {
              is_active: true,
            });
          case "deactivate":
            return handleUserAction(userId, "updateProfile", {
              is_active: false,
            });
          case "makeAdmin":
            return handleUserAction(userId, "toggleAdmin", { isAdmin: true });
          case "removeAdmin":
            return handleUserAction(userId, "toggleAdmin", { isAdmin: false });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedUsers([]);
      setBulkAction("");
      setShowBulkModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("Error performing bulk action:", err);
      alert("Failed to perform bulk action. Please try again.");
    }
  };

  const exportUsers = () => {
    const csvContent = [
      [
        "Name",
        "Email",
        "User Type",
        "Grade",
        "Section",
        "Admin",
        "Status",
        "Registration Date",
      ].join(","),
      ...filteredUsers.map((user) =>
        [
          user.name || "",
          user.email || "",
          user.user_type || "",
          user.grade || "",
          user.section || "",
          user.is_admin ? "Yes" : "No",
          user.is_active !== false ? "Active" : "Inactive",
          user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading User Management...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || u.user_type === filterType;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active !== false) ||
      (filterStatus === "inactive" && u.is_active === false) ||
      (filterStatus === "admin" && u.is_admin);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getProfileCompletion = (user) => {
    const fields = ["name", "email", "user_type", "grade", "section"];
    const completed = fields.filter((field) => user[field]).length;
    return Math.round((completed / fields.length) * 100);
  };

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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-sm text-gray-400">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportUsers}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <i className="fas fa-download"></i>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.totalUsers}
              </p>
              <p className="text-sm text-gray-400">Total Users</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {stats.students}
              </p>
              <p className="text-sm text-gray-400">Students</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {stats.teachers}
              </p>
              <p className="text-sm text-gray-400">Teachers</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">
                {stats.staff}
              </p>
              <p className="text-sm text-gray-400">Staff</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{stats.admins}</p>
              <p className="text-sm text-gray-400">Admins</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 backdrop-blur-sm rounded-xl p-4 border border-teal-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">
                {stats.activeUsers}
              </p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-sm rounded-xl p-4 border border-gray-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">
                {stats.inactiveUsers}
              </p>
              <p className="text-sm text-gray-400">Inactive</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Types</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="staff">Staff</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {selectedUsers.length} selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Bulk Actions</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="makeAdmin">Make Admin</option>
                  <option value="removeAdmin">Remove Admin</option>
                </select>
                <button
                  onClick={() => setShowBulkModal(true)}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Grade/Section
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Profile
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Registered
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredUsers.map((user) => {
                  const profileCompletion = getProfileCompletion(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(
                                selectedUsers.filter((id) => id !== user.id)
                              );
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name
                                ? user.name.charAt(0).toUpperCase()
                                : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.name || "No Name"}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              user.user_type === "student"
                                ? "bg-green-500/20 text-green-400"
                                : user.user_type === "teacher"
                                ? "bg-purple-500/20 text-purple-400"
                                : user.user_type === "staff"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {user.user_type
                              ? user.user_type.charAt(0).toUpperCase() +
                                user.user_type.slice(1)
                              : "Unknown"}
                          </span>
                          {user.is_admin && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {user.grade && (
                            <p className="text-white">Grade {user.grade}</p>
                          )}
                          {user.section && (
                            <p className="text-gray-400">
                              Section {user.section}
                            </p>
                          )}
                          {!user.grade && !user.section && (
                            <p className="text-gray-500">Not specified</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active !== false
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                profileCompletion >= 80
                                  ? "bg-green-500"
                                  : profileCompletion >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${profileCompletion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {profileCompletion}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                              setIsEditing(false);
                            }}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                              setIsEditing(true);
                            }}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() =>
                              handleUserAction(user.id, "resetPassword")
                            }
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <i className="fas fa-key"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-users text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400 text-lg">No users found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Details/Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isEditing ? "Edit User" : "User Details"}
                  </h2>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const userData = {
                      name: formData.get("name"),
                      user_type: formData.get("user_type"),
                      grade: formData.get("grade"),
                      section: formData.get("section"),
                      is_active: formData.get("is_active") === "on",
                    };
                    handleUserAction(
                      selectedUser.id,
                      "updateProfile",
                      userData
                    );
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={selectedUser.name || ""}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        User Type
                      </label>
                      <select
                        name="user_type"
                        defaultValue={selectedUser.user_type || ""}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Select Type</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Grade
                      </label>
                      <input
                        type="text"
                        name="grade"
                        defaultValue={selectedUser.grade || ""}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        name="section"
                        defaultValue={selectedUser.section || ""}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={selectedUser.is_active !== false}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">Active Account</span>
                    </label>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400">Name</p>
                          <p className="text-white">
                            {selectedUser.name || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="text-white">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">User Type</p>
                          <p className="text-white">
                            {selectedUser.user_type || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Academic Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400">Grade</p>
                          <p className="text-white">
                            {selectedUser.grade || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Section</p>
                          <p className="text-white">
                            {selectedUser.section || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            Registration Date
                          </p>
                          <p className="text-white">
                            {selectedUser.created_at
                              ? new Date(
                                  selectedUser.created_at
                                ).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Account Status
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedUser.is_active !== false
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {selectedUser.is_active !== false
                          ? "Active"
                          : "Inactive"}
                      </span>
                      {selectedUser.is_admin && (
                        <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
                          Administrator
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          getProfileCompletion(selectedUser) >= 80
                            ? "bg-green-500/20 text-green-400"
                            : getProfileCompletion(selectedUser) >= 50
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        Profile {getProfileCompletion(selectedUser)}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit User</span>
                      </button>
                      <button
                        onClick={() =>
                          handleUserAction(selectedUser.id, "resetPassword")
                        }
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <i className="fas fa-key"></i>
                        <span>Reset Password</span>
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleUserAction(selectedUser.id, "toggleAdmin", {
                          isAdmin: !selectedUser.is_admin,
                        })
                      }
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        selectedUser.is_admin
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      <i
                        className={`fas ${
                          selectedUser.is_admin
                            ? "fa-user-minus"
                            : "fa-user-plus"
                        }`}
                      ></i>
                      <span>
                        {selectedUser.is_admin ? "Remove Admin" : "Make Admin"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Bulk Action
              </h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to{" "}
                {bulkAction.replace(/([A-Z])/g, " $1").toLowerCase()}{" "}
                {selectedUsers.length} user(s)?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-sm">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-red-400"></i>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;