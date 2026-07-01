const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="flex flex-col border border-black rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-2 gap-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] hover:border-blue-600">
      <div className="text-sm text-[#555]">
        {testimonial.text}
      </div>
      <div className="testimonial-avatar">
        <img src={testimonial.avatar} alt={testimonial.name} className="h-20 w-20" />
      </div>
      <div className="testimonial-details">
        <h3 className="text-primary text-base m-0">
          {testimonial.name}
        </h3>
        <p className="text-sm text-[#777] m-0">
          {testimonial.title}
        </p>
      </div>
    </div>
  );
};

export default TestimonialCard;
