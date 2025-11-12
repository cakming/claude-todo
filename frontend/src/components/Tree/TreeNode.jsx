import { useState } from 'react';
import StatusBadge from '../Common/StatusBadge';
import ProgressBar from '../Common/ProgressBar';
import { getTypeIcon } from '../../utils/helpers';

export default function TreeNode({ item, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasChildren = (item.features && item.features.length > 0) || (item.tasks && item.tasks.length > 0);

  return (
    <div className="tree-node">
      <div
        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 mt-1"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        {/* Icon */}
        <span className="text-2xl">{getTypeIcon(item.type)}</span>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <StatusBadge status={item.status} />
            </div>
            {item.progress && (
              <div className="text-sm text-gray-600">
                {item.progress.completed} / {item.progress.total}
                {item.type === 'epic' ? ' features' : ' tasks'}
              </div>
            )}
          </div>

          {item.desc && (
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          )}

          {item.uat && (
            <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
              UAT: {item.uat}
            </div>
          )}

          {item.reference_file && (
            <div className="mt-1 text-xs text-gray-500">
              📄 {item.reference_file}
            </div>
          )}

          {item.progress && (
            <div className="mt-3 max-w-md">
              <ProgressBar progress={item.progress} />
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-2">
          {item.features?.map(feature => (
            <TreeNode key={feature._id} item={feature} level={level + 1} />
          ))}
          {item.tasks?.map(task => (
            <TreeNode key={task._id} item={task} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
