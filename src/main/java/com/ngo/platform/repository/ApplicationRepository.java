package com.ngo.platform.repository;

import com.ngo.platform.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    List<Application> findByUserId(Long userId);

    List<Application> findByEventId(Long eventId);

    Optional<Application> findByQrToken(String qrToken);
}