# 🎓 EduSphere AI — Modern Learning Management System

> **A production-ready, full-stack Learning Management System (LMS)** built using **React 19, TypeScript, Spring Boot 3, Java 21**, and designed with scalable architecture for online education.

---

## ✨ Overview

EduSphere AI is a modern LMS that enables students, instructors, and administrators to manage the complete online learning lifecycle. The project follows a clean full-stack architecture with a React frontend and Spring Boot backend.

> **Repository Status:** This repository currently includes the project structure, frontend application, backend foundation, dashboards, and core LMS pages. Some enterprise features described below are planned and under active development.

---

# 🚀 Features

## 👨‍🎓 Student

- Authentication
- Student Dashboard
- Browse Courses
- Course Learning Pages
- Video Learning
- Quiz Module
- Assignment Module
- Certificate Page
- Leaderboard
- Learning Progress

## 👨‍🏫 Instructor

- Instructor Dashboard
- Course Builder
- Manage Courses
- Student Monitoring
- Analytics (UI)

## 👨‍💼 Admin

- Admin Dashboard
- User Management
- Course Monitoring
- Platform Statistics

---

# 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Backend | Spring Boot 3.3.1 |
| Language | Java 21 |
| Security | Spring Security + JWT |
| Database | H2 / MySQL |
| ORM | Spring Data JPA |
| API Docs | Swagger / OpenAPI |
| HTTP | Axios |

---

# 📁 Project Structure

```text
edusphere-lms/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── instructor/
│   │   │   └── admin/
│   │   └── services/
│   └── package.json
│
└── docker-compose.yml
```

---

# ⚙️ Installation

## Backend

```bash
cd backend
mvn spring-boot:run
```

Backend

```
http://localhost:8080
```

Swagger

```
http://localhost:8080/swagger-ui/index.html
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 👥 User Roles

- Student
- Instructor
- Admin

---

# 📈 Planned Features

- AI Course Recommendations
- AI Quiz Generator
- AI Learning Assistant
- Azure Deployment
- Email Notifications
- Video Streaming
- Certificate Verification
- Discussion Forums
- Assignment Evaluation
- Gamification
- Payment Integration

---

# 🐳 Docker

```bash
docker-compose up --build
```

---

# 🌐 Future Cloud Deployment

- Azure VM
- Azure SQL
- Azure Blob Storage
- Azure CDN
- Azure Monitor

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📜 License

MIT License

---

# 👨‍💻 Author

**Varshith Julakanti**

B.Tech CSE (AI & ML)

VIT-AP University

---

⭐ If you like this project, consider giving it a star.
