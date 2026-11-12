import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String defaultBaseUrl =
      'https://thread-mil-preferred-proper.trycloudflare.com/api';

  static String _normalizeUrl(String url) {
    var clean = url.trim().replaceAll(RegExp(r'/+$'), '');
    if (!clean.endsWith('/api')) {
      clean = '$clean/api';
    }
    return clean;
  }

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('custom_base_url');
    if (saved == null || saved.trim().isEmpty) {
      return defaultBaseUrl;
    }
    // Migrate away from legacy sleeping Render default if still cached
    if (saved.contains('school-erp-backend-zkuh.onrender.com')) {
      await prefs.setString('custom_base_url', defaultBaseUrl);
      return defaultBaseUrl;
    }
    return saved;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_base_url', _normalizeUrl(url));
  }

  static Future<void> resetBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('custom_base_url');
  }

  static Future<bool> checkHealth([String? customBaseUrl]) async {
    try {
      final base = customBaseUrl != null ? _normalizeUrl(customBaseUrl) : await getBaseUrl();
      final response = await http
          .get(Uri.parse('$base/health'))
          .timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
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

      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'username': username.trim(),
              'password': password.trim(),
            }),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
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
        'message': 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ومن صحة رابط الخادم.',
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
      final response = await http
          .get(Uri.parse('$base/parents/my-dashboard'), headers: headers)
          .timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        return json.decode(utf8.decode(response.bodyBytes));
      } else if (response.statusCode == 401) {
        return {'unauthorized': true};
      }
    } catch (_) {
      // ignore
    }
    return null;
  }

  static Future<List<dynamic>> _getList(String endpoint) async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final response = await http
          .get(Uri.parse('$base$endpoint'), headers: headers)
          .timeout(const Duration(seconds: 20));
      if (response.statusCode == 200) {
        final decoded = json.decode(utf8.decode(response.bodyBytes));
        if (decoded is List) return decoded;
      }
    } catch (_) {
      // ignore
    }
    return [];
  }

  static Future<Map<String, dynamic>> getStaffDashboardStats(String role) async {
    final isAdmin = role.contains('ADMINISTRATOR');
    final results = await Future.wait([
      _getList('/students'),
      isAdmin ? _getList('/teachers') : Future.value([]),
      _getList('/classes'),
      _getList('/parents'),
    ]);

    final students = results[0];
    final teachers = results[1];
    final classes = results[2];
    final parents = results[3];

    return {
      'totalStudents': students.length,
      'totalTeachers': teachers.length,
      'totalClasses': classes.length,
      'totalParents': parents.length,
      'students': students,
    };
  }

  static Future<List<dynamic>> getAnnouncements() async {
    return _getList('/announcements');
  }
}
