const FeatureCard = ({ feature, index }) => {
  const bgColors = [
    'bg-[#4a90e2]',
    'bg-[#ff6289]',
    'bg-[#fcbf58]',
    'bg-[#44bfc3]',
    'bg-[#77b05d]',
    'bg-[#6d7890]'
  ];
  
  const bgColor = bgColors[index % bgColors.length];

  return (
    <div className={`flex flex-col justify-center items-center ${bgColor} p-[1.6rem] rounded-[1rem] gap-4`}>
      <div className="bg-background h-12 w-12 rounded-full flex justify-center items-center">
        <img className="h-6 w-6" src={feature.icon} alt={feature.title} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="text-white font-bold text-[1.3rem]">
          {feature.title}
        </div>
        <div className="text-white">
          {feature.description}
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
