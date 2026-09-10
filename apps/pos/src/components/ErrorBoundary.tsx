import React from 'react';

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('POS render failure', error, info); }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: 24, fontFamily: 'sans-serif' }}>
        <h1>POS could not display this screen</h1>
        <p>An unexpected error occurred. No sale was submitted by this error.</p>
        <button onClick={() => window.location.reload()}>Reload POS</button>
      </main>
    );
  }
}
