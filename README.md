# 📚 StudySync

> **Seamless Learning for Brighter Futures**

StudySync is a modern, responsive e-learning platform built with React and Vite. It provides a rich course catalog with advanced filtering, bookmarking capabilities, and a polished user experience — all wrapped in a clean, professional design.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## ✨ Features

- **🏠 Landing Page** — Eye-catching hero section with slide-in animations, trusted company logos, feature highlights, testimonials, and newsletter signup
- **📖 Course Catalog** — Browse 30+ courses across 15+ categories with rich thumbnails and metadata
- **🔍 Search & Filter** — Debounced search by title, instructor, or category with multi-filter dropdowns (category, difficulty, duration, rating)
- **📑 Course Details** — Detailed view with syllabus breakdown, tags, instructor info, and related course recommendations
- **🔖 Bookmarks** — Save courses with a single click; persisted to `localStorage` so bookmarks survive page refreshes
- **📱 Fully Responsive** — Mobile-first design with a collapsible hamburger menu and responsive grids
- **💀 Skeleton Loading** — Animated skeleton placeholders while content loads for a smooth UX
- **⬆️ Scroll to Top** — Floating button that appears on scroll for quick navigation
- **🔗 Client-Side Routing** — SPA navigation with React Router v7 and a shared layout (Header + Footer)
- **🎨 Custom Design System** — Tailwind CSS theme with custom colors, Inter font, and slide-in animations

---

## 🛠️ Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| **Framework**  | [React 19](https://react.dev/) with JSX                         |
| **Build Tool** | [Vite 8](https://vitejs.dev/)                                   |
| **Styling**    | [Tailwind CSS 4](https://tailwindcss.com/) + PostCSS + Autoprefixer |
| **Routing**    | [React Router DOM 7](https://reactrouter.com/)                  |
| **Font**       | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| **Language**   | JavaScript (ES Modules)                                         |

---

## 📂 Project Structure

```
study-sync/
├── public/
│   └── images/               # SVGs (logo, icons, socials) and static images
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Header.jsx        # Sticky nav with mobile hamburger menu
│   │   ├── Hero.jsx          # Landing hero section with CTA buttons
│   │   ├── Features.jsx      # Competitive advantage feature grid
│   │   ├── FeatureCard.jsx   # Individual feature card with color coding
│   │   ├── Testimonials.jsx  # Testimonial grid section
│   │   ├── TestimonialCard.jsx # Individual testimonial card
│   │   ├── TrustedCompanies.jsx # Trusted partners logo bar
│   │   ├── Newsletter.jsx    # Email newsletter signup section
│   │   ├── CourseCard.jsx     # Course card with bookmark toggle
│   │   ├── CourseSkeleton.jsx # Loading skeleton for course cards
│   │   ├── Footer.jsx        # Multi-column footer with social links
│   │   ├── Layout.jsx        # Shared layout (Header + Outlet + Footer)
│   │   └── ScrollToTop.jsx   # Floating scroll-to-top button
│   ├── pages/                # Route-level page components
│   │   ├── Home.jsx          # Landing page (Hero + Companies + Features + Testimonials + Newsletter)
│   │   ├── Courses.jsx       # Course catalog with search, filters, and grid
│   │   ├── CourseDetails.jsx # Individual course detail page with syllabus
│   │   ├── Bookmarks.jsx     # Saved/bookmarked courses page
│   │   ├── About.jsx         # About us page
│   │   └── NotFound.jsx      # 404 error page
│   ├── context/
│   │   └── BookmarksContext.jsx # React Context for bookmark state management
│   ├── hooks/
│   │   ├── useDebounce.js    # Debounce hook for search input
│   │   └── useLocalStorage.js # Hook to sync state with localStorage
│   ├── data/
│   │   ├── index.js          # Static data (companies, features, testimonials)
│   │   └── courses.js        # Course catalog data (30 courses)
│   ├── App.jsx               # Router configuration and route definitions
│   ├── main.jsx              # App entry point with providers
│   └── styles.css            # Global styles, Tailwind imports, and theme config
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS theme customization
├── postcss.config.js         # PostCSS plugin configuration
├── package.json              # Dependencies and scripts
└── .gitignore                # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or yarn / pnpm)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/harshpreet284/study-sync.git
   cd study-sync
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in your browser**

   Navigate to the URL shown in terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The production-ready files will be output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📜 Available Scripts

| Script            | Command             | Description                              |
| ----------------- | -------------------- | ---------------------------------------- |
| **Dev Server**    | `npm run dev`        | Start Vite dev server with HMR           |
| **Build**         | `npm run build`      | Build optimized production bundle        |
| **Preview**       | `npm run preview`    | Preview the production build locally     |

---

## 🗺️ Routes

| Path              | Page            | Description                          |
| ----------------- | --------------- | ------------------------------------ |
| `/`               | Home            | Landing page with hero and sections  |
| `/courses`        | Courses         | Full course catalog with filters     |
| `/course/:id`     | Course Details  | Detailed view of a specific course   |
| `/bookmarks`      | Bookmarks       | User's saved/bookmarked courses      |
| `/about`          | About           | About StudySync                      |
| `/contact`        | —               | Redirects to Home                    |
| `*`               | 404 Not Found   | Catch-all error page                 |

---

## 🎨 Design System

### Colors

| Token          | Hex       | Usage                    |
| -------------- | --------- | ------------------------ |
| `primary`      | `#6366F1` | Buttons, links, accents  |
| `accent`       | `#3F83F8` | Secondary actions        |
| `text`         | `#333333` | Primary text             |
| `link`         | `#2563EB` | Hover states             |
| `background`   | `#FFFFFF` | Page background          |
| `light-gray`   | `#F0F0F0` | Section backgrounds      |
| `gray`         | `#808080` | Secondary text           |
| `dark-gray`    | `#555555` | Tertiary text            |

### Typography

- **Font Family:** Inter (400, 500, 600, 700 weights)
- **Source:** Google Fonts

### Animations

- `slideFromLeft` — 1s ease slide-in animation used for hero and section reveals

---

## 📦 Course Categories

The platform includes **30 courses** spanning across these categories:

- Web Development
- Data Science
- Artificial Intelligence
- Mobile Development
- Design
- Security
- Cloud
- DevOps
- Backend Development
- Marketing
- Finance
- Game Development
- Technology
- Creative
- Business

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👤 Author

**harshpreet284** — [GitHub](https://github.com/harshpreet284)

---

<p align="center">
  Made with ❤️ using React + Vite + Tailwind CSS
</p>
