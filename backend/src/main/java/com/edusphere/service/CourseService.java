package com.edusphere.service;

import com.edusphere.dto.CourseDto.*;
import com.edusphere.exception.ResourceNotFoundException;
import com.edusphere.model.*;
import com.edusphere.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationService notificationService;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<CourseResponse> getCourses(String status, String search, Long categoryId) {
        List<Course> courses;

        if (search != null && !search.isEmpty()) {
            courses = courseRepository.findByTitleContainingIgnoreCaseOrSubtitleContainingIgnoreCase(search, search);
        } else if (categoryId != null) {
            courses = courseRepository.findByCategoryId(categoryId);
        } else if (status != null && !status.isEmpty()) {
            courses = courseRepository.findByStatus(status);
        } else {
            courses = courseRepository.findAll();
        }

        return courses.stream().map(this::convertToCourseResponse).collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return convertToCourseResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        Course course = Course.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .trailerUrl(request.getTrailerUrl())
                .price(request.getPrice())
                .isFree(request.isFree())
                .learningOutcomes(writeValueAsString(request.getLearningOutcomes()))
                .requirements(writeValueAsString(request.getRequirements()))
                .durationHours(request.getDurationHours())
                .status("DRAFT") // Default to draft, needs admin approval
                .instructor(instructor)
                .category(category)
                .build();

        Course saved = courseRepository.save(course);
        return convertToCourseResponse(saved);
    }

    @Transactional
    public CourseResponse updateCourseStatus(Long id, String status) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        course.setStatus(status.toUpperCase());
        return convertToCourseResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        courseRepository.delete(course);
    }

    public List<LessonResponse> getLessonsForCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId)
                .stream().map(this::convertToLessonResponse).collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse addLesson(Long courseId, LessonCreateRequest request) {
        Lesson lesson = Lesson.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .content(request.getContent())
                .videoUrl(request.getVideoUrl())
                .pdfUrl(request.getPdfUrl())
                .imageUrl(request.getImageUrl())
                .pptUrl(request.getPptUrl())
                .wordUrl(request.getWordUrl())
                .zipUrl(request.getZipUrl())
                .audioUrl(request.getAudioUrl())
                .codeExamples(request.getCodeExamples())
                .externalLinks(writeValueAsString(request.getExternalLinks()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .sortOrder(request.getSortOrder())
                .isDraft(request.isDraft())
                .isVisible(request.isVisible())
                .build();

        Lesson saved = lessonRepository.save(lesson);

        if (!saved.getIsDraft() && saved.getIsVisible()) {
            notificationService.notifyCourseStudents(courseId, "New Lesson Published! 📚", 
                    "A new lesson '" + saved.getTitle() + "' has been published in your course.");
        }
        notificationService.sendContentUpdateSignal(courseId, "LESSON_UPDATE");

        return convertToLessonResponse(saved);
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonCreateRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        
        boolean wasDraft = Boolean.TRUE.equals(lesson.getIsDraft());
        boolean wasVisible = Boolean.TRUE.equals(lesson.getIsVisible());

        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setPdfUrl(request.getPdfUrl());
        lesson.setImageUrl(request.getImageUrl());
        lesson.setPptUrl(request.getPptUrl());
        lesson.setWordUrl(request.getWordUrl());
        lesson.setZipUrl(request.getZipUrl());
        lesson.setAudioUrl(request.getAudioUrl());
        lesson.setCodeExamples(request.getCodeExamples());
        lesson.setExternalLinks(writeValueAsString(request.getExternalLinks()));
        lesson.setEstimatedMinutes(request.getEstimatedMinutes());
        lesson.setSortOrder(request.getSortOrder());
        lesson.setIsDraft(request.isDraft());
        lesson.setIsVisible(request.isVisible());

        Lesson saved = lessonRepository.save(lesson);

        if ((wasDraft || !wasVisible) && !saved.getIsDraft() && saved.getIsVisible()) {
            notificationService.notifyCourseStudents(saved.getCourseId(), "New Lesson Published! 📚", 
                    "A new lesson '" + saved.getTitle() + "' has been published in your course.");
        }

        notificationService.sendContentUpdateSignal(saved.getCourseId(), "LESSON_UPDATE");

        return convertToLessonResponse(saved);
    }

    @Transactional
    public void reorderLessons(Long courseId, List<Long> lessonIds) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        Map<Long, Lesson> lessonMap = lessons.stream()
                .collect(Collectors.toMap(Lesson::getId, l -> l));

        for (int i = 0; i < lessonIds.size(); i++) {
            Long lId = lessonIds.get(i);
            Lesson l = lessonMap.get(lId);
            if (l != null) {
                l.setSortOrder(i);
                lessonRepository.save(l);
            }
        }

        notificationService.sendContentUpdateSignal(courseId, "LESSON_UPDATE");
    }

    private CourseResponse convertToCourseResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .trailerUrl(course.getTrailerUrl())
                .price(course.getPrice())
                .isFree(course.getIsFree())
                .learningOutcomes(readListValue(course.getLearningOutcomes()))
                .requirements(readListValue(course.getRequirements()))
                .durationHours(course.getDurationHours())
                .status(course.getStatus())
                .instructorId(course.getInstructor().getId())
                .instructorName(course.getInstructor().getFirstName() + " " + course.getInstructor().getLastName())
                .categoryId(course.getCategory() != null ? course.getCategory().getId() : null)
                .categoryName(course.getCategory() != null ? course.getCategory().getName() : null)
                .build();
    }

    private LessonResponse convertToLessonResponse(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourseId())
                .title(lesson.getTitle())
                .content(lesson.getContent())
                .videoUrl(lesson.getVideoUrl())
                .pdfUrl(lesson.getPdfUrl())
                .imageUrl(lesson.getImageUrl())
                .pptUrl(lesson.getPptUrl())
                .wordUrl(lesson.getWordUrl())
                .zipUrl(lesson.getZipUrl())
                .audioUrl(lesson.getAudioUrl())
                .codeExamples(lesson.getCodeExamples())
                .externalLinks(readListValue(lesson.getExternalLinks()))
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .sortOrder(lesson.getSortOrder())
                .isDraft(Boolean.TRUE.equals(lesson.getIsDraft()))
                .isVisible(Boolean.TRUE.equals(lesson.getIsVisible()))
                .build();
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        lessonRepository.delete(lesson);
        notificationService.sendContentUpdateSignal(lesson.getCourseId(), "LESSON_UPDATE");
    }

    private String writeValueAsString(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            return "[]";
        }
    }

    private List<String> readListValue(String value) {
        if (value == null || value.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(value, new TypeReference<List<String>>() {});
        } catch (IOException e) {
            return Arrays.asList(value.replace("[", "").replace("]", "").replace("\"", "").split(","));
        }
    }
}

