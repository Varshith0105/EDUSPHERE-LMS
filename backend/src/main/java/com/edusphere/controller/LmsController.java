package com.edusphere.controller;

import com.edusphere.dto.CourseDto.*;
import com.edusphere.dto.LmsDto.*;
import com.edusphere.model.Certificate;
import com.edusphere.security.UserDetailsImpl;
import com.edusphere.service.LmsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lms")
@Tag(name = "LMS Module", description = "Endpoints for student interactions, quizzes, lessons progress, certificates, and forums")
public class LmsController {

    @Autowired
    private LmsService lmsService;

    @PostMapping("/enroll")
    public ResponseEntity<Void> enrollInCourse(
            Authentication authentication,
            @RequestParam Long courseId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        lmsService.enrollInCourse(userDetails.getId(), courseId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lessons/{lessonId}/progress")
    public ResponseEntity<Void> updateLessonProgress(
            Authentication authentication,
            @PathVariable Long lessonId,
            @RequestBody LessonProgressRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        lmsService.updateLessonProgress(userDetails.getId(), lessonId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}/lessons-with-progress")
    public ResponseEntity<List<LessonResponse>> getLessonsWithProgress(
            Authentication authentication,
            @PathVariable Long courseId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.getLessonsWithProgress(userDetails.getId(), courseId));
    }

    @GetMapping("/courses/{courseId}/quiz")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long courseId) {
        return ResponseEntity.ok(lmsService.getQuizForCourse(courseId));
    }

    @PostMapping("/quizzes/{quizId}/submit")
    public ResponseEntity<QuizAttemptResponse> submitQuiz(
            Authentication authentication,
            @PathVariable Long quizId,
            @RequestBody QuizSubmitRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.submitQuiz(userDetails.getId(), quizId, request));
    }

    @GetMapping("/courses/{courseId}/assignments")
    public ResponseEntity<List<AssignmentResponse>> getAssignments(
            Authentication authentication,
            @PathVariable Long courseId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.getAssignmentsForCourse(userDetails.getId(), courseId));
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<AssignmentSubmissionResponse> submitAssignment(
            Authentication authentication,
            @PathVariable Long assignmentId,
            @RequestBody AssignmentSubmissionRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.submitAssignment(userDetails.getId(), assignmentId, request));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AssignmentSubmissionResponse> gradeSubmission(
            Authentication authentication,
            @PathVariable Long submissionId,
            @RequestBody GradeSubmissionRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.gradeSubmission(userDetails.getId(), submissionId, request));
    }

    @GetMapping("/courses/{courseId}/forum")
    public ResponseEntity<List<ForumResponse>> getForumThreads(@PathVariable Long courseId) {
        return ResponseEntity.ok(lmsService.getForumThreads(courseId));
    }

    @PostMapping("/courses/{courseId}/forum")
    public ResponseEntity<ForumResponse> createForumThread(
            Authentication authentication,
            @PathVariable Long courseId,
            @Valid @RequestBody ForumCreateRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.createForumThread(userDetails.getId(), courseId, request));
    }

    @PostMapping("/forum/{forumId}/reply")
    public ResponseEntity<ForumReplyResponse> replyToForum(
            Authentication authentication,
            @PathVariable Long forumId,
            @Valid @RequestBody ForumReplyRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.replyToForum(userDetails.getId(), forumId, request));
    }

    @GetMapping("/courses/{courseId}/certificate")
    public ResponseEntity<Certificate> getCertificate(
            Authentication authentication,
            @PathVariable Long courseId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.getCertificate(userDetails.getId(), courseId));
    }

    @GetMapping("/enrollments")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(lmsService.getStudentEnrollments(userDetails.getId()));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<List<AssignmentSubmissionResponse>> getSubmissionsForAssignment(
            @PathVariable Long assignmentId) {
        return ResponseEntity.ok(lmsService.getSubmissionsForAssignment(assignmentId));
    }

    // ===================== Instructor Course Management =====================

    @GetMapping("/courses/{courseId}/quizzes")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<List<QuizResponse>> getQuizzesForCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(lmsService.getQuizzesForCourse(courseId));
    }

    @PostMapping("/courses/{courseId}/quizzes")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long courseId,
            @RequestBody QuizCreateRequest request) {
        return ResponseEntity.ok(lmsService.createQuiz(courseId, request));
    }

    @DeleteMapping("/quizzes/{quizId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId) {
        lmsService.deleteQuiz(quizId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/quizzes/{quizId}/questions")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<QuestionResponse> addQuestion(
            @PathVariable Long quizId,
            @RequestBody QuestionCreateRequest request) {
        return ResponseEntity.ok(lmsService.addQuestion(quizId, request));
    }

    @DeleteMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        lmsService.deleteQuestion(questionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/courses/{courseId}/assignments")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<AssignmentResponse> createAssignment(
            @PathVariable Long courseId,
            @RequestBody AssignmentCreateRequest request) {
        return ResponseEntity.ok(lmsService.createAssignment(courseId, request));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long assignmentId) {
        lmsService.deleteAssignment(assignmentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<com.edusphere.dto.AuthDto.UserResponse>> getLeaderboard() {
        return ResponseEntity.ok(lmsService.getLeaderboard());
    }

    @PutMapping("/quizzes/{quizId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> updateQuiz(
            @PathVariable Long quizId,
            @RequestBody QuizCreateRequest request) {
        return ResponseEntity.ok(lmsService.updateQuiz(quizId, request));
    }

    @PutMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long questionId,
            @RequestBody QuestionCreateRequest request) {
        return ResponseEntity.ok(lmsService.updateQuestion(questionId, request));
    }

    @PostMapping("/quizzes/{quizId}/questions/reorder")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> reorderQuestions(
            @PathVariable Long quizId,
            @RequestBody List<Long> questionIds) {
        lmsService.reorderQuestions(quizId, questionIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getCourseLeaderboard(@PathVariable Long courseId) {
        return ResponseEntity.ok(lmsService.getCourseLeaderboard(courseId));
    }
}


