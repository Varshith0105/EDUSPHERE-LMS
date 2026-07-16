# EduSphere AI — Online Learning Management System

A **production-ready, Azure-ready** Learning Management System built with React 19, TypeScript, Spring Boot 3, and Java 21.

---

## 🚀 Features

### Student Portal
- Browse and search the course catalog with category filters
- Enroll in courses and track progress per lesson
- Interactive video player with notes, bookmarks, and resume
- Download PDFs and visit external learning resources
- Take timed quizzes with negative marking support and detailed review
- Submit assignments with deadline enforcement
- Participate in course-specific discussion forums
- Leaderboard with XP and streak system (Gamification)
- Auto-generated verifiable certificates (UUID + QR code) on course completion

### Instructor Portal
- Full course builder with outcomes, requirements, pricing, and media
- Weekly enrollment and monthly revenue charts
- Course status management (Draft → Pending → Published)
- Grade student assignment submissions with feedback

### Admin Portal
- Platform KPI dashboard (Students, Instructors, Revenue, Courses)
- Student growth and category distribution charts
- Course approval queue (Approve / Reject pending submissions)
- User management with role filtering

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS + Framer Motion |
| Charts | Recharts |
| State | React Query + Context API |
| HTTP | Axios (JWT interceptors) |
| Backend | Spring Boot 3.3.1 + Java 21 |
| Auth | Spring Security + JWT (JJWT) |
| ORM | Spring Data JPA + Hibernate |
| Database | H2 (dev) / MySQL (prod) |
| Docs | SpringDoc OpenAPI (Swagger) |
| Cloud | Azure VM / Azure SQL / Azure CDN |

---

## 📂 Project Structure

```
edusphere-lms/
├── backend/                  # Spring Boot 3 API
│   ├── src/main/java/com/edusphere/
│   │   ├── config/           # SecurityConfig, OpenApiConfig
│   │   ├── controller/       # REST Controllers
│   │   ├── dto/              # Request/Response DTOs
│   │   ├── exception/        # GlobalExceptionHandler
│   │   ├── model/            # JPA Entities
│   │   ├── repository/       # Spring Data Repositories
│   │   ├── security/         # JWT Utils, Filters
│   │   └── service/          # Business Logic Services
│   └── src/main/resources/
│       ├── application.yml
│       └── db/schema-h2.sql
│
├── frontend/                 # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/       # DashboardLayout
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── student/      # Dashboard, VideoPlayer, Quiz, etc.
│   │   │   ├── instructor/   # Dashboard, CourseBuilder
│   │   │   └── admin/        # AdminDashboard, AdminUsers
│   │   └── services/         # api.ts (Axios client)
│   └── public/
│
└── docker-compose.yml        # Local development orchestration
```

---

## 🔧 Local Development Setup

### Prerequisites
- **Java 21** (JDK)
- **Maven 3.8+**
- **Node.js 20+** (with npm)

### 1. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot API will start on **http://localhost:8080**

- Swagger UI: http://localhost:8080/swagger-ui/index.html
- H2 Console: http://localhost:8080/h2-console

> JDBC URL: `jdbc:h2:mem:eduspheredb`  
> Username: `sa` | Password: `password`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app will start on **http://localhost:5173**

API requests are proxied through Vite to `http://localhost:8080`.

---

## 🔑 Seed Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password123` |
| Instructor | `instructor_jane` | `password123` |
| Student | `student_john` | `password123` |
| Student | `student_alice` | `password123` |

---

## 🌐 REST API Reference

> Full documentation available at: `http://localhost:8080/swagger-ui/index.html`

### Auth Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user, receive JWT |
| `POST` | `/api/auth/register` | Register new user |
| `GET`  | `/api/auth/profile` | Get current user info |

### Courses Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/courses` | List all courses (filter by status/category/search) |
| `GET`  | `/api/courses/{id}` | Get course details |
| `POST` | `/api/courses` | Create a course (Instructor/Admin) |
| `PUT`  | `/api/courses/{id}/status` | Approve/reject course (Admin) |
| `GET`  | `/api/courses/{id}/lessons` | List course lessons |
| `POST` | `/api/courses/{id}/lessons` | Add lesson to course (Instructor) |

### LMS Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/lms/enroll` | Enroll in a course |
| `GET`  | `/api/lms/courses/{id}/lessons-with-progress` | Get lessons with student progress |
| `PUT`  | `/api/lms/lessons/{id}/progress` | Update lesson progress |
| `GET`  | `/api/lms/courses/{id}/quiz` | Get course quiz |
| `POST` | `/api/lms/quizzes/{id}/submit` | Submit quiz answers |
| `GET`  | `/api/lms/courses/{id}/assignments` | List course assignments |
| `POST` | `/api/lms/assignments/{id}/submit` | Submit assignment |
| `GET`  | `/api/lms/courses/{id}/certificate` | Get completion certificate |
| `GET`  | `/api/lms/courses/{id}/forum` | Get forum threads |
| `POST` | `/api/lms/courses/{id}/forum` | Create forum thread |

### Analytics Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/analytics/dashboard` | Platform KPI metrics |

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

---

## ☁️ Azure Deployment (Production)

1. **Azure SQL** — Change `application.yml` to point to your Azure SQL database URL
2. **Azure VM** — Deploy the Spring Boot JAR via `java -jar edusphere-lms.jar`
3. **Azure Blob Storage** — Store course video/PDF uploads
4. **Azure CDN** — Serve React frontend static files
5. **Azure Monitor** — Enable Application Insights for telemetry

---

## 🎮 Gamification System

| Action | XP Awarded |
|--------|-----------|
| Enroll in a course | +50 XP |
| Complete a lesson | +20 XP |
| Complete all lessons | +200 XP |
| Pass a quiz | +100 XP |
| Attempt a quiz (fail) | +10 XP |
| Submit an assignment | +40 XP |
| Receive A/B grade | +50 XP |
| Reply to a forum | +15 XP |

---

## 📜 License

MIT License — Free to use, modify, and distribute.
