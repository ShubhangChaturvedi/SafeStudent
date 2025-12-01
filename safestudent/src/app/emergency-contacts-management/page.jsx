"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showImportModal, setShowImportModal] = useState(false);
  const [draggedContact, setDraggedContact] = useState(null);

  const contactTypes = [
    { value: "emergency", label: "Emergency", color: "red" },
    { value: "medical", label: "Medical", color: "blue" },
    { value: "counseling", label: "Counseling", color: "purple" },
    { value: "crisis", label: "Crisis", color: "yellow" },
    { value: "general", label: "General", color: "gray" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    contact_type: "general",
    is_available: true,
    description: "",
    available_hours: "",
    priority: 1,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/contacts";
    }
  }, [user, userLoading]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setContacts(data.contacts || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedContact
        ? "/api/update-contact"
        : "/api/create-contact";
      const payload = selectedContact
        ? { ...formData, id: selectedContact.id }
        : formData;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save contact");
      }

      await fetchContacts();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving contact:", err);
      setError("Failed to save contact");
    }
  };

  const handleDelete = async (contactId) => {
    try {
      const response = await fetch("/api/delete-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }

      await fetchContacts();
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError("Failed to delete contact");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedContacts.map((id) =>
          fetch("/api/delete-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      );

      await fetchContacts();
      setSelectedContacts([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error("Error bulk deleting contacts:", err);
      setError("Failed to delete selected contacts");
    }
  };

  const handleBulkToggleAvailability = async (available) => {
    try {
      await Promise.all(
        selectedContacts.map((id) => {
          const contact = contacts.find((c) => c.id === id);
          return fetch("/api/update-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...contact, is_available: available }),
          });
        })
      );

      await fetchContacts();
      setSelectedContacts([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error("Error bulk updating availability:", err);
      setError("Failed to update availability");
    }
  };

  const toggleAvailability = async (contact) => {
    try {
      const response = await fetch("/api/update-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          is_available: !contact.is_available,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      await fetchContacts();
    } catch (err) {
      console.error("Error updating availability:", err);
      setError("Failed to update availability");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      contact_type: "general",
      is_available: true,
      description: "",
      available_hours: "",
      priority: 1,
    });
    setSelectedContact(null);
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setFormData(contact);
    setShowEditModal(true);
  };

  const handleDragStart = (e, contact) => {
    setDraggedContact(contact);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetContact) => {
    e.preventDefault();
    if (!draggedContact || draggedContact.id === targetContact.id) return;

    try {
      const draggedPriority = draggedContact.priority;
      const targetPriority = targetContact.priority;

      await Promise.all([
        fetch("/api/update-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draggedContact, priority: targetPriority }),
        }),
        fetch("/api/update-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...targetContact, priority: draggedPriority }),
        }),
      ]);

      await fetchContacts();
    } catch (err) {
      console.error("Error reordering contacts:", err);
      setError("Failed to reorder contacts");
    }

    setDraggedContact(null);
  };

  const exportContacts = () => {
    const csvContent = [
      [
        "Name",
        "Role",
        "Phone",
        "Email",
        "Type",
        "Available",
        "Description",
        "Hours",
      ],
      ...filteredContacts.map((contact) => [
        contact.name,
        contact.role,
        contact.phone,
        contact.email,
        contact.contact_type,
        contact.is_available ? "Yes" : "No",
        contact.description || "",
        contact.available_hours || "",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emergency_contacts.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateContact = (contact) => {
    const errors = [];
    if (!contact.name?.trim()) errors.push("Name is required");
    if (!contact.phone?.trim()) errors.push("Phone is required");
    if (contact.email && !/\S+@\S+\.\S+/.test(contact.email)) {
      errors.push("Invalid email format");
    }
    return errors;
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts
    .filter((contact) => {
      const matchesSearch =
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "all" || contact.contact_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "priority") {
        aVal = parseInt(aVal) || 999;
        bVal = parseInt(bVal) || 999;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Emergency Contacts Management
                </h1>
                <p className="text-sm text-gray-400">
                  Manage emergency contact information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <i className="fas fa-upload mr-2"></i>Import
              </button>
              <button
                onClick={exportContacts}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <i className="fas fa-download mr-2"></i>Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 font-medium"
              >
                <i className="fas fa-plus mr-2"></i>Add Contact
              </button>
            </div>
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
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All Types</option>
                {contactTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="priority-asc">Priority (High to Low)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="contact_type-asc">Type</option>
              </select>
            </div>

            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {selectedContacts.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-cog mr-1"></i>Actions
                </button>
              </div>
            )}
          </div>

          {showBulkActions && selectedContacts.length > 0 && (
            <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkToggleAvailability(true)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-check mr-1"></i>Mark Available
                </button>
                <button
                  onClick={() => handleBulkToggleAvailability(false)}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-pause mr-1"></i>Mark Unavailable
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-phone-alt text-gray-400 text-xl"></i>
            </div>
            <p className="text-gray-400 mb-4">No contacts found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                draggable
                onDragStart={(e) => handleDragStart(e, contact)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, contact)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 cursor-move"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContacts([
                            ...selectedContacts,
                            contact.id,
                          ]);
                        } else {
                          setSelectedContacts(
                            selectedContacts.filter((id) => id !== contact.id)
                          );
                        }
                      }}
                      className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {contact.name}
                          </h3>
                          <p className="text-gray-400">{contact.role}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              contactTypes.find(
                                (t) => t.value === contact.contact_type
                              )?.color === "red"
                                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                : contactTypes.find(
                                    (t) => t.value === contact.contact_type
                                  )?.color === "blue"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : contactTypes.find(
                                    (t) => t.value === contact.contact_type
                                  )?.color === "purple"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                : contactTypes.find(
                                    (t) => t.value === contact.contact_type
                                  )?.color === "yellow"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                            }`}
                          >
                            {contactTypes.find(
                              (t) => t.value === contact.contact_type
                            )?.label || contact.contact_type}
                          </span>

                          <button
                            onClick={() => toggleAvailability(contact)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              contact.is_available
                                ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                            }`}
                          >
                            <i
                              className={`fas ${
                                contact.is_available
                                  ? "fa-check-circle"
                                  : "fa-times-circle"
                              } mr-1`}
                            ></i>
                            {contact.is_available ? "Available" : "Unavailable"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-300">
                            <i className="fas fa-phone w-5 text-gray-400"></i>
                            <a
                              href={`tel:${contact.phone}`}
                              className="hover:text-purple-400 transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>
                          {contact.email && (
                            <div className="flex items-center text-gray-300">
                              <i className="fas fa-envelope w-5 text-gray-400"></i>
                              <a
                                href={`mailto:${contact.email}`}
                                className="hover:text-purple-400 transition-colors"
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}
                        </div>

                        {contact.available_hours && (
                          <div className="flex items-center text-gray-300">
                            <i className="fas fa-clock w-5 text-gray-400"></i>
                            <span>{contact.available_hours}</span>
                          </div>
                        )}
                      </div>

                      {contact.description && (
                        <p className="text-gray-400 text-sm mb-4">
                          {contact.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Priority: {contact.priority || 1}
                          </span>
                          <i className="fas fa-grip-vertical text-gray-500 text-xs"></i>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                            title="Edit Contact"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => {
                              setContactToDelete(contact);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete Contact"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {selectedContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Type
                  </label>
                  <select
                    name="contact_type"
                    value={formData.contact_type}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_type: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {contactTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    name="priority"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Hours
                </label>
                <input
                  type="text"
                  name="available_hours"
                  placeholder="e.g., 24/7, Mon-Fri 9AM-5PM"
                  value={formData.available_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      available_hours: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Brief description of services or when to contact..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData({ ...formData, is_available: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label className="ml-2 text-sm text-gray-300">
                  Currently Available
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 font-medium"
                >
                  {selectedContact ? "Update Contact" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Delete Contact
                  </h3>
                  <p className="text-gray-400 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to delete{" "}
                <strong>{contactToDelete.name}</strong>?
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setContactToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(contactToDelete.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                  Delete Contact
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