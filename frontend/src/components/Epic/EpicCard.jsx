import { useState } from 'react';
import StatusBadge from '../Common/StatusBadge';
import ProgressBar from '../Common/ProgressBar';
import { truncate, formatDateTime } from '../../utils/helpers';

export default function EpicCard({ epic, onEdit, onDelete, onExpand }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ⋯
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={() => {
                onEdit(epic);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(epic);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="cursor-pointer"
        onClick={() => onExpand(epic)}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 pr-8">
            📊 {epic.title}
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          {truncate(epic.desc, 150)}
        </p>

        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={epic.status} />
          <span className="text-sm text-gray-500">
            {epic.progress?.total || 0} features
          </span>
        </div>

        {epic.progress && <ProgressBar progress={epic.progress} />}

        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Created: {formatDateTime(epic.created_at)}</span>
            <span>Updated: {formatDateTime(epic.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
