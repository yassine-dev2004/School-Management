import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../navigation/erp_router.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _username = '';
  String _role = 'PARENT';
  Map<String, dynamic>? _parentData;
  Map<String, dynamic>? _staffData;
  List<dynamic> _announcements = [];
  List<dynamic> _parentHomework = [];
  bool _isLoading = true;

  bool get _isAdmin => ApiService.isAdminRole(_role);
  bool get _isStaff => ApiService.isStaffRole(_role);

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    final session = await ApiService.getUserSession();
    _username = session['username'] ?? 'المستخدم';
    _role = session['role'] ?? 'PARENT';

    if (_isStaff) {
      final staffData = await ApiService.getStaffDashboardData(_role);
      if (!mounted) return;
      setState(() {
        _staffData = staffData;
        _announcements = (staffData['announcements'] as List<dynamic>?) ?? [];
        _isLoading = false;
      });
    } else {
      final results = await Future.wait([
        ApiService.getParentDashboard(),
        ApiService.getAnnouncementsForRole(_role),
      ]);
      final parentData = results[0] as Map<String, dynamic>?;
      if (!mounted) return;
      if (parentData != null && parentData['unauthorized'] == true) {
        await ApiService.logout();
        if (mounted) ErpRouter.goToLogin(context);
        return;
      }
      final children = (parentData?['children'] as List<dynamic>?) ?? [];
      final hw = await ApiService.getHomeworkForParentChildren(children);
      if (!mounted) return;

      setState(() {
        _parentData = parentData;
        _announcements = results[1] as List<dynamic>;
        _parentHomework = hw;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ErpShell(
      currentRoute: ErpRoute.dashboard,
      onRefresh: _loadData,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  ErpPageHeader(
                    title: _isStaff
                        ? 'لوحة التحكم الرئيسية'
                        : 'مرحباً $_username 👋',
                    subtitle: _isStaff
                        ? 'المتابعة المباشرة للبيانات (${ApiService.roleLabel(_role)})'
                        : 'بوابة ولي الأمر — متابعة الأبناء والنتائج والحضور والواجبات',
                  ),
                  if (_isStaff)
                    ..._buildStaffBody()
                  else
                    ..._buildParentBody(),
                ],
              ),
            ),
    );
  }

  List<Widget> _buildStaffBody() {
    final s = _staffData ?? {};
    final totalStudents = s['totalStudents'] ?? 0;
    final totalTeachers = s['totalTeachers'] ?? 0;
    final totalClasses = s['totalClasses'] ?? 0;
    final totalSubjects = s['totalSubjects'] ?? 0;
    final totalParents = s['totalParents'] ?? 0;
    final totalHomework = s['totalHomework'] ?? 0;
    final attendanceRate = s['attendanceRate'] ?? 0;

    return [
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.95,
        children: [
          ErpStatCard(
            label: 'إجمالي الطلاب',
            value: '$totalStudents',
            icon: Icons.people_outline,
            iconBg: const Color(0xFF1A1A1A),
            onTap: () => ErpRouter.go(context, ErpRoute.students),
          ),
          ErpStatCard(
            label: _isAdmin ? 'المعلمون' : 'أولياء الأمور',
            value: _isAdmin ? '$totalTeachers' : '$totalParents',
            icon: _isAdmin
                ? Icons.school_outlined
                : Icons.family_restroom_outlined,
            iconBg: const Color(0xFF333333),
            onTap: () => ErpRouter.go(
                context, _isAdmin ? ErpRoute.teachers : ErpRoute.parents),
          ),
          ErpStatCard(
            label: 'الفصول النشطة',
            value: '$totalClasses',
            icon: Icons.meeting_room_outlined,
            iconBg: const Color(0xFF4A4A4A),
            onTap: () => ErpRouter.go(context, ErpRoute.classes),
          ),
          ErpStatCard(
            label: 'المواد الدراسية',
            value: '$totalSubjects',
            icon: Icons.menu_book_outlined,
            iconBg: const Color(0xFF666666),
            onTap: () => ErpRouter.go(context, ErpRoute.subjects),
          ),
        ],
      ),
      const SizedBox(height: 12),
      // Secondary metrics row
      Row(
        children: [
          Expanded(
            child: ErpStatCard(
              label: 'نسبة الحضور اليوم',
              value: '$attendanceRate%',
              icon: Icons.fact_check_outlined,
              iconBg: ErpColors.success,
              onTap: () => ErpRouter.go(context, ErpRoute.attendance),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ErpStatCard(
              label: 'الواجبات النشطة',
              value: '$totalHomework',
              icon: Icons.description_outlined,
              iconBg: ErpColors.warning,
              onTap: () => ErpRouter.go(context, ErpRoute.homework),
            ),
          ),
        ],
      ),
      const SizedBox(height: 18),
      // Full Quick Access Menu Grid (all web sidebar modules at 1 tap!)
      ErpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'الوصول السريع لجميع أقسام النظام',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: ErpColors.textMain,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.15,
              children: [
                _quickTile(
                    Icons.people_outline, 'الطلاب', ErpRoute.students),
                if (_isAdmin)
                  _quickTile(
                      Icons.school_outlined, 'المعلمون', ErpRoute.teachers),
                _quickTile(Icons.family_restroom_outlined, 'أولياء الأمور',
                    ErpRoute.parents),
                _quickTile(Icons.meeting_room_outlined, 'الفصول',
                    ErpRoute.classes),
                _quickTile(
                    Icons.menu_book_outlined, 'المواد', ErpRoute.subjects),
                _quickTile(Icons.fact_check_outlined, 'الحضور',
                    ErpRoute.attendance),
                _quickTile(
                    Icons.assignment_outlined, 'الدرجات', ErpRoute.grades),
                _quickTile(Icons.description_outlined, 'الواجبات',
                    ErpRoute.homework),
                _quickTile(Icons.campaign_outlined, 'الإعلانات',
                    ErpRoute.announcements),
                _quickTile(
                    Icons.settings_outlined, 'الإعدادات', ErpRoute.settings),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      _buildAnnouncementsPreview(),
    ];
  }

  List<Widget> _buildParentBody() {
    final p = _parentData ?? {};
    final children = (p['children'] as List<dynamic>?) ?? [];
    final avg = p['averageScore'] ?? 0;
    final attRate = p['attendanceRate'] ?? 0;
    final absent = p['totalAbsent'] ?? 0;

    final recentGrades = <Map<String, dynamic>>[];
    for (final c in children) {
      final childName = '${c['firstName'] ?? ''} ${c['lastName'] ?? ''}'.trim();
      final grades = (c['grades'] as List<dynamic>?) ?? [];
      for (final g in grades.take(3)) {
        if (g is Map) {
          recentGrades.add({
            ...g.cast<String, dynamic>(),
            'childName': childName,
          });
        }
      }
    }

    return [
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.95,
        children: [
          ErpStatCard(
            label: 'عدد الأبناء',
            value: '${p['totalChildren'] ?? children.length}',
            icon: Icons.child_care_outlined,
            iconBg: const Color(0xFF1A1A1A),
            onTap: () => ErpRouter.go(context, ErpRoute.children),
          ),
          ErpStatCard(
            label: 'متوسط الدرجات',
            value: '$avg',
            icon: Icons.trending_up,
            iconBg: const Color(0xFF333333),
            onTap: () => ErpRouter.go(context, ErpRoute.children),
          ),
          ErpStatCard(
            label: 'نسبة الحضور',
            value: '$attRate%',
            icon: Icons.check_circle_outline,
            iconBg: ErpColors.success,
            onTap: () => ErpRouter.go(context, ErpRoute.children),
          ),
          ErpStatCard(
            label: 'أيام الغياب',
            value: '$absent',
            icon: Icons.warning_amber_rounded,
            iconBg: ErpColors.warning,
            onTap: () => ErpRouter.go(context, ErpRoute.children),
          ),
        ],
      ),
      const SizedBox(height: 16),
      // Full Quick Access Menu for Parent
      ErpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'خدمات ولي الأمر',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: ErpColors.textMain,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 2.35,
              children: [
                _parentActionTile(
                  Icons.child_care_outlined,
                  'أبنائي والنتائج',
                  '${children.length} طالب',
                  ErpRoute.children,
                ),
                _parentActionTile(
                  Icons.description_outlined,
                  'الواجبات المدرسية',
                  '${_parentHomework.length} واجب',
                  ErpRoute.homework,
                ),
                _parentActionTile(
                  Icons.campaign_outlined,
                  'إعلانات المدرسة',
                  '${_announcements.length} إعلان',
                  ErpRoute.announcements,
                ),
                _parentActionTile(
                  Icons.settings_outlined,
                  'الحساب والإعدادات',
                  'الملف الشخصي',
                  ErpRoute.settings,
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      // Children summary card (matches web ParentDashboard)
      ErpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'أبنائي',
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800),
                ),
                ErpBadge(label: '${children.length}'),
              ],
            ),
            const SizedBox(height: 10),
            if (children.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(
                  child: Text('لا يوجد أبناء مسجلون حالياً',
                      style: TextStyle(color: ErpColors.textMuted)),
                ),
              )
            else
              ...children.map((child) {
                final sc = child['schoolClass'];
                final className = sc != null
                    ? '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'
                    : 'غير محدد';
                final gradesCount =
                    (child['grades'] as List<dynamic>?)?.length ?? 0;
                final attCount =
                    (child['attendance'] as List<dynamic>?)?.length ?? 0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: ErpColors.bgBase,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: ErpColors.border),
                  ),
                  child: ListTile(
                    onTap: () => ErpRouter.go(context, ErpRoute.children),
                    leading: CircleAvatar(
                      backgroundColor: ErpColors.primary,
                      child: Text(
                        ((child['firstName'] ?? 'ط').toString().isNotEmpty
                            ? child['firstName'].toString()[0]
                            : 'ط'),
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w800),
                      ),
                    ),
                    title: Text(
                      '${child['firstName'] ?? ''} ${child['lastName'] ?? ''}'
                          .trim(),
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                    subtitle: Text(
                      '$className  •  $gradesCount درجات  •  $attCount حضور',
                      style: const TextStyle(
                          color: ErpColors.textSecondary, fontSize: 12),
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios,
                        size: 14, color: ErpColors.textMuted),
                  ),
                );
              }),
          ],
        ),
      ),
      const SizedBox(height: 16),
      // Recent Grades preview
      ErpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'آخر الدرجات',
              style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            if (recentGrades.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(
                  child: Text('لا توجد درجات حالياً',
                      style: TextStyle(color: ErpColors.textMuted)),
                ),
              )
            else
              ...recentGrades.take(5).map((g) {
                final score = (g['score'] is num)
                    ? (g['score'] as num).toDouble()
                    : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: ErpColors.bgBase,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${g['childName']} — ${g['subjectName'] ?? ''}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 13.5),
                              ),
                              Text(
                                '${g['examType'] ?? ''}  ${g['comments'] != null && g['comments'].toString().isNotEmpty ? "• ${g['comments']}" : ""}',
                                style: const TextStyle(
                                    color: ErpColors.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        ErpBadge(
                          label: '$score',
                          tone: score >= 70
                              ? ErpBadgeTone.success
                              : score >= 50
                                  ? ErpBadgeTone.warning
                                  : ErpBadgeTone.danger,
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
      const SizedBox(height: 16),
      _buildAnnouncementsPreview(),
    ];
  }

  Widget _buildAnnouncementsPreview() {
    return ErpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'آخر الإعلانات',
                style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800),
              ),
              TextButton(
                onPressed: () => ErpRouter.go(context, ErpRoute.announcements),
                child: const Text('عرض الكل'),
              ),
            ],
          ),
          if (_announcements.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text('لا توجد إعلانات حالياً',
                    style: TextStyle(color: ErpColors.textMuted)),
              ),
            )
          else
            ..._announcements.take(4).map((a) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: ErpColors.bgBase,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ErpColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: ErpColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.campaign_outlined,
                          size: 16, color: Colors.white),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            a['title'] ?? 'إعلان',
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 13.5),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            a['content'] ?? '',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12.5,
                                color: ErpColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _quickTile(IconData icon, String label, ErpRoute route) {
    return Material(
      color: ErpColors.bgBase,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => ErpRouter.go(context, route),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ErpColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 22, color: ErpColors.primary),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: ErpColors.textMain,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _parentActionTile(
      IconData icon, String title, String subtitle, ErpRoute route) {
    return Material(
      color: ErpColors.bgBase,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => ErpRouter.go(context, route),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ErpColors.border),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: ErpColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 17, color: Colors.white),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12.2,
                        fontWeight: FontWeight.w800,
                        color: ErpColors.textMain,
                      ),
                    ),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: ErpColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
