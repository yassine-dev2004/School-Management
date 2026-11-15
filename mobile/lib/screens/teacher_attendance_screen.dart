import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  List<dynamic> _items = [];
  List<dynamic> _teachers = [];
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  Map<String, dynamic>? _hoursSummary;
  bool _loading = true;

  String _userRole = 'ADMIN';
  String _selectedTeacherId = '';
  String _dateFilter = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final session = await ApiService.getUserSession();
    _userRole = session['role'] ?? 'ADMIN';

    final isTeacher = ApiService.isTeacherRole(_userRole);

    final futures = <Future<dynamic>>[
      isTeacher
          ? ApiService.getTeacherAttendanceHistory()
          : ApiService.getAllTeacherAttendances(
              teacherId: _selectedTeacherId.isNotEmpty ? int.tryParse(_selectedTeacherId) : null,
              date: _dateFilter.isNotEmpty ? _dateFilter : null,
            ),
      ApiService.getTeacherHoursSummary(
        _selectedTeacherId.isNotEmpty ? int.tryParse(_selectedTeacherId) : null,
      ),
      ApiService.getList('/teachers'),
      ApiService.getList('/classes'),
      ApiService.getList('/subjects'),
    ];

    final results = await Future.wait(futures);
    if (!mounted) return;

    setState(() {
      _items = results[0] as List<dynamic>;
      _hoursSummary = results[1] as Map<String, dynamic>?;
      _teachers = results[2] as List<dynamic>;
      _classes = results[3] as List<dynamic>;
      _subjects = results[4] as List<dynamic>;
      _loading = false;
    });
  }

  bool get _isTeacher => ApiService.isTeacherRole(_userRole);
  bool get _isAdmin => ApiService.isAdminRole(_userRole);

  Future<void> _handleDelete(int id, String teacherName) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف تسجيل الحضور',
      message: 'هل تريد حذف هذا السجل للمعلم "$teacherName"؟',
      confirmText: 'حذف',
    );
    if (!ok) return;

    final res = await ApiService.deleteTeacherAttendance(id);
    if (!mounted) return;
    if (res.success) {
      showErpToast(context, 'تم حذف السجل بنجاح');
      _loadData();
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  void _openCheckInModal() {
    String status = 'PRESENT';
    final hoursCtrl = TextEditingController(text: '2.0');
    final rateCtrl = TextEditingController(text: '25.0');
    final startCtrl = TextEditingController(text: '08:00');
    final endCtrl = TextEditingController(text: '10:00');
    final remarksCtrl = TextEditingController();
    String? selectedClassId;
    String? selectedSubjectId;
    String? selectedTeacherId = _selectedTeacherId.isNotEmpty ? _selectedTeacherId : (_teachers.isNotEmpty ? _teachers.first['id'].toString() : null);
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ErpColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            18,
            18,
            18,
            MediaQuery.of(ctx).viewInsets.bottom + 18,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _isTeacher ? 'تسجيل حضور الحصة بالساعة (Pointage)' : 'رصد حصة وساعات عمل لمعلم',
                        style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w900),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                if (_isAdmin) ...[
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: selectedTeacherId,
                    decoration: const InputDecoration(labelText: 'اختر المعلم *'),
                    items: _teachers.map((t) {
                      final u = t['user'] ?? {};
                      final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                      final rate = t['hourlyRate'] ?? 25.0;
                      return DropdownMenuItem(
                        value: t['id'].toString(),
                        child: Text('$name ($rate د.ت/س)'),
                      );
                    }).toList(),
                    onChanged: (v) {
                      setModalState(() {
                        selectedTeacherId = v;
                        final tObj = _teachers.firstWhere((t) => t['id'].toString() == v, orElse: () => null);
                        if (tObj != null && tObj['hourlyRate'] != null) {
                          rateCtrl.text = tObj['hourlyRate'].toString();
                        }
                      });
                    },
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: selectedClassId,
                        decoration: const InputDecoration(labelText: 'الفصل (اختياري)'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('عام / غير محدد')),
                          ..._classes.map((c) => DropdownMenuItem(value: c['id'].toString(), child: Text(c['name'] ?? ''))),
                        ],
                        onChanged: (v) => setModalState(() => selectedClassId = v),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: selectedSubjectId,
                        decoration: const InputDecoration(labelText: 'المادة (اختياري)'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('عام / غير محدد')),
                          ..._subjects.map((s) => DropdownMenuItem(value: s['id'].toString(), child: Text(s['name'] ?? ''))),
                        ],
                        onChanged: (v) => setModalState(() => selectedSubjectId = v),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: startCtrl,
                        decoration: const InputDecoration(labelText: 'وقت البدء', hintText: '08:00'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: endCtrl,
                        decoration: const InputDecoration(labelText: 'وقت الانتهاء', hintText: '10:00'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: hoursCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'عدد الساعات *', suffixText: 'ساعة'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: rateCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'سعر الساعة *', suffixText: 'د.ت'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: status,
                  decoration: const InputDecoration(labelText: 'حالة الحضور *'),
                  items: const [
                    DropdownMenuItem(value: 'PRESENT', child: Text('حاضر (Présent)')),
                    DropdownMenuItem(value: 'LATE', child: Text('متأخر (En retard)')),
                    DropdownMenuItem(value: 'EXCUSED', child: Text('غياب مبرر (Excusé)')),
                  ],
                  onChanged: (v) => setModalState(() => status = v ?? 'PRESENT'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: remarksCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات وتفاصيل الحصة',
                    hintText: 'مثال: حصة تعويضية، درس رياضيات...',
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          final hours = double.tryParse(hoursCtrl.text.trim()) ?? 0;
                          final rate = double.tryParse(rateCtrl.text.trim()) ?? 25.0;
                          if (hours <= 0) {
                            showErpToast(context, 'الرجاء إدخال عدد ساعات صحيح', isError: true);
                            return;
                          }

                          setModalState(() => saving = true);
                          ApiResult<dynamic> res;

                          if (_isTeacher) {
                            res = await ApiService.teacherCheckInDetailed(
                              status: status,
                              hoursCount: hours,
                              hourlyRate: rate,
                              classId: selectedClassId != null ? int.tryParse(selectedClassId!) : null,
                              subjectId: selectedSubjectId != null ? int.tryParse(selectedSubjectId!) : null,
                              startTime: startCtrl.text.trim(),
                              endTime: endCtrl.text.trim(),
                              remarks: remarksCtrl.text.trim(),
                            );
                          } else {
                            if (selectedTeacherId == null) {
                              showErpToast(context, 'الرجاء اختيار المعلم', isError: true);
                              setModalState(() => saving = false);
                              return;
                            }
                            final payload = {
                              'teacherId': int.parse(selectedTeacherId!),
                              'status': status,
                              'hoursWorked': hours,
                              'hourlyRate': rate,
                              'classId': selectedClassId != null ? int.tryParse(selectedClassId!) : null,
                              'subjectId': selectedSubjectId != null ? int.tryParse(selectedSubjectId!) : null,
                              'timeIn': startCtrl.text.trim(),
                              'timeOut': endCtrl.text.trim(),
                              'remarks': remarksCtrl.text.trim(),
                            };
                            res = await ApiService.recordTeacherAttendanceAdmin(payload);
                          }

                          setModalState(() => saving = false);
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (!mounted) return;
                          if (res.success) {
                            showErpToast(context, 'تم تسجيل حضور الحصة واحتساب الأجر بنجاح 🎉');
                            _loadData();
                          } else {
                            showErpToast(context, res.message, isError: true);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ErpColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: saving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_isTeacher ? 'تأكيد تسجيل الحضور' : 'حفظ ساعات المعلم', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalHours = (_hoursSummary?['totalHours'] ?? 0.0).toDouble();
    final totalPay = (_hoursSummary?['totalEstimatedPay'] ?? 0.0).toDouble();
    final totalSessions = _hoursSummary?['totalSessions'] ?? _items.length;

    return ErpShell(
      currentRoute: ErpRoute.teacherAttendance,
      onRefresh: _loadData,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCheckInModal,
        backgroundColor: ErpColors.primary,
        icon: const Icon(Icons.add_task),
        label: Text(_isTeacher ? 'تسجيل حضوري' : 'رصد حصة معلم'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ErpPageHeader(
                    title: 'حضور المعلمين بالساعة',
                    subtitle: _isTeacher
                        ? 'متابعة ساعات العمل الشخصية واحتساب الأجر بالساعة'
                        : 'متابعة ساعات عمل كادر التدريس واحتساب الأجور والمستحقات الشهرية',
                  ),
                  const SizedBox(height: 12),

                  // KPI Cards
                  Row(
                    children: [
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('الساعات المنجزة', style: TextStyle(fontSize: 11, color: ErpColors.textMuted)),
                              const SizedBox(height: 4),
                              Text('$totalHours س', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('الأجر المقدر', style: TextStyle(fontSize: 11, color: Color(0xFF059669))),
                              const SizedBox(height: 4),
                              Text('$totalPay د.ت', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('الحصص المسجلة', style: TextStyle(fontSize: 11, color: ErpColors.textMuted)),
                              const SizedBox(height: 4),
                              Text('$totalSessions', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Filter for Admin
                  if (_isAdmin) ...[
                    ErpCard(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _selectedTeacherId,
                              decoration: const InputDecoration(labelText: 'تصفية بالمعلم'),
                              items: [
                                const DropdownMenuItem(value: '', child: Text('جميع المعلمين', style: TextStyle(fontSize: 13))),
                                ..._teachers.map((t) {
                                  final u = t['user'] ?? {};
                                  final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                                  return DropdownMenuItem(value: t['id'].toString(), child: Text(name, style: const TextStyle(fontSize: 13)));
                                }),
                              ],
                              onChanged: (v) {
                                setState(() => _selectedTeacherId = v ?? '');
                                _loadData();
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              decoration: const InputDecoration(
                                labelText: 'التاريخ',
                                hintText: 'YYYY-MM-DD',
                                suffixIcon: Icon(Icons.calendar_today_outlined, size: 16),
                              ),
                              onChanged: (v) {
                                _dateFilter = v.trim();
                                if (_dateFilter.length == 10 || _dateFilter.isEmpty) {
                                  _loadData();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // Sessions List
                  if (_items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(child: Text('لا توجد سجلات حضور مسجلة', style: TextStyle(color: ErpColors.textMuted))),
                    )
                  else
                    ..._items.map((item) {
                      final teacher = item['teacher'] ?? {};
                      final user = teacher['user'] ?? {};
                      final teacherName = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
                      final hours = (item['hoursWorked'] ?? 0.0).toDouble();
                      final rate = (item['hourlyRate'] ?? 25.0).toDouble();
                      final pay = (item['estimatedPay'] ?? (hours * rate)).toDouble();
                      final date = item['date'] ?? '';
                      final timeIn = item['timeIn'] ?? '';
                      final timeOut = item['timeOut'] ?? '';
                      final timeStr = timeIn.isNotEmpty ? '$timeIn - $timeOut' : 'عام';
                      final remarks = item['remarks'] ?? '—';
                      final status = item['status'] ?? 'PRESENT';

                      return ErpCard(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: ErpColors.primary,
                                  child: Text(
                                    teacherName.isNotEmpty ? teacherName[0] : 'أ',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        teacherName.isNotEmpty ? teacherName : 'معلم',
                                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                                      ),
                                      Text('$date | التوقيت: $timeStr', style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted)),
                                    ],
                                  ),
                                ),
                                _buildStatusBadge(status),
                              ],
                            ),
                            const Divider(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('الساعات', style: TextStyle(fontSize: 10.5, color: ErpColors.textMuted)),
                                    Text('$hours س', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    const Text('سعر الساعة', style: TextStyle(fontSize: 10.5, color: ErpColors.textMuted)),
                                    Text('$rate د.ت', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('المستحقات', style: TextStyle(fontSize: 10.5, color: Color(0xFF059669))),
                                    Text('$pay د.ت', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669), fontSize: 14)),
                                  ],
                                ),
                              ],
                            ),
                            if (remarks.isNotEmpty && remarks != '—') ...[
                              const SizedBox(height: 8),
                              Text('ملاحظات: $remarks', style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted)),
                            ],
                            if (_isAdmin) ...[
                              const SizedBox(height: 10),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: TextButton.icon(
                                  onPressed: () => _handleDelete(item['id'], teacherName),
                                  icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                  label: const Text('حذف السجل', style: TextStyle(color: Colors.red, fontSize: 12)),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  Widget _buildStatusBadge(String status) {
    switch (status) {
      case 'PRESENT':
        return const ErpBadge(label: 'حاضر', color: Color(0xFF059669), backgroundColor: Color(0xFFD1FAE5));
      case 'LATE':
        return const ErpBadge(label: 'متأخر', color: Color(0xFFD97706), backgroundColor: Color(0xFFFEF3C7));
      case 'EXCUSED':
        return const ErpBadge(label: 'مبرر', color: Color(0xFF2563EB), backgroundColor: Color(0xFFDBEAFE));
      default:
        return const ErpBadge(label: 'غائب', color: Color(0xFFDC2626), backgroundColor: Color(0xFFFEE2E2));
    }
  }
}
