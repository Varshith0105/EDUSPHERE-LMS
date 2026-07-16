package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 150)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(name = "max_marks", nullable = false)
    @Builder.Default
    private Integer maxMarks = 100;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String rubrics;
}
