import { NavLink, Link } from 'react-router-dom';

const Header = () => {
  const getNavClass = ({ isActive }) =>
    `text-lg font-semibold transition-colors duration-100 ${
      isActive ? 'text-primary' : 'text-[#718096] hover:text-link'
    }`;

  return (
    <div className="w-full">
      <header className="flex items-center justify-between max-w-[1000px] mx-auto p-[0.6rem] md:p-4">
        <Link to="/" className="flex items-center text-3xl font-bold text-text gap-2.5">
          <img src="/images/StudySyn.svg" alt="logoImage" className="flex items-start h-[5.875rem] w-[1.938rem]" />
          <span className="text-3xl font-bold">StudySync</span>
        </Link>

        <nav className="hidden md:flex gap-6">
          <NavLink to="/" className={getNavClass}>Home</NavLink>
          <NavLink to="/courses" className={getNavClass}>Courses</NavLink>
          <NavLink to="/bookmarks" className={getNavClass}>Bookmarks</NavLink>
          <NavLink to="/about" className={getNavClass}>About</NavLink>
        </nav>

        <Link to="/contact" className="hidden md:block border-none rounded-md bg-primary text-background transition-all duration-100 py-3 px-6 text-base font-semibold hover:bg-[#5254f8]">
          Contact Us
        </Link>

        <button type="button" className="block md:hidden border-none rounded-md bg-background text-base py-2 px-3.5 font-semibold">
          <img src="/images/Hamburger.svg" alt="menuButton" className="h-6 w-6" />
        </button>
      </header>
    </div>
  );
};

export default Header;
