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
  int _activeTab = 0; // 0 = الدروس اليومية, 1 = الرسوم والأقساط, 2 = الدرجات, 3 = الحضور, 4 = الواجبات
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

  ErpBadgeTone _scoreTone(double score, [double maxScore = 20.0]) {
    final pct = maxScore > 0 ? (score / maxScore) * 100 : score;
    if (pct >= 80) return ErpBadgeTone.success;
    if (pct >= 60) return ErpBadgeTone.neutral;
    if (pct >= 50) return ErpBadgeTone.warning;
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
                    title: 'أبنائي والدروس والرسوم',
                    subtitle:
                        'متابعة ما درسه ابنك اليوم، رسوم الدراسة المتبقية، والدرجات في مدرسة ابن خلدون',
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
                      final tuition = child['tuitionSummary'] as Map<String, dynamic>?;
                      final missing = tuition?['missingAmount'] ?? 0;
                      final isPaid = tuition?['yearStatus'] == 'PAID';
                      final todayLessons = (child['todayLessons'] as List<dynamic>?) ?? [];

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
                                    label: isPaid ? 'الرسوم خالصة 🎉' : 'المتبقي: $missing د.ت',
                                    tone: isPaid ? ErpBadgeTone.success : ErpBadgeTone.danger,
                                  ),
                                  ErpBadge(
                                    label: '${todayLessons.length} دروس اليوم',
                                    tone: ErpBadgeTone.info,
                                  ),
                                  ErpBadge(
                                    label: child['status']?.toString() ?? 'نشط',
                                    tone: ErpBadgeTone.success,
                                  ),
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
                            // Tabs row
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Container(
                                decoration: const BoxDecoration(
                                  border: Border(
                                      bottom:
                                          BorderSide(color: ErpColors.border)),
                                ),
                                child: Row(
                                  children: [
                                    _tabButton(0, Icons.menu_book_outlined,
                                        'ما درسه اليوم'),
                                    _tabButton(1, Icons.credit_card_outlined,
                                        'الرسوم والأقساط'),
                                    _tabButton(2, Icons.assignment_outlined,
                                        'الدرجات'),
                                    _tabButton(3, Icons.fact_check_outlined,
                                        'الحضور'),
                                    _tabButton(4, Icons.description_outlined,
                                        'الواجبات'),
                                  ],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(14),
                              child: _buildCurrentTabContent(),
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

  Widget _buildCurrentTabContent() {
    switch (_activeTab) {
      case 0:
        return _buildLessonsTab(_selectedChild);
      case 1:
        return _buildTuitionTab(_selectedChild);
      case 2:
        return _buildGradesTab(_selectedChild);
      case 3:
        return _buildAttendanceTab(_selectedChild);
      case 4:
        return _buildHomeworkTab();
      default:
        return _buildLessonsTab(_selectedChild);
    }
  }

  Widget _tabButton(int index, IconData icon, String label) {
    final active = _activeTab == index;
    return InkWell(
      onTap: () => setState(() => _activeTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: active ? ErpColors.primary : Colors.transparent,
              width: 2.2,
            ),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 16,
                color: active ? ErpColors.primary : ErpColors.textMuted),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                color: active ? ErpColors.primary : ErpColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLessonsTab(dynamic child) {
    final recentLessons = (child['recentLessons'] as List<dynamic>?) ?? [];
    if (recentLessons.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.menu_book_outlined, size: 40, color: ErpColors.textMuted),
              SizedBox(height: 8),
              Text('لم يتم تسجيل دروس حديثة لهذا الفصل بعد',
                  style: TextStyle(color: ErpColors.textMuted)),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: Text(
            'سجل ما تم تدريسه اليوم وفي الأيام الأخيرة (Cahier de Texte):',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          ),
        ),
        ...recentLessons.map((l) {
          final title = l['title']?.toString() ?? 'درس';
          final subName = l['subject']?['name']?.toString() ?? '';
          final date = l['logDate']?.toString() ?? '';
          final teacherName = l['teacherName']?.toString() ?? '';
          final summary = l['summary']?.toString() ?? '';
          final homework = l['homeworkAssigned']?.toString() ?? '';

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: ErpColors.bgBase,
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
                        title,
                        style: const TextStyle(
                            fontSize: 14.5, fontWeight: FontWeight.w800),
                      ),
                    ),
                    if (subName.isNotEmpty)
                      ErpBadge(label: subName, tone: ErpBadgeTone.info),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'التاريخ: $date ${teacherName.isNotEmpty ? "• الأستاذ: $teacherName" : ""}',
                  style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ErpColors.surface,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    summary,
                    style: const TextStyle(fontSize: 12.5, height: 1.4),
                  ),
                ),
                if (homework.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'الواجب المنزلي: $homework',
                      style: const TextStyle(
                          fontSize: 12,
                          color: Colors.orange,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTuitionTab(dynamic child) {
    final tuition = child['tuitionSummary'] as Map<String, dynamic>?;
    if (tuition == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: Text('بيانات الرسوم غير متوفرة',
              style: TextStyle(color: ErpColors.textMuted)),
        ),
      );
    }

    final fee = tuition['annualFee'] ?? 1200;
    final paid = tuition['totalPaid'] ?? 0;
    final missing = tuition['missingAmount'] ?? 0;
    final status = tuition['yearStatus'] ?? 'UNPAID';
    final breakdown = (tuition['monthlyBreakdown'] as List<dynamic>?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary grid
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ErpColors.bgBase,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _miniMetric('الرسوم السنوية', '$fee د.ت', ErpColors.textMain),
              _miniMetric('المسدد', '$paid د.ت', ErpColors.success),
              _miniMetric('المتبقي للدفع', '$missing د.ت', missing > 0 ? ErpColors.danger : ErpColors.success),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'حالة السداد العامة:',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
            ErpBadge(
              label: status == 'PAID'
                  ? 'خالص بالكامل 🎉'
                  : status == 'PARTIAL'
                      ? 'دفع جزئي ⏳'
                      : 'غير خالص ⚠️',
              tone: status == 'PAID'
                  ? ErpBadgeTone.success
                  : status == 'PARTIAL'
                      ? ErpBadgeTone.warning
                      : ErpBadgeTone.danger,
            ),
          ],
        ),
        const SizedBox(height: 14),
        const Text(
          'جدول الأقساط الشهرية (من سبتمبر إلى جوان):',
          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        ...breakdown.map((m) {
          final isPaid = m['isPaid'] == true;
          final isPartial = m['isPartial'] == true;
          final monthName = m['monthName'] ?? m['month'] ?? '';
          final paidAmt = m['paidAmount'] ?? 0;

          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: ErpColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: ErpColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  monthName.toString(),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                Row(
                  children: [
                    Text(
                      '$paidAmt د.ت',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: paidAmt > 0 ? ErpColors.success : ErpColors.textMuted,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ErpBadge(
                      label: isPaid
                          ? 'خالص'
                          : isPartial
                              ? 'جزئي'
                              : 'غير مسدد',
                      tone: isPaid
                          ? ErpBadgeTone.success
                          : isPartial
                              ? ErpBadgeTone.warning
                              : ErpBadgeTone.danger,
                    ),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
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
          final maxScore =
              g['maxScore'] is num ? (g['maxScore'] as num).toDouble() : 20.0;
          final term = (g['term'] ?? '').toString();

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
                        '${term.isNotEmpty ? "$term • " : ""}${g['examType'] ?? 'اختبار'} • ${formatDateShort(g['recordedDate'])}',
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
                ErpBadge(
                  label: '$score / $maxScore',
                  tone: _scoreTone(score, maxScore),
                ),
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

    final presentCount = att
        .where((a) => a['status'] == 'Present' || a['status'] == 'حاضر')
        .length;
    final absentCount =
        att.where((a) => a['status'] == 'Absent' || a['status'] == 'غائب').length;
    final lateCount =
        att.where((a) => a['status'] == 'Late' || a['status'] == 'متأخر').length;

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
              _miniMetric('إجمالي', '${att.length}', ErpColors.textMain),
              _miniMetric('حاضر', '$presentCount', ErpColors.success),
              _miniMetric('غائب', '$absentCount', ErpColors.danger),
              _miniMetric('متأخر', '$lateCount', ErpColors.warning),
            ],
          ),
        ),
        ...att.map((a) {
          final status = (a['status'] ?? 'حاضر').toString();
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
                        formatDateShort(a['date']),
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13.5),
                      ),
                      if (a['remarks'] != null &&
                          a['remarks'].toString().isNotEmpty)
                        Text(
                          a['remarks'].toString(),
                          style: const TextStyle(
                              fontSize: 12, color: ErpColors.textMuted),
                        ),
                    ],
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
              fontSize: 15.5, fontWeight: FontWeight.w900, color: color),
        ),
      ],
    );
  }
}
