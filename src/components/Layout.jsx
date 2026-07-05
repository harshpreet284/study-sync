import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

const Layout = () => {
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
