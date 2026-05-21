<h1 align="center">
  <br>
  🚀 NextHire
  <br>
</h1>

<h4 align="center">A full-stack job portal platform connecting candidates, employers, coordinators, and recruiters — built with React.js and Node.js.</h4>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Known Limitations](#-known-limitations)
- [License](#-license)

---

## 🌐 Overview

**NextHire** is a comprehensive job portal web application designed to streamline the entire hiring workflow — from job posting and candidate applications to structured recruiter evaluations. It supports four distinct user roles with a clean, role-based dashboard experience, real-time messaging, a social post feed, and OTP-based authentication.

---

## ✨ Features

### 👤 For Candidates
- Browse, search, and filter job listings
- View detailed job descriptions and company profiles
- Apply for jobs with resume upload (via ImageKit CDN)
- Real-time application status tracking
- Personal dashboard with application statistics
- In-app messaging with employers/recruiters
- Social feed to follow company/job updates

### 🏢 For Employers
- Create and manage company profiles with logo upload
- Post, update, and delete job listings (rich text editor)
- View and manage incoming applications
- Add coordinators and recruiters to their hiring team
- Dashboard with hiring metrics and shortlisted candidates

### 🗂️ For Coordinators
- View all jobs posted by their company
- Assign recruiters to specific jobs
- Create custom feedback forms for recruiters
- Track overall hiring pipeline progress

### 📋 For Recruiters
- Review applications assigned to them
- Evaluate candidates using structured feedback forms
- Shortlist or reject candidates with comments
- Download and view candidate resumes

### 💬 Real-Time Messaging
- Live one-on-one chat powered by Socket.IO
- Message delivery and "seen" status indicators
- Typing indicators
- Online presence detection

### 🔔 Other Platform Features
- Notification system for application updates
- Social post feed (like LinkedIn-style posts)
- Global search across jobs, companies, and users
- OTP-based email verification via Nodemailer
- Rate limiting for API protection
- Support ticket system

---

## 🛠 Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router DOM 6 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling |
| React Hook Form | Form management & validation |
| React Quill | Rich text editor for job descriptions |
| Socket.IO Client | Real-time messaging |
| Firebase | Additional auth/storage services |
| React Toastify | Toast notifications |
| Moment.js | Date/time formatting |
| Country-State-City | Location selector |
| React Icons / Boxicons | Icon libraries |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.IO | Real-time bidirectional events |
| JWT (jsonwebtoken) | Stateless authentication |
| Bcrypt.js | Password hashing |
| Multer | File upload middleware |
| ImageKit | CDN-based file/image storage |
| Nodemailer | Email delivery (OTP) |
| OTP Generator | One-time password generation |
| Express Rate Limit | API rate limiting |
| Cookie Parser | Cookie-based session support |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```
NextHire/
├── client/                        # React Frontend
│   ├── public/
│   └── src/
│       ├── assets/                # Static images & icons
│       ├── components/            # Shared/reusable components
│       │   ├── ContextProvider/   # Global state (auth, user context)
│       │   ├── Home/              # Landing page components (FeaturedJobs, JobDetails...)
│       │   ├── AllPostedJobs.js
│       │   ├── SimilarJobs.js
│       │   ├── ShortlistedCandidates.js
│       │   └── ShortlistedDetails.js
│       ├── Pages/                 # Role-based page views
│       │   ├── Candidate/
│       │   ├── Coordinator/
│       │   ├── Employer/
│       │   └── Recruiter/
│       ├── Router/                # Route definitions & guards
│       ├── App.js
│       └── index.js
│
├── server/                        # Node.js Backend
│   ├── config/
│   │   └── connectDB.js           # MongoDB connection
│   ├── controllers/               # Business logic
│   │   ├── Application/
│   │   ├── Auth/
│   │   ├── Chat/
│   │   ├── Company/
│   │   ├── Job/
│   │   ├── Message/
│   │   ├── Notification/
│   │   ├── Post/
│   │   ├── Recruiter/
│   │   ├── Search/
│   │   ├── Support/
│   │   └── User/
│   ├── middleware/                # Auth & validation middleware
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express route files
│   │   ├── Auth.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── companyRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recruiterRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── postRoutes.js
│   │   ├── searchRoutes.js
│   │   ├── supportRoutes.js
│   │   └── fileUploadRoute.js
│   ├── uploads/                   # Temporary local upload buffer
│   └── index.js                   # App entry point + Socket.IO setup
│
├── FIXES_APPLIED.md               # Bug fixes documentation
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+
- **npm** v9+
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An **ImageKit** account for file uploads
- A **Gmail** account (or SMTP provider) for Nodemailer OTP emails

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/NextHire.git
cd NextHire
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## 🔐 Environment Variables

### Server (`/server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexthire
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000

# ImageKit (for file/resume uploads)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Nodemailer (for OTP emails)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Client (`/client/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

> **Note:** Never commit `.env` files to version control. They are already listed in `.gitignore`.

---

## ▶️ Running the App

Open two terminal windows:

**Terminal 1 — Start the Backend:**
```bash
cd server
npm run dev
```
> Server runs at: `http://localhost:5000`

**Terminal 2 — Start the Frontend:**
```bash
cd client
npm run dev
```
> Client runs at: `http://localhost:3000`

### Health Check
```
GET http://localhost:5000/api/health
```

---

## 📡 API Reference

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and receive JWT |
| `POST` | `/logout` | Invalidate session |
| `GET` | `/me` | Get authenticated user info |
| `POST` | `/send-otp` | Send OTP to email |
| `POST` | `/verify-otp` | Verify OTP |

### 💼 Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/all-jobs` | Fetch all job listings |
| `GET` | `/current-job/:id` | Get job by ID |
| `GET` | `/by-company/:companyId` | Get jobs by company |
| `POST` | `/post-job` | Create a new job (Employer) |
| `PUT` | `/update-job/:id` | Update job listing |
| `DELETE` | `/delete-job/:id` | Delete job listing |

### 🏢 Companies (`/api/company`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/all-companies` | Get all companies |
| `GET` | `/company/:id` | Get company by ID |
| `POST` | `/create` | Create a company |
| `PUT` | `/update/:id` | Update company profile |
| `POST` | `/add-member/:id` | Add coordinator/recruiter |
| `POST` | `/remove-member/:id` | Remove team member |

### 📄 Applications (`/api/application`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/post-application` | Submit a job application |
| `GET` | `/all-application` | Get all applications |
| `GET` | `/my-applications` | Get current user's applications |
| `GET` | `/get-application/:id` | Get application by ID |

### 👥 Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/all-users` | Get all users |
| `GET` | `/user/:id` | Get user by ID |
| `PUT` | `/update-user/:id` | Update user profile |

### 💬 Chat & Messages (`/api/chat`, `/api/message`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Create or get existing chat |
| `GET` | `/chat/user-chats` | Get all chats for current user |
| `GET` | `/message/:chatId` | Get messages for a chat |
| `POST` | `/message` | Send a new message |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get user notifications |
| `PUT` | `/:id/read` | Mark notification as read |

### 📰 Posts (`/api/posts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all posts (feed) |
| `POST` | `/create` | Create a new post |
| `PUT` | `/like/:id` | Like/unlike a post |
| `DELETE` | `/:id` | Delete a post |

### 🔍 Search (`/api/search`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Global search (jobs, companies, users) |

### 📎 File Upload (`/api/upload`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/resume` | Upload resume to ImageKit |
| `POST` | `/image` | Upload image to ImageKit |

---

## 👥 User Roles

| Role | Access Level | Key Capabilities |
|------|-------------|-----------------|
| **Candidate** | Public | Browse jobs, apply, chat, track applications |
| **Employer** | Company Owner | Post jobs, manage team, view applications |
| **Coordinator** | Company Member | Assign recruiters, create feedback forms |
| **Recruiter** | Company Member | Review applications, shortlist candidates |

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `addUser` | Client → Server | Register user presence |
| `sendMessage` | Client → Server | Send a chat message |
| `getMessage` | Server → Client | Receive a chat message |
| `messageDelivered` | Client → Server | Acknowledge message delivery |
| `messageSeen` | Client → Server | Acknowledge message seen |
| `messageStatusUpdate` | Server → Client | Broadcast status change |
| `typing` | Client → Server | Notify typing started |
| `stopTyping` | Client → Server | Notify typing stopped |
| `disconnect` | Client → Server | Remove user from presence map |

---

## ⚠️ Known Limitations

- Resume/file upload requires ImageKit credentials for production
- Company logo uses URL input (direct file upload not supported)
- Email verification flow depends on Gmail SMTP / app password setup
- Password reset is not yet implemented
- No pagination on large data sets (planned improvement)

---

## 🔮 Roadmap

- [ ] Password reset via email
- [ ] Pagination & infinite scroll for job listings
- [ ] Loading skeleton screens
- [ ] Real-time notifications via Socket.IO
- [ ] Mobile responsive improvements
- [ ] Admin panel
- [ ] Search/filter result caching
- [ ] React Error Boundaries for better UX

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

<p align="center">Made with ❤️ for college project — NextHire</p>
