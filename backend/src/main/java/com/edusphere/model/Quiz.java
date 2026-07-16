package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "negative_marking")
    @Builder.Default
    private Boolean negativeMarking = false;

    @Column(name = "passing_score")
    @Builder.Default
    private Integer passingScore = 60;

    @Column(name = "attempts_limit", nullable = false)
    @Builder.Default
    private Integer attemptsLimit = 1;

    @Column(name = "show_score_immediately", nullable = false)
    @Builder.Default
    private Boolean showScoreImmediately = true;

    @Column(name = "show_correct_answers", nullable = false)
    @Builder.Default
    private Boolean showCorrectAnswers = true;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "DRAFT";
}
