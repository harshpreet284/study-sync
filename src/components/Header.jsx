import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <nav className="hidden md:flex gap-8">
          <NavLink to="/" className={getNavClass}>Home</NavLink>
          <NavLink to="/courses" className={getNavClass}>Courses</NavLink>
          <NavLink to="/bookmarks" className={getNavClass}>Bookmarks</NavLink>
          <NavLink to="/about" className={getNavClass}>About</NavLink>
        </nav>

        {/* Desktop Contact Button */}
        <Link to="/contact" className="hidden md:block border-none rounded-md bg-primary text-white transition-transform duration-200 py-2.5 px-6 text-base font-semibold hover:bg-link hover:scale-105 active:scale-95 shadow-md">
          Contact Us
        </Link>

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
          <NavLink to="/bookmarks" onClick={closeMenu} className={getMobileNavClass}>Bookmarks</NavLink>
          <NavLink to="/about" onClick={closeMenu} className={getMobileNavClass}>About</NavLink>
          <Link 
            to="/contact" 
            onClick={closeMenu}
            className="mt-6 border-none rounded-md bg-primary text-white transition-colors duration-200 py-3 px-6 text-center text-base font-semibold hover:bg-link shadow-md w-full"
          >
            Contact Us
          </Link>
        </div>
      )}
    </div>
  );
};

export default Header;
