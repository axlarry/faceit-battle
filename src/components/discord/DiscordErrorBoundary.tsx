
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DiscordErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a CSP-related error
    const isCSPError = error.message.includes('CSP') || 
                      error.message.includes('Content Security Policy') ||
                      error.message.includes('blocked');
    
    if (isCSPError) {
      console.warn('🔒 CSP-related error caught by boundary:', error.message);
      // Don't show error UI for CSP violations in Discord
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Discord Error Boundary caught an error:', error, errorInfo);
    
    // Handle Discord-specific errors gracefully
    if (error.message.includes('CSP') || error.message.includes('Content Security Policy')) {
      console.log('🔒 CSP error handled - continuing execution');
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          backgroundColor: '#0d1117', 
          color: 'white', 
          padding: '20px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h2>🎮 Discord Activity Error</h2>
          <p>Something went wrong in the Discord Activity.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: '#5865F2',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
