import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String defaultBaseUrl = 'https://school-erp-backend-zkuh.onrender.com/api';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('custom_base_url') ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_base_url', url.trim());
  }

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
    try {
      final base = await getBaseUrl();
      final url = Uri.parse('$base/auth/signin');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'username': username.trim(), 'password': password.trim()}),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token'] ?? '');
        await prefs.setString('username', data['username'] ?? username);
        await prefs.setString('email', data['email'] ?? '');
        if (data['roles'] != null && data['roles'].isNotEmpty) {
          await prefs.setString('role', data['roles'][0].toString());
        }
        return {'success': true, 'data': data};
      } else if (response.statusCode == 401) {
        return {'success': false, 'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'};
      } else {
        return {'success': false, 'message': 'فشل تسجيل الدخول (${response.statusCode})'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'تعذر الاتصال بالخادم. تأكد من أن الهاتف والكمبيوتر متصلان بنفس شبكة الواي فاي ومن صحة عنوان الخادم.'
      };
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('username');
    await prefs.remove('email');
    await prefs.remove('role');
  }

  static Future<Map<String, dynamic>?> getParentDashboard() async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$base/parents/my-dashboard'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        return json.decode(utf8.decode(response.bodyBytes));
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  static Future<List<dynamic>> getAnnouncements() async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$base/announcements'),
        headers: headers,
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        return json.decode(utf8.decode(response.bodyBytes));
      }
    } catch (e) {
      // ignore
    }
    return [];
  }
}
