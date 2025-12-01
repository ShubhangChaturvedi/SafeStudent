"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterImportance, setFilterImportance] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");
  const [selectedTips, setSelectedTips] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [formData, setFormData] = useState({
    tip: "",
    category: "mental",
    importance_level: "normal",
    is_featured: false,
    is_active: true,
    scheduled_date: "",
    tags: "",
  });

  const categories = [
    { value: "mental", label: "Mental Wellness", color: "purple" },
    { value: "physical", label: "Physical Wellness", color: "blue" },
    { value: "emotional", label: "Emotional Wellness", color: "pink" },
    { value: "social", label: "Social Wellness", color: "green" },
    { value: "environmental", label: "Environmental Wellness", color: "teal" },
    { value: "spiritual", label: "Spiritual Wellness", color: "indigo" },
    { value: "occupational", label: "Occupational Wellness", color: "orange" },
    { value: "financial", label: "Financial Wellness", color: "yellow" },
  ];

  const importanceLevels = [
    { value: "high", label: "High Priority", color: "red" },
    { value: "normal", label: "Normal Priority", color: "gray" },
    { value: "low", label: "Low Priority", color: "blue" },
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/tips";
    }
  }, [user, userLoading]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/list-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setTips(data.tips || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tips:", err);
      setError("Failed to load tips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/create-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tip");
      }

      setShowCreateModal(false);
      setFormData({
        tip: "",
        category: "mental",
        importance_level: "normal",
        is_featured: false,
        is_active: true,
        scheduled_date: "",
        tags: "",
      });
      fetchTips();
    } catch (err) {
      console.error("Error creating tip:", err);
      setError("Failed to create tip. Please try again.");
    }
  };

  const handleEditTip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/update-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTip.id,
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tip");
      }

      setShowEditModal(false);
      setSelectedTip(null);
      fetchTips();
    } catch (err) {
      console.error("Error updating tip:", err);
      setError("Failed to update tip. Please try again.");
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!confirm("Are you sure you want to delete this tip?")) return;

    try {
      const response = await fetch("/api/delete-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tipId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete tip");
      }

      fetchTips();
    } catch (err) {
      console.error("Error deleting tip:", err);
      setError("Failed to delete tip. Please try again.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedTips.length === 0) return;

    try {
      const promises = selectedTips.map((tipId) => {
        if (action === "delete") {
          return fetch("/api/delete-tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tipId }),
          });
        } else if (action === "feature") {
          return fetch("/api/update-tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tipId, is_featured: true }),
          });
        } else if (action === "unfeature") {
          return fetch("/api/update-tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tipId, is_featured: false }),
          });
        }
      });

      await Promise.all(promises);
      setSelectedTips([]);
      setShowBulkActions(false);
      fetchTips();
    } catch (err) {
      console.error("Error performing bulk action:", err);
      setError("Failed to perform bulk action. Please try again.");
    }
  };

  const openEditModal = (tip) => {
    setSelectedTip(tip);
    setFormData({
      tip: tip.tip,
      category: tip.category,
      importance_level: tip.importance_level,
      is_featured: tip.is_featured,
      is_active: tip.is_active,
      scheduled_date: tip.scheduled_date || "",
      tags: tip.tags ? tip.tags.join(", ") : "",
    });
    setShowEditModal(true);
  };

  const filteredTips = tips
    .filter((tip) => {
      const matchesSearch = tip.tip
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || tip.category === filterCategory;
      const matchesImportance =
        filterImportance === "all" || tip.importance_level === filterImportance;
      const matchesFeatured =
        filterFeatured === "all" ||
        (filterFeatured === "featured" && tip.is_featured) ||
        (filterFeatured === "not-featured" && !tip.is_featured);

      return (
        matchesSearch && matchesCategory && matchesImportance && matchesFeatured
      );
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getCategoryColor = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.color : "gray";
  };

  const getImportanceColor = (importance) => {
    const imp = importanceLevels.find((i) => i.value === importance);
    return imp ? imp.color : "gray";
  };

  useEffect(() => {
    fetchTips();
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Wellbeing Tips Management
                </h1>
                <p className="text-sm text-gray-400">
                  Manage daily wellness content
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Create Tip</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Tips
              </label>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tips..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Importance
              </label>
              <select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="all">All Levels</option>
                {importanceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Featured
              </label>
              <select
                value={filterFeatured}
                onChange={(e) => setFilterFeatured(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="all">All Tips</option>
                <option value="featured">Featured Only</option>
                <option value="not-featured">Not Featured</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  <option value="created_at">Date Created</option>
                  <option value="category">Category</option>
                  <option value="importance_level">Importance</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/50 transition-colors"
                >
                  <i
                    className={`fas fa-sort-${
                      sortOrder === "asc" ? "up" : "down"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTips.length > 0 && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-300">
                {selectedTips.length} tip{selectedTips.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction("feature")}
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors"
                >
                  <i className="fas fa-star mr-1"></i>
                  Feature
                </button>
                <button
                  onClick={() => handleBulkAction("unfeature")}
                  className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded border border-gray-500/50 hover:bg-gray-500/30 transition-colors"
                >
                  <i className="far fa-star mr-1"></i>
                  Unfeature
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/50 hover:bg-red-500/30 transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </button>
                <button
                  onClick={() => setSelectedTips([])}
                  className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded border border-gray-500/50 hover:bg-gray-500/30 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tips...</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lightbulb text-2xl text-gray-400"></i>
            </div>
            <p className="text-gray-400 mb-4">No tips found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Create Your First Tip
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTips.includes(tip.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTips([...selectedTips, tip.id]);
                        } else {
                          setSelectedTips(
                            selectedTips.filter((id) => id !== tip.id)
                          );
                        }
                      }}
                      className="mt-1 w-4 h-4 text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium bg-${getCategoryColor(
                            tip.category
                          )}-500/20 text-${getCategoryColor(
                            tip.category
                          )}-300 border border-${getCategoryColor(
                            tip.category
                          )}-500/50`}
                        >
                          {categories.find((c) => c.value === tip.category)
                            ?.label || tip.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium bg-${getImportanceColor(
                            tip.importance_level
                          )}-500/20 text-${getImportanceColor(
                            tip.importance_level
                          )}-300 border border-${getImportanceColor(
                            tip.importance_level
                          )}-500/50`}
                        >
                          {importanceLevels.find(
                            (i) => i.value === tip.importance_level
                          )?.label || tip.importance_level}
                        </span>
                        {tip.is_featured && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                            <i className="fas fa-star mr-1"></i>
                            Featured
                          </span>
                        )}
                        {!tip.is_active && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/50">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-white text-lg mb-3 leading-relaxed">
                        {tip.tip}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {new Date(tip.created_at).toLocaleDateString()}
                        </span>
                        {tip.scheduled_date && (
                          <span>
                            <i className="fas fa-clock mr-1"></i>
                            Scheduled:{" "}
                            {new Date(tip.scheduled_date).toLocaleDateString()}
                          </span>
                        )}
                        {tip.tags && tip.tags.length > 0 && (
                          <span>
                            <i className="fas fa-tags mr-1"></i>
                            {tip.tags.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(tip)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                      title="Edit tip"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteTip(tip.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                      title="Delete tip"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{tips.length}</div>
              <div className="text-sm text-gray-400">Total Tips</div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {tips.filter((t) => t.is_featured).length}
              </div>
              <div className="text-sm text-gray-400">Featured</div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {tips.filter((t) => t.importance_level === "high").length}
              </div>
              <div className="text-sm text-gray-400">High Priority</div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {tips.filter((t) => t.is_active).length}
              </div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Create New Tip</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateTip} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tip Content
                </label>
                <textarea
                  value={formData.tip}
                  onChange={(e) =>
                    setFormData({ ...formData, tip: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Enter your wellbeing tip..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Importance Level
                  </label>
                  <select
                    value={formData.importance_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        importance_level: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  >
                    {importanceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="stress, mindfulness, exercise..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scheduled Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_featured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-gray-300">Featured Tip</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-gray-300">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Create Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Tip</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handleEditTip} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tip Content
                </label>
                <textarea
                  value={formData.tip}
                  onChange={(e) =>
                    setFormData({ ...formData, tip: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Enter your wellbeing tip..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Importance Level
                  </label>
                  <select
                    value={formData.importance_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        importance_level: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  >
                    {importanceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="stress, mindfulness, exercise..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scheduled Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_featured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-gray-300">Featured Tip</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-gray-300">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Update Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;