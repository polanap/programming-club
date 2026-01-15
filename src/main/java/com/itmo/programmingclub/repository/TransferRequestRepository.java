package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.model.TransferRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.TransferRequest;

import java.util.List;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Integer> {
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.student.user.id = :studentId")
    List<TransferRequest> findByStudentId(@Param("studentId") Integer studentId);
    
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.manager.user.id = :managerId")
    List<TransferRequest> findByManagerId(@Param("managerId") Integer managerId);
    
    List<TransferRequest> findByStatus(TransferRequestStatus status);
    
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.status = :status")
    List<TransferRequest> findUnassignedRequests(@Param("status") TransferRequestStatus status);
    
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.curator.user.id = :curatorId")
    List<TransferRequest> findByCuratorId(@Param("curatorId") Integer curatorId);
    
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.status = :status AND tr.curator.user.id = :curatorId")
    List<TransferRequest> findByStatusAndCuratorId(@Param("status") TransferRequestStatus status, @Param("curatorId") Integer curatorId);
    
    @Query("SELECT tr FROM TransferRequest tr WHERE tr.student.id = :studentUserRoleId " +
           "AND tr.sourceGroup.id = :groupId " +
           "AND tr.status NOT IN :closedStatuses")
    List<TransferRequest> findOpenRequestsByStudentAndGroup(
            @Param("studentUserRoleId") Integer studentUserRoleId,
            @Param("groupId") Integer groupId,
            @Param("closedStatuses") List<TransferRequestStatus> closedStatuses);
}

