import type { ReactNode } from "react";
import clsx from "clsx";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: PanelShellProps) {
  return (
    <section className={clsx("glass-panel rounded-[28px] p-5", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
