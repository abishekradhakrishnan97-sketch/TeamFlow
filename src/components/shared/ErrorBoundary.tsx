import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TeamFlow UI:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F7F3E9] flex items-center justify-center p-6 text-[#222222]">
          <div className="max-w-md w-full bg-[#FFFDF7] p-8 rounded-2xl border-[0.5px] border-black shadow-soft text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#E99A88]/30 border-[0.5px] border-black flex items-center justify-center mx-auto text-[#CE7864]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-primary">
                Something went wrong
              </h2>
              <p className="text-xs text-secondary mt-1">
                An unexpected application error occurred. You can reload or return to the control centre.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-[#FCF1EF] border-[0.5px] border-black/20 rounded-xl text-left text-[11px] font-mono text-[#CE7864] overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="border-[0.5px] border-black text-xs font-bold"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reload Application
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleGoHome}
                className="bg-[#222222] hover:bg-[#333333] text-white border-[0.5px] border-black text-xs font-bold"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
