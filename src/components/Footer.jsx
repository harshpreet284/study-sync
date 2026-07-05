const Footer = () => {
  return (
    <div className="bg-background mx-auto px-8 flex flex-col w-full border-t border-gray-200 mt-auto">
      <footer className="max-w-[1280px] w-full mx-auto py-12 lg:py-16 text-left flex flex-col lg:flex-row lg:justify-between gap-12">
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="flex justify-start">
            <a className="flex items-center gap-3 text-2xl font-bold text-text hover:opacity-80 transition-opacity" href="#">
              <img className="h-10 w-auto" src="/images/StudySyn.svg" alt="StudySync" />
              StudySync
            </a>
          </div>
          <p className="text-base text-gray max-w-sm">
            Seamless Learning for Brighter Futures. Empowering students worldwide with top-tier education.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="hover:scale-110 transition-transform duration-200">
              <img src="/images/instagram.svg" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Instagram" />
            </a>
            <a href="#" className="hover:scale-110 transition-transform duration-200">
              <img src="/images/linkedin.svg" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="LinkedIn" />
            </a>
            <a href="#" className="hover:scale-110 transition-transform duration-200">
              <img src="/images/twitter.svg" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Twitter" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 w-full lg:w-2/3 gap-8">
          {/* column1 */}
          <div>
            <div className="text-lg font-bold text-text mb-6">
              Products
            </div>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#overview" className="text-gray text-sm hover:text-primary transition-colors duration-200">Overview</a>
              </li>
              <li>
                <a href="#solutions" className="text-gray text-sm hover:text-primary transition-colors duration-200">Solutions</a>
              </li>
              <li>
                <a href="#pricing" className="text-gray text-sm hover:text-primary transition-colors duration-200">Pricing</a>
              </li>
              <li>
                <a href="#customers" className="text-gray text-sm hover:text-primary transition-colors duration-200">Customers</a>
              </li>
            </ul>
          </div>
          {/* column2 */}
          <div>
            <div className="text-lg font-bold text-text mb-6">
              Company
            </div>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#about" className="text-gray text-sm hover:text-primary transition-colors duration-200">About</a>
              </li>
              <li>
                <a href="#investor" className="text-gray text-sm hover:text-primary transition-colors duration-200">Investor Relations</a>
              </li>
              <li>
                <a href="#jobs" className="text-gray text-sm hover:text-primary transition-colors duration-200">Jobs</a>
              </li>
              <li>
                <a href="#press" className="text-gray text-sm hover:text-primary transition-colors duration-200">Press</a>
              </li>
              <li>
                <a href="#blog" className="text-gray text-sm hover:text-primary transition-colors duration-200">Blog</a>
              </li>
            </ul>
          </div>
          {/* column3 */}
          <div>
            <div className="text-lg font-bold text-text mb-6">
              Support
            </div>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#contact" className="text-gray text-sm hover:text-primary transition-colors duration-200">Contact</a>
              </li>
              <li>
                <a href="#documentation" className="text-gray text-sm hover:text-primary transition-colors duration-200">Documentation</a>
              </li>
              <li>
                <a href="#chat" className="text-gray text-sm hover:text-primary transition-colors duration-200">Chat</a>
              </li>
              <li>
                <a href="#faq" className="text-gray text-sm hover:text-primary transition-colors duration-200">FAQ</a>
              </li>
            </ul>
          </div>
          {/* column4 */}
          <div>
            <div className="text-lg font-bold text-text mb-6">
              Legal
            </div>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#terms" className="text-gray text-sm hover:text-primary transition-colors duration-200">Terms of Service</a>
              </li>
              <li>
                <a href="#privacy" className="text-gray text-sm hover:text-primary transition-colors duration-200">Privacy Policy</a>
              </li>
              <li>
                <a href="#cookies" className="text-gray text-sm hover:text-primary transition-colors duration-200">Cookie Settings</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
      <div className="max-w-[1280px] w-full mx-auto text-gray text-sm pb-8 pt-6 border-t border-gray-200 flex justify-between items-center flex-col md:flex-row text-center md:text-left gap-4">
        <div>&#169; {new Date().getFullYear()} StudySync. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
