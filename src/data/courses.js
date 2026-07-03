export const courses = [
  {
    id: 1,
    title: "Introduction to Web Development",
    category: "Web Development",
    level: "Beginner",
    rating: 4.8,
    duration: "12 hours",
    instructor: "Sarah Jenkins",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
    description: "Learn the fundamentals of web development using HTML, CSS, and basic JavaScript. Perfect for absolute beginners.",
    syllabus: [
      { week: 1, title: "HTML Basics", description: "Learn structure and semantics." },
      { week: 2, title: "CSS Fundamentals", description: "Styling and layouts." },
      { week: 3, title: "Intro to JavaScript", description: "Basic interactivity." }
    ],
    tags: ["HTML", "CSS", "JavaScript", "Beginner"]
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    category: "Web Development",
    level: "Advanced",
    rating: 4.9,
    duration: "20 hours",
    instructor: "David Miller",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80",
    description: "Master React by learning advanced design patterns, performance optimization, and custom hooks.",
    syllabus: [
      { week: 1, title: "Custom Hooks", description: "Extracting reusable logic." },
      { week: 2, title: "Context & Reducers", description: "Advanced state management." },
      { week: 3, title: "Performance Tuning", description: "Memo, useMemo, and useCallback." }
    ],
    tags: ["React", "JavaScript", "Frontend"]
  },
  {
    id: 3,
    title: "Data Science with Python",
    category: "Data Science",
    level: "Intermediate",
    rating: 4.7,
    duration: "35 hours",
    instructor: "Dr. Emily Chen",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    description: "A comprehensive guide to Data Science using Python, Pandas, NumPy, and Scikit-Learn.",
    syllabus: [
      { week: 1, title: "Python Refresher", description: "Data structures and basics." },
      { week: 2, title: "Data Analysis", description: "Pandas and NumPy." },
      { week: 3, title: "Machine Learning Basics", description: "Intro to Scikit-Learn." },
      { week: 4, title: "Data Visualization", description: "Matplotlib and Seaborn." }
    ],
    tags: ["Python", "Data Science", "Machine Learning"]
  },
  {
    id: 4,
    title: "UI/UX Design Fundamentals",
    category: "Design",
    level: "Beginner",
    rating: 4.6,
    duration: "15 hours",
    instructor: "Alex Rivera",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80",
    description: "Learn the principles of user interface and user experience design to create engaging digital products.",
    syllabus: [
      { week: 1, title: "Design Thinking", description: "Understanding the user." },
      { week: 2, title: "Wireframing", description: "Low-fidelity prototyping." },
      { week: 3, title: "Figma Basics", description: "Designing interfaces." }
    ],
    tags: ["UI", "UX", "Figma", "Design"]
  },
  {
    id: 5,
    title: "Full-Stack Next.js Development",
    category: "Web Development",
    level: "Intermediate",
    rating: 4.9,
    duration: "40 hours",
    instructor: "Michael Chang",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
    description: "Build production-ready full-stack applications using Next.js, Tailwind CSS, and Prisma.",
    syllabus: [
      { week: 1, title: "Next.js Routing", description: "App router and layouts." },
      { week: 2, title: "Server Actions", description: "Mutating data." },
      { week: 3, title: "Database Integration", description: "Prisma and PostgreSQL." },
      { week: 4, title: "Deployment", description: "Deploying to Vercel." }
    ],
    tags: ["Next.js", "React", "Fullstack", "Prisma"]
  },
  {
    id: 6,
    title: "Machine Learning Masterclass",
    category: "Artificial Intelligence",
    level: "Advanced",
    rating: 4.8,
    duration: "50 hours",
    instructor: "Prof. Alan Turing",
    thumbnail: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=600&q=80",
    description: "Deep dive into machine learning algorithms, neural networks, and deep learning frameworks like TensorFlow.",
    syllabus: [
      { week: 1, title: "Advanced Algorithms", description: "SVM, Random Forests, Gradient Boosting." },
      { week: 2, title: "Neural Networks", description: "Building MLPs." },
      { week: 3, title: "Deep Learning", description: "CNNs and RNNs." },
      { week: 4, title: "TensorFlow", description: "Building models with TF." }
    ],
    tags: ["AI", "Machine Learning", "TensorFlow", "Deep Learning"]
  },
  {
    id: 7,
    title: "iOS App Development with Swift",
    category: "Mobile Development",
    level: "Beginner",
    rating: 4.7,
    duration: "30 hours",
    instructor: "Jessica Alba",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80",
    description: "Start building iOS apps from scratch using Swift and SwiftUI.",
    syllabus: [
      { week: 1, title: "Swift Basics", description: "Variables, functions, and types." },
      { week: 2, title: "SwiftUI Fundamentals", description: "Building basic UI." },
      { week: 3, title: "State & Data Flow", description: "Managing app state." },
      { week: 4, title: "Publishing", description: "App Store submission." }
    ],
    tags: ["iOS", "Swift", "Mobile", "SwiftUI"]
  },
  {
    id: 8,
    title: "Cybersecurity Basics",
    category: "Security",
    level: "Beginner",
    rating: 4.5,
    duration: "18 hours",
    instructor: "Robert Johnson",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    description: "Learn the fundamentals of cybersecurity, networking, and how to protect systems against common threats.",
    syllabus: [
      { week: 1, title: "Intro to Security", description: "Concepts and principles." },
      { week: 2, title: "Network Security", description: "Firewalls and VPNs." },
      { week: 3, title: "Common Threats", description: "Malware, phishing, and DoS." }
    ],
    tags: ["Cybersecurity", "Networking", "Security"]
  },
  {
    id: 9,
    title: "Cloud Computing with AWS",
    category: "Cloud",
    level: "Intermediate",
    rating: 4.8,
    duration: "45 hours",
    instructor: "Amanda White",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    description: "Master Amazon Web Services and prepare for the AWS Certified Solutions Architect exam.",
    syllabus: [
      { week: 1, title: "AWS Core Services", description: "EC2, S3, and VPC." },
      { week: 2, title: "Databases", description: "RDS and DynamoDB." },
      { week: 3, title: "Serverless", description: "Lambda and API Gateway." },
      { week: 4, title: "Security & IAM", description: "Identity and access management." }
    ],
    tags: ["AWS", "Cloud", "DevOps"]
  },
  {
    id: 10,
    title: "Mastering TypeScript",
    category: "Web Development",
    level: "Intermediate",
    rating: 4.9,
    duration: "25 hours",
    instructor: "Daniel Scott",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=600&q=80",
    description: "Take your JavaScript skills to the next level by mastering TypeScript and static typing.",
    syllabus: [
      { week: 1, title: "TypeScript Basics", description: "Types, interfaces, and classes." },
      { week: 2, title: "Advanced Types", description: "Generics, mapped types, and utility types." },
      { week: 3, title: "TypeScript with React", description: "Typing components and hooks." }
    ],
    tags: ["TypeScript", "JavaScript", "Frontend"]
  },
  {
    id: 11,
    title: "Docker and Kubernetes Bootcamp",
    category: "DevOps",
    level: "Advanced",
    rating: 4.7,
    duration: "35 hours",
    instructor: "Chris Martin",
    thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=600&q=80",
    description: "Learn containerization and orchestration with Docker and Kubernetes for scalable deployments.",
    syllabus: [
      { week: 1, title: "Docker Fundamentals", description: "Containers and images." },
      { week: 2, title: "Docker Compose", description: "Multi-container applications." },
      { week: 3, title: "Kubernetes Basics", description: "Pods, services, and deployments." },
      { week: 4, title: "Advanced K8s", description: "Ingress and stateful sets." }
    ],
    tags: ["Docker", "Kubernetes", "DevOps"]
  },
  {
    id: 12,
    title: "Python for Data Analysis",
    category: "Data Science",
    level: "Beginner",
    rating: 4.6,
    duration: "20 hours",
    instructor: "Laura Lee",
    thumbnail: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=600&q=80",
    description: "An introductory course on using Python for data analysis, focusing on Pandas and data cleaning techniques.",
    syllabus: [
      { week: 1, title: "Python Basics", description: "Syntax and data structures." },
      { week: 2, title: "Intro to Pandas", description: "DataFrames and Series." },
      { week: 3, title: "Data Cleaning", description: "Handling missing data." }
    ],
    tags: ["Python", "Pandas", "Data Analysis"]
  },
  {
    id: 13,
    title: "Advanced CSS and Sass",
    category: "Web Development",
    level: "Intermediate",
    rating: 4.8,
    duration: "16 hours",
    instructor: "Kevin Powell",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=600&q=80",
    description: "Level up your CSS skills by learning Sass, Flexbox, CSS Grid, and responsive design techniques.",
    syllabus: [
      { week: 1, title: "Sass Fundamentals", description: "Variables, nesting, and mixins." },
      { week: 2, title: "Modern Layouts", description: "Flexbox and CSS Grid." },
      { week: 3, title: "Animations", description: "CSS transitions and keyframes." }
    ],
    tags: ["CSS", "Sass", "Web Design"]
  },
  {
    id: 14,
    title: "Go Programming Language",
    category: "Backend Development",
    level: "Intermediate",
    rating: 4.7,
    duration: "28 hours",
    instructor: "Rob Pike",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    description: "Learn Go (Golang) from scratch and build high-performance backend systems.",
    syllabus: [
      { week: 1, title: "Go Basics", description: "Syntax, variables, and functions." },
      { week: 2, title: "Concurrency", description: "Goroutines and channels." },
      { week: 3, title: "Building APIs", description: "Creating REST APIs with Go." }
    ],
    tags: ["Go", "Golang", "Backend"]
  },
  {
    id: 15,
    title: "Digital Marketing Strategy",
    category: "Marketing",
    level: "Beginner",
    rating: 4.5,
    duration: "14 hours",
    instructor: "Emma Watson",
    thumbnail: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=600&q=80",
    description: "Learn how to create comprehensive digital marketing strategies, covering SEO, SEM, and social media.",
    syllabus: [
      { week: 1, title: "SEO Basics", description: "Search engine optimization." },
      { week: 2, title: "Social Media", description: "Platforms and engagement." },
      { week: 3, title: "Paid Advertising", description: "Google Ads and Facebook Ads." }
    ],
    tags: ["Marketing", "SEO", "Social Media"]
  },
  {
    id: 16,
    title: "Ethical Hacking and Penetration Testing",
    category: "Security",
    level: "Advanced",
    rating: 4.9,
    duration: "45 hours",
    instructor: "Kevin Mitnick",
    thumbnail: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80",
    description: "Learn advanced techniques in ethical hacking, vulnerability assessment, and penetration testing.",
    syllabus: [
      { week: 1, title: "Information Gathering", description: "Footprinting and scanning." },
      { week: 2, title: "System Hacking", description: "Exploitation and post-exploitation." },
      { week: 3, title: "Web App Hacking", description: "SQL injection and XSS." }
    ],
    tags: ["Hacking", "Security", "Pen Testing"]
  },
  {
    id: 17,
    title: "Android App Development with Kotlin",
    category: "Mobile Development",
    level: "Intermediate",
    rating: 4.7,
    duration: "32 hours",
    instructor: "Jake Wharton",
    thumbnail: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=600&q=80",
    description: "Build robust Android applications using Kotlin and Jetpack Compose.",
    syllabus: [
      { week: 1, title: "Kotlin Basics", description: "Language fundamentals." },
      { week: 2, title: "Jetpack Compose", description: "Modern Android UI." },
      { week: 3, title: "Architecture", description: "MVVM and Room database." }
    ],
    tags: ["Android", "Kotlin", "Mobile"]
  },
  {
    id: 18,
    title: "Financial Modeling and Valuation",
    category: "Finance",
    level: "Advanced",
    rating: 4.6,
    duration: "24 hours",
    instructor: "Warren Buffett",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    description: "Master financial modeling, DCF valuation, and M&A analysis.",
    syllabus: [
      { week: 1, title: "Excel for Finance", description: "Advanced Excel functions." },
      { week: 2, title: "Financial Statements", description: "Linking the 3 statements." },
      { week: 3, title: "Valuation Methods", description: "DCF and comparable analysis." }
    ],
    tags: ["Finance", "Modeling", "Excel"]
  },
  {
    id: 19,
    title: "Game Development with Unity",
    category: "Game Development",
    level: "Beginner",
    rating: 4.8,
    duration: "40 hours",
    instructor: "John Carmack",
    thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
    description: "Start creating 2D and 3D games using the Unity engine and C# programming.",
    syllabus: [
      { week: 1, title: "Unity Interface", description: "Navigating the editor." },
      { week: 2, title: "C# Scripting", description: "Game logic and mechanics." },
      { week: 3, title: "Physics and Animation", description: "Adding life to games." }
    ],
    tags: ["Unity", "Game Dev", "C#"]
  },
  {
    id: 20,
    title: "GraphQL for Beginners",
    category: "Backend Development",
    level: "Intermediate",
    rating: 4.7,
    duration: "15 hours",
    instructor: "Lee Byron",
    thumbnail: "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?auto=format&fit=crop&w=600&q=80",
    description: "Learn how to design, build, and query GraphQL APIs.",
    syllabus: [
      { week: 1, title: "GraphQL Concepts", description: "Queries and mutations." },
      { week: 2, title: "Building a Server", description: "Apollo Server." },
      { week: 3, title: "Frontend Integration", description: "Apollo Client." }
    ],
    tags: ["GraphQL", "API", "Backend"]
  },
  {
    id: 21,
    title: "Introduction to Artificial Intelligence",
    category: "Artificial Intelligence",
    level: "Beginner",
    rating: 4.5,
    duration: "20 hours",
    instructor: "Andrew Ng",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
    description: "Discover the fundamentals of AI, its applications, and its societal impact.",
    syllabus: [
      { week: 1, title: "What is AI?", description: "History and concepts." },
      { week: 2, title: "Problem Solving", description: "Search algorithms." },
      { week: 3, title: "Ethics in AI", description: "Bias and fairness." }
    ],
    tags: ["AI", "Beginner", "Tech"]
  },
  {
    id: 22,
    title: "Vue.js 3 Fundamentals",
    category: "Web Development",
    level: "Beginner",
    rating: 4.8,
    duration: "18 hours",
    instructor: "Evan You",
    thumbnail: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=600&q=80",
    description: "Learn the latest features of Vue 3, including the Composition API and Pinia.",
    syllabus: [
      { week: 1, title: "Vue Basics", description: "Directives and components." },
      { week: 2, title: "Composition API", description: "Reactivity and logic." },
      { week: 3, title: "State Management", description: "Using Pinia." }
    ],
    tags: ["Vue", "JavaScript", "Frontend"]
  },
  {
    id: 23,
    title: "Blockchain and Cryptocurrency Explained",
    category: "Technology",
    level: "Beginner",
    rating: 4.4,
    duration: "12 hours",
    instructor: "Vitalik Buterin",
    thumbnail: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80",
    description: "Understand the technology behind Bitcoin, Ethereum, and decentralized finance.",
    syllabus: [
      { week: 1, title: "Blockchain Basics", description: "How it works." },
      { week: 2, title: "Smart Contracts", description: "Ethereum and DApps." },
      { week: 3, title: "DeFi", description: "Decentralized finance." }
    ],
    tags: ["Blockchain", "Crypto", "Tech"]
  },
  {
    id: 24,
    title: "Advanced Node.js",
    category: "Backend Development",
    level: "Advanced",
    rating: 4.9,
    duration: "30 hours",
    instructor: "Ryan Dahl",
    thumbnail: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
    description: "Deep dive into Node.js internals, event loop, streams, and microservices.",
    syllabus: [
      { week: 1, title: "Node Internals", description: "V8 and libuv." },
      { week: 2, title: "Streams and Buffers", description: "Handling data efficiently." },
      { week: 3, title: "Microservices", description: "Building scalable architectures." }
    ],
    tags: ["Node.js", "Backend", "JavaScript"]
  },
  {
    id: 25,
    title: "Photography for Beginners",
    category: "Creative",
    level: "Beginner",
    rating: 4.7,
    duration: "10 hours",
    instructor: "Annie Leibovitz",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    description: "Learn how to use your DSLR or mirrorless camera to take stunning photos.",
    syllabus: [
      { week: 1, title: "Camera Basics", description: "Exposure triangle." },
      { week: 2, title: "Composition", description: "Rule of thirds and lighting." },
      { week: 3, title: "Editing", description: "Lightroom basics." }
    ],
    tags: ["Photography", "Creative", "Art"]
  },
  {
    id: 26,
    title: "Project Management Professional (PMP)",
    category: "Business",
    level: "Intermediate",
    rating: 4.6,
    duration: "40 hours",
    instructor: "Mike Griffiths",
    thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    description: "Prepare for the PMP certification exam with comprehensive coverage of PMBOK concepts.",
    syllabus: [
      { week: 1, title: "Project Initiation", description: "Charters and stakeholders." },
      { week: 2, title: "Planning", description: "Scope, schedule, and cost." },
      { week: 3, title: "Execution", description: "Managing teams and quality." }
    ],
    tags: ["PMP", "Management", "Business"]
  },
  {
    id: 27,
    title: "Rust Programming Language",
    category: "Backend Development",
    level: "Intermediate",
    rating: 4.8,
    duration: "35 hours",
    instructor: "Steve Klabnik",
    thumbnail: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=600&q=80",
    description: "Learn Rust for systems programming, memory safety, and high performance.",
    syllabus: [
      { week: 1, title: "Rust Basics", description: "Ownership and borrowing." },
      { week: 2, title: "Error Handling", description: "Result and Option types." },
      { week: 3, title: "Concurrency", description: "Safe concurrency in Rust." }
    ],
    tags: ["Rust", "Systems", "Programming"]
  },
  {
    id: 28,
    title: "SQL and Database Design",
    category: "Data Science",
    level: "Beginner",
    rating: 4.7,
    duration: "22 hours",
    instructor: "C.J. Date",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80",
    description: "Master SQL queries and learn how to design normalized relational databases.",
    syllabus: [
      { week: 1, title: "SQL Basics", description: "SELECT, INSERT, UPDATE, DELETE." },
      { week: 2, title: "Advanced Queries", description: "Joins, subqueries, and window functions." },
      { week: 3, title: "Database Design", description: "Normalization and ER diagrams." }
    ],
    tags: ["SQL", "Database", "Data"]
  },
  {
    id: 29,
    title: "Agile and Scrum Masterclass",
    category: "Business",
    level: "Beginner",
    rating: 4.6,
    duration: "16 hours",
    instructor: "Ken Schwaber",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80",
    description: "Learn Agile methodologies and how to effectively manage projects using the Scrum framework.",
    syllabus: [
      { week: 1, title: "Agile Principles", description: "The Agile manifesto." },
      { week: 2, title: "Scrum Framework", description: "Roles, events, and artifacts." },
      { week: 3, title: "Sprint Planning", description: "Estimating and user stories." }
    ],
    tags: ["Agile", "Scrum", "Management"]
  },
  {
    id: 30,
    title: "3D Modeling with Blender",
    category: "Design",
    level: "Intermediate",
    rating: 4.8,
    duration: "45 hours",
    instructor: "Andrew Price",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    description: "Create professional 3D models, animations, and renders using Blender.",
    syllabus: [
      { week: 1, title: "Blender Interface", description: "Navigation and basic tools." },
      { week: 2, title: "Modeling", description: "Polygonal modeling techniques." },
      { week: 3, title: "Texturing & Shading", description: "Materials and UV mapping." },
      { week: 4, title: "Animation & Rendering", description: "Keyframes and Cycles." }
    ],
    tags: ["Blender", "3D", "Design", "Animation"]
  }
];
