import { NavLink, Link } from 'react-router-dom';

const Header = () => {
  const getNavClass = ({ isActive }) =>
    `text-lg font-semibold transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-gray-500 hover:text-link'
    }`;

  return (
    <div className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <header className="flex items-center justify-between max-w-[1000px] mx-auto p-3 md:p-4 transition-all duration-300">
        <Link to="/" className="flex items-center text-3xl font-bold text-text gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/images/StudySyn.svg" alt="logoImage" className="flex items-start h-12 w-auto" />
          <span className="text-3xl font-bold">StudySync</span>
        </Link>

        <nav className="hidden md:flex gap-8">
          <NavLink to="/" className={getNavClass}>Home</NavLink>
          <NavLink to="/courses" className={getNavClass}>Courses</NavLink>
          <NavLink to="/bookmarks" className={getNavClass}>Bookmarks</NavLink>
          <NavLink to="/about" className={getNavClass}>About</NavLink>
        </nav>

        <Link to="/contact" className="hidden md:block border-none rounded-md bg-primary text-white transition-transform duration-200 py-2.5 px-6 text-base font-semibold hover:bg-link hover:scale-105 active:scale-95 shadow-md">
          Contact Us
        </Link>

        <button type="button" className="block md:hidden border-none rounded-md bg-background text-base py-2 px-3.5 font-semibold hover:bg-gray-100 transition-colors">
          <img src="/images/Hamburger.svg" alt="menuButton" className="h-6 w-6" />
        </button>
      </header>
    </div>
  );
};

export default Header;
