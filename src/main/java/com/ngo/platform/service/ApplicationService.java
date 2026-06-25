package com.ngo.platform.service;

import com.ngo.platform.dto.ApplicationResponse;
import com.ngo.platform.dto.StatusUpdateRequest;
import com.ngo.platform.exception.DuplicateResourceException;
import com.ngo.platform.exception.ResourceNotFoundException;
import com.ngo.platform.model.Application;
import com.ngo.platform.model.ApplicationStatus;
import com.ngo.platform.model.Event;
import com.ngo.platform.model.User;
import com.ngo.platform.repository.ApplicationRepository;
import com.ngo.platform.repository.EventRepository;
import com.ngo.platform.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                              UserRepository userRepository,
                              EventRepository eventRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    public ApplicationResponse applyToEvent(Long eventId) {

        String currentUserEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Authenticated user not found"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Event not found with id: " + eventId));

        if (applicationRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            throw new DuplicateResourceException("You have already applied to this event");
        }

        Application application = Application.builder()
                .user(user)
                .event(event)
                .status(ApplicationStatus.PENDING)
                .build();

        Application saved = applicationRepository.save(application);

        return mapToResponse(saved);
    }

    public List<ApplicationResponse> getMyApplications() {

        String currentUserEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Authenticated user not found"));

        return applicationRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ApplicationResponse> getAllApplications() {

        return applicationRepository.findAllWithUserAndEvent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ApplicationResponse> getApplicationsForEvent(Long eventId) {

        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }

        return applicationRepository.findByEventId(eventId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ApplicationResponse updateApplicationStatus(
            Long applicationId,
            StatusUpdateRequest request) {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Application not found with id: " + applicationId));

        ApplicationStatus newStatus = request.getStatus();

        if (newStatus == ApplicationStatus.COMPLETED
                && application.getEvent().getDate().isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Event cannot be marked COMPLETED before the event date");
        }

        application.setStatus(newStatus);

        Application updated = applicationRepository.save(application);

        return mapToResponse(updated);
    }

    private ApplicationResponse mapToResponse(Application app) {

        return ApplicationResponse.builder()
                .id(app.getId())
                .userId(app.getUser() != null ? app.getUser().getId() : null)
                .userName(app.getUser() != null ? app.getUser().getName() : null)
                .userEmail(app.getUser() != null ? app.getUser().getEmail() : null)
                .eventId(app.getEvent() != null ? app.getEvent().getId() : null)
                .eventTitle(app.getEvent() != null ? app.getEvent().getTitle() : null)
                .eventDate(app.getEvent() != null ? app.getEvent().getDate() : null)
                .status(app.getStatus() != null ? app.getStatus().name() : null)
                .build();
    }
}