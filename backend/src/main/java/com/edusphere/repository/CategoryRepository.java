package com.edusphere.repository;

import com.edusphere.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParentCategoryIdNull();
    List<Category> findByParentCategoryId(Long parentCategoryId);
}
