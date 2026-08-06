import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Shown in the error card so staff know which screen failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions so a single bad row of data shows a visible
 * error card instead of blanking the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <div>
          <p className="font-semibold text-sm">
            {this.props.label ? `${this.props.label} could not load` : "Something went wrong"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 break-words max-w-md mx-auto">
            {error.message}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
