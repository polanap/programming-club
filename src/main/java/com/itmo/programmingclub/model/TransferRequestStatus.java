package com.itmo.programmingclub.model;

import java.util.List;

import static org.hibernate.internal.util.collections.CollectionHelper.listOf;

public enum TransferRequestStatus {
    NEW,
    UNDER_CONSIDERATION,
    WAITING_REASONS,
    REASON_RECEIVED,
    GROUP_SEARCH,
    GROUP_FOUND,
    TRANSFERRED,
    REJECTED;

    public List<TransferRequestStatus> getNextAvailableStatusesForStudent() {
        return switch (this) {
            case NEW, UNDER_CONSIDERATION, WAITING_REASONS, REASON_RECEIVED, GROUP_SEARCH -> listOf(REJECTED);
            case GROUP_FOUND -> listOf(REJECTED, TRANSFERRED);
            case TRANSFERRED, REJECTED -> listOf();
            default -> throw new RuntimeException("Unexpected status");
        };
    }

    public List<TransferRequestStatus> getNextAvailableStatusesForManager() {
        return switch (this) {
            case NEW -> listOf(UNDER_CONSIDERATION);
            case UNDER_CONSIDERATION -> listOf(WAITING_REASONS, REJECTED);
            case WAITING_REASONS -> listOf(REASON_RECEIVED, GROUP_SEARCH, REJECTED);
            case REASON_RECEIVED -> listOf(GROUP_SEARCH, REJECTED);
            case GROUP_SEARCH -> listOf(GROUP_FOUND, REJECTED);
            case GROUP_FOUND -> listOf(TRANSFERRED);
            case TRANSFERRED, REJECTED -> listOf();
            default -> throw new RuntimeException("Unexpected status");
        };
    }

    public List<TransferRequestStatus> getNextAvailableStatusesForCurator() {
        return switch (this) {
            case WAITING_REASONS -> listOf(REASON_RECEIVED);
            case NEW, UNDER_CONSIDERATION, REASON_RECEIVED, GROUP_SEARCH, GROUP_FOUND, TRANSFERRED, REJECTED ->
                    listOf();
            default -> throw new RuntimeException("Unexpected status");
        };
    }

}
