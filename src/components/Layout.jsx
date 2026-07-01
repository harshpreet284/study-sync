import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
