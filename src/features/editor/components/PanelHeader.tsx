import type { ReactNode } from "react";

interface PanelHeaderProps { readonly children: ReactNode; readonly action?: ReactNode; }

export function PanelHeader({ children, action }: PanelHeaderProps) {
  return <div className="flex h-9 items-center justify-between border-b border-white/10 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><span>{children}</span>{action}</div>;
}
