import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="py-10 border-t border-border/50">
      <div className="site-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="font-heading font-semibold text-sm text-text-primary">SHP</span>
            <span className="text-text-muted text-sm ml-2">— Smart Highway Patrol</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            {!isHome && <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>}
            <Link to="/detect" className="hover:text-text-primary transition-colors">Detection</Link>
            <Link to="/severity" className="hover:text-text-primary transition-colors">Severity</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
