import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class DailyLogbookScreen extends StatefulWidget {
  const DailyLogbookScreen({super.key});

  @override
  State<DailyLogbookScreen> createState() => _DailyLogbookScreenState();
}

class _DailyLogbookScreenState extends State<DailyLogbookScreen> {
  List<dynamic> _logs = [];
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  bool _loading = true;

  String _userRole = 'ADMIN';
  String _selectedClassId = '';
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

    final results = await Future.wait([
      ApiService.getDailyLessonLogs(
        classId: _selectedClassId.isNotEmpty ? int.tryParse(_selectedClassId) : null,
        date: _dateFilter.isNotEmpty ? _dateFilter : null,
      ),
      ApiService.getList('/classes'),
      ApiService.getList('/subjects'),
    ]);

    if (!mounted) return;
    setState(() {
      _logs = results[0];
      _classes = results[1];
      _subjects = results[2];
      _loading = false;
    });
  }

  bool get _isStaff => ApiService.isAdminRole(_userRole) || ApiService.isTeacherRole(_userRole);

  Future<void> _handleDelete(int id, String title) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف تسجيل الدرس',
      message: 'هل تريد حذف الدرس "$title" من كراس المتابعة اليومي؟',
      confirmText: 'حذف',
    );
    if (!ok) return;

    final res = await ApiService.deleteDailyLessonLog(id);
    if (!mounted) return;
    if (res.success) {
      showErpToast(context, 'تم حذف الدرس من الكراس بنجاح');
      _loadData();
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  void _openAddLogModal() {
    String? classId = _selectedClassId.isNotEmpty ? _selectedClassId : (_classes.isNotEmpty ? _classes.first['id'].toString() : null);
    String? subjectId = _subjects.isNotEmpty ? _subjects.first['id'].toString() : null;
    final titleCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().toIso8601String().substring(0, 10));
    final topicsCtrl = TextEditingController();
    final homeworkCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
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
                    const Expanded(
                      child: Text(
                        'إضافة درس جديد في كراس المتابعة',
                        style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w900),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: classId,
                        decoration: const InputDecoration(labelText: 'الفصل الدراسي *'),
                        items: _classes.map((c) => DropdownMenuItem(value: c['id'].toString(), child: Text(c['name'] ?? ''))).toList(),
                        onChanged: (v) => setModalState(() => classId = v),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: subjectId,
                        decoration: const InputDecoration(labelText: 'المادة الدراسية *'),
                        items: _subjects.map((s) => DropdownMenuItem(value: s['id'].toString(), child: Text(s['name'] ?? ''))).toList(),
                        onChanged: (v) => setModalState(() => subjectId = v),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'عنوان الدرس / موضوع الحصة *',
                    hintText: 'مثال: التراكيب النحوية وإعراب الجملة',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: dateCtrl,
                  decoration: const InputDecoration(
                    labelText: 'تاريخ الحصة (YYYY-MM-DD) *',
                    suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: topicsCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'المحاور والأنشطة المنجزة في الفصل *',
                    hintText: 'شرح القاعدة، قراءة النص، إنجاز التمارين ص 45...',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: homeworkCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'الواجب المنزلي المطلوب',
                    hintText: 'إنجاز التمرين 3 ص 46 وكتابة فقرة تلخيصية...',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات إضافية لأولياء الأمور',
                    hintText: 'إحضار الأدوات الهندسية الحصة القادمة...',
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (classId == null || subjectId == null || titleCtrl.text.trim().isEmpty) {
                            showErpToast(context, 'الرجاء ملء جميع الحقول المطلوبة (*)', isError: true);
                            return;
                          }

                          setModalState(() => saving = true);
                          final payload = {
                            'classId': int.parse(classId!),
                            'subjectId': int.parse(subjectId!),
                            'title': titleCtrl.text.trim(),
                            'date': dateCtrl.text.trim(),
                            'coveredTopics': topicsCtrl.text.trim(),
                            'homework': homeworkCtrl.text.trim(),
                            'notes': notesCtrl.text.trim(),
                          };

                          final res = await ApiService.createDailyLessonLog(payload);
                          setModalState(() => saving = false);
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (!mounted) return;
                          if (res.success) {
                            showErpToast(context, 'تم تسجيل الدرس في الكراس بنجاح 🎉');
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
                      : const Text('حفظ الدرس في الكراس', style: TextStyle(fontWeight: FontWeight.bold)),
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
    return ErpShell(
      currentRoute: ErpRoute.dailyLogbook,
      onRefresh: _loadData,
      floatingActionButton: _isStaff
          ? FloatingActionButton.extended(
              onPressed: _openAddLogModal,
              backgroundColor: ErpColors.primary,
              icon: const Icon(Icons.post_add),
              label: const Text('إضافة درس في الكراس'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const ErpPageHeader(
                    title: 'كراس الدروس اليومي',
                    subtitle: 'سجل المتابعة اليومية للدروس والمحاور المنجزة والواجبات المطلوبة',
                  ),
                  const SizedBox(height: 12),

                  // Filters
                  ErpCard(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedClassId,
                            decoration: const InputDecoration(labelText: 'تصفية بالفصل'),
                            items: [
                              const DropdownMenuItem(value: '', child: Text('جميع الفصول', style: TextStyle(fontSize: 13))),
                              ..._classes.map((c) => DropdownMenuItem(value: c['id'].toString(), child: Text(c['name'] ?? '', style: const TextStyle(fontSize: 13)))),
                            ],
                            onChanged: (v) {
                              setState(() => _selectedClassId = v ?? '');
                              _loadData();
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(
                              labelText: 'تاريخ الدرس',
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

                  if (_logs.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(child: Text('لا توجد دروس مسجلة في الكراس لهذا التاريخ/الفصل', style: TextStyle(color: ErpColors.textMuted))),
                    )
                  else
                    ..._logs.map((log) {
                      final title = log['title'] ?? 'درس';
                      final classObj = log['schoolClass'] ?? {};
                      final className = classObj['name'] ?? 'الفصل';
                      final subject = log['subject'] ?? {};
                      final subjectName = subject['name'] ?? 'المادة';
                      final teacher = log['teacher'] ?? {};
                      final teacherUser = teacher['user'] ?? {};
                      final teacherName = '${teacherUser['firstName'] ?? ''} ${teacherUser['lastName'] ?? ''}'.trim();
                      final date = log['date'] ?? '';
                      final coveredTopics = log['coveredTopics'] ?? '';
                      final homework = log['homework'] ?? '';
                      final notes = log['notes'] ?? '';

                      return ErpCard(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                ErpBadge(label: className, color: ErpColors.primary, backgroundColor: ErpColors.primaryLight),
                                const SizedBox(width: 6),
                                ErpBadge(label: subjectName, color: const Color(0xFF059669), backgroundColor: const Color(0xFFD1FAE5)),
                                const Spacer(),
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_today_outlined, size: 13, color: ErpColors.textMuted),
                                    const SizedBox(width: 4),
                                    Text(date, style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                            if (teacherName.isNotEmpty) ...[
                              const SizedBox(height: 3),
                              Text('الأستاذ: $teacherName', style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted)),
                            ],
                            const Divider(height: 18),
                            if (coveredTopics.isNotEmpty) ...[
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.menu_book, size: 16, color: ErpColors.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('ما تم تدريسه في الحصة:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                        const SizedBox(height: 2),
                                        Text(coveredTopics, style: const TextStyle(fontSize: 12.5, color: ErpColors.textSecondary)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                            ],
                            if (homework.isNotEmpty) ...[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFFDE68A)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.assignment_outlined, size: 16, color: Color(0xFFB45309)),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('الواجب المنزلي المطلوب:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Color(0xFF92400E))),
                                          const SizedBox(height: 2),
                                          Text(homework, style: const TextStyle(fontSize: 12, color: Color(0xFF78350F))),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if (notes.isNotEmpty) ...[
                              Text('ملاحظات: $notes', style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted)),
                            ],
                            if (_isStaff) ...[
                              const Divider(height: 16),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: TextButton.icon(
                                  onPressed: () => _handleDelete(log['id'], title),
                                  icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                  label: const Text('حذف الدرس', style: TextStyle(color: Colors.red, fontSize: 12)),
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
}
