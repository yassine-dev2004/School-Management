package com.school.management.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initFirebase() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("Firebase already initialized.");
                return;
            }

            InputStream serviceAccount = null;

            // 1. Check in classpath: resources/firebase-service-account.json
            ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
            if (resource.exists()) {
                serviceAccount = resource.getInputStream();
                logger.info("Loaded firebase-service-account.json from classpath.");
            } else {
                // 2. Check in external file path (e.g. /opt/school/firebase-service-account.json or current dir)
                File externalFile = new File("firebase-service-account.json");
                if (externalFile.exists()) {
                    serviceAccount = new FileInputStream(externalFile);
                    logger.info("Loaded firebase-service-account.json from working directory.");
                } else {
                    File optFile = new File("/opt/school/firebase-service-account.json");
                    if (optFile.exists()) {
                        serviceAccount = new FileInputStream(optFile);
                        logger.info("Loaded firebase-service-account.json from /opt/school/.");
                    }
                }
            }

            if (serviceAccount != null) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                logger.info("Firebase Application successfully initialized for Push Notifications! 🎉");
            } else {
                logger.warn("⚠️ Firebase service account file not found (firebase-service-account.json). Push notifications are standby until file is uploaded.");
            }
        } catch (Exception e) {
            logger.error("Failed to initialize Firebase: " + e.getMessage(), e);
        }
    }
}
