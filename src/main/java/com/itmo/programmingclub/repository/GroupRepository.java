package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Integer> {
}

