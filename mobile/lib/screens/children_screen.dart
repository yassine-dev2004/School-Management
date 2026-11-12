import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class ChildrenScreen extends StatefulWidget {
  const ChildrenScreen({super.key});

  @override
  State<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends State<ChildrenScreen> {
  List<dynamic> _children = [];
  dynamic _selectedChild;
  List<dynamic> _classHomework = [];
  int _activeTab = 0; // 0 = الدرجات, 1 = الحضور, 2 = الواجبات
  bool _loading = true;
  bool _loadingHomework = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final data = await ApiService.getParentDashboard();
    if (!mounted) return;
    final list = (data?['children'] as List<dynamic>?) ?? [];
    setState(() {
      _children = list;
      if (list.isNotEmpty) {
        _selectedChild = list.first;
      } else {
        _selectedChild = null;
      }
      _loading = false;
    });
    if (_selectedChild != null) {
      await _loadHomeworkForChild(_selectedChild);
    }
  }

  Future<void> _loadHomeworkForChild(dynamic child) async {
    final classId = child?['schoolClass']?['id'];
    if (classId == null) {
      setState(() => _classHomework = []);
      return;
    }
    setState(() => _loadingHomework = true);
    final hw = await ApiService.getList('/homework/class/$classId');
    if (!mounted) return;
    setState(() {
      _classHomework = hw;
      _loadingHomework = false;
    });
  }

  ErpBadgeTone _scoreTone(double score) {
    if (score >= 90) return ErpBadgeTone.success;
    if (score >= 70) return ErpBadgeTone.neutral;
    if (score >= 50) return ErpBadgeTone.warning;
    return ErpBadgeTone.danger;
  }

  ErpBadgeTone _attendanceTone(String status) {
    final s = status.toLowerCase();
    if (s == 'present' || s == 'حاضر') return ErpBadgeTone.success;
    if (s == 'absent' || s == 'غائب') return ErpBadgeTone.danger;
    if (s == 'late' || s == 'متأخر') return ErpBadgeTone.warning;
    return ErpBadgeTone.neutral;
  }

  @override
  Widget build(BuildContext context) {
    return ErpShell(
      currentRoute: ErpRoute.children,
      onRefresh: _loadData,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  const ErpPageHeader(
                    title: 'أبنائي والنتائج',
                    subtitle:
                        'متابعة الدرجات وسجلات الحضور والواجبات المدرسية للأبناء',
                  ),
                  if (_children.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.child_care_outlined,
                      message: 'لا يوجد أبناء مسجلون حالياً',
                    )
                  else ...[
                    // Selectable Child Cards
                    ..._children.map((child) {
                      final isSelected = _selectedChild != null &&
                          _selectedChild['id'] == child['id'];
                      final firstName = (child['firstName'] ?? '').toString();
                      final lastName = (child['lastName'] ?? '').toString();
                      final sc = child['schoolClass'];
                      final className = sc != null
                          ? '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'
                          : 'غير محدد';
                      final grades =
                          (child['grades'] as List<dynamic>?) ?? [];
                      final att =
                          (child['attendance'] as List<dynamic>?) ?? [];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          selected: isSelected,
                          onTap: () {
                            setState(() {
                              _selectedChild = child;
                            });
                            _loadHomeworkForChild(child);
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 22,
                                    backgroundColor: ErpColors.primary,
                                    child: Text(
                                      firstName.isNotEmpty ? firstName[0] : 'ط',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '$firstName $lastName'.trim(),
                                          style: const TextStyle(
                                              fontSize: 15.5,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        Text(
                                          'الفصل: $className',
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: ErpColors.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isSelected)
                                    const ErpBadge(
                                      label: 'محدد',
                                      tone: ErpBadgeTone.neutral,
                                    ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  ErpBadge(
                                    label: child['status']?.toString() ?? 'نشط',
                                    tone: ErpBadgeTone.success,
                                  ),
                                  ErpBadge(
                                      label: '${grades.length} درجة',
                                      tone: ErpBadgeTone.info),
                                  ErpBadge(
                                      label: '${att.length} سجل حضور',
                                      tone: ErpBadgeTone.neutral),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),

                    if (_selectedChild != null) ...[
                      const SizedBox(height: 8),
                      ErpCard(
                        padding: EdgeInsets.zero,
                        child: Column(
                          children: [
                            // Tabs row (Grades / Attendance / Homework)
                            Container(
                              decoration: const BoxDecoration(
                                border: Border(
                                    bottom:
                                        BorderSide(color: ErpColors.border)),
                              ),
                              child: Row(
                                children: [
                                  _tabButton(0, Icons.assignment_outlined,
                                      'الدرجات'),
                                  _tabButton(1, Icons.fact_check_outlined,
                                      'الحضور'),
                                  _tabButton(2, Icons.description_outlined,
                                      'الواجبات'),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(14),
                              child: _activeTab == 0
                                  ? _buildGradesTab(_selectedChild)
                                  : _activeTab == 1
                                      ? _buildAttendanceTab(_selectedChild)
                                      : _buildHomeworkTab(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
    );
  }

  Widget _tabButton(int index, IconData icon, String label) {
    final active = _activeTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? ErpColors.primary : Colors.transparent,
                width: 2.2,
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 16,
                  color: active ? ErpColors.primary : ErpColors.textMuted),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active ? ErpColors.primary : ErpColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGradesTab(dynamic child) {
    final grades = (child['grades'] as List<dynamic>?) ?? [];
    if (grades.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Text('لا توجد درجات مسجلة',
              style: TextStyle(color: ErpColors.textMuted)),
        ),
      );
    }

    final scores = grades
        .map((g) => g['score'] is num ? (g['score'] as num).toDouble() : 0.0)
        .toList();
    final avg = scores.reduce((a, b) => a + b) / scores.length;
    final maxScore = scores.reduce((a, b) => a > b ? a : b);
    final minScore = scores.reduce((a, b) => a < b ? a : b);

    return Column(
      children: [
        // Summary strip
        Container(
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: ErpColors.bgBase,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _miniMetric('المتوسط', avg.toStringAsFixed(1), ErpColors.primary),
              _miniMetric('أعلى درجة', '$maxScore', ErpColors.success),
              _miniMetric('أدنى درجة', '$minScore', ErpColors.danger),
            ],
          ),
        ),
        ...grades.map((g) {
          final score =
              g['score'] is num ? (g['score'] as num).toDouble() : 0.0;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: ErpColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        g['subjectName']?.toString() ?? 'مادة غير محددة',
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${g['examType'] ?? 'اختبار'} • ${formatDateShort(g['recordedDate'])}',
                        style: const TextStyle(
                            fontSize: 12, color: ErpColors.textMuted),
                      ),
                      if (g['comments'] != null &&
                          g['comments'].toString().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Text(
                            g['comments'].toString(),
                            style: const TextStyle(
                                fontSize: 12, color: ErpColors.textSecondary),
                          ),
                        ),
                    ],
                  ),
                ),
                ErpBadge(label: '$score', tone: _scoreTone(score)),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildAttendanceTab(dynamic child) {
    final att = (child['attendance'] as List<dynamic>?) ?? [];
    if (att.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Text('لا توجد سجلات حضور',
              style: TextStyle(color: ErpColors.textMuted)),
        ),
      );
    }

    final present = att
        .where((a) => a['status'] == 'Present' || a['status'] == 'حاضر')
        .length;
    final absent = att
        .where((a) => a['status'] == 'Absent' || a['status'] == 'غائب')
        .length;
    final late = att
        .where((a) => a['status'] == 'Late' || a['status'] == 'متأخر')
        .length;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: ErpColors.bgBase,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _miniMetric('حاضر', '$present', ErpColors.success),
              _miniMetric('غائب', '$absent', ErpColors.danger),
              _miniMetric('متأخر', '$late', ErpColors.warning),
            ],
          ),
        ),
        ...att.map((a) {
          final status = a['status']?.toString() ?? '—';
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: ErpColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    size: 16, color: ErpColors.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    formatDateShort(a['date']),
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13.5),
                  ),
                ),
                ErpBadge(label: status, tone: _attendanceTone(status)),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildHomeworkTab() {
    if (_loadingHomework) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_classHomework.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Text('لا توجد واجبات مسندة لهذا الفصل',
              style: TextStyle(color: ErpColors.textMuted)),
        ),
      );
    }

    return Column(
      children: _classHomework.map((hw) {
        final subjectName = hw['subject']?['name'] ?? 'مادة';
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ErpColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      hw['title']?.toString() ?? 'واجب',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                  ),
                  ErpBadge(label: subjectName.toString()),
                ],
              ),
              if (hw['description'] != null &&
                  hw['description'].toString().isNotEmpty) ...[
                const SizedBox(height: 5),
                Text(
                  hw['description'].toString(),
                  style: const TextStyle(
                      fontSize: 12.5, color: ErpColors.textSecondary),
                ),
              ],
              const SizedBox(height: 6),
              Text(
                'آخر موعد للتسليم: ${formatDateShort(hw['dueDate'])}',
                style:
                    const TextStyle(fontSize: 11.5, color: ErpColors.textMuted),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _miniMetric(String label, String value, Color color) {
    return Column(
      children: [
        Text(label,
            style: const TextStyle(fontSize: 11, color: ErpColors.textMuted)),
        const SizedBox(height: 3),
        Text(
          value,
          style: TextStyle(
              fontSize: 16.5, fontWeight: FontWeight.w900, color: color),
        ),
      ],
    );
  }
}
