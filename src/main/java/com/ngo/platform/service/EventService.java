package com.ngo.platform.service;

import com.ngo.platform.dto.EventRequest;
import com.ngo.platform.dto.EventResponse;
import com.ngo.platform.exception.ResourceNotFoundException;
import com.ngo.platform.model.Event;
import com.ngo.platform.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public EventResponse createEvent(EventRequest request) {
        String qrToken = UUID.randomUUID().toString();

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .date(request.getDate())
                .location(request.getLocation())
                .qrToken(qrToken)
                .build();

        Event saved = eventRepository.save(event);
        return mapToResponse(saved);
    }

    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with id: " + id));
        return mapToResponse(event);
    }

    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
    }

    public List<EventResponse> searchEvents(String title, String location, LocalDateTime date) {
        return eventRepository.searchEvents(title, location, date)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EventResponse mapToResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .date(event.getDate())
                .location(event.getLocation())
                .qrToken(event.getQrToken())
                .build();
    }
}