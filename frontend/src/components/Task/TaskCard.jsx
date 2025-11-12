import { useState } from 'react';
import StatusBadge from '../Common/StatusBadge';
import { truncate } from '../../utils/helpers';

export default function TaskCard({ task, featureName, epicName, onEdit, onDelete, onStatusChange }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="card mb-3 hover:shadow-md transition-shadow relative">
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-gray-600"
        >
          ⋯
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={() => {
                onEdit(task);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(task);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="pr-6">
        <div className="text-xs text-gray-500 mb-2">
          📊 {epicName} / ✨ {featureName}
        </div>

        <h4 className="font-semibold text-gray-900 mb-2">
          {task.title}
        </h4>

        {task.desc && (
          <p className="text-sm text-gray-600 mb-2">
            {truncate(task.desc, 80)}
          </p>
        )}

        {task.uat && (
          <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-900">
            {truncate(task.uat, 60)}
          </div>
        )}

        {task.reference_file && (
          <div className="text-xs text-gray-600 mb-2">
            📄 {task.reference_file}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <StatusBadge status={task.status} />
          {onStatusChange && (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
