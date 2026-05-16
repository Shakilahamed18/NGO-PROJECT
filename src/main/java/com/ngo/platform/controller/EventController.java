package com.ngo.platform.controller;

import com.ngo.platform.dto.EventRequest;
import com.ngo.platform.dto.EventResponse;
import com.ngo.platform.service.EventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // Create event — ADMIN only
    @PostMapping("/create")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    // Get all events
    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    // Get event by ID
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // Delete event — ADMIN only
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok("Event deleted successfully");
    }

    /**
     * Search events by title, location, date
     * Example: GET /api/events/search?title=beach&location=chennai&date=2025-08-01T00:00:00
     * All parameters are optional
     */
    @GetMapping("/search")
    public ResponseEntity<List<EventResponse>> searchEvents(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        return ResponseEntity.ok(eventService.searchEvents(title, location, date));
    }
}
