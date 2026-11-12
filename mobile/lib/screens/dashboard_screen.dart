import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'children_screen.dart';
import 'announcements_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _username = '';
  String _role = '';
  Map<String, dynamic>? _dashboardData;
  Map<String, dynamic>? _staffStats;
  List<dynamic> _announcements = [];
  bool _isLoading = true;

  bool get _isStaff =>
      _role.contains('ADMINISTRATOR') || _role.contains('TEACHER');

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    final prefs = await SharedPreferences.getInstance();
    _username = prefs.getString('username') ?? 'المستخدم';
    _role = prefs.getString('role') ?? 'PARENT';

    final announcementsFuture = ApiService.getAnnouncements();

    if (_isStaff) {
      final staffFuture = ApiService.getStaffDashboardStats(_role);
      final results = await Future.wait([staffFuture, announcementsFuture]);
      if (!mounted) return;
      setState(() {
        _staffStats = results[0] as Map<String, dynamic>;
        _announcements = results[1] as List<dynamic>;
        _isLoading = false;
      });
    } else {
      final parentFuture = ApiService.getParentDashboard();
      final results = await Future.wait([parentFuture, announcementsFuture]);
      final parentData = results[0] as Map<String, dynamic>?;
      if (!mounted) return;
      if (parentData != null && parentData['unauthorized'] == true) {
        _logout();
        return;
      }
      setState(() {
        _dashboardData = parentData;
        _announcements = results[1] as List<dynamic>;
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    await ApiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  String _roleLabel() {
    if (_role.contains('ADMINISTRATOR')) return 'مدير النظام';
    if (_role.contains('TEACHER')) return 'معلم';
    if (_role.contains('STUDENT')) return 'طالب';
    return 'ولي أمر';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'نظام إدارة المدرسة',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.indigo,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'تسجيل الخروج',
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // User Welcome Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Colors.indigo, Colors.blueAccent],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.indigo.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'مرحباً بك، $_username 👋',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'الصفة: ${_roleLabel()}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    if (_isStaff) ...[
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              'إجمالي الطلاب',
                              '${_staffStats?['totalStudents'] ?? 0}',
                              Icons.people,
                              Colors.indigo,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              'المعلمون',
                              '${_staffStats?['totalTeachers'] ?? 0}',
                              Icons.school,
                              Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              'الفصول النشطة',
                              '${_staffStats?['totalClasses'] ?? 0}',
                              Icons.class_,
                              Colors.cyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              'أولياء الأمور',
                              '${_staffStats?['totalParents'] ?? 0}',
                              Icons.family_restroom,
                              Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              'عدد الأبناء',
                              '${_dashboardData?['totalChildren'] ?? 0}',
                              Icons.child_care,
                              Colors.indigo,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              'متوسط الدرجات',
                              '${_dashboardData?['averageScore'] ?? 0}',
                              Icons.grade,
                              Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              'نسبة الحضور',
                              '${_dashboardData?['attendanceRate'] ?? 0}%',
                              Icons.check_circle_outline,
                              Colors.cyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              'أيام الغياب',
                              '${_dashboardData?['totalAbsent'] ?? 0}',
                              Icons.warning_amber_rounded,
                              Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 24),

                    const Text(
                      'الخدمات السريعة',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),

                    if (!_isStaff) ...[
                      ListTile(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        tileColor: Colors.indigo.shade50,
                        leading: const Icon(Icons.people, color: Colors.indigo),
                        title: const Text('متابعة الأبناء (الدرجات والحضور)'),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChildrenScreen(
                                children: _dashboardData?['children'] ?? [],
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 10),
                    ] else ...[
                      ListTile(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        tileColor: Colors.indigo.shade50,
                        leading: const Icon(Icons.people, color: Colors.indigo),
                        title: Text(
                            'قائمة الطلاب (${_staffStats?['totalStudents'] ?? 0})'),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: () {
                          final rawStudents =
                              (_staffStats?['students'] as List<dynamic>?) ??
                                  [];
                          final formatted = rawStudents.map((s) {
                            final user = s['user'] ?? {};
                            return {
                              'firstName': user['firstName'] ?? s['firstName'] ?? '',
                              'lastName': user['lastName'] ?? s['lastName'] ?? '',
                              'schoolClass': s['schoolClass'],
                              'grades': s['grades'] ?? [],
                              'attendance': s['attendance'] ?? [],
                            };
                          }).toList();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChildrenScreen(
                                children: formatted,
                                title: 'قائمة الطلاب',
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 10),
                    ],

                    ListTile(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      tileColor: Colors.amber.shade50,
                      leading:
                          const Icon(Icons.announcement, color: Colors.amber),
                      title: Text('إعلانات المدرسة (${_announcements.length})'),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => AnnouncementsScreen(
                              announcements: _announcements,
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: color.withValues(alpha: 0.15),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
