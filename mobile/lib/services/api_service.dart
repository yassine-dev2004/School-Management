import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiResult<T> {
  final bool success;
  final T? data;
  final String message;
  final int? statusCode;

  const ApiResult({
    required this.success,
    this.data,
    this.message = '',
    this.statusCode,
  });
}

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
      final base = customBaseUrl != null
          ? _normalizeUrl(customBaseUrl)
          : await getBaseUrl();
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

  static Future<Map<String, String>> getUserSession() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'username': prefs.getString('username') ?? 'المستخدم',
      'email': prefs.getString('email') ?? '',
      'role': prefs.getString('role') ?? 'PARENT',
    };
  }

  static bool isAdminRole(String role) => role.contains('ADMINISTRATOR');
  static bool isTeacherRole(String role) => role.contains('TEACHER');
  static bool isStaffRole(String role) =>
      isAdminRole(role) || isTeacherRole(role);
  static bool isParentRole(String role) => role.contains('PARENT');

  static String roleLabel(String role) {
    if (role.contains('ADMINISTRATOR')) return 'مدير النظام';
    if (role.contains('TEACHER')) return 'معلم';
    if (role.contains('STUDENT')) return 'طالب';
    return 'ولي أمر';
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _decodeBody(http.Response response) {
    if (response.bodyBytes.isEmpty) return null;
    try {
      return json.decode(utf8.decode(response.bodyBytes));
    } catch (_) {
      return utf8.decode(response.bodyBytes);
    }
  }

  static String _extractError(http.Response response, [dynamic decoded]) {
    if (decoded is Map && decoded['message'] != null) {
      return decoded['message'].toString();
    }
    if (response.statusCode == 401) return 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً';
    if (response.statusCode == 403) return 'ليس لديك صلاحية تنفيذ هذا الإجراء';
    if (response.statusCode == 404) return 'العنصر المطلوب غير موجود';
    return 'فشل الطلب (${response.statusCode})';
  }

  static Future<Map<String, dynamic>> login(
      String username, String password) async {
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
        return {
          'success': false,
          'message': 'اسم المستخدم أو كلمة المرور غير صحيحة',
        };
      } else {
        final decoded = _decodeBody(response);
        return {
          'success': false,
          'message': _extractError(response, decoded),
        };
      }
    } catch (_) {
      return {
        'success': false,
        'message':
            'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ومن صحة رابط الخادم.',
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

  static Future<ApiResult<dynamic>> get(String endpoint) async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final res = await http
          .get(Uri.parse('$base$endpoint'), headers: headers)
          .timeout(const Duration(seconds: 20));
      final decoded = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResult(
            success: true, data: decoded, statusCode: res.statusCode);
      }
      return ApiResult(
        success: false,
        message: _extractError(res, decoded),
        statusCode: res.statusCode,
      );
    } catch (_) {
      return const ApiResult(
        success: false,
        message: 'تعذر الاتصال بالخادم',
      );
    }
  }

  static Future<ApiResult<dynamic>> post(String endpoint, dynamic body) async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final res = await http
          .post(
            Uri.parse('$base$endpoint'),
            headers: headers,
            body: json.encode(body),
          )
          .timeout(const Duration(seconds: 20));
      final decoded = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResult(
            success: true, data: decoded, statusCode: res.statusCode);
      }
      return ApiResult(
        success: false,
        message: _extractError(res, decoded),
        statusCode: res.statusCode,
      );
    } catch (_) {
      return const ApiResult(
        success: false,
        message: 'تعذر الاتصال بالخادم',
      );
    }
  }

  static Future<ApiResult<dynamic>> put(String endpoint, dynamic body) async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final res = await http
          .put(
            Uri.parse('$base$endpoint'),
            headers: headers,
            body: json.encode(body),
          )
          .timeout(const Duration(seconds: 20));
      final decoded = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResult(
            success: true, data: decoded, statusCode: res.statusCode);
      }
      return ApiResult(
        success: false,
        message: _extractError(res, decoded),
        statusCode: res.statusCode,
      );
    } catch (_) {
      return const ApiResult(
        success: false,
        message: 'تعذر الاتصال بالخادم',
      );
    }
  }

  static Future<ApiResult<dynamic>> delete(String endpoint) async {
    try {
      final base = await getBaseUrl();
      final headers = await _getHeaders();
      final res = await http
          .delete(Uri.parse('$base$endpoint'), headers: headers)
          .timeout(const Duration(seconds: 20));
      final decoded = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResult(
            success: true, data: decoded, statusCode: res.statusCode);
      }
      return ApiResult(
        success: false,
        message: _extractError(res, decoded),
        statusCode: res.statusCode,
      );
    } catch (_) {
      return const ApiResult(
        success: false,
        message: 'تعذر الاتصال بالخادم',
      );
    }
  }

  static Future<List<dynamic>> getList(String endpoint) async {
    final res = await get(endpoint);
    if (res.success && res.data is List) {
      return res.data as List<dynamic>;
    }
    return [];
  }

  // Dashboard & High-Level Endpoints
  static Future<Map<String, dynamic>?> getParentDashboard() async {
    final res = await get('/parents/my-dashboard');
    if (res.statusCode == 401) {
      return {'unauthorized': true};
    }
    if (res.success && res.data is Map<String, dynamic>) {
      return res.data as Map<String, dynamic>;
    }
    return null;
  }

  static Future<Map<String, dynamic>> getStaffDashboardData(String role) async {
    final summaryRes = await get('/dashboard/summary');
    if (summaryRes.success && summaryRes.data is Map<String, dynamic>) {
      final d = summaryRes.data as Map<String, dynamic>;
      return {
        'announcements': (d['announcements'] as List<dynamic>?) ?? <dynamic>[],
        'totalStudents': d['students'] ?? 0,
        'totalTeachers': d['teachers'] ?? 0,
        'totalClasses': d['classes'] ?? 0,
        'totalSubjects': d['subjects'] ?? 0,
        'totalParents': d['parentsCount'] ?? 0,
        'totalHomework': d['homeworkCount'] ?? 0,
        'attendanceRate': d['attendanceRate'] ?? 0,
      };
    }

    final todayStr = DateTime.now().toIso8601String().split('T').first;
    final isAdmin = isAdminRole(role);

    final results = await Future.wait([
      getList('/students'),
      isAdmin ? getList('/teachers') : Future.value(<dynamic>[]),
      getList('/classes'),
      getList('/subjects'),
      getList('/parents'),
      getList('/homework'),
      getList('/announcements'),
      getList('/attendance/date/$todayStr'),
    ]);

    final students = results[0];
    final teachers = results[1];
    final classes = results[2];
    final subjects = results[3];
    final parents = results[4];
    final homework = results[5];
    final announcements = results[6];
    final todayAttendance = results[7];

    int attendanceRate = 0;
    if (todayAttendance.isNotEmpty) {
      final presentCount = todayAttendance
          .where((a) => a['status'] == 'حاضر' || a['status'] == 'Present')
          .length;
      attendanceRate =
          ((presentCount / todayAttendance.length) * 100).round();
    }

    return {
      'students': students,
      'teachers': teachers,
      'classes': classes,
      'subjects': subjects,
      'parents': parents,
      'homework': homework,
      'announcements': announcements,
      'totalStudents': students.length,
      'totalTeachers': teachers.length,
      'totalClasses': classes.length,
      'totalSubjects': subjects.length,
      'totalParents': parents.length,
      'totalHomework': homework.length,
      'attendanceRate': attendanceRate,
    };
  }

  static Future<List<dynamic>> getAnnouncementsForRole(String role) async {
    if (isStaffRole(role)) {
      return getList('/announcements');
    }
    if (isParentRole(role)) {
      final res = await getList('/announcements/role/PARENT');
      if (res.isNotEmpty) return res;
    }
    return getList('/announcements');
  }

  static Future<List<dynamic>> getHomeworkForParentChildren(
      List<dynamic> children) async {
    final classIds = <int>{};
    final classMap = <int, String>{};
    for (final c in children) {
      final sc = c['schoolClass'];
      if (sc is Map && sc['id'] != null) {
        final id = (sc['id'] as num).toInt();
        classIds.add(id);
        classMap[id] = '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'.trim();
      }
    }
    if (classIds.isEmpty) return [];
    final lists = await Future.wait(
      classIds.map((id) => getList('/homework/class/$id')),
    );
    final merged = <dynamic>[];
    final seenIds = <dynamic>{};
    for (final list in lists) {
      for (final hw in list) {
        if (seenIds.add(hw['id'])) {
          merged.add(hw);
        }
      }
    }
    return merged;
  }

  static Future<Map<String, dynamic>?> getProfile() async {
    final res = await get('/users/profile');
    if (res.success && res.data is Map<String, dynamic>) {
      return res.data as Map<String, dynamic>;
    }
    return null;
  }
}
