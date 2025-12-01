"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [assistanceOptions, setAssistanceOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    description: "",
    category: "Student Assistance",
    urgency: "normal",
    is_active: true,
    sort_order: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [sortBy, setSortBy] = useState("sort_order");

  const categories = [
    "Student Assistance",
    "Teacher Assistance",
    "Student/Teacher Assistance",
    "Medical Emergency",
    "Security Issue",
    "Technical Support",
    "Mental Health",
    "Academic Support",
  ];

  const urgencyLevels = [
    { value: "low", label: "Low Priority", color: "text-green-400" },
    { value: "normal", label: "Normal", color: "text-blue-400" },
    { value: "high", label: "High Priority", color: "text-yellow-400" },
    { value: "urgent", label: "Urgent", color: "text-red-400" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      window.location.href =
        "/account/signin?callbackUrl=/admin/assistance-options";
    }
  }, [user, loading]);

  const fetchAssistanceOptions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/list-assistance-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAssistanceOptions(data.options || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching assistance options:", err);
      setError("Failed to load assistance options");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/create-assistance-option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await fetchAssistanceOptions();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Error creating assistance option:", err);
      setError("Failed to create assistance option");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/update-assistance-option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingOption.id, ...formData }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await fetchAssistanceOptions();
      setShowEditModal(false);
      setEditingOption(null);
      resetForm();
    } catch (err) {
      console.error("Error updating assistance option:", err);
      setError("Failed to update assistance option");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch("/api/delete-assistance-option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await fetchAssistanceOptions();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting assistance option:", err);
      setError("Failed to delete assistance option");
    }
  };

  const resetForm = () => {
    setFormData({
      label: "",
      description: "",
      category: "Student Assistance",
      urgency: "normal",
      is_active: true,
      sort_order: 0,
    });
  };

  const openEditModal = (option) => {
    setEditingOption(option);
    setFormData({
      label: option.label,
      description: option.description,
      category: option.category,
      urgency: option.urgency,
      is_active: option.is_active,
      sort_order: option.sort_order || 0,
    });
    setShowEditModal(true);
  };

  const getFilteredAndSortedOptions = () => {
    let filtered = assistanceOptions;

    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (option) => option.category === filterCategory
      );
    }

    if (filterUrgency !== "all") {
      filtered = filtered.filter((option) => option.urgency === filterUrgency);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "sort_order":
          return (a.sort_order || 0) - (b.sort_order || 0);
        case "label":
          return a.label.localeCompare(b.label);
        case "category":
          return a.category.localeCompare(b.category);
        case "urgency":
          const urgencyOrder = { low: 0, normal: 1, high: 2, urgent: 3 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        default:
          return 0;
      }
    });
  };

  const getUrgencyColor = (urgency) => {
    const level = urgencyLevels.find((l) => l.value === urgency);
    return level ? level.color : "text-gray-400";
  };

  const getUrgencyLabel = (urgency) => {
    const level = urgencyLevels.find((l) => l.value === urgency);
    return level ? level.label : urgency;
  };

  useEffect(() => {
    fetchAssistanceOptions();
  }, []);

  if (loading) {
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

  const filteredOptions = getFilteredAndSortedOptions();

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Assistance Options Management
                </h1>
                <p className="text-sm text-gray-400">
                  Configure help request categories and options
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Option</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">
            Filters & Sorting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Urgency
              </label>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgency Levels</option>
                {urgencyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sort_order">Sort Order</option>
                <option value="label">Label</option>
                <option value="category">Category</option>
                <option value="urgency">Urgency</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assistance options...</p>
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-list-ul text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Options Found
            </h3>
            <p className="text-gray-400 mb-4">
              {assistanceOptions.length === 0
                ? "No assistance options have been created yet."
                : "No options match your current filters."}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Create First Option
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:border-gray-500/50 ${
                  !option.is_active
                    ? "border-gray-700/30 opacity-60"
                    : "border-gray-700/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {option.label}
                      </h3>
                      {!option.is_active && (
                        <span className="px-2 py-1 bg-gray-600/50 text-gray-400 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-4">{option.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-tag text-blue-400"></i>
                        <span className="text-gray-300">Category:</span>
                        <span className="text-blue-400">{option.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-exclamation-circle text-yellow-400"></i>
                        <span className="text-gray-300">Urgency:</span>
                        <span className={getUrgencyColor(option.urgency)}>
                          {getUrgencyLabel(option.urgency)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-sort-numeric-up text-purple-400"></i>
                        <span className="text-gray-300">Order:</span>
                        <span className="text-purple-400">
                          {option.sort_order || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(option)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Edit Option"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(option)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Delete Option"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {showCreateModal
                  ? "Create New Assistance Option"
                  : "Edit Assistance Option"}
              </h2>
            </div>

            <form
              onSubmit={showCreateModal ? handleCreate : handleEdit}
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Label *
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Academic Support Request"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Describe what this assistance option is for..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={(e) =>
                      setFormData({ ...formData, urgency: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-400">
                    Active (visible to users)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingOption(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  {showCreateModal ? "Create Option" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Assistance Option
                </h3>
              </div>

              <p className="text-gray-400 mb-6">
                Are you sure you want to delete "{deleteConfirm.label}"? This
                action cannot be undone.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Delete
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