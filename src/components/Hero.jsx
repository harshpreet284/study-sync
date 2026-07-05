const Hero = () => {
  return (
    <div className="w-full">
      <section className="max-w-[1280px] flex flex-col md:flex-row gap-8 md:gap-24 p-[0.6rem] items-center mx-auto">
        <div className="text-center md:text-left md:max-w-[50%] md:pl-28 animate-slideFromLeft opacity-0">
          <p className="text-[1.15rem] md:text-base font-semibold text-primary md:pl-[0.3rem]">
            Very proud to introduce
          </p>
          <h1 className="text-[2.3rem] md:text-[3.2rem] p-[1.1rem] md:pl-0 text-text leading-tight font-bold">
            Seamless Learning for Brighter Futures
          </h1>
          <p className="text-gray text-[1.13rem] md:text-[1.1rem] md:w-[78%]">
            Our innovative platform offers an effortless and seamless approach to learning, empowering students of all ages to achieve brighter futures. Join us on a transformative journey to simplify education and unlock your full potential.
          </p>

          <div className="flex gap-4 sm:gap-8 p-4 mt-4 items-center justify-center md:justify-start md:pl-0">
            <a href="#start" className="border-none rounded-md bg-primary text-background transition-transform duration-200 py-3 px-6 text-base font-semibold hover:bg-link hover:scale-105 active:scale-95 shadow-md">
              Start Now
            </a>
            <a href="#tour" className="border-none rounded-md bg-dark-gray text-background transition-transform duration-200 py-3 px-6 text-base font-semibold hover:bg-gray hover:scale-105 active:scale-95 shadow-md">
              Take Tour
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="rounded-[1.225rem] overflow-hidden shadow-[0px_4px_8px_rgba(0,0,0,0.1)] h-[50vh] md:h-[65vh]">
            <img 
              src="/images/usgs-hoS3dzgpHzw-unsplash.jpg" 
              alt="sectionImage"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
