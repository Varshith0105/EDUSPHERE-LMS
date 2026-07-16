package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 255)
    private String subtitle;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "trailer_url")
    private String trailerUrl;

    private BigDecimal price;

    @Column(name = "is_free")
    private Boolean isFree = false;

    @Column(name = "learning_outcomes", length = 2000)
    private String learningOutcomes; // JSON string format

    @Column(length = 2000)
    private String requirements; // JSON string format

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(length = 20)
    private String status; // DRAFT, PENDING_APPROVAL, PUBLISHED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
