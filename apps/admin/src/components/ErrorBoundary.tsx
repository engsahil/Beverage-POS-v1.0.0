import React from 'react';

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Admin UI render failure', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: 24, fontFamily: 'sans-serif' }}>
        <h1>Unable to display this page</h1>
        <p>The page encountered an unexpected error. Your data was not changed.</p>
        <button onClick={() => window.location.reload()}>Reload page</button>
      </main>
    );
  }
}
