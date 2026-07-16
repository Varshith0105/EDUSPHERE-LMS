package com.edusphere.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class LmsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizResponse {
        private Long id;
        private Long courseId;
        private String title;
        private Integer timeLimitMinutes;
        private boolean negativeMarking;
        private Integer passingScore;
        private Integer attemptsLimit;
        private boolean showScoreImmediately;
        private boolean showCorrectAnswers;
        private String status;
        private List<QuestionResponse> questions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionResponse {
        private Long id;
        private String questionText;
        private List<String> options;
        private Integer correctOptionIndex;
        private String explanation;
        private String type;
        private List<Integer> correctOptionIndices;
        private String correctAnswerText;
        private String imageUrl;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizSubmitRequest {
        private LocalDateTime startTime;
        private List<List<Integer>> selectedAnswers; // Ordered list of selected option indices per question (or empty if skipped)
        private List<String> shortAnswers; // Ordered list of text answers (for SHORT_ANSWER questions, empty string if skipped)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizCreateRequest {
        private String title;
        private Integer timeLimitMinutes;
        private boolean negativeMarking;
        private Integer passingScore;
        private Integer attemptsLimit;
        private boolean showScoreImmediately;
        private boolean showCorrectAnswers;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionCreateRequest {
        private String questionText;
        private List<String> options;
        private Integer correctOptionIndex;
        private String explanation;
        private String type;
        private List<Integer> correctOptionIndices;
        private String correctAnswerText;
        private String imageUrl;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentCreateRequest {
        private String title;
        private String description;
        private String fileUrl;
        private java.time.LocalDateTime deadline;
        private Integer maxMarks;
        private String rubrics;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizAttemptResponse {
        private Long id;
        private Integer score;
        private boolean passed;
        private LocalDateTime completedAt;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer durationSeconds;
        private Double rawScore;
        private Double negativeMarks;
        private Double percentage;
        private Integer attemptNumber;
        private List<QuestionExplanation> questionExplanations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionExplanation {
        private Long questionId;
        private String questionText;
        private List<String> options;
        private Integer correctOptionIndex;
        private List<Integer> correctOptionIndices;
        private String correctAnswerText;
        private String type;
        private String imageUrl;
        private List<Integer> selectedOptionIndices;
        private String selectedShortAnswer;
        private String explanation;
        private boolean isCorrect;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentResponse {
        private Long id;
        private Long courseId;
        private String title;
        private String description;
        private String fileUrl;
        private LocalDateTime deadline;
        private Integer maxMarks;
        private String rubrics;
        private AssignmentSubmissionResponse submission;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentSubmissionRequest {
        private String submissionFileUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentSubmissionResponse {
        private Long id;
        private String submissionFileUrl;
        private LocalDateTime submittedAt;
        private String grade;
        private String feedback;
        private String gradedByName;
        private Integer marksObtained;
        private boolean isLate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradeSubmissionRequest {
        private String grade;
        private String feedback;
        private Integer marksObtained;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForumResponse {
        private Long id;
        private Long courseId;
        private Long userId;
        private String username;
        private String userProfilePic;
        private String title;
        private String content;
        private boolean pinned;
        private Integer likesCount;
        private LocalDateTime createdAt;
        private List<ForumReplyResponse> replies;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForumReplyResponse {
        private Long id;
        private Long forumId;
        private Long userId;
        private String username;
        private String userProfilePic;
        private String content;
        private boolean instructorReply;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForumCreateRequest {
        private String title;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForumReplyRequest {
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewResponse {
        private Long id;
        private Long courseId;
        private String studentName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewRequest {
        private Integer rating;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardAnalytics {
        // General metrics
        private long totalStudents;
        private long totalInstructors;
        private long totalCourses;
        private BigDecimal totalRevenue;
        
        // Dynamic lists for graphs/charts
        private List<PopularCourseMetric> popularCourses;
        private List<RevenueMetric> monthlyRevenue;
        private List<GrowthMetric> studentGrowth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularCourseMetric {
        private String courseTitle;
        private long studentCount;
        private double rating;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueMetric {
        private String month;
        private BigDecimal amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthMetric {
        private String month;
        private long newStudents;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EnrollmentResponse {
        private Long id;
        private com.edusphere.dto.CourseDto.CourseSummary course;
        private double progressPercentage;
        private boolean completed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LeaderboardEntry {
        private int rank;
        private String studentName;
        private double score;
        private double percentage;
        private int timeTakenSeconds;
        private int attempts;
        private int courseRank;
        private int overallRank;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentDashboardData {
        private int enrolledCoursesCount;
        private int completedCoursesCount;
        private int totalXp;
        private int streakCount;
        private int overallRank;
        private double averageQuizScore;
        private List<DashboardCourseProgress> courseProgress;
        private List<DashboardDeadline> upcomingDeadlines;
        private List<DashboardRecentGrade> recentGrades;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardCourseProgress {
        private Long courseId;
        private String courseTitle;
        private double progressPercentage;
        private boolean completed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardDeadline {
        private String title;
        private String courseTitle;
        private LocalDateTime deadline;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardRecentGrade {
        private String title;
        private String grade;
        private Integer marksObtained;
        private Integer maxMarks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstructorDashboardData {
        private long totalCourses;
        private long totalStudents;
        private double averageRating;
        private BigDecimal totalEarnings;
        private List<DashboardSubmissionsMetric> recentSubmissions;
        private List<PopularCourseMetric> popularCourses;
        private List<RevenueMetric> monthlyRevenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardSubmissionsMetric {
        private Long submissionId;
        private String studentName;
        private String assignmentTitle;
        private String courseTitle;
        private LocalDateTime submittedAt;
    }
}

