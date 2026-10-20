import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import AuthPromptModal from './AuthPromptModal';
import { useBookmarks } from '../context/BookmarksContext';

const Layout = () => {
  const { pathname } = useLocation();
  const { authPrompt, dismissAuthPrompt } = useBookmarks();

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
      <AuthPromptModal
        isOpen={authPrompt?.isOpen}
        message={authPrompt?.message}
        onClose={dismissAuthPrompt}
      />
    </>
  );
};

export default Layout;
