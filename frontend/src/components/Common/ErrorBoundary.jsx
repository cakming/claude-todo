import { Component } from 'react';
import { reportError } from '../../monitoring';

/**
 * Catches render/runtime errors in the component tree and shows a friendly
 * fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
    reportError(error, { componentStack: info?.componentStack });
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button onClick={this.handleReload} className="btn-primary">
              Reload the app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
