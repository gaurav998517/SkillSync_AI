<div align="center">
  <h1>🚀 SkillSync AI</h1>
  <p><strong>A smart web application that evaluates resume-job compatibility using NLP-based skill extraction and cosine similarity matching.</strong></p>
</div>

---

## 📖 Overview

SkillSync AI helps streamline the recruitment and job-hunting process by analyzing uploaded resumes against job descriptions. By leveraging a robust backend NLP processing service, it extracts key technical skills, standardizes them, and calculates an accurate "Match Percentage" to help candidates and recruiters see at a glance how well a resume fits a role.

## ✨ Features

### Backend (Node.js/Express)
- **User Authentication:** Secure Signup and Login mechanisms with JWT-based sessions.
- **Resume Processing:**
  - Upload `.pdf` and `.docx` files easily via `multer`.
  - Extracts text natively using `pdf-parse` and `mammoth`.
  - Employs Dictionary-based NLP to extract technical skills and intelligently normalizes abbreviations (e.g., "NodeJS" -> "node.js").
- **Job Management:**
  - API support to create, fetch, and manage single or multiple jobs.
  - Handy "seed" endpoint for testing to quickly populate the database with realistic dummy job posts.
- **Smart Matching Engine:**
  - Analyzes the overlap between extracted resume skills and job requirements.
  - Generates a clear "Match Percentage" score.
  - Categorizes skills into "Matched" and "Missing" for actionable insights.
- **User Profiles & Saved Jobs:**
  - Automatically saves parsed skills and education details to user profiles.
  - Lets users bookmark their favorite job recommendations.

### Frontend (React/Vite/Tailwind + shadcn/ui)
- **Modern & Responsive UI:** Built with Tailwind CSS and shadcn/ui for a polished experience.
- **Landing & Auth Pages:** Welcoming landing, Login, and Signup forms.
- **Interactive Dashboard:**
  - **Overview Stats:** Visualize total uploaded resumes, jobs matched, and average match score.
  - **Resume Uploader:** Drag-and-drop interface for resumes with instant parsed skill display.
  - **Job Matching Analysis:** A fully fleshed-out view ranking jobs against your resume. Features a circular "Match Score" ring and a comparative "You Have" vs "Missing" skill breakdown.
  - **Job Management:** Simple form to create custom job postings or generate dummy data with one click.
  - **Saved Jobs:** Easily view and manage bookmarked roles.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** with **TypeScript** and **Vite** for fast, optimized builds.
- **Tailwind CSS** & **shadcn/ui** for modern, responsive components.
- **React Router** for seamless client-side routing.
- **React Query** for efficient state management and data fetching.

### Backend
- **Node.js** & **Express.js** for handling robust RESTful API endpoints.
- **MongoDB** with **Mongoose** for flexible schema-based data modeling.
- **Multer**, **pdf-parse**, **mammoth** for sophisticated file uploads and parsing.
- **Firebase Admin** for extended auth handling.

---

## 🧠 Core Logic: How It Works

1. **Resume Parsing:** Uploaded resumes hit the `POST /api/resume/upload` endpoint, where text is extracted depending on the file format (`pdf-parse` for PDFs, `mammoth` for DOCX).
2. **Skill Extraction:** The text is cleaned and run against a vast technical skill dictionary using boundary regex matching. Variations are automatically standardized to a single source of truth.
3. **Job Matching Algorithm:** `GET /api/match/auto/:userId` retrieves the user's latest parsed resume and runs it against system jobs. It calculates the intersection and difference of skill sets, applying the formula `(Total Matched / Total Required) * 100` to yield a match percentage.
4. **UI Representation:** The React frontend visualizes these metrics with intuitive scorecards and color-coded skill pills, offering immediate gap analysis.

---

## 📡 API Reference

### Authentication
- `POST /api/auth/signup` - Create a new account
- `POST /api/auth/login` - Authenticate user

### Resumes
- `POST /api/resume/upload` - Upload resume (multipart/form-data), extract text & skills

### Jobs
- `POST /api/jobs` - Create a job
- `GET /api/jobs` - Retrieve all jobs
- `POST /api/jobs/seed` - Clear and seed dummy jobs

### Matching
- `GET /api/match/auto/:userId` - Auto-match latest resume against all jobs
- `GET /api/match/:resumeId/:jobId` - Detailed match metric for a specific job

### Users
- `GET /api/users/:userId/profile` - Retrieve user profile and skills
- `POST /api/users/:userId/jobs/:jobId` - Bookmark a job
- `GET /api/users/:userId/jobs` - Retrieve bookmarked jobs
- `DELETE /api/users/:userId/jobs/:jobId` - Remove bookmarked job

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)
- Firebase Project Setup (for extended Auth)

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sagarchhikara/SkillSync_Ai.git
   cd SkillSync_Ai
   ```

2. **Backend Setup:**
   - The backend runs from the root of the project.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file in the root directory and add:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     FIREBASE_PROJECT_ID=your_firebase_project_id
     FIREBASE_CLIENT_EMAIL=your_firebase_client_email
     FIREBASE_PRIVATE_KEY=your_firebase_private_key
     ```
   - Start the backend server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup:**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file in the `frontend` directory and add:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
   - Start the Vite development server:
     ```bash
     npm run dev
     ```

---

## 🌍 Deployment

For detailed deployment instructions for Vercel (Frontend) and Render (Backend), please refer to our [Deployment Guide](DEPLOYMENT_GUIDE.md).

---

<div align="center">
  <p>Built with ❤️ for better job matching.</p>
</div>
