import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mark } from '../components/Mark';
import { Icon } from '../components/Icon';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`m-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top">
          <Mark size={24} />
          <span className="word">Veridian</span>
        </a>
        <div className="links">
          <a href="#rules">Rules</a>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#api">API</a>
        </div>
        <div className="right">
          <Link className="btn ghost" to="/dashboard">Sign in</Link>
          <Link className="btn primary" to="/dashboard">
            <Icon name="upload" size={15} />
            Open dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
