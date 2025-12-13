type FooterProps = {
    version?: string;
};

export function Footer({version}: FooterProps) {
    return (
        <footer className="border-t border-slate-200 py-3 text-xs text-slate-500">
            <div className="flex w-full items-center justify-between px-0">
                <div>
                    &copy; 2026 Triple Zero Labs
                </div>

                <div className="font-mono">
                    v{version ?? "000"}
                </div>
            </div>
        </footer>
    );
}
