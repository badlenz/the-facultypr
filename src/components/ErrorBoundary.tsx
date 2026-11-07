import React from 'react';
import { AlertTriangle, RefreshCw, Music2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isDynamicImportError = 
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-[#18181b] border border-red-900/60 rounded-2xl max-w-lg w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                {this.props.fallbackTitle || 'Hubo un inconveniente al cargar el módulo'}
              </h3>
              <p className="text-xs text-gray-400">
                {isDynamicImportError 
                  ? 'Se interrumpió la conexión al cargar este módulo de La Facultad Studio. Pulsa el botón abajo para reconectar.'
                  : 'Ocurrió un error inesperado al renderizar esta sección.'}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/50 p-3 rounded-lg border border-gray-800 text-left overflow-auto max-h-32">
                <p className="text-[11px] font-mono text-red-400 font-semibold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="bg-red-700 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar y Recargar</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
              <Music2 className="w-3.5 h-3.5 text-amber-500" />
              <span>La Facultad Studio LLC • Sistema de Alta Fidelidad</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
