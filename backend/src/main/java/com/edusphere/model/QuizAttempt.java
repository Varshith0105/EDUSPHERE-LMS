package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    private Integer score;

    private Boolean passed;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "raw_score")
    private Double rawScore;

    @Column(name = "negative_marks")
    private Double negativeMarks;

    @Column(name = "percentage")
    private Double percentage;

    @Column(name = "attempt_number")
    private Integer attemptNumber;
}
