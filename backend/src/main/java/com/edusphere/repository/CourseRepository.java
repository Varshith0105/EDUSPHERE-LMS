package com.edusphere.repository;

import com.edusphere.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatus(String status);
    List<Course> findByInstructorId(Long instructorId);
    List<Course> findByCategoryId(Long categoryId);
    List<Course> findByTitleContainingIgnoreCaseOrSubtitleContainingIgnoreCase(String title, String subtitle);
}
