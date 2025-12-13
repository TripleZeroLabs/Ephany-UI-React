type FooterProps = {
  version?: string;
};

export function Footer({ version }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div>Ephany UI</div>
        <div>
          Build: <span className="font-mono">{version ?? "unknown"}</span>
        </div>
      </div>
    </footer>
  );
}
