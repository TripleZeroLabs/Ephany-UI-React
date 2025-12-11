import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo" onClick={closeMenu}>
          <span className="app-logo-mark">E</span>
          <span className="app-logo-text">Ephany UI</span>
        </Link>

        <button
          className="app-menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          onClick={toggleMenu}
        >
          ☰
        </button>

        <nav className={`app-nav ${isOpen ? "is-open" : ""}`}>
          <NavLink
            to="/assets"
            className="app-nav-link"
            onClick={closeMenu}
          >
            Assets
          </NavLink>
          <NavLink
            to="/manufacturers"
            className="app-nav-link"
            onClick={closeMenu}
          >
            Manufacturers
          </NavLink>
          <NavLink
            to="/projects"
            className="app-nav-link"
            onClick={closeMenu}
          >
            Projects
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
