const CourseSkeleton = () => {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-left relative animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 w-full bg-gray-200"></div>
      
      <div className="p-5 flex flex-col flex-grow">
        {/* Category & Rating Skeleton */}
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
        
        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        
        {/* Description Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-6 flex-grow"></div>
        
        {/* Level & Duration Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        
        {/* Button Skeleton */}
        <div className="mt-auto h-10 w-full bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default CourseSkeleton;
