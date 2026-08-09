const Newsletter = () => {
  return (
    <div className="bg-background max-w-[1280px] h-[60vh] mx-auto sm:p-8">
      <div className="flex flex-row bg-light-gray h-full rounded-lg overflow-hidden w-full">
        {/* left-part */}
        <div className="hidden sm:block h-full w-[50%] relative">
          <img src="/images/img.png" loading="lazy" alt="news-img" className="absolute inset-0 w-full h-full object-cover object-center" />
        </div>
        {/* right-part */}
        <div className="flex flex-col gap-4 p-4 sm:p-12 justify-center items-start w-full sm:w-[50%]">
          <div className="w-full">
            <h2 className="text-[1.5rem] sm:text-[2.5rem] font-bold text-primary mb-2">
              Get the Latest Updates
            </h2>
            <p className="text-left text-[#777]">
              Sign up for our newsletter
            </p>
          </div>
          <form className="flex flex-wrap mb-4 gap-[0.6rem] w-full max-w-lg mt-4">
            <input 
              className="bg-background text-[#333] outline-none border border-[#ccc] rounded px-4 py-3 focus:border-[#2563eb] focus:shadow-[0_4px_8px_rgba(0,0,0,0.3)] flex-1 min-w-[200px]" 
              placeholder="Email" 
            />
            <button className="bg-primary text-background border-none rounded py-3 px-8 transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md font-semibold">
              Send
            </button>
          </form>
          <div className="text-[0.8rem] text-[#777] max-w-lg mt-2">
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
