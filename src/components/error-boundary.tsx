'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 py-[96px] text-center">
          <div className="mb-[14px] text-[12px] font-semibold tracking-[0.08em] text-danger uppercase">
            Something went wrong
          </div>
          <h1 className="m-0 mb-[14px] text-[30px] leading-[1.18] font-semibold tracking-[-0.02em] text-ink">
            Please refresh the page
          </h1>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-[6px] rounded-[10px] bg-primary px-[18px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
