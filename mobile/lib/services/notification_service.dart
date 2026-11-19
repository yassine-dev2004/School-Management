import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  if (kDebugMode) {
    print('Handling background push notification: ${message.messageId}');
  }
}

class NotificationService {
  static bool _initialized = false;
  static String? _fcmToken;

  static String? get fcmToken => _fcmToken;
  static bool get isInitialized => _initialized;

  // Stream controller to broadcast foreground notifications to active UI
  static final StreamController<RemoteMessage> onNotificationReceived =
      StreamController<RemoteMessage>.broadcast();

  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;

      // Request notification permission (critical for Android 13+)
      final settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (kDebugMode) {
        print('User notification permission status: ${settings.authorizationStatus}');
      }

      // Retrieve device FCM token
      _fcmToken = await messaging.getToken();
      if (kDebugMode) {
        print('Firebase FCM Token: $_fcmToken');
      }

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        syncTokenWithBackend();
      });

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Foreground message received: ${message.notification?.title}');
        }
        onNotificationReceived.add(message);
      });

      // When user clicks notification while app is in background/opened from notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Notification clicked by user: ${message.data}');
        }
      });

      _initialized = true;
      if (kDebugMode) {
        print('NotificationService successfully initialized! 🎉');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Firebase Push Notification initialization note: $e');
      }
    }
  }

  /// Syncs FCM token with backend and subscribes to relevant school topics
  static Future<void> setupUserSubscriptions({
    String? role,
    List<int>? classIds,
  }) async {
    if (!_initialized) return;

    try {
      final messaging = FirebaseMessaging.instance;

      // Subscribe to general school announcements
      await messaging.subscribeToTopic('all');

      if (role != null) {
        final cleanRole = role.replaceFirst('ROLE_', '').toLowerCase();
        if (cleanRole == 'parent') {
          await messaging.subscribeToTopic('parents');
        } else if (cleanRole == 'teacher') {
          await messaging.subscribeToTopic('teachers');
        }
      }

      if (classIds != null && classIds.isNotEmpty) {
        for (final cid in classIds) {
          await messaging.subscribeToTopic('class_$cid');
        }
      }

      await syncTokenWithBackend(role: role);
    } catch (e) {
      if (kDebugMode) {
        print('Error setting up topic subscriptions: $e');
      }
    }
  }

  static Future<void> syncTokenWithBackend({String? role}) async {
    if (_fcmToken == null || _fcmToken!.isEmpty) return;
    try {
      final token = await ApiService.getToken();
      if (token != null && token.isNotEmpty) {
        await ApiService.registerFcmToken(_fcmToken!, role: role);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error syncing FCM token with backend: $e');
      }
    }
  }
}
