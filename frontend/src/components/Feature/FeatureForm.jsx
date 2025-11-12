import { useState, useEffect } from 'react';

export default function FeatureForm({ feature, epics, selectedEpicId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    epic_id: selectedEpicId || '',
    title: '',
    desc: '',
    uat: '',
    status: 'todo',
    reference_file: ''
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        epic_id: feature.epic_id || selectedEpicId || '',
        title: feature.title || '',
        desc: feature.desc || '',
        uat: feature.uat || '',
        status: feature.status || 'todo',
        reference_file: feature.reference_file || ''
      });
    }
  }, [feature, selectedEpicId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Epic *
        </label>
        <select
          value={formData.epic_id}
          onChange={(e) => handleChange('epic_id', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select an epic</option>
          {epics.map(epic => (
            <option key={epic._id} value={epic._id}>
              {epic.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Shopping Cart"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.desc}
          onChange={(e) => handleChange('desc', e.target.value)}
          placeholder="Implement shopping cart functionality..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User Acceptance Testing (UAT)
        </label>
        <textarea
          value={formData.uat}
          onChange={(e) => handleChange('uat', e.target.value)}
          placeholder="Users can add items, view cart, and proceed to checkout..."
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reference File
        </label>
        <input
          type="text"
          value={formData.reference_file}
          onChange={(e) => handleChange('reference_file', e.target.value)}
          placeholder="src/features/cart/Cart.tsx"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {feature ? 'Update Feature' : 'Create Feature'}
        </button>
      </div>
    </form>
  );
}
