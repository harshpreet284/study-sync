import { testimonials } from '../data';
import TestimonialCard from './TestimonialCard';

const Testimonials = () => {
  return (
    <div className="bg-background py-20 px-8 mx-auto max-w-[1280px]">
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-[1.875rem] font-bold">
          What Others Say About Us
        </h2>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(234px,1fr))] gap-8 w-full">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
