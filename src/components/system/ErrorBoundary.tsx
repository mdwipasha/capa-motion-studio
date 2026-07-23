import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps { readonly children: ReactNode; }
interface ErrorBoundaryState { readonly hasError: boolean; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  public componentDidCatch(error: Error, info: ErrorInfo): void { console.error("CapaMotion UI error", error, info); }
  public render(): ReactNode {
    if (this.state.hasError) return <main className="grid min-h-screen place-items-center bg-[#101116] p-6 text-center text-white"><div><p className="text-lg font-semibold">Something went wrong.</p><p className="mt-2 text-sm text-slate-400">The editor can be safely reloaded.</p><Button className="mt-5" onClick={() => window.location.reload()}>Reload CapaMotion</Button></div></main>;
    return this.props.children;
  }
}
