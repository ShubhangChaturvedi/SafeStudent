"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState(null);
  const [upload, { loading: uploading }] = useUpload();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    tags: "",
    description: "",
    steps: [{ description: "", image: null }],
    icon_name: "",
    status: "active",
  });

  const categories = [
    "CPR",
    "Burns",
    "Cuts",
    "Choking",
    "Fractures",
    "Allergic Reactions",
    "Heart Attack",
    "Stroke",
    "Poisoning",
    "Shock",
    "Bleeding",
    "Other",
  ];

  const iconOptions = [
    { name: "heart", label: "Heart" },
    { name: "first-aid", label: "First Aid" },
    { name: "fire", label: "Fire/Burns" },
    { name: "cut", label: "Cuts" },
    { name: "bone", label: "Fractures" },
    { name: "lungs", label: "Breathing" },
    { name: "exclamation-triangle", label: "Warning" },
    { name: "plus-circle", label: "Medical" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/guides";
    }
  }, [user, loading]);

  const fetchGuides = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/get-first-aid-guides", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setGuides(data.guides || []);
      setFilteredGuides(data.guides || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching guides:", err);
      setError("Failed to load guides");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    let filtered = guides;

    if (searchTerm) {
      filtered = filtered.filter(
        (guide) =>
          guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          guide.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (guide) =>
          guide.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((guide) =>
        guide.tags?.toLowerCase().includes(selectedTag.toLowerCase())
      );
    }

    setFilteredGuides(filtered);
  }, [guides, searchTerm, selectedCategory, selectedTag]);

  const handleCreateGuide = async () => {
    try {
      const response = await fetch("/api/create-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          tags: formData.tags,
          description: formData.description,
          steps: formData.steps,
          icon_name: formData.icon_name,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create guide");
      }

      setShowCreateModal(false);
      resetForm();
      fetchGuides();
      alert("Guide created successfully!");
    } catch (err) {
      console.error("Error creating guide:", err);
      alert("Failed to create guide: " + err.message);
    }
  };

  const handleEditGuide = async () => {
    try {
      const response = await fetch("/api/update-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGuide.id,
          title: formData.title,
          category: formData.category,
          tags: formData.tags,
          description: formData.description,
          steps: formData.steps,
          icon_name: formData.icon_name,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to update guide");
      }

      setShowEditModal(false);
      setSelectedGuide(null);
      resetForm();
      fetchGuides();
      alert("Guide updated successfully!");
    } catch (err) {
      console.error("Error updating guide:", err);
      alert("Failed to update guide: " + err.message);
    }
  };

  const handleDeleteGuide = async (guideId) => {
    try {
      const response = await fetch("/api/delete-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guideId }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete guide");
      }

      fetchGuides();
      alert("Guide deleted successfully!");
    } catch (err) {
      console.error("Error deleting guide:", err);
      alert("Failed to delete guide: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGuides.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedGuides.length} guides?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(selectedGuides.map((id) => handleDeleteGuide(id)));
      setSelectedGuides([]);
    } catch (err) {
      console.error("Error in bulk delete:", err);
    }
  };

  const handleImageUpload = async (stepIndex, file) => {
    try {
      const { url, error } = await upload({ file });

      if (error) {
        throw new Error(error);
      }

      const newSteps = [...formData.steps];
      newSteps[stepIndex].image = url;
      setFormData({ ...formData, steps: newSteps });
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image: " + err.message);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { description: "", image: null }],
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index, direction) => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      tags: "",
      description: "",
      steps: [{ description: "", image: null }],
      icon_name: "",
      status: "active",
    });
  };

  const openEditModal = (guide) => {
    setSelectedGuide(guide);
    setFormData({
      title: guide.title || "",
      category: guide.category || "",
      tags: guide.tags || "",
      description: guide.description || "",
      steps: guide.steps || [{ description: "", image: null }],
      icon_name: guide.icon_name || "",
      status: guide.status || "active",
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (guide) => {
    setSelectedGuide(guide);
    setShowPreviewModal(true);
  };

  const confirmDelete = (guide) => {
    setGuideToDelete(guide);
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (guideToDelete) {
      handleDeleteGuide(guideToDelete.id);
      setShowDeleteConfirm(false);
      setGuideToDelete(null);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="text-gray-400 hover:text-white">
                <i className="fas fa-arrow-left"></i>
              </a>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  First Aid Guides Management
                </h1>
                <p className="text-sm text-gray-400">
                  Manage medical emergency procedures
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Create Guide</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search
              </label>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tag
              </label>
              <input
                type="text"
                placeholder="Filter by tag..."
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex items-end">
              {selectedGuides.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <i className="fas fa-trash"></i>
                  <span>Delete Selected ({selectedGuides.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Guides List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading guides...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchGuides}
              className="mt-4 text-red-400 hover:text-red-300 underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-gray-700/50">
            <i className="fas fa-book-medical text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-gray-300 mb-2">
              No Guides Found
            </h3>
            <p className="text-gray-400 mb-6">
              {guides.length === 0
                ? "Get started by creating your first guide."
                : "No guides match your current filters."}
            </p>
            {guides.length === 0 && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Create First Guide
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedGuides.length === filteredGuides.length &&
                          filteredGuides.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuides(filteredGuides.map((g) => g.id));
                          } else {
                            setSelectedGuides([]);
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Guide
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Steps
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredGuides.map((guide) => (
                    <tr
                      key={guide.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedGuides.includes(guide.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGuides([...selectedGuides, guide.id]);
                            } else {
                              setSelectedGuides(
                                selectedGuides.filter((id) => id !== guide.id)
                              );
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {guide.icon_name ? (
                              <i
                                className={`fas fa-${guide.icon_name} text-blue-400 text-xl`}
                              ></i>
                            ) : (
                              <i className="fas fa-first-aid text-green-400 text-xl"></i>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {guide.title}
                            </div>
                            {guide.description && (
                              <div className="text-gray-400 text-sm truncate max-w-xs">
                                {guide.description}
                              </div>
                            )}
                            {guide.tags && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {guide.tags.split(",").map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded-full"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {guide.category && (
                          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/50">
                            {guide.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">
                          {guide.steps ? guide.steps.length : 0} steps
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-sm rounded-full ${
                            guide.status === "active"
                              ? "bg-green-500/20 text-green-300 border border-green-500/50"
                              : "bg-gray-500/20 text-gray-300 border border-gray-500/50"
                          }`}
                        >
                          {guide.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {guide.created_at
                          ? new Date(guide.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openPreviewModal(guide)}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                            title="Preview"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={() => openEditModal(guide)}
                            className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-yellow-500/10 transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => confirmDelete(guide)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {showCreateModal ? "Create New Guide" : "Edit Guide"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedGuide(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter guide title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="emergency, urgent, basic (comma separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon_name}
                      onChange={(e) =>
                        setFormData({ ...formData, icon_name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select Icon</option>
                      {iconOptions.map((icon) => (
                        <option key={icon.name} value={icon.name}>
                          {icon.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Brief description of the guide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-400">
                      Steps *
                    </label>
                    <button
                      onClick={addStep}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
                    >
                      <i className="fas fa-plus"></i>
                      <span>Add Step</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-white font-medium">
                            Step {index + 1}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {index > 0 && (
                              <button
                                onClick={() => moveStep(index, "up")}
                                className="text-gray-400 hover:text-white p-1"
                                title="Move Up"
                              >
                                <i className="fas fa-arrow-up"></i>
                              </button>
                            )}
                            {index < formData.steps.length - 1 && (
                              <button
                                onClick={() => moveStep(index, "down")}
                                className="text-gray-400 hover:text-white p-1"
                                title="Move Down"
                              >
                                <i className="fas fa-arrow-down"></i>
                              </button>
                            )}
                            {formData.steps.length > 1 && (
                              <button
                                onClick={() => removeStep(index)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Remove Step"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            value={step.description}
                            onChange={(e) => {
                              const newSteps = [...formData.steps];
                              newSteps[index].description = e.target.value;
                              setFormData({ ...formData, steps: newSteps });
                            }}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Describe this step in detail..."
                            required
                          />

                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Step Image (optional)
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImageUpload(index, e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                                id={`step-image-${index}`}
                              />
                              <label
                                htmlFor={`step-image-${index}`}
                                className="bg-gray-600/50 hover:bg-gray-600/70 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center space-x-2"
                              >
                                <i className="fas fa-upload"></i>
                                <span>Upload Image</span>
                              </label>
                              {uploading && (
                                <div className="text-blue-400 text-sm">
                                  <i className="fas fa-spinner fa-spin mr-1"></i>
                                  Uploading...
                                </div>
                              )}
                            </div>
                            {step.image && (
                              <div className="mt-2">
                                <img
                                  src={step.image}
                                  alt={`Step ${index + 1}`}
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                                />
                                <button
                                  onClick={() => {
                                    const newSteps = [...formData.steps];
                                    newSteps[index].image = null;
                                    setFormData({
                                      ...formData,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="mt-1 text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove Image
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedGuide(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreateGuide : handleEditGuide}
                disabled={
                  !formData.title ||
                  !formData.category ||
                  formData.steps.some((step) => !step.description)
                }
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200"
              >
                {showCreateModal ? "Create Guide" : "Update Guide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {selectedGuide.icon_name && (
                    <i
                      className={`fas fa-${selectedGuide.icon_name} text-blue-400 text-2xl`}
                    ></i>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedGuide.title}
                    </h2>
                    {selectedGuide.category && (
                      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/50 mt-1">
                        {selectedGuide.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedGuide(null);
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {selectedGuide.description && (
                <div className="mb-6">
                  <p className="text-gray-300">{selectedGuide.description}</p>
                </div>
              )}

              {selectedGuide.steps && selectedGuide.steps.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Steps:</h3>
                  {selectedGuide.steps.map((step, index) => (
                    <div
                      key={index}
                      className="border border-gray-700 rounded-lg p-4 bg-gray-700/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-200">{step.description}</p>
                          {step.image && (
                            <img
                              src={step.image}
                              alt={`Step ${index + 1}`}
                              className="mt-3 rounded-lg w-full max-w-md object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGuide.tags && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Tags:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGuide.tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-gray-600/50 text-gray-300 text-sm rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && guideToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Guide</h3>
                  <p className="text-gray-400 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "
                <strong>{guideToDelete.title}</strong>"?
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setGuideToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Delete Guide
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