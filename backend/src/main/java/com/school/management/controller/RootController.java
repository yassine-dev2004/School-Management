package com.school.management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class RootController {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @GetMapping({"/", "/api/health", "/api/ping"})
    public ResponseEntity<Map<String, Object>> root() {
        String dbStatus = "UP";
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            } catch (Exception e) {
                dbStatus = "DEGRADED";
            }
        }
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "db", dbStatus,
            "service", "School Management System Backend API",
            "version", "1.0.0",
            "timestamp", Instant.now().toString()
        ));
    }
}
