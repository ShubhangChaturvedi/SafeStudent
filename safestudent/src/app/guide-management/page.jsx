"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: authLoading } = useUser();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [upload, { loading: uploading }] = useUpload();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    icon_name: "first-aid",
    steps: [{ description: "", image: null }],
  });

  const categories = [
    { value: "general", label: "General" },
    { value: "burns", label: "Burns" },
    { value: "cuts", label: "Cuts & Wounds" },
    { value: "cpr", label: "CPR" },
    { value: "choking", label: "Choking" },
    { value: "fractures", label: "Fractures" },
  ];

  useEffect(() => {
    if (!authLoading && !user?.is_admin) {
      window.location.href = "/account/signin?callbackUrl=/admin/guides";
    }
  }, [user, authLoading]);

  const fetchGuides = useCallback(async () => {
    try {
      const response = await fetch("/api/get-first-aid-guides", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to fetch guides");
      const data = await response.json();
      setGuides(data.guides || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load guides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      fetchGuides();
    }
  }, [fetchGuides, user]);

  const handleImageUpload = async (file, stepIndex) => {
    try {
      const { url, error } = await upload({ file });
      if (error) throw new Error(error);

      const newSteps = [...formData.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], image: url };
      setFormData({ ...formData, steps: newSteps });
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const endpoint = editingGuide ? "/api/update-guide" : "/api/create-guide";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingGuide?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save guide");

      setShowForm(false);
      setEditingGuide(null);
      setFormData({
        title: "",
        description: "",
        category: "general",
        icon_name: "first-aid",
        steps: [{ description: "", image: null }],
      });
      fetchGuides();
    } catch (err) {
      console.error(err);
      setError("Failed to save guide");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this guide?")) return;

    try {
      const response = await fetch("/api/delete-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete guide");
      fetchGuides();
    } catch (err) {
      console.error(err);
      setError("Failed to delete guide");
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      description: guide.description,
      category: guide.category,
      icon_name: guide.icon_name,
      steps: guide.steps || [{ description: "", image: null }],
    });
    setShowForm(true);
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

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || guide.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [guides, searchQuery, selectedCategory]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <a
            href="/admin"
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Admin Portal
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New Guide
            </button>
            <span className="text-gray-400">{user.email}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingGuide ? "Edit Guide" : "New Guide"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGuide(null);
                  setFormData({
                    title: "",
                    description: "",
                    category: "general",
                    icon_name: "first-aid",
                    steps: [{ description: "", image: null }],
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    value={formData.icon_name}
                    onChange={(e) =>
                      setFormData({ ...formData, icon_name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g. bandage, heart, medical-kit"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Steps</h3>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Step
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
                          Step {index + 1}
                        </span>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>

                      <textarea
                        value={step.description}
                        onChange={(e) => {
                          const newSteps = [...formData.steps];
                          newSteps[index] = {
                            ...step,
                            description: e.target.value,
                          };
                          setFormData({ ...formData, steps: newSteps });
                        }}
                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white mb-4"
                        rows="2"
                        placeholder="Step description"
                        required
                      />

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], index);
                            }
                          }}
                          className="hidden"
                          id={`step-image-${index}`}
                        />
                        <label
                          htmlFor={`step-image-${index}`}
                          className="cursor-pointer inline-block"
                        >
                          {step.image ? (
                            <div className="relative">
                              <img
                                src={step.image}
                                alt={`Step ${index + 1}`}
                                className="max-w-xs rounded-lg"
                              />
                              <div className="absolute top-2 right-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const newSteps = [...formData.steps];
                                    newSteps[index] = { ...step, image: null };
                                    setFormData({
                                      ...formData,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                              <i className="fas fa-upload text-gray-400 text-2xl mb-2"></i>
                              <p className="text-gray-400">Upload Image</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : editingGuide ? (
                  "Update Guide"
                ) : (
                  "Create Guide"
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <i
                        className={`fas fa-${guide.icon_name} text-blue-500 text-xl`}
                      ></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">
                        {guide.title}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {guide.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(guide)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(guide.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">{guide.description}</p>
                <div className="mt-4">
                  <span className="text-sm text-gray-400">
                    {guide.steps?.length || 0} steps
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;