import { Component, type ReactNode } from 'react';
import { clearCheckpoint } from '../storage/store';
import { Icon } from './Icon';

interface Props { children: ReactNode }
interface State { failed: boolean }

// The last line of defence: if anything crashes while rendering, show a calm
// way back instead of a blank screen. The saved "resume" point is cleared, as
// it's the most likely cause; completions and the streak are kept.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  // React itself logs the error; we only clean up.
  componentDidCatch(): void {
    clearCheckpoint();
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="screen">
        <h1 className="t-hero">Something went wrong</h1>
        <p className="muted">Your streak is safe. Let's start fresh.</p>
        <button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>
          <Icon name="player-play" />Back to home
        </button>
      </main>
    );
  }
}
