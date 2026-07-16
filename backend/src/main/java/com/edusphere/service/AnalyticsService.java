package com.edusphere.service;

import com.edusphere.dto.LmsDto.*;
import com.edusphere.model.*;
import com.edusphere.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    public DashboardAnalytics getPlatformAnalytics() {
        long totalStudents = userRepository.findByRoleName("ROLE_STUDENT").size();
        long totalInstructors = userRepository.findByRoleName("ROLE_INSTRUCTOR").size();
        long totalCourses = courseRepository.count();

        List<Payment> payments = paymentRepository.findAll();
        BigDecimal totalRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Aggregate popular courses
        List<Course> courses = courseRepository.findAll();
        List<PopularCourseMetric> popularCourses = courses.stream().map(course -> {
            long count = enrollmentRepository.countByCourseId(course.getId());
            double mockRating = 4.0 + (course.getId() % 2) * 0.5 + 0.3; // Generates 4.3, 4.8 etc.
            return new PopularCourseMetric(course.getTitle(), count, mockRating);
        }).sorted((c1, c2) -> Long.compare(c2.getStudentCount(), c1.getStudentCount()))
          .limit(5)
          .collect(Collectors.toList());

        // Seed mock monthly metrics for charts
        List<RevenueMetric> monthlyRevenue = new ArrayList<>();
        monthlyRevenue.add(new RevenueMetric("Jan", BigDecimal.valueOf(1500.00)));
        monthlyRevenue.add(new RevenueMetric("Feb", BigDecimal.valueOf(2300.00)));
        monthlyRevenue.add(new RevenueMetric("Mar", BigDecimal.valueOf(3200.00)));
        monthlyRevenue.add(new RevenueMetric("Apr", BigDecimal.valueOf(4100.00)));
        monthlyRevenue.add(new RevenueMetric("May", totalRevenue.add(BigDecimal.valueOf(1200.00))));

        List<GrowthMetric> studentGrowth = new ArrayList<>();
        studentGrowth.add(new GrowthMetric("Jan", 12));
        studentGrowth.add(new GrowthMetric("Feb", 24));
        studentGrowth.add(new GrowthMetric("Mar", 35));
        studentGrowth.add(new GrowthMetric("Apr", 45));
        studentGrowth.add(new GrowthMetric("May", totalStudents));

        return DashboardAnalytics.builder()
                .totalStudents(totalStudents)
                .totalInstructors(totalInstructors)
                .totalCourses(totalCourses)
                .totalRevenue(totalRevenue)
                .popularCourses(popularCourses)
                .monthlyRevenue(monthlyRevenue)
                .studentGrowth(studentGrowth)
                .build();
    }

    public StudentDashboardData getStudentAnalytics(Long studentId) {
        User studentUser = userRepository.findById(studentId).orElse(null);
        int totalXp = studentUser != null && studentUser.getXpPoints() != null ? studentUser.getXpPoints() : 0;
        int streakCount = studentUser != null && studentUser.getStreakCount() != null ? studentUser.getStreakCount() : 0;

        List<User> students = userRepository.findByRoleName("ROLE_STUDENT");
        students.sort((u1, u2) -> {
            int xp1 = u1.getXpPoints() != null ? u1.getXpPoints() : 0;
            int xp2 = u2.getXpPoints() != null ? u2.getXpPoints() : 0;
            return Integer.compare(xp2, xp1);
        });
        int overallRank = 1;
        for (int i = 0; i < students.size(); i++) {
            if (students.get(i).getId().equals(studentId)) {
                overallRank = i + 1;
                break;
            }
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        int enrolledCount = enrollments.size();
        int completedCount = (int) enrollments.stream().filter(Enrollment::getCompleted).count();

        List<QuizAttempt> quizAttempts = quizAttemptRepository.findByStudentId(studentId);
        double avgQuizScore = quizAttempts.isEmpty() ? 0.0 : quizAttempts.stream()
                .mapToInt(QuizAttempt::getScore)
                .average()
                .orElse(0.0);
        avgQuizScore = Math.round(avgQuizScore * 100.0) / 100.0;

        List<DashboardCourseProgress> courseProgress = enrollments.stream().map(e -> DashboardCourseProgress.builder()
                .courseId(e.getCourse().getId())
                .courseTitle(e.getCourse().getTitle())
                .progressPercentage(e.getProgressPercentage() != null ? e.getProgressPercentage().doubleValue() : 0.0)
                .completed(Boolean.TRUE.equals(e.getCompleted()))
                .build()).collect(Collectors.toList());

        List<DashboardDeadline> deadlines = new ArrayList<>();
        for (Enrollment e : enrollments) {
            List<Assignment> assignments = assignmentRepository.findByCourseId(e.getCourse().getId());
            for (Assignment a : assignments) {
                boolean submitted = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), studentId).isPresent();
                if (!submitted && a.getDeadline().isAfter(LocalDateTime.now())) {
                    deadlines.add(DashboardDeadline.builder()
                            .title(a.getTitle())
                            .courseTitle(e.getCourse().getTitle())
                            .deadline(a.getDeadline())
                            .build());
                }
            }
        }
        deadlines.sort(Comparator.comparing(DashboardDeadline::getDeadline));
        if (deadlines.size() > 5) {
            deadlines = deadlines.subList(0, 5);
        }

        List<AssignmentSubmission> submissions = submissionRepository.findByStudentId(studentId);
        List<DashboardRecentGrade> recentGrades = submissions.stream()
                .filter(s -> s.getGrade() != null)
                .map(s -> {
                    Assignment a = assignmentRepository.findById(s.getAssignmentId()).orElse(null);
                    String title = a != null ? a.getTitle() : "Assignment";
                    Integer max = a != null ? a.getMaxMarks() : 100;
                    return DashboardRecentGrade.builder()
                            .title(title)
                            .grade(s.getGrade())
                            .marksObtained(s.getMarksObtained())
                            .maxMarks(max)
                            .build();
                })
                .limit(5)
                .collect(Collectors.toList());

        return StudentDashboardData.builder()
                .enrolledCoursesCount(enrolledCount)
                .completedCoursesCount(completedCount)
                .totalXp(totalXp)
                .streakCount(streakCount)
                .overallRank(overallRank)
                .averageQuizScore(avgQuizScore)
                .courseProgress(courseProgress)
                .upcomingDeadlines(deadlines)
                .recentGrades(recentGrades)
                .build();
    }

    public InstructorDashboardData getInstructorAnalytics(Long instructorId) {
        List<Course> instructorCourses = courseRepository.findByInstructorId(instructorId);
        long totalCourses = instructorCourses.size();

        long totalStudents = 0;
        for (Course c : instructorCourses) {
            totalStudents += enrollmentRepository.countByCourseId(c.getId());
        }

        double totalRating = 0;
        long ratingCount = 0;
        for (Course c : instructorCourses) {
            List<Review> reviews = reviewRepository.findByCourseId(c.getId());
            for (Review r : reviews) {
                totalRating += r.getRating();
                ratingCount++;
            }
        }
        double avgRating = ratingCount == 0 ? 4.8 : totalRating / ratingCount;
        avgRating = Math.round(avgRating * 100.0) / 100.0;

        BigDecimal totalEarnings = BigDecimal.ZERO;
        for (Course c : instructorCourses) {
            List<Payment> payments = paymentRepository.findByCourseId(c.getId());
            for (Payment p : payments) {
                totalEarnings = totalEarnings.add(p.getAmount());
            }
        }

        List<DashboardSubmissionsMetric> recentSubmissions = new ArrayList<>();
        for (Course c : instructorCourses) {
            List<Assignment> assignments = assignmentRepository.findByCourseId(c.getId());
            for (Assignment a : assignments) {
                List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(a.getId());
                for (AssignmentSubmission s : submissions) {
                    if (s.getGrade() == null) {
                        User student = userRepository.findById(s.getStudentId()).orElse(null);
                        String sName = student != null ? student.getFirstName() + " " + student.getLastName() : "Student";
                        recentSubmissions.add(DashboardSubmissionsMetric.builder()
                                .submissionId(s.getId())
                                .studentName(sName)
                                .assignmentTitle(a.getTitle())
                                .courseTitle(c.getTitle())
                                .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt() : LocalDateTime.now())
                                .build());
                    }
                }
            }
        }
        recentSubmissions.sort((s1, s2) -> s2.getSubmittedAt().compareTo(s1.getSubmittedAt()));
        if (recentSubmissions.size() > 5) {
            recentSubmissions = recentSubmissions.subList(0, 5);
        }

        List<PopularCourseMetric> popularCourses = instructorCourses.stream().map(course -> {
            long count = enrollmentRepository.countByCourseId(course.getId());
            double mockRating = 4.0 + (course.getId() % 2) * 0.5 + 0.3;
            return new PopularCourseMetric(course.getTitle(), count, mockRating);
        }).sorted((c1, c2) -> Long.compare(c2.getStudentCount(), c1.getStudentCount()))
          .limit(5)
          .collect(Collectors.toList());

        List<RevenueMetric> monthlyRevenue = new ArrayList<>();
        monthlyRevenue.add(new RevenueMetric("Jan", BigDecimal.valueOf(1500.00)));
        monthlyRevenue.add(new RevenueMetric("Feb", BigDecimal.valueOf(2300.00)));
        monthlyRevenue.add(new RevenueMetric("Mar", BigDecimal.valueOf(3200.00)));
        monthlyRevenue.add(new RevenueMetric("Apr", BigDecimal.valueOf(4100.00)));
        monthlyRevenue.add(new RevenueMetric("May", totalEarnings));

        return InstructorDashboardData.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .averageRating(avgRating)
                .totalEarnings(totalEarnings)
                .recentSubmissions(recentSubmissions)
                .popularCourses(popularCourses)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }
}
