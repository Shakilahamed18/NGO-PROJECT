package com.ngo.platform.model;

import jakarta.persistence.*;

@Entity
@Table(name = "applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "event_id"}))
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    // Constructors
    public Application() {}

    public Application(Long id, User user, Event event, ApplicationStatus status) {
        this.id = id;
        this.user = user;
        this.event = event;
        this.status = status;
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Event getEvent() { return event; }
    public ApplicationStatus getStatus() { return status; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setEvent(Event event) { this.event = event; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User user;
        private Event event;
        private ApplicationStatus status = ApplicationStatus.PENDING;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder event(Event event) { this.event = event; return this; }
        public Builder status(ApplicationStatus status) { this.status = status; return this; }

        public Application build() {
            return new Application(id, user, event, status);
        }
    }
}
