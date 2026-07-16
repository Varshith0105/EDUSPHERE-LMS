package com.edusphere.repository;

import com.edusphere.model.Forum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumRepository extends JpaRepository<Forum, Long> {
    List<Forum> findByCourseIdOrderByIsPinnedDescCreatedAtDesc(Long courseId);
}
