package com.ngo.platform.repository;

import com.ngo.platform.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Search by title (case-insensitive)
    List<Event> findByTitleContainingIgnoreCase(String title);

    // Filter by location (case-insensitive)
    List<Event> findByLocationContainingIgnoreCase(String location);

    // Filter events after a certain date
    List<Event> findByDateAfter(LocalDateTime date);

    // Search by title AND location
    List<Event> findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
            String title, String location);

    // Combined search — title, location, date
    @Query("SELECT e FROM Event e WHERE " +
           "(:title IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:location IS NULL OR LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:date IS NULL OR e.date >= :date)")
    List<Event> searchEvents(
            @Param("title") String title,
            @Param("location") String location,
            @Param("date") LocalDateTime date);
}
