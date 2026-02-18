import { Component } from 'react';
import { GameScreen } from './components/GameScreen.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 20 }}>
          <h2>Game crashed!</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center overflow-hidden">
      <ErrorBoundary>
        <GameScreen />
      </ErrorBoundary>
    </div>
  );
}
