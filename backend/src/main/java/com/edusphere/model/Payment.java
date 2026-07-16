package com.edusphere.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus = "COMPLETED";

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
