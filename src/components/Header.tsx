import {useEffect, useState} from "react";
import {Link, NavLink} from "react-router-dom";
import LogoLetter from "../assets/Logo-Letter-1_White_100.png";


export function Header() {
    const [isOpen, setIsOpen] = useState(false);

    // theme: "light" | "dark"
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";
        const stored = localStorage.getItem("theme");
        return stored === "dark" ? "dark" : "light";
    });

    // Apply/remove the `dark` class on <html>
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <header className="w-full">
            <div className="mx-auto flex max-w-7xl items-center justify-between py-1 px-0">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-slate-900">
                        <img
                            src={LogoLetter}
                            alt="Ephany logo"
                            className="h-6 w-6 object-contain"
                        />
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                        Ephany
                    </span>
                </Link>

                {/* Desktop nav + theme toggle */}
                <div className="hidden items-center gap-6 sm:flex">
                    <nav className="flex gap-6">
                        <NavLink
                            to="/assets"
                            onClick={closeMenu}
                            className={({isActive}) =>
                                `text-sm font-medium ${
                                    isActive
                                        ? "text-slate-900 dark:text-white"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`
                            }
                        >
                            Assets
                        </NavLink>

                        <NavLink
                            to="/manufacturers"
                            onClick={closeMenu}
                            className={({isActive}) =>
                                `text-sm font-medium ${
                                    isActive
                                        ? "text-slate-900 dark:text-white"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`
                            }
                        >
                            Manufacturers
                        </NavLink>

                        <NavLink
                            to="/projects"
                            onClick={closeMenu}
                            className={({isActive}) =>
                                `text-sm font-medium ${
                                    isActive
                                        ? "text-slate-900 dark:text-white"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`
                            }
                        >
                            Projects
                        </NavLink>
                    </nav>

                    <button
                        onClick={toggleTheme}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-700/60 transition"
                        aria-label={theme === "light" ? "Enable dark mode" : "Enable light mode"}
                    >
                        <span className="text-base">
                            {theme === "light" ? "☾" : "☼"}
                        </span>
                    </button>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    className="ml-3 rounded-md p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 sm:hidden"
                    aria-label="Toggle navigation"
                    onClick={toggleMenu}
                >
                    ☰
                </button>
            </div>

            {/* Mobile dropdown */}
            {isOpen && (
                <div
                    className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800 sm:hidden">
                    <NavLink
                        to="/assets"
                        onClick={closeMenu}
                        className="block text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        Assets
                    </NavLink>
                    <NavLink
                        to="/manufacturers"
                        onClick={closeMenu}
                        className="block text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        Manufacturers
                    </NavLink>
                    <NavLink
                        to="/projects"
                        onClick={closeMenu}
                        className="block text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                        Projects
                    </NavLink>

                    <button
                        onClick={toggleTheme}
                        className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-700/60 transition"
                        aria-label={theme === "light" ? "Enable dark mode" : "Enable light mode"}
                    >
	<span className="text-base">
		{theme === "light" ? "☾" : "☼"}
	</span>
                        <span className="text-xs font-medium">
		{theme === "light" ? "Dark mode" : "Light mode"}
	</span>
                    </button>

                </div>
            )}
        </header>
    );
}
