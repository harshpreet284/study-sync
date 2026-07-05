import { features } from '../data';
import FeatureCard from './FeatureCard';

const Features = () => {
  return (
    <div className="bg-light-gray py-20 text-center">
      <div className="max-w-[800px] mx-auto px-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-[2.2rem] font-bold">
            Our competitive advantage
          </h2>
          <p className="text-gray text-base">
            This is a section of some simple filler text, also known as placeholder text. It shares some characteristics of real written text but is random or otherwise generated.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mt-[1.3rem]">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
