"use client";
import React from "react";

function MainComponent() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterImportance, setFilterImportance] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user, loading: authLoading } = useUser();

  const [formData, setFormData] = useState({
    tip: "",
    category: "mental",
    importance_level: "normal",
    is_featured: false,
  });

  const categories = [
    "mental",
    "physical",
    "emotional",
    "social",
    "environmental",
    "spiritual",
    "occupational",
  ];

  const importanceLevels = ["low", "normal", "high"];

  const fetchTips = useCallback(async () => {
    try {
      const response = await fetch("/api/list-tips", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tips");
      }
      const data = await response.json();
      setTips(data.tips || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tips:", err);
      setError("Failed to load tips");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/create-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingTip?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tip");
      }

      setFormData({
        tip: "",
        category: "mental",
        importance_level: "normal",
        is_featured: false,
      });
      setShowForm(false);
      setEditingTip(null);
      fetchTips();
    } catch (err) {
      console.error("Error saving tip:", err);
      setError("Failed to save tip");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tip?")) {
      return;
    }

    try {
      const response = await fetch("/api/delete-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete tip");
      }

      fetchTips();
    } catch (err) {
      console.error("Error deleting tip:", err);
      setError("Failed to delete tip");
    }
  };

  const handleEdit = (tip) => {
    setEditingTip(tip);
    setFormData({
      tip: tip.tip,
      category: tip.category,
      importance_level: tip.importance_level,
      is_featured: tip.is_featured,
    });
    setShowForm(true);
  };

  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      const matchesCategory =
        !filterCategory || tip.category === filterCategory;
      const matchesImportance =
        !filterImportance || tip.importance_level === filterImportance;
      const matchesSearch =
        !searchQuery ||
        tip.tip.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesImportance && matchesSearch;
    });
  }, [tips, filterCategory, filterImportance, searchQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/tips";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchTips();
    }
  }, [fetchTips, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <a
            href="/admin"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
          >
            <i className="fas fa-arrow-left mr-2" />
            Back to Admin Portal
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <i className="fas fa-plus mr-2" />
              Create New Tip
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-inter font-bold text-gray-900 dark:text-white">
                {editingTip ? "Edit Tip" : "New Tip"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTip(null);
                  setFormData({
                    tip: "",
                    category: "mental",
                    importance_level: "normal",
                    is_featured: false,
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tip Content
                  </label>
                  <textarea
                    name="tip"
                    value={formData.tip}
                    onChange={(e) =>
                      setFormData({ ...formData, tip: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows="4"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Importance Level
                    </label>
                    <select
                      name="importance_level"
                      value={formData.importance_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          importance_level: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {importanceLevels.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_featured: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Featured Tip
                      </span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTip ? "Update Tip" : "Create Tip"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Importance Levels</option>
              {importanceLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tip Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Importance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      <i className="fas fa-spinner fa-spin mr-2" />
                      Loading tips...
                    </td>
                  </tr>
                ) : filteredTips.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No tips found
                    </td>
                  </tr>
                ) : (
                  filteredTips.map((tip) => (
                    <tr
                      key={tip.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {tip.tip}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tip.category === "mental"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                              : tip.category === "physical"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                              : tip.category === "emotional"
                              ? "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300"
                              : tip.category === "social"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                          }`}
                        >
                          {tip.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tip.importance_level === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              : tip.importance_level === "normal"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          }`}
                        >
                          {tip.importance_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tip.is_featured ? (
                          <i className="fas fa-star text-yellow-500" />
                        ) : (
                          <i className="far fa-star text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(tip)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          onClick={() => handleDelete(tip.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;