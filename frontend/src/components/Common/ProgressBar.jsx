export default function ProgressBar({ progress }) {
  const { total, completed, percentage } = progress;

  if (total === 0) {
    return (
      <div className="text-sm text-gray-500">
        No items yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {completed} / {total} completed
        </span>
        <span className="font-semibold text-gray-700">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percentage === 100 ? 'bg-green-500' :
            percentage > 0 ? 'bg-blue-500' :
            'bg-gray-300'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
