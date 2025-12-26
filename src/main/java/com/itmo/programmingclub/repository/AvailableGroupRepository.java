package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.AvailableGroup;

import java.util.List;

@Repository
public interface AvailableGroupRepository extends JpaRepository<AvailableGroup, Integer> {
    List<AvailableGroup> findByTransferRequestId(Integer requestId);
    List<AvailableGroup> findByGroupId(Integer groupId);
}

