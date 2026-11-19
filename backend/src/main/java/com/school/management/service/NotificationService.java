package com.school.management.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import com.school.management.entity.DeviceToken;
import com.school.management.entity.User;
import com.school.management.repository.DeviceTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    public boolean isFirebaseAvailable() {
        return !FirebaseApp.getApps().isEmpty();
    }

    @Transactional
    public DeviceToken registerToken(User user, String token, String deviceType, String role) {
        Optional<DeviceToken> existing = deviceTokenRepository.findByToken(token);
        DeviceToken dt;
        if (existing.isPresent()) {
            dt = existing.get();
            dt.setUser(user);
            dt.setDeviceType(deviceType != null ? deviceType : "ANDROID");
            dt.setRole(role);
            dt.setLastUpdated(new Date());
        } else {
            dt = new DeviceToken(user, token, deviceType != null ? deviceType : "ANDROID", role);
        }
        DeviceToken saved = deviceTokenRepository.save(dt);

        // Auto-subscribe token to role topic if Firebase is active
        if (isFirebaseAvailable()) {
            try {
                FirebaseMessaging.getInstance().subscribeToTopic(Collections.singletonList(token), "all");
                if (role != null) {
                    String topic = role.replace("ROLE_", "").toLowerCase() + "s"; // e.g. parents, teachers
                    FirebaseMessaging.getInstance().subscribeToTopic(Collections.singletonList(token), topic);
                }
            } catch (Exception e) {
                logger.warn("Could not subscribe token to topics: {}", e.getMessage());
            }
        }
        return saved;
    }

    public boolean sendToTopic(String topic, String title, String body, Map<String, String> data) {
        if (!isFirebaseAvailable()) {
            logger.warn("Firebase is not initialized. Cannot send notification to topic: {}", topic);
            return false;
        }
        try {
            Message.Builder builder = Message.builder()
                    .setTopic(topic)
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                builder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(builder.build());
            logger.info("Successfully sent notification to topic {}: {}", topic, response);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send notification to topic {}: {}", topic, e.getMessage(), e);
            return false;
        }
    }

    public boolean sendToToken(String token, String title, String body, Map<String, String> data) {
        if (!isFirebaseAvailable()) {
            logger.warn("Firebase is not initialized. Cannot send notification to token.");
            return false;
        }
        try {
            Message.Builder builder = Message.builder()
                    .setToken(token)
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                builder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(builder.build());
            logger.info("Successfully sent notification to token: {}", response);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send notification to token: {}", e.getMessage(), e);
            return false;
        }
    }

    public int broadcastPush(String targetRole, Long classId, String title, String body) {
        if (!isFirebaseAvailable()) {
            logger.warn("Firebase not active. Broadcast push skipped.");
            return 0;
        }

        Map<String, String> data = new HashMap<>();
        data.put("title", title);
        data.put("body", body);
        data.put("click_action", "FLUTTER_NOTIFICATION_CLICK");

        if (classId != null && classId > 0) {
            String topic = "class_" + classId;
            boolean ok = sendToTopic(topic, title, body, data);
            return ok ? 1 : 0;
        }

        if (targetRole == null || targetRole.equalsIgnoreCase("ALL")) {
            boolean ok = sendToTopic("all", title, body, data);
            return ok ? 1 : 0;
        } else if (targetRole.equalsIgnoreCase("PARENT") || targetRole.equalsIgnoreCase("PARENTS") || targetRole.equalsIgnoreCase("ROLE_PARENT")) {
            boolean ok = sendToTopic("parents", title, body, data);
            return ok ? 1 : 0;
        } else if (targetRole.equalsIgnoreCase("TEACHER") || targetRole.equalsIgnoreCase("TEACHERS") || targetRole.equalsIgnoreCase("ROLE_TEACHER")) {
            boolean ok = sendToTopic("teachers", title, body, data);
            return ok ? 1 : 0;
        } else {
            boolean ok = sendToTopic(targetRole.toLowerCase(), title, body, data);
            return ok ? 1 : 0;
        }
    }
}
