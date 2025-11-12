import { useState } from 'react';
import StatusBadge from '../Common/StatusBadge';
import ProgressBar from '../Common/ProgressBar';
import { truncate, formatDateTime } from '../../utils/helpers';

export default function FeatureCard({ feature, epicName, onEdit, onDelete, onExpand }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
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
                onEdit(feature);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(feature);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div
        className="cursor-pointer"
        onClick={() => onExpand(feature)}
      >
        {epicName && (
          <div className="text-sm text-gray-500 mb-2">
            📊 {epicName}
          </div>
        )}

        <h3 className="text-xl font-semibold text-gray-900 pr-8 mb-3">
          ✨ {feature.title}
        </h3>

        <p className="text-gray-600 mb-3">
          {truncate(feature.desc, 120)}
        </p>

        {feature.uat && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-1">UAT:</p>
            <p className="text-sm text-blue-900">{truncate(feature.uat, 100)}</p>
          </div>
        )}

        {feature.reference_file && (
          <div className="text-sm text-gray-600 mb-3">
            📄 {feature.reference_file}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={feature.status} />
          <span className="text-sm text-gray-500">
            {feature.progress?.total || 0} tasks
          </span>
        </div>

        {feature.progress && <ProgressBar progress={feature.progress} />}

        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          Updated: {formatDateTime(feature.updated_at)}
        </div>
      </div>
    </div>
  );
}
