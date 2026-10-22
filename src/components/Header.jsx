import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const getNavClass = ({ isActive }) =>
    `text-lg font-semibold transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-gray-500 hover:text-link'
    }`;

  const getMobileNavClass = ({ isActive }) =>
    `block text-lg font-semibold transition-colors duration-200 py-3 border-b border-gray-100 ${
      isActive ? 'text-primary' : 'text-gray-500 hover:text-link'
    }`;

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <header className="flex items-center justify-between max-w-[1000px] mx-auto p-3 md:p-4 transition-all duration-300">
        <Link to="/" onClick={closeMenu} className="flex items-center text-3xl font-bold text-text gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/images/StudySyn.svg" alt="logoImage" className="flex items-start h-12 w-auto" />
          <span className="text-3xl font-bold">StudySync</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" className={getNavClass}>Home</NavLink>
          <NavLink to="/courses" className={getNavClass}>Courses</NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={getNavClass}>Dashboard</NavLink>
          )}
          <NavLink to="/bookmarks" className={getNavClass}>
            {isAuthenticated ? 'My Learning' : 'Bookmarks'}
          </NavLink>
          <NavLink to="/goals" className={getNavClass}>Goals</NavLink>
          <NavLink to="/about" className={getNavClass}>About</NavLink>
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-light-gray/70 py-1.5 px-3 rounded-full border border-gray-200">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="text-sm font-semibold text-text max-w-[120px] truncate">
                  {user?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-semibold text-gray hover:text-red-600 transition-colors py-1.5 px-2.5 rounded hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <NavLink to="/login" className="text-base font-semibold text-gray-600 hover:text-primary transition-colors py-2 px-3">
                Sign In
              </NavLink>
              <Link
                to="/register"
                className="border-none rounded-md bg-primary text-white transition-transform duration-200 py-2.5 px-5 text-sm font-semibold hover:bg-link hover:scale-105 active:scale-95 shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          type="button" 
          onClick={toggleMenu}
          className="block md:hidden border-none rounded-md bg-background text-base py-2 px-3.5 font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-dark-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <img src="/images/Hamburger.svg" alt="menuButton" className="h-6 w-6" />
          )}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg animate-fadeIn flex flex-col p-4 z-40">
          <NavLink to="/" onClick={closeMenu} className={getMobileNavClass}>Home</NavLink>
          <NavLink to="/courses" onClick={closeMenu} className={getMobileNavClass}>Courses</NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={closeMenu} className={getMobileNavClass}>Dashboard</NavLink>
          )}
          <NavLink to="/bookmarks" onClick={closeMenu} className={getMobileNavClass}>
            {isAuthenticated ? 'My Learning' : 'Bookmarks'}
          </NavLink>
          <NavLink to="/goals" onClick={closeMenu} className={getMobileNavClass}>Goals</NavLink>
          <NavLink to="/about" onClick={closeMenu} className={getMobileNavClass}>About</NavLink>

          {/* Mobile Auth Actions */}
          <div className="pt-4 mt-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 p-3 bg-light-gray/60 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold uppercase">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text">{user?.name}</span>
                    <span className="text-xs text-gray">{user?.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full border border-red-200 text-red-600 bg-red-50 rounded-md py-2.5 text-center text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center py-2.5 border border-gray-300 rounded-md text-text font-semibold hover:bg-light-gray transition-colors"
                >
                  Sign In
                </NavLink>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full border-none rounded-md bg-primary text-white transition-colors duration-200 py-3 text-center text-base font-semibold hover:bg-link shadow-md"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
