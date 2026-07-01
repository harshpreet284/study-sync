const Footer = () => {
  return (
    <div className="bg-background mx-auto px-8 flex flex-col max-w-[1280px]">
      <footer className="max-w-[1280px] py-[1.2rem] px-[2.4rem] pr-8 text-left flex flex-col items-center lg:flex-row lg:justify-between">
        <div className="w-full lg:w-[34%] flex flex-col gap-[1.65rem] pl-4 md:pl-40 lg:pl-0">
          <div className="flex justify-start -mb-[1.9rem]">
            <a className="flex justify-center items-center gap-[0.8rem] text-[1.28rem] font-bold text-black" href="#">
              <img className="w-[2rem] h-[6rem]" src="/images/StudySyn.svg" alt="StudySync" />
              StudySync
            </a>
          </div>
          <p className="text-base text-[#777] mt-8">
            Seamless Learning for Brighter Futures.
          </p>
          <div className="flex gap-[0.8rem]">
            <a href="#">
              <img src="/images/instagram.svg" className="w-6 h-6" alt="Instagram" />
            </a>
            <a href="#">
              <img src="/images/linkedin.svg" className="w-6 h-6" alt="LinkedIn" />
            </a>
            <a href="#">
              <img src="/images/linkedin-copy.svg" className="w-6 h-6" alt="LinkedIn" />
            </a>
            <a href="#">
              <img src="/images/twitter.svg" className="w-6 h-6" alt="Twitter" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 w-full lg:w-[58%] gap-8 lg:gap-[5.67rem] pt-8 self-center lg:self-auto justify-evenly">
          {/* column1 */}
          <div>
            <div className="text-[1.05rem] font-bold text-text mb-[1.6rem]">
              Products
            </div>
            <ul className="flex flex-col gap-[1.2rem]">
              <li>
                <a href="#overview" className="text-[#777] text-[0.876rem]">Overview</a>
              </li>
              <li>
                <a href="#solutions" className="text-[#777] text-[0.876rem]">Solutions</a>
              </li>
              <li>
                <a href="#pricing" className="text-[#777] text-[0.876rem]">Pricing</a>
              </li>
              <li>
                <a href="#customers" className="text-[#777] text-[0.876rem]">Customers</a>
              </li>
            </ul>
          </div>
          {/* column2 */}
          <div>
            <div className="text-[1.05rem] font-bold text-text mb-[1.6rem]">
              Company
            </div>
            <ul className="flex flex-col gap-[1.2rem]">
              <li>
                <a href="#about" className="text-[#777] text-[0.876rem]">About</a>
              </li>
              <li>
                <a href="#investor" className="text-[#777] text-[0.876rem]">Investor Relations</a>
              </li>
              <li>
                <a href="#jobs" className="text-[#777] text-[0.876rem]">Jobs</a>
              </li>
              <li>
                <a href="#press" className="text-[#777] text-[0.876rem]">Press</a>
              </li>
              <li>
                <a href="#blog" className="text-[#777] text-[0.876rem]">Blog</a>
              </li>
            </ul>
          </div>
          {/* column3 */}
          <div>
            <div className="text-[1.05rem] font-bold text-text mb-[1.6rem]">
              Support
            </div>
            <ul className="flex flex-col gap-[1.2rem]">
              <li>
                <a href="#contact" className="text-[#777] text-[0.876rem]">Contact</a>
              </li>
              <li>
                <a href="#documentation" className="text-[#777] text-[0.876rem]">Documentation</a>
              </li>
              <li>
                <a href="#chat" className="text-[#777] text-[0.876rem]">Chat</a>
              </li>
              <li>
                <a href="#faq" className="text-[#777] text-[0.876rem]">FAQ</a>
              </li>
            </ul>
          </div>
          {/* column4 */}
          <div>
            <div className="text-[1.05rem] font-bold text-text mb-[1.6rem]">
              Legal
            </div>
            <ul className="flex flex-col gap-[1.2rem]">
              <li>
                <a href="#terms" className="text-[#777] text-[0.876rem]">Terms of Service</a>
              </li>
              <li>
                <a href="#privacy" className="text-[#777] text-[0.876rem]">Privacy Policy</a>
              </li>
              <li>
                <a href="#cookies" className="text-[#777] text-[0.876rem]">Cookie Settings</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
      <div className="text-gray text-[0.75rem] pb-8 mt-8 pt-[1.15rem] border-t border-[#E5E7EB]">
        &#169; 2025 - Present StudySync. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;
