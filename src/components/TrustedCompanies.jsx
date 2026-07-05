import { companies } from '../data';

const TrustedCompanies = () => {
  return (
    <div className="flex flex-col justify-center items-center py-20 animate-slideFromLeft opacity-0">
      <h2 className="text-xl sm:text-[2.3rem] font-bold text-text">Trusted by the best</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[3.6rem] bg-light-gray rounded-[0.625rem] my-8 py-[1.8rem] px-[2.5rem]">
        {companies.map((company) => (
          <div key={company.id} className="text-base font-medium text-gray flex items-center justify-center gap-2">
            <img src={company.logo} alt={company.name} className="h-[1.56rem]" />
            <span className="text-base">{company.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustedCompanies;
