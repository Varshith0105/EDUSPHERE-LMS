-- H2-compatible schema and seed data for local development

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forums;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- 2. Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_picture_url VARCHAR(255),
    role_id INT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    xp_points INT DEFAULT 0,
    streak_count INT DEFAULT 0,
    last_login_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 3. Categories Table
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id BIGINT NULL,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- 4. Courses Table
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    thumbnail_url VARCHAR(255),
    trailer_url VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT FALSE,
    learning_outcomes VARCHAR(2000),
    requirements VARCHAR(2000),
    duration_hours INT,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, PUBLISHED
    instructor_id BIGINT NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 5. Lessons Table
CREATE TABLE lessons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT,
    video_url VARCHAR(255),
    pdf_url VARCHAR(255),
    image_url VARCHAR(255),
    ppt_url VARCHAR(255),
    word_url VARCHAR(255),
    zip_url VARCHAR(255),
    audio_url VARCHAR(255),
    code_examples TEXT,
    external_links TEXT,
    estimated_minutes INT,
    sort_order INT NOT NULL,
    is_draft BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 6. Enrollments Table
CREATE TABLE enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY uq_student_course (student_id, course_id)
);

-- 7. Lesson Progress Table
CREATE TABLE lesson_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    bookmarked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    last_watched_seconds INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id),
    UNIQUE KEY uq_enrollment_lesson (enrollment_id, lesson_id)
);

-- 8. Quizzes Table
CREATE TABLE quizzes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    time_limit_minutes INT DEFAULT 0,
    negative_marking BOOLEAN DEFAULT FALSE,
    passing_score INT DEFAULT 60,
    attempts_limit INT DEFAULT 1,
    show_score_immediately BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 9. Questions Table
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    options VARCHAR(2000) NOT NULL, -- Stored as JSON string
    correct_option_index INT NOT NULL,
    explanation TEXT,
    type VARCHAR(30) DEFAULT 'MCQ_SINGLE',
    correct_option_indices VARCHAR(500),
    correct_answer_text TEXT,
    image_url VARCHAR(255),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- 10. Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    quiz_id BIGINT NOT NULL,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    duration_seconds INT NULL,
    raw_score DOUBLE NULL,
    negative_marks DOUBLE NULL,
    percentage DOUBLE NULL,
    attempt_number INT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- 11. Assignments Table
CREATE TABLE assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    file_url VARCHAR(255),
    deadline TIMESTAMP NOT NULL,
    max_marks INT DEFAULT 100,
    rubrics TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 12. Assignment Submissions Table
CREATE TABLE assignment_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    submission_file_url VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10) NULL,
    feedback TEXT NULL,
    graded_by BIGINT NULL,
    marks_obtained INT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (graded_by) REFERENCES users(id)
);

-- 13. Forums Table
CREATE TABLE forums (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 14. Forum Replies Table
CREATE TABLE forum_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    forum_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_instructor_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 15. Reviews Table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY uq_course_student_review (course_id, student_id)
);

-- 16. Certificates Table
CREATE TABLE certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL UNIQUE,
    certificate_uuid VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qr_code_url VARCHAR(255),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

-- 17. Notifications Table
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 18. Payments Table
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'COMPLETED',
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Seed Roles
INSERT INTO roles (id, name) VALUES (1, 'ROLE_STUDENT');
INSERT INTO roles (id, name) VALUES (2, 'ROLE_INSTRUCTOR');
INSERT INTO roles (id, name) VALUES (3, 'ROLE_ADMIN');

-- Seed Users (Password is 'password123' bcrypt hash)
INSERT INTO users (id, username, email, password, first_name, last_name, profile_picture_url, role_id, is_verified, xp_points, streak_count) VALUES
(1, 'admin', 'admin@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'System', 'Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 3, TRUE, 0, 0),
(2, 'instructor_jane', 'jane@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'Jane', 'Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', 2, TRUE, 150, 4),
(3, 'student_john', 'john@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'John', 'Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 1, TRUE, 1250, 5),
(4, 'student_alice', 'alice@edusphere.com', '$2a$10$H8z2QpQZ/Kq2hT9f8r0pBe6y9i8D86s3vW5.mJ80LgZt62UexfS4u', 'Alice', 'Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 1, TRUE, 450, 2);

-- Seed Categories
INSERT INTO categories (id, name, parent_category_id) VALUES
(1, 'Computer Science', NULL),
(2, 'Web Development', 1),
(3, 'Artificial Intelligence', 1),
(4, 'Business & Finance', NULL),
(5, 'Marketing', 4);

-- Seed Courses
INSERT INTO courses (id, title, subtitle, description, thumbnail_url, trailer_url, price, is_free, learning_outcomes, requirements, duration_hours, status, instructor_id, category_id) VALUES
(1, 'Introduction to React & TypeScript', 'Build scalable, type-safe web applications from scratch.', 'Learn React 19, TypeScript, state management, hooks, and routing. Integrate Shadcn UI components and TailwindCSS to create stunning interactive web layouts.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 49.99, FALSE, '["Understand React 19 fundamentals", "Master TypeScript types and interfaces in React", "Use TailwindCSS and Shadcn UI components", "Manage state with React Query and Context"]', 'Basic knowledge of HTML, CSS, and Javascript.', 12, 'PUBLISHED', 2, 2),
(2, 'Mastering Spring Boot 3 & Java 21', 'Develop high-performance, secure backend microservices.', 'Deep dive into Spring Security, JWT, Data JPA, validations, and cloud deployment options on Azure. Create a robust enterprise grade REST API from scratch.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 99.99, FALSE, '["Build production-ready REST APIs", "Implement Spring Security and JWT authentication", "Understand Hibernate and Spring Data JPA relationships", "Deploy Spring Boot applications to Azure VMs"]', 'Basic knowledge of Java programming language.', 20, 'PUBLISHED', 2, 1),
(3, 'Generative AI & LLM Foundations', 'Introduction to Prompt Engineering, OpenAI APIs, and Azure Cognitive Services.', 'An introductory course to GenAI. Understand transformer architectures, build smart assistants, and integrate vector databases.', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600', 'https://www.w3schools.com/html/mov_bbb.mp4', 0.00, TRUE, '["Understand Large Language Models", "Learn prompt engineering patterns", "Interact with OpenAI and Azure OpenAI endpoints", "Build RAG systems"]', 'No programming experience required.', 6, 'PUBLISHED', 2, 3);

-- Seed Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, pdf_url, image_url, code_examples, external_links, estimated_minutes, sort_order) VALUES
(1, 1, 'Course Introduction & Setup', 'Welcome to the React & TypeScript course. In this lesson, we will initialize our project using Vite, configure Tailwind CSS, and set up our TypeScript config.', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://www.w3schools.com/html/html_intro.asp', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=400', 'npm create vite@latest my-app -- --template react-ts\ncd my-app\nnpm install -D tailwindcss postcss autoprefixer', '["https://react.dev", "https://typescriptlang.org"]', 15, 1),
(2, 1, 'Understanding Components and Props', 'Components are the building blocks of React. Here we explore functional components, JSX, and strict TypeScript types for Props.', 'https://www.w3schools.com/html/movie.mp4', NULL, NULL, 'interface ButtonProps {\n  label: string;\n  onClick: () => void;\n}\n\nexport const Button = ({ label, onClick }: ButtonProps) => (\n  <button onClick={onClick}>{label}</button>\n);', '["https://react.dev/learn/passing-props-to-a-component"]', 30, 2),
(3, 1, 'Advanced Hooks & React Query', 'Learn how to fetch data asynchronously using Axios and React Query, handling states, cache invalidation, and custom hooks.', 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, NULL, 'import { useQuery } from "@tanstack/react-query";\nimport axios from "axios";\n\nconst fetchCourses = () => axios.get("/api/courses").then(res => res.data);\nconst { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });', '["https://tanstack.com/query/latest"]', 45, 3),
(4, 2, 'Spring Boot 3 Project Initialization', 'Create a new project using Spring Initializr. Include dependencies for Web, Data JPA, Security, Lombok, and MySQL Driver.', 'https://www.w3schools.com/html/movie.mp4', NULL, NULL, '<dependency>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-web</artifactId>\n</dependency>', '["https://start.spring.io"]', 20, 1);

-- Seed Enrollments
INSERT INTO enrollments (id, student_id, course_id, enrolled_at, progress_percentage, completed) VALUES
(1, 3, 1, '2026-07-08 10:00:00', 33.33, FALSE),
(2, 3, 2, '2026-07-09 14:00:00', 0.00, FALSE),
(3, 4, 1, '2026-07-09 15:30:00', 100.00, TRUE);

-- Seed Lesson Progress
INSERT INTO lesson_progress (enrollment_id, lesson_id, completed, bookmarked, notes, last_watched_seconds) VALUES
(1, 1, TRUE, FALSE, 'Vite setup matches user requirements.', 900),
(1, 2, FALSE, TRUE, 'Need to review generics in props typing.', 0),
(3, 1, TRUE, FALSE, 'Completed setup', 900),
(3, 2, TRUE, FALSE, 'Mastered props structure', 1800),
(3, 3, TRUE, FALSE, 'Axios client integrated correctly.', 2700);

-- Seed Quizzes
INSERT INTO quizzes (id, course_id, title, time_limit_minutes, negative_marking, passing_score) VALUES
(1, 1, 'React & TypeScript Fundamentals Quiz', 10, TRUE, 70),
(2, 2, 'Spring Security & JPA Quiz', 15, FALSE, 60);

-- Seed Questions
INSERT INTO questions (id, quiz_id, question_text, options, correct_option_index, explanation) VALUES
(1, 1, 'Which version of React introduces the new compiler and transition improvements?', '["React 16", "React 17", "React 18", "React 19"]', 3, 'React 19 introduces React Compiler, Server Actions, and document metadata support.'),
(2, 1, 'How do you define a type for a React component props that includes children?', '["interface Props { children: ReactNode }", "interface Props { children: string }", "interface Props { childs: any }", "interface Props { children: HTMLDivElement }"]', 0, 'ReactNode is the standard type in @types/react for representing children.'),
(3, 1, 'What is the purpose of React Query (TanStack Query)?', '["Routing", "Global state management for forms", "Server state caching and sync", "CSS Animations"]', 2, 'React Query is designed for caching, syncing and updating server state in web apps.');

-- Seed Quiz Attempts
INSERT INTO quiz_attempts (id, student_id, quiz_id, score, passed) VALUES
(1, 3, 1, 66, FALSE),
(2, 4, 1, 100, TRUE);

-- Seed Certificates
INSERT INTO certificates (id, enrollment_id, certificate_uuid, qr_code_url) VALUES
(1, 3, 'cert-uuid-1111-2222-3333', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://edusphere.com/verify/cert-uuid-1111-2222-3333');

-- Seed Forums
INSERT INTO forums (id, course_id, user_id, title, content, is_pinned, likes_count) VALUES
(1, 1, 3, 'TypeScript type error with React Query useQuery', 'I am getting a TypeScript error when trying to map response.data to CourseDto. How can I strictly type useQuery returns?', FALSE, 5),
(2, 1, 2, 'React 19 Cheat Sheet and Reference Guide', 'This pinned discussion thread contains links to official React 19 upgrades and documentation. Check here before posting setup issues.', TRUE, 24);

-- Seed Forum Replies
INSERT INTO forum_replies (id, forum_id, user_id, content, is_instructor_reply) VALUES
(1, 1, 2, 'You should pass the DTO type as a generic parameter: useQuery<CourseDto, Error>({ queryKey, queryFn }). This guarantees res.data is typed correctly.', TRUE);

-- Seed Reviews
INSERT INTO reviews (course_id, student_id, rating, comment) VALUES
(1, 3, 5, 'Absolutely loved the course! The TypeScript layout and Shadcn UI examples were perfect.'),
(1, 4, 4, 'Very good introduction. Wish it had more code exercises.');

-- Seed Notifications
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(3, 'Welcome to React & TS Course!', 'You have successfully enrolled in Introduction to React & TypeScript. Happy learning!', TRUE),
(3, 'Quiz Graded', 'Your React & TS Fundamentals Quiz attempt scored 66%. Keep practicing to pass!', FALSE),
(2, 'New Forum Question', 'Student John Smith posted a new thread in React & TS: "TypeScript type error with React Query useQuery"', FALSE);

-- Seed Assignments
INSERT INTO assignments (id, course_id, title, description, file_url, deadline) VALUES
(1, 1, 'Build a Responsive Card Deck using Shadcn UI', 'Create a React + TS page displaying a responsive grid of course card elements. Include animations using Framer Motion and state matching.', 'https://edusphere.com/assignments/react-card-deck.pdf', '2026-07-20 23:59:59');

-- Seed Assignment Submissions
INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_file_url, grade, feedback, graded_by) VALUES
(1, 1, 3, 'https://edusphere.com/submissions/john-assignment1.zip', 'A', 'Excellent layout and type-safety. Animations are very smooth!', 2);
