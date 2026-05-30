import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { label: 'Problem', href: '#problem' },
  { label: 'Approach', href: '#approach' },
  { label: 'Dataset', href: '#dataset' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-base/90 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="site-container h-14 flex items-center justify-between">
        <Link to="/" className="font-heading font-semibold text-base tracking-tight">
          SHP
        </Link>

        {isHome && (
          <>
            <div className="hidden sm:flex items-center gap-6">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/detect"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Detection
              </Link>
              <Link
                to="/severity"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Severity
              </Link>
            </div>

            <button
              onClick={() => setOpen(!open)}
              className="sm:hidden text-text-secondary"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? (
                  <path d="M5 5l10 10M5 15L15 5" />
                ) : (
                  <path d="M3 5h14M3 10h14M3 15h14" />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {open && isHome && (
        <div className="sm:hidden bg-surface border-b border-border">
          <div className="site-container py-3 space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-1.5 text-sm text-text-muted hover:text-text-primary"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/detect"
              onClick={() => setOpen(false)}
              className="block py-1.5 text-sm text-accent"
            >
              Detection
            </Link>
            <Link
              to="/severity"
              onClick={() => setOpen(false)}
              className="block py-1.5 text-sm text-accent"
            >
              Severity
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
