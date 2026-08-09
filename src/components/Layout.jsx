import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

const Layout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col min-h-screen relative">
        <Outlet />
        <ScrollToTop />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
