package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.AvailableGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailableGroupRepository extends JpaRepository<AvailableGroup, Integer> {
    List<AvailableGroup> findByTransferRequestId(Integer requestId);
    List<AvailableGroup> findByGroupId(Integer groupId);
}

