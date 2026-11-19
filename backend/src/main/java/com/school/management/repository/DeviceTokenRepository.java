package com.school.management.repository;

import com.school.management.entity.DeviceToken;
import com.school.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByToken(String token);
    List<DeviceToken> findByUser(User user);
    List<DeviceToken> findByRole(String role);
    void deleteByToken(String token);
}
