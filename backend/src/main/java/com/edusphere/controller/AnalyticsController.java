package com.edusphere.controller;

import com.edusphere.dto.LmsDto.DashboardAnalytics;
import com.edusphere.dto.LmsDto.StudentDashboardData;
import com.edusphere.dto.LmsDto.InstructorDashboardData;
import com.edusphere.security.UserDetailsImpl;
import com.edusphere.service.AnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics Module", description = "Endpoints for dashboard charts, performance stats and platform growth data")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardAnalytics> getDashboardAnalytics() {
        return ResponseEntity.ok(analyticsService.getPlatformAnalytics());
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentDashboardData> getStudentAnalytics(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(analyticsService.getStudentAnalytics(userDetails.getId()));
    }

    @GetMapping("/instructor")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<InstructorDashboardData> getInstructorAnalytics(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(analyticsService.getInstructorAnalytics(userDetails.getId()));
    }
}
