package com.ngo.platform.dto;

import com.ngo.platform.model.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public class StatusUpdateRequest {

    @NotNull(message = "Status is required (PENDING, APPROVED, REJECTED)")
    private ApplicationStatus status;

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
}
