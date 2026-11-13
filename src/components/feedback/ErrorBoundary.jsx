import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="grid min-h-dvh place-items-center bg-bg p-6 text-center text-ink">
        <div className="max-w-sm space-y-3">
          <h1 className="font-display text-2xl">This screen hit a problem</h1>
          <p className="text-muted">Your data was not changed. Reload the screen and check the record before trying again.</p>
          <button className="h-11 rounded-md bg-accent px-5 font-semibold text-on-accent" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>Reload</button>
        </div>
      </div>
    );
  }
}
