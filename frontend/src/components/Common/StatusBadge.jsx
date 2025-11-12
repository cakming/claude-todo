import { getStatusClass, getStatusDisplay } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {getStatusDisplay(status)}
    </span>
  );
}
