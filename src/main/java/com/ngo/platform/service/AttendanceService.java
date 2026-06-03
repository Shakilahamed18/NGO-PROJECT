package com.ngo.platform.service;

import com.ngo.platform.dto.AttendanceResponse;
import com.ngo.platform.model.Application;
import com.ngo.platform.model.ApplicationStatus;
import com.ngo.platform.repository.ApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AttendanceService {

    private final ApplicationRepository applicationRepository;

    public AttendanceService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional
    public AttendanceResponse checkIn(String qrToken, String email) {
        Application application = applicationRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new RuntimeException("Invalid QR token"));

        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new RuntimeException("Application is not approved");
        }

        if (application.isAttended()) {
            throw new RuntimeException("Already checked in");
        }

        application.setAttended(true);
        application.setAttendedAt(LocalDateTime.now());
        applicationRepository.save(application);

        return new AttendanceResponse(
                "Check-in successful",
                application.getId(),
                application.getUser().getId(),
                application.getEvent().getId(),
                application.getAttendedAt()
        );
    }
}