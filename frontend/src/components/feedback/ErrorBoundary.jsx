import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Something broke</h1>
          <p className="mt-2 max-w-md text-sm text-content-secondary">
            An unexpected error stopped this page from rendering. Reloading usually fixes it.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg border border-subtle bg-surface p-3 text-left font-mono text-xs text-danger">
              {error.message}
            </pre>
          )}
        </div>
        <Button leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
