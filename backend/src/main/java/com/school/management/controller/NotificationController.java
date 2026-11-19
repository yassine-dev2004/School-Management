package com.school.management.controller;

import com.school.management.entity.User;
import com.school.management.repository.UserRepository;
import com.school.management.security.UserDetailsImpl;
import com.school.management.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("firebaseActive", notificationService.isFirebaseAvailable());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/register-token")
    public ResponseEntity<?> registerDeviceToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String deviceType = request.getOrDefault("deviceType", "ANDROID");
        String role = request.get("role");

        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token is required"));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        notificationService.registerToken(userOpt.get(), token.trim(), deviceType, role);
        return ResponseEntity.ok(Map.of("success", true, "message", "تم تسجيل رمز الجهاز بنجاح"));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or hasAuthority('ROLE_ADMINISTRATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> sendPushNotification(@RequestBody Map<String, Object> request) {
        String title = (String) request.get("title");
        String body = (String) request.get("body");
        String targetRole = (String) request.get("targetRole");
        Long classId = request.get("classId") != null ? Long.valueOf(request.get("classId").toString()) : null;

        if (title == null || title.trim().isEmpty() || body == null || body.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "العنوان ونص الرسالة مطلوبان"));
        }

        if (!notificationService.isFirebaseAvailable()) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "تم حفظ الطلب، لكن خدمة Firebase لم تُهيأ بعد على الخادم (يرجى رفع ملف firebase-service-account.json)."
            ));
        }

        int sent = notificationService.broadcastPush(targetRole, classId, title.trim(), body.trim());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "sentCount", sent,
                "message", "تم إرسال الإشعار الفوري للهواتف بنجاح 🎉"
        ));
    }
}
