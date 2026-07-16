package com.edusphere.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class CourseDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseResponse {
        private Long id;
        private String title;
        private String subtitle;
        private String description;
        private String thumbnailUrl;
        private String trailerUrl;
        private BigDecimal price;
        private boolean isFree;
        private List<String> learningOutcomes;
        private List<String> requirements;
        private Integer durationHours;
        private String status;
        private Long instructorId;
        private String instructorName;
        private Long categoryId;
        private String categoryName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseCreateRequest {
        private String title;
        private String subtitle;
        private String description;
        private String thumbnailUrl;
        private String trailerUrl;
        private BigDecimal price;
        private boolean isFree;
        private List<String> learningOutcomes;
        private List<String> requirements;
        private Integer durationHours;
        private Long categoryId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LessonResponse {
        private Long id;
        private Long courseId;
        private String title;
        private String content;
        private String videoUrl;
        private String pdfUrl;
        private String imageUrl;
        private String pptUrl;
        private String wordUrl;
        private String zipUrl;
        private String audioUrl;
        private String codeExamples;
        private List<String> externalLinks;
        private Integer estimatedMinutes;
        private Integer sortOrder;
        private boolean completed;
        private boolean bookmarked;
        private String notes;
        private Integer lastWatchedSeconds;
        private boolean isDraft;
        private boolean isVisible;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LessonCreateRequest {
        private String title;
        private String content;
        private String videoUrl;
        private String pdfUrl;
        private String imageUrl;
        private String pptUrl;
        private String wordUrl;
        private String zipUrl;
        private String audioUrl;
        private String codeExamples;
        private List<String> externalLinks;
        private Integer estimatedMinutes;
        private Integer sortOrder;
        private boolean isDraft;
        private boolean isVisible;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LessonProgressRequest {
        private boolean completed;
        private boolean bookmarked;
        private String notes;
        private Integer lastWatchedSeconds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseSummary {
        private Long id;
        private String title;
        private String subtitle;
        private String thumbnailUrl;
        private java.math.BigDecimal price;
        private Boolean isFree;
        private Integer durationHours;
        private String instructorName;
        private String categoryName;
        private String status;
    }
}

