-- SQL Server-compatible schema and seed data for Azure SQL Database

-- 1. Drop existing tables if they exist
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
IF OBJECT_ID('dbo.certificates', 'U') IS NOT NULL DROP TABLE dbo.certificates;
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID('dbo.forum_replies', 'U') IS NOT NULL DROP TABLE dbo.forum_replies;
IF OBJECT_ID('dbo.forums', 'U') IS NOT NULL DROP TABLE dbo.forums;
IF OBJECT_ID('dbo.assignment_submissions', 'U') IS NOT NULL DROP TABLE dbo.assignment_submissions;
IF OBJECT_ID('dbo.assignments', 'U') IS NOT NULL DROP TABLE dbo.assignments;
IF OBJECT_ID('dbo.quiz_attempts', 'U') IS NOT NULL DROP TABLE dbo.quiz_attempts;
IF OBJECT_ID('dbo.questions', 'U') IS NOT NULL DROP TABLE dbo.questions;
IF OBJECT_ID('dbo.quizzes', 'U') IS NOT NULL DROP TABLE dbo.quizzes;
IF OBJECT_ID('dbo.lesson_progress', 'U') IS NOT NULL DROP TABLE dbo.lesson_progress;
IF OBJECT_ID('dbo.enrollments', 'U') IS NOT NULL DROP TABLE dbo.enrollments;
IF OBJECT_ID('dbo.lessons', 'U') IS NOT NULL DROP TABLE dbo.lessons;
IF OBJECT_ID('dbo.courses', 'U') IS NOT NULL DROP TABLE dbo.courses;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL DROP TABLE dbo.categories;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;

-- 2. Create Tables

CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_picture_url VARCHAR(255),
    role_id INT NOT NULL FOREIGN KEY REFERENCES roles(id),
    is_verified BIT DEFAULT 0,
    xp_points INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    last_login_date DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE categories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id BIGINT NULL FOREIGN KEY REFERENCES categories(id)
);

CREATE TABLE courses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    description NVARCHAR(MAX),
    thumbnail_url VARCHAR(255),
    trailer_url VARCHAR(255),
    price DECIMAL(18,2) DEFAULT 0.00,
    is_free BIT DEFAULT 0,
    learning_outcomes NVARCHAR(2000),
    requirements NVARCHAR(2000),
    duration_hours INT,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, PUBLISHED
    instructor_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    category_id BIGINT FOREIGN KEY REFERENCES categories(id),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE lessons (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    title VARCHAR(150) NOT NULL,
    content NVARCHAR(MAX),
    video_url VARCHAR(255),
    pdf_url VARCHAR(255),
    image_url VARCHAR(255),
    ppt_url VARCHAR(255),
    word_url VARCHAR(255),
    zip_url VARCHAR(255),
    audio_url VARCHAR(255),
    code_examples NVARCHAR(MAX),
    external_links NVARCHAR(MAX),
    estimated_minutes INT,
    sort_order INT NOT NULL,
    is_draft BIT DEFAULT 0,
    is_visible BIT DEFAULT 1
);

CREATE TABLE enrollments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    student_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    enrolled_at DATETIME DEFAULT GETDATE(),
    progress_percentage DECIMAL(18,2) DEFAULT 0.00,
    completed BIT DEFAULT 0,
    completed_at DATETIME NULL,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE TABLE lesson_progress (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    enrollment_id BIGINT NOT NULL FOREIGN KEY REFERENCES enrollments(id),
    lesson_id BIGINT NOT NULL FOREIGN KEY REFERENCES lessons(id),
    completed BIT DEFAULT 0,
    bookmarked BIT DEFAULT 0,
    notes NVARCHAR(MAX),
    last_watched_seconds INT DEFAULT 0,
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT uq_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE quizzes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    title VARCHAR(150) NOT NULL,
    time_limit_minutes INT DEFAULT 0,
    negative_marking BIT DEFAULT 0,
    passing_score INT DEFAULT 60,
    attempts_limit INT DEFAULT 1,
    show_score_immediately BIT DEFAULT 1,
    show_correct_answers BIT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'DRAFT'
);

CREATE TABLE questions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    quiz_id BIGINT NOT NULL FOREIGN KEY REFERENCES quizzes(id),
    question_text NVARCHAR(MAX) NOT NULL,
    options NVARCHAR(2000) NOT NULL, -- Stored as JSON string
    correct_option_index INT NOT NULL,
    explanation NVARCHAR(MAX),
    type VARCHAR(30) DEFAULT 'MCQ_SINGLE',
    correct_option_indices VARCHAR(500),
    correct_answer_text NVARCHAR(MAX),
    image_url VARCHAR(255),
    sort_order INT DEFAULT 0
);

CREATE TABLE quiz_attempts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    student_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    quiz_id BIGINT NOT NULL FOREIGN KEY REFERENCES quizzes(id),
    score INT NOT NULL,
    passed BIT NOT NULL,
    completed_at DATETIME DEFAULT GETDATE(),
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    duration_seconds INT NULL,
    raw_score DECIMAL(18,2) NULL,
    negative_marks DECIMAL(18,2) NULL,
    percentage DECIMAL(18,2) NULL,
    attempt_number INT NULL
);

CREATE TABLE assignments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    title VARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    file_url VARCHAR(255),
    deadline DATETIME NOT NULL,
    max_marks INT DEFAULT 100,
    rubrics NVARCHAR(MAX)
);

CREATE TABLE assignment_submissions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    assignment_id BIGINT NOT NULL FOREIGN KEY REFERENCES assignments(id),
    student_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    submission_file_url VARCHAR(255) NOT NULL,
    submitted_at DATETIME DEFAULT GETDATE(),
    grade VARCHAR(10) NULL,
    feedback NVARCHAR(MAX) NULL,
    graded_by BIGINT NULL FOREIGN KEY REFERENCES users(id),
    marks_obtained INT NULL
);

CREATE TABLE forums (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    is_pinned BIT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE forum_replies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    forum_id BIGINT NOT NULL FOREIGN KEY REFERENCES forums(id),
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    content NVARCHAR(MAX) NOT NULL,
    is_instructor_reply BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    student_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    rating INT NOT NULL,
    comment NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT uq_course_student_review UNIQUE (course_id, student_id)
);

CREATE TABLE certificates (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    enrollment_id BIGINT NOT NULL UNIQUE FOREIGN KEY REFERENCES enrollments(id),
    certificate_uuid VARCHAR(100) NOT NULL UNIQUE,
    issued_at DATETIME DEFAULT GETDATE(),
    qr_code_url VARCHAR(255)
);

CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE payments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    student_id BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    course_id BIGINT NOT NULL FOREIGN KEY REFERENCES courses(id),
    amount DECIMAL(18,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'COMPLETED',
    transaction_reference VARCHAR(100),
    created_at DATETIME DEFAULT GETDATE()
);

-- 3. Seed Roles
SET IDENTITY_INSERT roles ON;
INSERT INTO roles (id, name) VALUES (1, 'ROLE_STUDENT');
INSERT INTO roles (id, name) VALUES (2, 'ROLE_INSTRUCTOR');
INSERT INTO roles (id, name) VALUES (3, 'ROLE_ADMIN');
SET IDENTITY_INSERT roles OFF;

-- 4. Seed Users (Password is 'password123' bcrypt hash)
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, username, email, password, first_name, last_name, profile_picture_url, role_id, is_verified, xp_points, streak_count) VALUES
(1, 'admin', 'admin@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'System', 'Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 3, 1, 0, 0),
(2, 'instructor_jane', 'jane@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'Jane', 'Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', 2, 1, 150, 4),
(3, 'student_john', 'john@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'John', 'Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 1, 1, 1250, 5),
(4, 'student_alice', 'alice@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'Alice', 'Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 1, 1, 450, 2);
SET IDENTITY_INSERT users OFF;

-- 5. Seed Categories
SET IDENTITY_INSERT categories ON;
INSERT INTO categories (id, name, parent_category_id) VALUES
(1, 'Computer Science', NULL),
(2, 'Web Development', 1),
(3, 'Artificial Intelligence', 1),
(4, 'Business & Finance', NULL),
(5, 'Marketing', 4);
SET IDENTITY_INSERT categories OFF;

-- 6. Seed Courses
SET IDENTITY_INSERT courses ON;
INSERT INTO courses (id, title, subtitle, description, thumbnail_url, trailer_url, price, is_free, learning_outcomes, requirements, duration_hours, status, instructor_id, category_id) VALUES
(1, 'Introduction to React & TypeScript', 'Build scalable, type-safe web applications from scratch.', 'Learn React 19, TypeScript, state management, hooks, and routing. Integrate Shadcn UI components and TailwindCSS to create stunning interactive web layouts.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 49.99, 0, '["Understand React 19 fundamentals", "Master TypeScript types and interfaces in React", "Use TailwindCSS and Shadcn UI components", "Manage state with React Query and Context"]', 'Basic knowledge of HTML, CSS, and Javascript.', 12, 'PUBLISHED', 2, 2),
(2, 'Mastering Spring Boot 3 & Java 21', 'Develop high-performance, secure backend microservices.', 'Deep dive into Spring Security, JWT, Data JPA, validations, and cloud deployment options on Azure. Create a robust enterprise grade REST API from scratch.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 99.99, 0, '["Build production-ready REST APIs", "Implement Spring Security and JWT authentication", "Understand Hibernate and Spring Data JPA relationships", "Deploy Spring Boot applications to Azure VMs"]', 'Basic knowledge of Java programming language.', 20, 'PUBLISHED', 2, 1),
(3, 'Generative AI & LLM Foundations', 'Introduction to Prompt Engineering, OpenAI APIs, and Azure Cognitive Services.', 'An introductory course to GenAI. Understand transformer architectures, build smart assistants, and integrate vector databases.', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 0.00, 1, '["Understand Large Language Models", "Learn prompt engineering patterns", "Interact with OpenAI and Azure OpenAI endpoints", "Build RAG systems"]', 'No programming experience required.', 6, 'PUBLISHED', 2, 3);
SET IDENTITY_INSERT courses OFF;

-- 7. Seed Lessons
SET IDENTITY_INSERT lessons ON;
INSERT INTO lessons (id, course_id, title, content, video_url, pdf_url, image_url, code_examples, external_links, estimated_minutes, sort_order) VALUES
(1, 1, 'Course Introduction & Setup', 'Welcome to the React & TypeScript course. In this lesson, we will initialize our project using Vite, configure Tailwind CSS, and set up our TypeScript config.', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://www.w3schools.com/html/html_intro.asp', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=400', 'npm create vite@latest my-app -- --template react-ts\ncd my-app\nnpm install -D tailwindcss postcss autoprefixer', '["https://react.dev", "https://typescriptlang.org"]', 15, 1),
(2, 1, 'Understanding Components and Props', 'Components are the building blocks of React. Here we explore functional components, JSX, and strict TypeScript types for Props.', 'https://www.w3schools.com/html/movie.mp4', NULL, NULL, 'interface ButtonProps {\n  label: string;\n  onClick: () => void;\n}\n\nexport const Button = ({ label, onClick }: ButtonProps) => (\n  <button onClick={onClick}>{label}</button>\n);', '["https://react.dev/learn/passing-props-to-a-component"]', 30, 2),
(3, 1, 'Advanced Hooks & React Query', 'Learn how to fetch data asynchronously using Axios and React Query, handling states, cache invalidation, and custom hooks.', 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, NULL, 'import { useQuery } from "@tanstack/react-query";\nimport axios from "axios";\n\nconst fetchCourses = () => axios.get("/api/courses").then(res => res.data);\nconst { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });', '["https://tanstack.com/query/latest"]', 45, 3),
(4, 2, 'Spring Boot 3 Project Initialization', 'Create a new project using Spring Initializr. Include dependencies for Web, Data JPA, Security, Lombok, and MySQL Driver.', 'https://www.w3schools.com/html/movie.mp4', NULL, NULL, '<dependency>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-web</artifactId>\n</dependency>', '["https://start.spring.io"]', 20, 1);
SET IDENTITY_INSERT lessons OFF;

-- 8. Seed Enrollments
SET IDENTITY_INSERT enrollments ON;
INSERT INTO enrollments (id, student_id, course_id, enrolled_at, progress_percentage, completed) VALUES
(1, 3, 1, '2026-07-08 10:00:00', 33.33, 0),
(2, 3, 2, '2026-07-09 14:00:00', 0.00, 0),
(3, 4, 1, '2026-07-09 15:30:00', 100.00, 1);
SET IDENTITY_INSERT enrollments OFF;

-- 9. Seed Lesson Progress
INSERT INTO lesson_progress (enrollment_id, lesson_id, completed, bookmarked, notes, last_watched_seconds) VALUES
(1, 1, 1, 0, 'Vite setup matches user requirements.', 900),
(1, 2, 0, 1, 'Need to review generics in props typing.', 0),
(3, 1, 1, 0, 'Completed setup', 900),
(3, 2, 1, 0, 'Mastered props structure', 1800),
(3, 3, 1, 0, 'Axios client integrated correctly.', 2700);

-- 10. Seed Quizzes
SET IDENTITY_INSERT quizzes ON;
INSERT INTO quizzes (id, course_id, title, time_limit_minutes, negative_marking, passing_score) VALUES
(1, 1, 'React & TypeScript Fundamentals Quiz', 10, 1, 70),
(2, 2, 'Spring Security & JPA Quiz', 15, 0, 60);
SET IDENTITY_INSERT quizzes OFF;

-- 11. Seed Questions
SET IDENTITY_INSERT questions ON;
INSERT INTO questions (id, quiz_id, question_text, options, correct_option_index, explanation) VALUES
(1, 1, 'Which version of React introduces the new compiler and transition improvements?', '["React 16", "React 17", "React 18", "React 19"]', 3, 'React 19 introduces React Compiler, Server Actions, and document metadata support.'),
(2, 1, 'How do you define a type for a React component props that includes children?', '["interface Props { children: ReactNode }", "interface Props { children: string }", "interface Props { childs: any }", "interface Props { children: HTMLDivElement }"]', 0, 'ReactNode is the standard type in @types/react for representing children.'),
(3, 1, 'What is the purpose of React Query (TanStack Query)?', '["Routing", "Global state management for forms", "Server state caching and sync", "CSS Animations"]', 2, 'React Query is designed for caching, syncing and updating server state in web apps.');
SET IDENTITY_INSERT questions OFF;

-- 12. Seed Quiz Attempts
SET IDENTITY_INSERT quiz_attempts ON;
INSERT INTO quiz_attempts (id, student_id, quiz_id, score, passed) VALUES
(1, 3, 1, 66, 0),
(2, 4, 1, 100, 1);
SET IDENTITY_INSERT quiz_attempts OFF;

-- 13. Seed Certificates
SET IDENTITY_INSERT certificates ON;
INSERT INTO certificates (id, enrollment_id, certificate_uuid, qr_code_url) VALUES
(1, 3, 'cert-uuid-1111-2222-3333', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://edusphere.com/verify/cert-uuid-1111-2222-3333');
SET IDENTITY_INSERT certificates OFF;

-- 14. Seed Forums
SET IDENTITY_INSERT forums ON;
INSERT INTO forums (id, course_id, user_id, title, content, is_pinned, likes_count) VALUES
(1, 1, 3, 'TypeScript type error with React Query useQuery', 'I am getting a TypeScript error when trying to map response.data to CourseDto. How can I strictly type useQuery returns?', 0, 5),
(2, 1, 2, 'React 19 Cheat Sheet and Reference Guide', 'This pinned discussion thread contains links to official React 19 upgrades and documentation. Check here before posting setup issues.', 1, 24);
SET IDENTITY_INSERT forums OFF;

-- 15. Seed Forum Replies
SET IDENTITY_INSERT forum_replies ON;
INSERT INTO forum_replies (id, forum_id, user_id, content, is_instructor_reply) VALUES
(1, 1, 2, 'You should pass the DTO type as a generic parameter: useQuery<CourseDto, Error>({ queryKey, queryFn }). This guarantees res.data is typed correctly.', 1);
SET IDENTITY_INSERT forum_replies OFF;

-- 16. Seed Reviews
INSERT INTO reviews (course_id, student_id, rating, comment) VALUES
(1, 3, 5, 'Absolutely loved the course! The TypeScript layout and Shadcn UI examples were perfect.'),
(1, 4, 4, 'Very good introduction. Wish it had more code exercises.');

-- 17. Seed Notifications
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(3, 'Welcome to React & TS Course!', 'You have successfully enrolled in Introduction to React & TypeScript. Happy learning!', 1),
(3, 'Quiz Graded', 'Your React & TS Fundamentals Quiz attempt scored 66%. Keep practicing to pass!', 0),
(2, 'New Forum Question', 'Student John Smith posted a new thread in React & TS: "TypeScript type error with React Query useQuery"', 0);

-- 18. Seed Assignments
SET IDENTITY_INSERT assignments ON;
INSERT INTO assignments (id, course_id, title, description, file_url, deadline) VALUES
(1, 1, 'Build a Responsive Card Deck using Shadcn UI', 'Create a React + TS page displaying a responsive grid of course card elements. Include animations using Framer Motion and state matching.', 'https://edusphere.com/assignments/react-card-deck.pdf', '2026-07-20 23:59:59');
SET IDENTITY_INSERT assignments OFF;

-- 19. Seed Assignment Submissions
SET IDENTITY_INSERT assignment_submissions ON;
INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_file_url, grade, feedback, graded_by) VALUES
(1, 1, 3, 'https://edusphere.com/submissions/john-assignment1.zip', 'A', 'Excellent layout and type-safety. Animations are very smooth!', 2);
SET IDENTITY_INSERT assignment_submissions OFF;
