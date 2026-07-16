package com.edusphere.controller;

import com.edusphere.dto.CourseDto.*;
import com.edusphere.model.Category;
import com.edusphere.security.UserDetailsImpl;
import com.edusphere.service.CourseService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@Tag(name = "Course Module", description = "Endpoints for course listing, creation, and lesson editing")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(courseService.getCourses(status, search, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(courseService.getAllCategories());
    }

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> createCourse(
            Authentication authentication,
            @Valid @RequestBody CourseCreateRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(courseService.createCourse(request, userDetails.getId()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> updateCourseStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(courseService.updateCourseStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessons(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getLessonsForCourse(id));
    }

    @PostMapping("/{id}/lessons")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<LessonResponse> addLesson(
            @PathVariable Long id,
            @Valid @RequestBody LessonCreateRequest request) {
        return ResponseEntity.ok(courseService.addLesson(id, request));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        courseService.deleteLesson(lessonId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lessons/{lessonId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonCreateRequest request) {
        return ResponseEntity.ok(courseService.updateLesson(lessonId, request));
    }

    @PostMapping("/{courseId}/lessons/reorder")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> reorderLessons(
            @PathVariable Long courseId,
            @RequestBody List<Long> lessonIds) {
        courseService.reorderLessons(courseId, lessonIds);
        return ResponseEntity.ok().build();
    }
}

