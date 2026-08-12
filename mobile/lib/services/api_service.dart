import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default base URL for local development (10.0.2.2 for Android Emulator, localhost for iOS/Web)
  static String baseUrl = 'http://localhost:8080/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signin'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('username', data['username'] ?? username);
      await prefs.setString('email', data['email'] ?? '');
      if (data['roles'] != null && data['roles'].isNotEmpty) {
        await prefs.setString('role', data['roles'][0].toString());
      }
      return {'success': true, 'data': data};
    } else {
      return {'success': false, 'message': 'فشل تسجيل الدخول: ${response.statusCode}'};
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<Map<String, dynamic>?> getParentDashboard() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/parents/my-dashboard'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print("Error fetching parent dashboard: $e");
    }
    return null;
  }

  static Future<List<dynamic>> getAnnouncements() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/announcements'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print("Error fetching announcements: $e");
    }
    return [];
  }
}
