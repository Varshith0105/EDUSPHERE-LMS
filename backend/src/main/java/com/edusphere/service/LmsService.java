package com.edusphere.service;

import com.edusphere.dto.CourseDto.*;
import com.edusphere.dto.LmsDto.*;
import com.edusphere.exception.BadRequestException;
import com.edusphere.exception.ResourceNotFoundException;
import com.edusphere.model.*;
import com.edusphere.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LmsService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private LessonProgressRepository lessonProgressRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private ForumRepository forumRepository;

    @Autowired
    private ForumReplyRepository forumReplyRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public void enrollInCourse(Long studentId, Long courseId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BadRequestException("You are already enrolled in this course");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .progressPercentage(BigDecimal.ZERO)
                .completed(false)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        // Initialize progress for all lessons in this course
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        for (Lesson lesson : lessons) {
            LessonProgress progress = LessonProgress.builder()
                    .enrollmentId(saved.getId())
                    .lessonId(lesson.getId())
                    .completed(false)
                    .bookmarked(false)
                    .notes("")
                    .build();
            lessonProgressRepository.save(progress);
        }

        // Award enrollment XP
        authService.addXp(student, 50);
    }

    @Transactional
    public void updateLessonProgress(Long studentId, Long lessonId, LessonProgressRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, lesson.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for this course"));

        LessonProgress progress = lessonProgressRepository.findByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson progress tracker not found"));

        boolean previouslyCompleted = progress.getCompleted();
        progress.setCompleted(request.isCompleted());
        progress.setBookmarked(request.isBookmarked());
        if (request.getNotes() != null) {
            progress.setNotes(request.getNotes());
        }
        progress.setLastWatchedSeconds(request.getLastWatchedSeconds());

        lessonProgressRepository.save(progress);

        // Recalculate progress percentage
        List<LessonProgress> allProgress = lessonProgressRepository.findByEnrollmentId(enrollment.getId());
        long completedCount = allProgress.stream().filter(LessonProgress::getCompleted).count();
        BigDecimal percentage = BigDecimal.valueOf(completedCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(allProgress.size()), 2, RoundingMode.HALF_UP);

        enrollment.setProgressPercentage(percentage);
        enrollmentRepository.save(enrollment);

        // Trigger comprehensive course completion check
        checkAndHandleCourseCompletion(studentId, lesson.getCourseId());

        // Award completion XP (only first time)
        if (request.isCompleted() && !previouslyCompleted) {
            authService.addXp(enrollment.getStudent(), 20);
        }
    }

    public List<LessonResponse> getLessonsWithProgress(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        List<Lesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        List<LessonProgress> progressList = lessonProgressRepository.findByEnrollmentId(enrollment.getId());
        Map<Long, LessonProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(LessonProgress::getLessonId, p -> p));

        return lessons.stream().map(lesson -> {
            LessonProgress p = progressMap.get(lesson.getId());
            return LessonResponse.builder()
                    .id(lesson.getId())
                    .courseId(lesson.getCourseId())
                    .title(lesson.getTitle())
                    .content(lesson.getContent())
                    .videoUrl(lesson.getVideoUrl())
                    .pdfUrl(lesson.getPdfUrl())
                    .imageUrl(lesson.getImageUrl())
                    .codeExamples(lesson.getCodeExamples())
                    .externalLinks(readListValue(lesson.getExternalLinks()))
                    .estimatedMinutes(lesson.getEstimatedMinutes())
                    .sortOrder(lesson.getSortOrder())
                    .completed(p != null && p.getCompleted())
                    .bookmarked(p != null && p.getBookmarked())
                    .notes(p != null ? p.getNotes() : "")
                    .lastWatchedSeconds(p != null ? p.getLastWatchedSeconds() : 0)
                    .build();
        }).collect(Collectors.toList());
    }

    public QuizResponse getQuizForCourse(Long courseId) {
        Quiz quiz = quizRepository.findFirstByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found for this course"));
        List<Question> questions = questionRepository.findByQuizId(quiz.getId());
        questions.sort(Comparator.comparingInt(q -> q.getSortOrder() != null ? q.getSortOrder() : 0));

        List<QuestionResponse> qResponses = questions.stream().map(q -> QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .options(q.getOptions())
                .correctOptionIndex(q.getCorrectOptionIndex())
                .explanation(q.getExplanation())
                .type(q.getType())
                .correctOptionIndices(q.getCorrectOptionIndices())
                .correctAnswerText(q.getCorrectAnswerText())
                .imageUrl(q.getImageUrl())
                .sortOrder(q.getSortOrder())
                .build()).collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourseId())
                .title(quiz.getTitle())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .negativeMarking(quiz.getNegativeMarking())
                .passingScore(quiz.getPassingScore())
                .attemptsLimit(quiz.getAttemptsLimit())
                .showScoreImmediately(quiz.getShowScoreImmediately())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .status(quiz.getStatus())
                .questions(qResponses)
                .build();
    }

    @Transactional
    public QuizAttemptResponse submitQuiz(Long studentId, Long quizId, QuizSubmitRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        // Verify attempts limit
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdAndQuizId(studentId, quizId);
        if (attempts.size() >= quiz.getAttemptsLimit()) {
            throw new BadRequestException("You have exceeded the maximum attempts limit of " + quiz.getAttemptsLimit() + " for this quiz.");
        }
        
        List<Question> questions = questionRepository.findByQuizId(quizId);
        questions.sort(Comparator.comparingInt(q -> q.getSortOrder() != null ? q.getSortOrder() : 0));
        
        List<List<Integer>> selectedAnswers = request.getSelectedAnswers();
        List<String> shortAnswers = request.getShortAnswers();
        
        int correctCount = 0;
        double negativeScore = 0.0;
        List<QuestionExplanation> explanations = new ArrayList<>();
        
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            List<Integer> selected = (selectedAnswers != null && selectedAnswers.size() > i) ? selectedAnswers.get(i) : Collections.emptyList();
            String selectedShort = (shortAnswers != null && shortAnswers.size() > i) ? shortAnswers.get(i) : "";
            
            boolean isCorrect = false;
            boolean isSkipped = false;
            String qType = q.getType() != null ? q.getType() : "MCQ_SINGLE";
            
            if ("MCQ_SINGLE".equals(qType) || "TRUE_FALSE".equals(qType)) {
                int selectedIndex = (selected != null && !selected.isEmpty()) ? selected.get(0) : -1;
                isSkipped = (selectedIndex == -1);
                isCorrect = (!isSkipped && selectedIndex == q.getCorrectOptionIndex());
                if (!isCorrect && !isSkipped && Boolean.TRUE.equals(quiz.getNegativeMarking())) {
                    negativeScore += 0.25;
                }
            } else if ("MCQ_MULTIPLE".equals(qType)) {
                isSkipped = (selected == null || selected.isEmpty());
                List<Integer> correctIndices = q.getCorrectOptionIndices() != null ? q.getCorrectOptionIndices() : Collections.emptyList();
                isCorrect = (!isSkipped && new HashSet<>(selected).equals(new HashSet<>(correctIndices)));
                if (!isCorrect && !isSkipped && Boolean.TRUE.equals(quiz.getNegativeMarking())) {
                    negativeScore += 0.25;
                }
            } else if ("SHORT_ANSWER".equals(qType)) {
                isSkipped = (selectedShort == null || selectedShort.trim().isEmpty());
                String correctText = q.getCorrectAnswerText() != null ? q.getCorrectAnswerText().trim() : "";
                isCorrect = (!isSkipped && selectedShort.trim().equalsIgnoreCase(correctText));
                if (!isCorrect && !isSkipped && Boolean.TRUE.equals(quiz.getNegativeMarking())) {
                    negativeScore += 0.25;
                }
            }
            
            if (isCorrect) {
                correctCount++;
            }
            
            explanations.add(QuestionExplanation.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .options(q.getOptions())
                    .correctOptionIndex(q.getCorrectOptionIndex())
                    .correctOptionIndices(q.getCorrectOptionIndices())
                    .correctAnswerText(q.getCorrectAnswerText())
                    .type(qType)
                    .imageUrl(q.getImageUrl())
                    .selectedOptionIndices(selected)
                    .selectedShortAnswer(selectedShort)
                    .explanation(q.getExplanation())
                    .isCorrect(isCorrect)
                    .build());
        }
        
        double rawScore = correctCount - negativeScore;
        double rawPercentage = (rawScore / (questions.isEmpty() ? 1 : questions.size())) * 100.0;
        int scorePercentage = (int) Math.round(Math.max(0, rawPercentage)); // Floor at 0
        boolean passed = scorePercentage >= quiz.getPassingScore();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = request.getStartTime() != null ? request.getStartTime() : now.minusMinutes(5);
        int durationSeconds = (int) java.time.Duration.between(startTime, now).getSeconds();
        
        QuizAttempt attempt = QuizAttempt.builder()
                .studentId(studentId)
                .quizId(quizId)
                .score(scorePercentage)
                .passed(passed)
                .startTime(startTime)
                .endTime(now)
                .durationSeconds(durationSeconds)
                .rawScore((double) correctCount)
                .negativeMarks(negativeScore)
                .percentage(rawPercentage)
                .attemptNumber(attempts.size() + 1)
                .build();
                
        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        
        // Award XP
        User student = userRepository.findById(studentId).get();
        if (passed) {
            authService.addXp(student, 100);
        } else {
            authService.addXp(student, 10);
        }
        
        // Check course completion
        checkAndHandleCourseCompletion(studentId, quiz.getCourseId());
        
        return QuizAttemptResponse.builder()
                .id(savedAttempt.getId())
                .score(scorePercentage)
                .passed(passed)
                .completedAt(now)
                .startTime(startTime)
                .endTime(now)
                .durationSeconds(durationSeconds)
                .rawScore((double) correctCount)
                .negativeMarks(negativeScore)
                .percentage(rawPercentage)
                .attemptNumber(attempt.getAttemptNumber())
                .questionExplanations(explanations)
                .build();
    }

    public List<AssignmentResponse> getAssignmentsForCourse(Long studentId, Long courseId) {
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        return assignments.stream().map(a -> {
            Optional<AssignmentSubmission> subOpt = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), studentId);
            AssignmentSubmissionResponse subResponse = subOpt.map(this::convertToSubmissionResponse).orElse(null);
            
            return AssignmentResponse.builder()
                    .id(a.getId())
                    .courseId(a.getCourseId())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .fileUrl(a.getFileUrl())
                    .deadline(a.getDeadline())
                    .maxMarks(a.getMaxMarks())
                    .rubrics(a.getRubrics())
                    .submission(subResponse)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public AssignmentSubmissionResponse submitAssignment(Long studentId, Long assignmentId, AssignmentSubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        Optional<AssignmentSubmission> existingOpt = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        AssignmentSubmission submission;
        
        if (existingOpt.isPresent()) {
            submission = existingOpt.get();
            submission.setSubmissionFileUrl(request.getSubmissionFileUrl());
            // Clear grading on resubmission
            submission.setGrade(null);
            submission.setFeedback(null);
            submission.setGradedBy(null);
            submission.setMarksObtained(null);
        } else {
            submission = AssignmentSubmission.builder()
                    .assignmentId(assignmentId)
                    .studentId(studentId)
                    .submissionFileUrl(request.getSubmissionFileUrl())
                    .build();
        }

        AssignmentSubmission saved = submissionRepository.save(submission);
        
        // Award Submission XP
        User student = userRepository.findById(studentId).get();
        authService.addXp(student, 40);

        // Check course completion
        checkAndHandleCourseCompletion(studentId, assignment.getCourseId());

        return convertToSubmissionResponse(saved);
    }

    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(Long instructorId, Long submissionId, GradeSubmissionRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        submission.setGrade(request.getGrade());
        submission.setFeedback(request.getFeedback());
        submission.setGradedBy(instructorId);
        submission.setMarksObtained(request.getMarksObtained());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Notify student
        notificationService.sendNotification(submission.getStudentId(), "Assignment Graded! 📝", 
                "Your submission for assignment '" + assignment.getTitle() + "' has been graded. Marks: " + 
                request.getMarksObtained() + "/" + (assignment.getMaxMarks() != null ? assignment.getMaxMarks() : 100) + 
                " (Grade: " + request.getGrade() + ").");

        // Award grading bonus XP to student if score is good
        if ("A".equals(request.getGrade()) || "B".equals(request.getGrade()) || 
            (request.getMarksObtained() != null && assignment.getMaxMarks() != null && 
             (double)request.getMarksObtained() / assignment.getMaxMarks() >= 0.8)) {
            User student = userRepository.findById(submission.getStudentId()).orElse(null);
            if (student != null) {
                authService.addXp(student, 50);
            }
        }

        return convertToSubmissionResponse(saved);
    }

    public List<ForumResponse> getForumThreads(Long courseId) {
        return forumRepository.findByCourseIdOrderByIsPinnedDescCreatedAtDesc(courseId)
                .stream().map(this::convertToForumResponse).collect(Collectors.toList());
    }

    @Transactional
    public ForumResponse createForumThread(Long userId, Long courseId, ForumCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Forum forum = Forum.builder()
                .courseId(courseId)
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(false)
                .likesCount(0)
                .build();

        return convertToForumResponse(forumRepository.save(forum));
    }

    @Transactional
    public ForumReplyResponse replyToForum(Long userId, Long forumId, ForumReplyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Forum forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum thread not found"));

        boolean isInstructor = "ROLE_INSTRUCTOR".equals(user.getRole().getName());

        ForumReply reply = ForumReply.builder()
                .forumId(forumId)
                .user(user)
                .content(request.getContent())
                .isInstructorReply(isInstructor)
                .build();

        ForumReply saved = forumReplyRepository.save(reply);
        
        // Award contribution XP
        authService.addXp(user, 15);

        return convertToReplyResponse(saved);
    }

    public Certificate getCertificate(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
        return certificateRepository.findByEnrollmentId(enrollment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Certificate has not been generated yet. Please complete all lessons first."));
    }

    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        return enrollments.stream().map(e -> {
            Course c = e.getCourse();
            CourseSummary summary = CourseSummary.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .subtitle(c.getSubtitle())
                    .thumbnailUrl(c.getThumbnailUrl())
                    .price(c.getPrice())
                    .isFree(c.getIsFree())
                    .durationHours(c.getDurationHours())
                    .instructorName(c.getInstructor() != null
                            ? c.getInstructor().getFirstName() + " " + c.getInstructor().getLastName()
                            : "Unknown")
                    .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                    .status(c.getStatus())
                    .build();
            return EnrollmentResponse.builder()
                    .id(e.getId())
                    .course(summary)
                    .progressPercentage(e.getProgressPercentage() != null ? e.getProgressPercentage().doubleValue() : 0.0)
                    .completed(Boolean.TRUE.equals(e.getCompleted()))
                    .build();
        }).collect(Collectors.toList());
    }

    public List<AssignmentSubmissionResponse> getSubmissionsForAssignment(Long assignmentId) {
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);
        return submissions.stream().map(this::convertToSubmissionResponse).collect(Collectors.toList());
    }

    private void generateCertificateForEnrollment(Enrollment enrollment) {
        String uuid = UUID.randomUUID().toString();
        Certificate certificate = Certificate.builder()
                .enrollment(enrollment)
                .certificateUuid(uuid)
                .qrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://edusphere.com/verify/cert/" + uuid)
                .build();
        certificateRepository.save(certificate);
    }

    private AssignmentSubmissionResponse convertToSubmissionResponse(AssignmentSubmission s) {
        String graderName = "Pending Grader";
        if (s.getGradedBy() != null) {
            User grader = userRepository.findById(s.getGradedBy()).orElse(null);
            if (grader != null) {
                graderName = grader.getFirstName() + " " + grader.getLastName();
            }
        }
        Assignment assignment = assignmentRepository.findById(s.getAssignmentId()).orElse(null);
        LocalDateTime submittedTime = s.getSubmittedAt() != null ? s.getSubmittedAt() : LocalDateTime.now();
        boolean isLate = assignment != null && submittedTime.isAfter(assignment.getDeadline());

        return AssignmentSubmissionResponse.builder()
                .id(s.getId())
                .submissionFileUrl(s.getSubmissionFileUrl())
                .submittedAt(s.getSubmittedAt())
                .grade(s.getGrade())
                .feedback(s.getFeedback())
                .gradedByName(graderName)
                .marksObtained(s.getMarksObtained())
                .isLate(isLate)
                .build();
    }

    private ForumResponse convertToForumResponse(Forum f) {
        List<ForumReplyResponse> replies = forumReplyRepository.findByForumIdOrderByCreatedAtAsc(f.getId())
                .stream().map(this::convertToReplyResponse).collect(Collectors.toList());

        return ForumResponse.builder()
                .id(f.getId())
                .courseId(f.getCourseId())
                .userId(f.getUser().getId())
                .username(f.getUser().getFirstName() + " " + f.getUser().getLastName())
                .userProfilePic(f.getUser().getProfilePictureUrl())
                .title(f.getTitle())
                .content(f.getContent())
                .pinned(f.getIsPinned())
                .likesCount(f.getLikesCount())
                .createdAt(f.getCreatedAt())
                .replies(replies)
                .build();
    }

    private ForumReplyResponse convertToReplyResponse(ForumReply r) {
        return ForumReplyResponse.builder()
                .id(r.getId())
                .forumId(r.getForumId())
                .userId(r.getUser().getId())
                .username(r.getUser().getFirstName() + " " + r.getUser().getLastName())
                .userProfilePic(r.getUser().getProfilePictureUrl())
                .content(r.getContent())
                .instructorReply(r.getIsInstructorReply())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private List<String> readListValue(String value) {
        if (value == null || value.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(value, new TypeReference<List<String>>() {});
        } catch (IOException e) {
            return Arrays.asList(value.replace("[", "").replace("]", "").replace("\"", "").split(","));
        }
    }

    private String writeValueAsString(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            return "[]";
        }
    }

    // ===================== Instructor Course Management =====================

    @Transactional
    public QuizResponse createQuiz(Long courseId, QuizCreateRequest request) {
        Quiz quiz = Quiz.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .negativeMarking(request.isNegativeMarking())
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 60)
                .attemptsLimit(request.getAttemptsLimit() != null ? request.getAttemptsLimit() : 1)
                .showScoreImmediately(request.isShowScoreImmediately())
                .showCorrectAnswers(request.isShowCorrectAnswers())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .build();
        Quiz saved = quizRepository.save(quiz);

        if ("PUBLISHED".equalsIgnoreCase(saved.getStatus())) {
            notificationService.notifyCourseStudents(courseId, "New Quiz Published! 🏆", 
                    "A new quiz '" + saved.getTitle() + "' has been published in your course. Good luck!");
        }
        notificationService.sendContentUpdateSignal(courseId, "QUIZ_UPDATE");

        return QuizResponse.builder()
                .id(saved.getId())
                .courseId(saved.getCourseId())
                .title(saved.getTitle())
                .timeLimitMinutes(saved.getTimeLimitMinutes())
                .negativeMarking(saved.getNegativeMarking())
                .passingScore(saved.getPassingScore())
                .attemptsLimit(saved.getAttemptsLimit())
                .showScoreImmediately(saved.getShowScoreImmediately())
                .showCorrectAnswers(saved.getShowCorrectAnswers())
                .status(saved.getStatus())
                .questions(Collections.emptyList())
                .build();
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        // Delete all questions first
        questionRepository.deleteAll(questionRepository.findByQuizId(quizId));
        quizRepository.delete(quiz);
        
        notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");
    }

    @Transactional
    public QuestionResponse addQuestion(Long quizId, QuestionCreateRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        Question question = Question.builder()
                .quizId(quizId)
                .questionText(request.getQuestionText())
                .options(request.getOptions())
                .correctOptionIndex(request.getCorrectOptionIndex())
                .explanation(request.getExplanation())
                .type(request.getType() != null ? request.getType() : "MCQ_SINGLE")
                .correctOptionIndices(request.getCorrectOptionIndices())
                .correctAnswerText(request.getCorrectAnswerText())
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        Question saved = questionRepository.save(question);
        
        notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");

        return QuestionResponse.builder()
                .id(saved.getId())
                .questionText(saved.getQuestionText())
                .options(saved.getOptions())
                .correctOptionIndex(saved.getCorrectOptionIndex())
                .explanation(saved.getExplanation())
                .type(saved.getType())
                .correctOptionIndices(saved.getCorrectOptionIndices())
                .correctAnswerText(saved.getCorrectAnswerText())
                .imageUrl(saved.getImageUrl())
                .sortOrder(saved.getSortOrder())
                .build();
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        questionRepository.delete(question);
        
        Quiz quiz = quizRepository.findById(question.getQuizId()).orElse(null);
        if (quiz != null) {
            notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");
        }
    }

    @Transactional
    public AssignmentResponse createAssignment(Long courseId, AssignmentCreateRequest request) {
        Assignment assignment = Assignment.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .fileUrl(request.getFileUrl())
                .deadline(request.getDeadline())
                .maxMarks(request.getMaxMarks() != null ? request.getMaxMarks() : 100)
                .rubrics(request.getRubrics())
                .build();
        Assignment saved = assignmentRepository.save(assignment);

        // Notify students
        notificationService.notifyCourseStudents(courseId, "New Assignment! 📝", 
                "A new assignment '" + saved.getTitle() + "' has been created in your course. Deadline: " + saved.getDeadline());
        
        // Content update signal
        notificationService.sendContentUpdateSignal(courseId, "ASSIGNMENT_UPDATE");

        return AssignmentResponse.builder()
                .id(saved.getId())
                .courseId(saved.getCourseId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .fileUrl(saved.getFileUrl())
                .deadline(saved.getDeadline())
                .maxMarks(saved.getMaxMarks())
                .rubrics(saved.getRubrics())
                .submission(null)
                .build();
    }

    @Transactional
    public void deleteAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        // Delete all submissions first
        submissionRepository.deleteAll(submissionRepository.findByAssignmentId(assignmentId));
        assignmentRepository.delete(assignment);
    }

    public List<QuizResponse> getQuizzesForCourse(Long courseId) {
        return quizRepository.findByCourseId(courseId).stream().map(quiz -> {
            List<Question> questions = questionRepository.findByQuizId(quiz.getId());
            questions.sort(Comparator.comparingInt(q -> q.getSortOrder() != null ? q.getSortOrder() : 0));
            List<QuestionResponse> qResponses = questions.stream().map(q -> QuestionResponse.builder()
                    .id(q.getId())
                    .questionText(q.getQuestionText())
                    .options(q.getOptions())
                    .correctOptionIndex(q.getCorrectOptionIndex())
                    .explanation(q.getExplanation())
                    .type(q.getType())
                    .correctOptionIndices(q.getCorrectOptionIndices())
                    .correctAnswerText(q.getCorrectAnswerText())
                    .imageUrl(q.getImageUrl())
                    .sortOrder(q.getSortOrder())
                    .build()).collect(Collectors.toList());
            return QuizResponse.builder()
                    .id(quiz.getId())
                    .courseId(quiz.getCourseId())
                    .title(quiz.getTitle())
                    .timeLimitMinutes(quiz.getTimeLimitMinutes())
                    .negativeMarking(quiz.getNegativeMarking())
                    .passingScore(quiz.getPassingScore())
                    .attemptsLimit(quiz.getAttemptsLimit())
                    .showScoreImmediately(quiz.getShowScoreImmediately())
                    .showCorrectAnswers(quiz.getShowCorrectAnswers())
                    .status(quiz.getStatus())
                    .questions(qResponses)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<com.edusphere.dto.AuthDto.UserResponse> getLeaderboard() {
        List<User> students = userRepository.findByRoleName("ROLE_STUDENT");
        students.sort((u1, u2) -> {
            int xp1 = u1.getXpPoints() != null ? u1.getXpPoints() : 0;
            int xp2 = u2.getXpPoints() != null ? u2.getXpPoints() : 0;
            return Integer.compare(xp2, xp1);
        });
        return students.stream().map(u -> com.edusphere.dto.AuthDto.UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .role(u.getRole() != null ? u.getRole().getName() : "ROLE_STUDENT")
                .profilePictureUrl(u.getProfilePictureUrl())
                .xpPoints(u.getXpPoints() != null ? u.getXpPoints() : 0)
                .streakCount(u.getStreakCount() != null ? u.getStreakCount() : 0)
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public QuizResponse updateQuiz(Long quizId, QuizCreateRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        quiz.setTitle(request.getTitle());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setNegativeMarking(request.isNegativeMarking());
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 60);
        quiz.setAttemptsLimit(request.getAttemptsLimit() != null ? request.getAttemptsLimit() : 1);
        quiz.setShowScoreImmediately(request.isShowScoreImmediately());
        quiz.setShowCorrectAnswers(request.isShowCorrectAnswers());
        quiz.setStatus(request.getStatus() != null ? request.getStatus() : "DRAFT");
        
        Quiz saved = quizRepository.save(quiz);

        if ("PUBLISHED".equalsIgnoreCase(saved.getStatus())) {
            notificationService.notifyCourseStudents(quiz.getCourseId(), "New Quiz Published! 🏆", 
                    "A new quiz '" + saved.getTitle() + "' has been published in your course. Good luck!");
        }
        notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");
        
        return getQuizResponse(saved);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long questionId, QuestionCreateRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        question.setQuestionText(request.getQuestionText());
        question.setOptions(request.getOptions());
        question.setCorrectOptionIndex(request.getCorrectOptionIndex());
        question.setExplanation(request.getExplanation());
        question.setType(request.getType() != null ? request.getType() : "MCQ_SINGLE");
        question.setCorrectOptionIndices(request.getCorrectOptionIndices());
        question.setCorrectAnswerText(request.getCorrectAnswerText());
        question.setImageUrl(request.getImageUrl());
        if (request.getSortOrder() != null) {
            question.setSortOrder(request.getSortOrder());
        }
        
        Question saved = questionRepository.save(question);
        
        Quiz quiz = quizRepository.findById(saved.getQuizId()).orElse(null);
        if (quiz != null) {
            notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");
        }
        
        return QuestionResponse.builder()
                .id(saved.getId())
                .questionText(saved.getQuestionText())
                .options(saved.getOptions())
                .correctOptionIndex(saved.getCorrectOptionIndex())
                .explanation(saved.getExplanation())
                .type(saved.getType())
                .correctOptionIndices(saved.getCorrectOptionIndices())
                .correctAnswerText(saved.getCorrectAnswerText())
                .imageUrl(saved.getImageUrl())
                .sortOrder(saved.getSortOrder())
                .build();
    }

    @Transactional
    public void reorderQuestions(Long quizId, List<Long> questionIds) {
        List<Question> questions = questionRepository.findByQuizId(quizId);
        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        
        for (int i = 0; i < questionIds.size(); i++) {
            Long qId = questionIds.get(i);
            Question q = questionMap.get(qId);
            if (q != null) {
                q.setSortOrder(i);
                questionRepository.save(q);
            }
        }
        
        Quiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz != null) {
            notificationService.sendContentUpdateSignal(quiz.getCourseId(), "QUIZ_UPDATE");
        }
    }

    public void checkAndHandleCourseCompletion(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId).orElse(null);
        if (enrollment == null || Boolean.TRUE.equals(enrollment.getCompleted())) {
            return;
        }

        // 1. Lessons completed check
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        List<LessonProgress> progresses = lessonProgressRepository.findByEnrollmentId(enrollment.getId());
        long completedLessons = progresses.stream().filter(LessonProgress::getCompleted).count();
        boolean allLessonsCompleted = (completedLessons >= lessons.size() && !lessons.isEmpty());

        // 2. Assignments completed check
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        long submittedAssignments = 0;
        for (Assignment a : assignments) {
            if (submissionRepository.findByAssignmentIdAndStudentId(a.getId(), studentId).isPresent()) {
                submittedAssignments++;
            }
        }
        boolean allAssignmentsCompleted = (submittedAssignments >= assignments.size());

        // 3. Quiz passed check
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        boolean quizPassed = true;
        for (Quiz q : quizzes) {
            List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdAndQuizId(studentId, q.getId());
            boolean hasPassed = attempts.stream().anyMatch(QuizAttempt::getPassed);
            if (!hasPassed) {
                quizPassed = false;
                break;
            }
        }
        if (quizzes.isEmpty()) {
            quizPassed = true;
        }

        if (allLessonsCompleted && allAssignmentsCompleted && quizPassed) {
            enrollment.setCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);

            // Award graduation XP
            User student = userRepository.findById(studentId).orElse(null);
            if (student != null) {
                authService.addXp(student, 200);
            }

            // Auto generate certificate
            generateCertificateForEnrollment(enrollment);
            
            // Notify student
            notificationService.sendNotification(studentId, "Course Completed! 🎓", 
                "Congratulations! You have completed all lessons, assignments, and passed the final quiz for '" + enrollment.getCourse().getTitle() + "'. Your certificate has been issued.");
        }
    }

    public List<LeaderboardEntry> getCourseLeaderboard(Long courseId) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<LeaderboardEntry> entries = new ArrayList<>();
        
        List<User> allStudents = userRepository.findByRoleName("ROLE_STUDENT");
        allStudents.sort((u1, u2) -> {
            int xp1 = u1.getXpPoints() != null ? u1.getXpPoints() : 0;
            int xp2 = u2.getXpPoints() != null ? u2.getXpPoints() : 0;
            return Integer.compare(xp2, xp1);
        });
        Map<Long, Integer> overallRanks = new HashMap<>();
        for (int i = 0; i < allStudents.size(); i++) {
            overallRanks.put(allStudents.get(i).getId(), i + 1);
        }
        
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        
        for (Enrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            double totalScore = 0;
            double totalPercentage = 0;
            int totalDuration = 0;
            int attemptsCount = 0;
            
            for (Quiz quiz : quizzes) {
                List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdAndQuizId(student.getId(), quiz.getId());
                if (!attempts.isEmpty()) {
                    attemptsCount += attempts.size();
                    QuizAttempt best = attempts.stream()
                            .max(Comparator.comparingInt(QuizAttempt::getScore))
                            .orElse(attempts.get(0));
                    totalScore += best.getScore();
                    totalPercentage += best.getPercentage() != null ? best.getPercentage() : best.getScore();
                    totalDuration += best.getDurationSeconds() != null ? best.getDurationSeconds() : 0;
                }
            }
            
            double avgScore = quizzes.isEmpty() ? 0 : totalScore / quizzes.size();
            double avgPercentage = quizzes.isEmpty() ? 0 : totalPercentage / quizzes.size();
            
            entries.add(LeaderboardEntry.builder()
                    .studentName(student.getFirstName() + " " + student.getLastName())
                    .score(Math.round(avgScore * 100.0) / 100.0)
                    .percentage(Math.round(avgPercentage * 100.0) / 100.0)
                    .timeTakenSeconds(totalDuration)
                    .attempts(attemptsCount)
                    .overallRank(overallRanks.getOrDefault(student.getId(), 0))
                    .build());
        }
        
        entries.sort((e1, e2) -> Double.compare(e2.getPercentage(), e1.getPercentage()));
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setCourseRank(i + 1);
            entries.get(i).setRank(i + 1);
        }
        
        return entries;
    }

    private QuizResponse getQuizResponse(Quiz quiz) {
        List<Question> questions = questionRepository.findByQuizId(quiz.getId());
        questions.sort(Comparator.comparingInt(q -> q.getSortOrder() != null ? q.getSortOrder() : 0));
        List<QuestionResponse> qResponses = questions.stream().map(q -> QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .options(q.getOptions())
                .correctOptionIndex(q.getCorrectOptionIndex())
                .explanation(q.getExplanation())
                .type(q.getType())
                .correctOptionIndices(q.getCorrectOptionIndices())
                .correctAnswerText(q.getCorrectAnswerText())
                .imageUrl(q.getImageUrl())
                .sortOrder(q.getSortOrder())
                .build()).collect(Collectors.toList());
        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourseId())
                .title(quiz.getTitle())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .negativeMarking(quiz.getNegativeMarking())
                .passingScore(quiz.getPassingScore())
                .attemptsLimit(quiz.getAttemptsLimit())
                .showScoreImmediately(quiz.getShowScoreImmediately())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .status(quiz.getStatus())
                .questions(qResponses)
                .build();
    }
}

