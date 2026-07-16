package com.edusphere.service;

import com.edusphere.model.Enrollment;
import com.edusphere.model.Notification;
import com.edusphere.repository.EnrollmentRepository;
import com.edusphere.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L); // 24 hour timeout
        this.emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((e) -> removeEmitter(userId, emitter));

        // Send initialization event
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected successfully"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = this.emitters.get(userId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                this.emitters.remove(userId);
            }
        }
    }

    public void sendNotification(Long userId, String title, String message) {
        // Save to Database
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        // Send SSE Event
        List<SseEmitter> userEmitters = this.emitters.get(userId);
        if (userEmitters != null) {
            for (SseEmitter emitter : userEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("NOTIFICATION")
                            .id(saved.getId().toString())
                            .data(saved));
                } catch (IOException e) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    public void notifyCourseStudents(Long courseId, String title, String message) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        for (Enrollment enrollment : enrollments) {
            sendNotification(enrollment.getStudent().getId(), title, message);
        }
    }

    public void sendContentUpdateSignal(Long courseId, String updateType) {
        // Broadcast type: updates lesson/quiz/assignment content in real-time
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        for (Enrollment enrollment : enrollments) {
            Long studentId = enrollment.getStudent().getId();
            List<SseEmitter> userEmitters = this.emitters.get(studentId);
            if (userEmitters != null) {
                for (SseEmitter emitter : userEmitters) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("CONTENT_UPDATE")
                                .data("{\"courseId\":" + courseId + ",\"type\":\"" + updateType + "\"}"));
                    } catch (IOException e) {
                        removeEmitter(studentId, emitter);
                    }
                }
            }
        }
    }
}
