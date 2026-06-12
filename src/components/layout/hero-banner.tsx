type HeroBannerProps = {
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function HeroBanner({ children, action }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-3">{children}</div>
        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>
    </div>
  );
}
