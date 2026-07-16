package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Lob
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", nullable = false, length = 2000)
    private List<String> options;

    @Column(name = "correct_option_index", nullable = false)
    private Integer correctOptionIndex;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 30)
    @Builder.Default
    private String type = "MCQ_SINGLE";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "correct_option_indices", length = 500)
    private List<Integer> correctOptionIndices;

    @Lob
    @Column(name = "correct_answer_text", columnDefinition = "TEXT")
    private String correctAnswerText;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
