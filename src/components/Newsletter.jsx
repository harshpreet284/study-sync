const Newsletter = () => {
  return (
    <div className="bg-background max-w-[1280px] h-[60vh] mx-auto sm:p-8">
      <div className="flex flex-row bg-light-gray h-full rounded-lg overflow-hidden">
        {/* left-part */}
        <div className="hidden sm:block h-full w-[50%] relative">
          <img src="/images/img.png" loading="lazy" alt="news-img" className="absolute inset-0 w-full h-full object-cover object-center" />
        </div>
        {/* right-part */}
        <div className="flex flex-col gap-4 p-2 justify-center items-start w-[98%] sm:w-[50%]">
          <div className="px-12">
            <h2 className="text-[1.5rem] sm:text-[2.5rem] font-bold text-primary">
              Get the latest updates
            </h2>
            <p className="text-left text-[#777]">
              Sign up for our newsletter
            </p>
          </div>
          <form className="px-12 flex flex-wrap mb-4 gap-[0.6rem]">
            <input 
              className="bg-background text-[#333] outline-none border border-[#ccc] rounded px-3 py-2 focus:border-[#2563eb] focus:shadow-[0_4px_8px_rgba(0,0,0,0.3)]" 
              placeholder="Email" 
            />
            <button className="bg-primary text-background border-none rounded py-2 px-6 transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md font-semibold">
              Send
            </button>
          </form>
          <div className="text-[0.76rem] px-12 text-[#777]">
            By signing up to our newsletter you agree to our{' '}
            <a href="#terms" className="underline text-[#2563eb]">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#privacy" className="underline text-[#2563eb]">
              Privacy policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
