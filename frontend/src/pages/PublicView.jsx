import { useState, useEffect } from 'react';
import { publicApi } from '../services/api';
import { renderMarkdown } from '../utils/markdown';
import StatusBadge from '../components/Common/StatusBadge';
import Loading from '../components/Common/Loading';

// Standalone, unauthenticated read-only view for a shared link (/s/:token).
// Rendered outside the main app shell — no auth, no sockets, no mutation.
export default function PublicView({ token }) {
  const [state, setState] = useState({ loading: true, error: null, payload: null });

  useEffect(() => {
    let active = true;
    publicApi
      .get(token)
      .then((res) => active && setState({ loading: false, error: null, payload: res }))
      .catch((e) => active && setState({ loading: false, error: e.message || 'Not found', payload: null }));
    return () => {
      active = false;
    };
  }, [token]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Loading shared content..." />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link unavailable</h1>
          <p className="text-gray-600">This share link is invalid or has been revoked.</p>
        </div>
      </div>
    );
  }

  const { scope, project, data } = state.payload;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🎯 {project}</h1>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Read-only · shared</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {scope === 'page' ? (
          <article className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{data.title}</h2>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(data.body) }} />
          </article>
        ) : (
          <PublicTree epics={data} />
        )}
      </main>
    </div>
  );
}

function PublicTree({ epics }) {
  if (!epics || epics.length === 0) {
    return <p className="text-gray-500">This project has no epics yet.</p>;
  }
  return (
    <div className="space-y-4">
      {epics.map((epic) => (
        <div key={epic._id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">📊 {epic.title}</h3>
            <StatusBadge status={epic.status} />
          </div>
          {epic.desc && <p className="text-sm text-gray-600 mt-1">{epic.desc}</p>}

          <div className="mt-3 space-y-3 pl-4">
            {epic.features.map((feature) => (
              <div key={feature._id} className="border-l-2 border-gray-100 pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">✨ {feature.title}</h4>
                  <StatusBadge status={feature.status} />
                </div>
                <ul className="mt-2 space-y-1">
                  {feature.tasks.map((task) => (
                    <li key={task._id} className="flex items-center justify-between text-sm text-gray-700">
                      <span>✅ {task.title}</span>
                      <StatusBadge status={task.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
