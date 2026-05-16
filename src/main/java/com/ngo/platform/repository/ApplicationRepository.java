package com.ngo.platform.repository;

import com.ngo.platform.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserId(Long userId);
    List<Application> findByEventId(Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    Optional<Application> findByUserIdAndEventId(Long userId, Long eventId);
}
