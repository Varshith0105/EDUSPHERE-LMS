package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 150)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "ppt_url")
    private String pptUrl;

    @Column(name = "word_url")
    private String wordUrl;

    @Column(name = "zip_url")
    private String zipUrl;

    @Column(name = "audio_url")
    private String audioUrl;

    @Lob
    @Column(name = "code_examples", columnDefinition = "TEXT")
    private String codeExamples;

    @Lob
    @Column(name = "external_links", columnDefinition = "TEXT")
    private String externalLinks;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_draft", nullable = false)
    @Builder.Default
    private Boolean isDraft = false;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;
}
