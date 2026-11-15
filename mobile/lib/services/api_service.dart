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
      'https://rio-openings-cognitive-four.trycloudflare.com/api';

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
        'checkedInToday': d['checkedInToday'] == true,
        'todayStatus': d['todayStatus'],
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

  // Teacher Self-Attendance & Profile
  static Future<ApiResult<dynamic>> teacherCheckIn(String status, [String? remarks]) async {
    return post('/teacher-attendance/check-in', {
      'status': status,
      if (remarks != null && remarks.trim().isNotEmpty) 'remarks': remarks.trim(),
    });
  }

  static Future<ApiResult<dynamic>> teacherCheckInDetailed({
    required String status,
    String? remarks,
    double? hoursCount,
    double? hourlyRate,
    int? subjectId,
    int? classId,
    String? startTime,
    String? endTime,
  }) async {
    return post('/teacher-attendance/check-in', {
      'status': status,
      if (remarks != null && remarks.trim().isNotEmpty) 'remarks': remarks.trim(),
      if (hoursCount != null) 'hoursCount': hoursCount,
      if (hourlyRate != null) 'hourlyRate': hourlyRate,
      if (subjectId != null) 'subjectId': subjectId,
      if (classId != null) 'classId': classId,
      if (startTime != null) 'startTime': startTime,
      if (endTime != null) 'endTime': endTime,
    });
  }

  static Future<Map<String, dynamic>?> getTeacherHoursSummary([int? teacherId]) async {
    final url = teacherId != null ? '/teacher-attendance/hours-summary?teacherId=$teacherId' : '/teacher-attendance/hours-summary';
    final res = await get(url);
    if (res.success && res.data is Map<String, dynamic>) {
      return res.data as Map<String, dynamic>;
    }
    return null;
  }

  static Future<ApiResult<dynamic>> getTeacherTodayAttendance() async {
    return get('/teacher-attendance/me/today');
  }

  static Future<List<dynamic>> getTeacherAttendanceHistory() async {
    return getList('/teacher-attendance/me');
  }

  static Future<Map<String, dynamic>?> getTeacherProfile() async {
    final res = await get('/teachers/me');
    if (res.success && res.data is Map<String, dynamic>) {
      return res.data as Map<String, dynamic>;
    }
    return null;
  }

  // Payments / Tuition API
  static Future<Map<String, dynamic>?> getStudentTuitionSummary(int studentId, {String? academicYear}) async {
    final year = academicYear ?? '2025-2026';
    final res = await get('/payments/student/$studentId/summary?academicYear=$year');
    if (res.success && res.data is Map<String, dynamic>) {
      return res.data as Map<String, dynamic>;
    }
    return null;
  }

  static Future<ApiResult<dynamic>> recordPayment(Map<String, dynamic> payload) async {
    return post('/payments', payload);
  }

  static Future<ApiResult<dynamic>> quickSettleTuition(int studentId, {String? academicYear, String status = 'PAID'}) async {
    final year = academicYear ?? '2025-2026';
    return post('/payments/student/$studentId/quick-status', {
      'academicYear': year,
      'status': status,
    });
  }

  // Daily Lesson Logbook API
  static Future<List<dynamic>> getDailyLessonLogs({int? classId, String? date}) async {
    var url = '/logbook?';
    if (classId != null) url += 'classId=$classId&';
    if (date != null && date.isNotEmpty) url += 'date=$date&';
    return getList(url);
  }

  static Future<ApiResult<dynamic>> createDailyLessonLog(Map<String, dynamic> payload) async {
    return post('/logbook', payload);
  }

  static Future<ApiResult<dynamic>> deleteDailyLessonLog(int id) async {
    return delete('/logbook/$id');
  }

  // Teacher Attendance Admin & History API
  static Future<List<dynamic>> getAllTeacherAttendances({int? teacherId, String? date}) async {
    var url = '/teacher-attendance?';
    if (teacherId != null) url += 'teacherId=$teacherId&';
    if (date != null && date.isNotEmpty) url += 'date=$date&';
    return getList(url);
  }

  static Future<ApiResult<dynamic>> recordTeacherAttendanceAdmin(Map<String, dynamic> payload) async {
    return post('/teacher-attendance', payload);
  }

  static Future<ApiResult<dynamic>> deleteTeacherAttendance(int id) async {
    return delete('/teacher-attendance/$id');
  }

  // Documents Repository API
  static Future<List<dynamic>> getDocuments({int? classId}) async {
    final url = classId != null ? '/documents/class/$classId' : '/documents';
    return getList(url);
  }

  static Future<ApiResult<dynamic>> uploadDocumentBytes({
    required List<int> bytes,
    required String filename,
    required String title,
    required String purpose,
    int? classId,
    String? notes,
  }) async {
    try {
      final base = await getBaseUrl();
      final uri = Uri.parse('$base/documents/upload');
      final request = http.MultipartRequest('POST', uri);

      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      final multipartFile = http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      );
      request.files.add(multipartFile);

      request.fields['title'] = title;
      request.fields['purpose'] = purpose;
      if (classId != null) request.fields['classId'] = classId.toString();
      if (notes != null && notes.isNotEmpty) request.fields['notes'] = notes;

      final streamedResponse = await request.send().timeout(const Duration(seconds: 45));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        return ApiResult(success: true, data: decoded, statusCode: response.statusCode);
      } else {
        return ApiResult(
          success: false,
          message: 'فشل الرفع: رمز الاستجابة ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResult(success: false, message: 'خطأ أثناء رفع الملف: $e');
    }
  }

  static Future<ApiResult<dynamic>> deleteDocument(int id) async {
    return delete('/documents/$id');
  }
}
