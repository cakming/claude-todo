import { useState, useEffect } from 'react';

export default function TaskForm({ task, features, selectedFeatureId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    feature_id: selectedFeatureId || '',
    title: '',
    desc: '',
    uat: '',
    status: 'todo',
    reference_file: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        feature_id: task.feature_id || selectedFeatureId || '',
        title: task.title || '',
        desc: task.desc || '',
        uat: task.uat || '',
        status: task.status || 'todo',
        reference_file: task.reference_file || ''
      });
    }
  }, [task, selectedFeatureId]);

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
          Feature *
        </label>
        <select
          value={formData.feature_id}
          onChange={(e) => handleChange('feature_id', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a feature</option>
          {features.map(feature => (
            <option key={feature._id} value={feature._id}>
              {feature.epicName} / {feature.title}
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
          placeholder="Add item to cart API"
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
          placeholder="Implement POST endpoint for adding items..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Definition of Done (UAT)
        </label>
        <textarea
          value={formData.uat}
          onChange={(e) => handleChange('uat', e.target.value)}
          placeholder="API accepts product ID and quantity, returns updated cart..."
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
          placeholder="src/api/cart.ts"
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
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
