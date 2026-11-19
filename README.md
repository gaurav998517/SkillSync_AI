<div align="center">

# 🚀 SkillSync AI

### **AI-Powered Resume Screening & Smart Job Recommendation Platform**

<p align="center">
Match resumes with <b>real-world job opportunities</b> using <b>Transformer Embeddings</b>, <b>NLP</b>, and <b>Cosine Similarity</b>.
</p>

![GitHub stars](https://img.shields.io/github/stars/Sagarchhikara/SkillSync_Ai?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/Sagarchhikara/SkillSync_Ai?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-Express-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-Vite-blue?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?style=for-the-badge)

---

*"Helping recruiters find the right candidate and helping candidates find the right job through AI."*

</div>

---

# 📖 Overview

SkillSync AI is an **AI-powered Resume Screening and Job Recommendation Platform** that intelligently matches candidates with relevant **real-world job opportunities**.

Unlike traditional Applicant Tracking Systems (ATS) that rely on exact keyword matching, SkillSync AI understands the **semantic meaning** of resumes and job descriptions using **Transformer Models**.

The platform extracts technical skills, generates semantic embeddings, and calculates similarity using **Cosine Similarity**, producing highly accurate job recommendations along with detailed skill-gap analysis.

---

# ✨ Features

## 🤖 AI Powered Matching

- 📄 Resume Parsing (PDF & DOCX)
- 🧠 NLP-based Skill Extraction
- 🤖 Transformer Embeddings
- 📊 Cosine Similarity Matching
- 🎯 AI Job Recommendation Engine
- 📈 Match Percentage Score
- 🟢 Matched Skills
- 🔴 Missing Skills
- 💡 Explainable Recommendations

---

## 👨‍💻 User Features

- Secure Authentication
- Resume Upload
- Automatic Skill Extraction
- Browse Real Job Listings
- Save Favorite Jobs
- Personalized Dashboard
- Track Resume Match Scores

---

## 💼 Job Management

- Create New Jobs
- View Available Jobs
- Real Job Recommendations
- Dummy Job Seeder for Testing
- Bookmark Jobs

---

# 🧠 AI Pipeline

```
                 Resume
                    │
                    ▼
          Resume Text Extraction
                    │
                    ▼
           NLP Skill Extraction
                    │
                    ▼
        Transformer Embeddings
                    │
                    ▼
          Cosine Similarity Engine
                    │
                    ▼
      Rank Real Job Opportunities
                    │
                    ▼
      Match Score + Skill Analysis
```

---

# ⚙️ How It Works

### Step 1️⃣ Upload Resume

Upload your resume in PDF or DOCX format.

↓

### Step 2️⃣ Resume Parsing

The backend extracts text using

- pdf-parse
- mammoth

↓

### Step 3️⃣ NLP Processing

The extracted text is cleaned and analyzed.

The system identifies

- Programming Languages
- Frameworks
- Libraries
- Databases
- Cloud Platforms
- Tools
- Technologies

↓

### Step 4️⃣ Transformer Embeddings

Instead of comparing plain text, SkillSync AI converts both

- Resume
- Job Description

into dense semantic vectors using **Transformer Models**.

This allows the system to understand context and meaning rather than simple keyword overlap.

↓

### Step 5️⃣ Cosine Similarity

The semantic vectors are compared using **Cosine Similarity**.

A higher similarity score indicates a better match between the candidate and the job.

↓

### Step 6️⃣ Smart Recommendations

The platform ranks all available jobs and recommends the most relevant ones.

Each recommendation includes

- Match Percentage
- Matched Skills
- Missing Skills
- Overall Ranking

---

# 🚀 Why SkillSync AI?

Traditional ATS systems only compare keywords.

For example

Resume

```
NodeJS
```

Job Description

```
Node.js
```

Many ATS systems fail to recognize these as the same skill.

SkillSync AI goes beyond keyword matching by leveraging

- Transformer Models
- NLP
- Cosine Similarity

to understand the semantic meaning of both resumes and job descriptions.

This results in:

✅ Better recommendations

✅ Higher matching accuracy

✅ Explainable AI

✅ Reduced recruiter effort

---

# 🛠 Tech Stack

## Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Query

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Firebase Authentication
- Multer
- pdf-parse
- mammoth

---

## AI / Machine Learning

- Natural Language Processing (NLP)
- Transformer Models
- Semantic Embeddings
- Cosine Similarity
- Skill Normalization
- AI Recommendation Engine

---

# 📡 REST APIs

### Authentication

```
POST /api/auth/signup

POST /api/auth/login
```

---

### Resume

```
POST /api/resume/upload
```

---

### Jobs

```
GET /api/jobs

POST /api/jobs

POST /api/jobs/seed
```

---

### Matching

```
GET /api/match/auto/:userId

GET /api/match/:resumeId/:jobId
```

---

### Users

```
GET /api/users/:userId/profile

POST /api/users/:userId/jobs/:jobId

GET /api/users/:userId/jobs

DELETE /api/users/:userId/jobs/:jobId
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Sagarchhikara/SkillSync_Ai.git

cd SkillSync_Ai
```

---

## Backend

```bash
npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📂 Project Structure

```
SkillSync_AI

├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── assets
│
├── routes
├── controllers
├── middleware
├── models
├── utils
├── uploads
├── config
└── server.js
```

---

# 🔮 Future Improvements

- 🤖 LLM-based Resume Feedback
- 🎤 AI Mock Interviews
- 📈 Resume ATS Score
- 📄 Cover Letter Generator
- 🌍 LinkedIn Integration
- 🔍 Live Job API Integration
- 🧠 Personalized Career Suggestions
- 📊 Recruiter Analytics Dashboard

---

# 🤝 Contributors

Made with ❤️ by

- **Sagar Chhikara**
- **Karmanya Singh**
- **Gaurav Sharma**


---

<div align="center">

## ⭐ If you like this project, give it a Star!

**SkillSync AI — Making hiring smarter with AI. 🚀**

</div>
