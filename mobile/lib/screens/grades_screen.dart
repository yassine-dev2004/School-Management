import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _students = [];
  List<dynamic> _subjects = [];
  String _search = '';
  String _subjectFilterId = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      ApiService.getList('/grades'),
      ApiService.getList('/students'),
      ApiService.getList('/subjects'),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _students = results[1];
      _subjects = results[2];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    return _items.where((g) {
      if (_subjectFilterId.isNotEmpty) {
        final sid = g['subject']?['id']?.toString() ?? '';
        if (sid != _subjectFilterId) return false;
      }
      if (_search.isEmpty) return true;
      final q = _search.toLowerCase();
      final su = g['student']?['user'] ?? {};
      final sName =
          '${su['firstName'] ?? ''} ${su['lastName'] ?? ''}'.toLowerCase();
      final subName = (g['subject']?['name'] ?? '').toString().toLowerCase();
      final ex = (g['examType'] ?? '').toString().toLowerCase();
      return sName.contains(q) || subName.contains(q) || ex.contains(q);
    }).toList();
  }

  ErpBadgeTone _scoreTone(double score, [double maxScore = 20.0]) {
    final pct = maxScore > 0 ? (score / maxScore) * 100 : score;
    if (pct >= 80) return ErpBadgeTone.success;
    if (pct >= 60) return ErpBadgeTone.info;
    if (pct >= 50) return ErpBadgeTone.warning;
    return ErpBadgeTone.danger;
  }

  Future<void> _deleteGrade(dynamic g) async {
    final su = g['student']?['user'] ?? {};
    final sName = '${su['firstName'] ?? ''} ${su['lastName'] ?? ''}'.trim();
    final subName = g['subject']?['name'] ?? '';
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف درجة',
      message: 'هل أنت متأكد من حذف درجة "$subName" للطالب "$sName"؟',
      confirmText: 'حذف الدرجة',
    );
    if (!ok) return;

    final res = await ApiService.delete('/grades/${g['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == g['id']));
      showErpToast(context, 'تم حذف الدرجة بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic grade]) async {
    String studentId = grade?['student']?['id']?.toString() ??
        (_students.isNotEmpty ? _students.first['id'].toString() : '');
    String subjectId = grade?['subject']?['id']?.toString() ??
        (_subjects.isNotEmpty ? _subjects.first['id'].toString() : '');
    String examType = grade?['examType']?.toString() ?? 'Devoir de contrôle (فرض مراقبة)';
    String term = grade?['term']?.toString() ?? 'الثلاثي الأول';
    final scoreCtrl = TextEditingController(
        text: grade?['score'] != null ? grade['score'].toString() : '');
    final maxScoreCtrl = TextEditingController(
        text: grade?['maxScore'] != null ? grade['maxScore'].toString() : '20');
    final commentsCtrl =
        TextEditingController(text: grade?['comments']?.toString() ?? '');
    final dateCtrl = TextEditingController(
      text: grade?['recordedDate'] != null
          ? formatDateShort(grade['recordedDate'])
          : DateTime.now().toIso8601String().split('T').first,
    );
    bool saving = false;

    const examTypes = [
      'Devoir de contrôle (فرض مراقبة)',
      'Devoir de synthèse (فرض تأليفي)',
      'Contrôle continu (مراقبة مستمرة)',
      'Oral / Pratique (شفاهي / تطبيقي)',
      'اختبار شهري',
      'امتحان نهائي',
      'واجب / نشاط',
    ];
    if (!examTypes.contains(examType)) {
      examType = examTypes.first;
    }

    const terms = [
      'الثلاثي الأول',
      'الثلاثي الثاني',
      'الثلاثي الثالث',
    ];
    if (!terms.contains(term)) {
      term = terms.first;
    }

    await showModalBottomSheet(
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
                        grade != null ? 'تعديل درجة' : 'رصد درجة جديدة',
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w900),
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
                DropdownButtonFormField<String>(
                  value: _students.any((s) => s['id'].toString() == studentId)
                      ? studentId
                      : null,
                  decoration: const InputDecoration(labelText: 'الطالب *'),
                  items: _students.map((s) {
                    final u = s['user'] ?? {};
                    return DropdownMenuItem(
                      value: s['id'].toString(),
                      child: Text(
                          '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                              .trim()),
                    );
                  }).toList(),
                  onChanged: (v) => setModalState(() => studentId = v ?? ''),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _subjects.any((s) => s['id'].toString() == subjectId)
                      ? subjectId
                      : null,
                  decoration: const InputDecoration(labelText: 'المادة *'),
                  items: _subjects
                      .map((s) => DropdownMenuItem(
                            value: s['id'].toString(),
                            child: Text(s['name']?.toString() ?? ''),
                          ))
                      .toList(),
                  onChanged: (v) => setModalState(() => subjectId = v ?? ''),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: term,
                  decoration: const InputDecoration(labelText: 'الفصل / الثلاثي'),
                  items: terms
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setModalState(() => term = v ?? terms.first),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: examType,
                  decoration: const InputDecoration(labelText: 'نوع التقييم'),
                  items: examTypes
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) =>
                      setModalState(() => examType = v ?? examTypes.first),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: scoreCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration:
                            const InputDecoration(labelText: 'الدرجة المسندة *'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: maxScoreCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration:
                            const InputDecoration(labelText: 'من مجموع (Max)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: dateCtrl,
                  decoration:
                      const InputDecoration(labelText: 'تاريخ الإسناد (YYYY-MM-DD)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: commentsCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(labelText: 'ملاحظات (اختياري)'),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          final scoreNum = double.tryParse(scoreCtrl.text.trim());
                          final maxScoreNum =
                              double.tryParse(maxScoreCtrl.text.trim()) ?? 20.0;
                          if (studentId.isEmpty ||
                              subjectId.isEmpty ||
                              scoreNum == null ||
                              scoreNum < 0 ||
                              scoreNum > maxScoreNum) {
                            showErpToast(
                                context,
                                'يرجى اختيار الطالب والمادة وإدخال درجة بين 0 و $maxScoreNum',
                                isWarning: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = {
                            'student': {'id': int.parse(studentId)},
                            'subject': {'id': int.parse(subjectId)},
                            'examType': examType,
                            'score': scoreNum,
                            'maxScore': maxScoreNum,
                            'term': term,
                            'comments': commentsCtrl.text.trim(),
                            'recordedDate': dateCtrl.text.trim(),
                          };
                          final res = grade != null
                              ? await ApiService.put(
                                  '/grades/${grade['id']}', payload)
                              : await ApiService.post('/grades', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) showErpToast(context, 'تم حفظ الدرجة بنجاح');
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ الدرجة'),
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
    final list = _filtered;
    return ErpShell(
      currentRoute: ErpRoute.grades,
      onRefresh: _loadAll,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: ErpColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _openFormModal(),
        icon: const Icon(Icons.add),
        label: const Text('رصد درجة',
            style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAll,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 86),
                children: [
                  ErpPageHeader(
                    title: 'إدارة الدرجات والتقييم',
                    subtitle: 'إجمالي السجلات: ${_items.length}',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث بالطالب أو المادة أو نوع التقييم...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  if (_subjects.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _chip('الكل', ''),
                          ..._subjects.map((s) => _chip(
                              s['name']?.toString() ?? '',
                              s['id'].toString())),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.assignment_outlined,
                      message: 'لا توجد درجات مسجلة مطابقة',
                    )
                  else
                    ...list.map((g) {
                      final su = g['student']?['user'] ?? {};
                      final studentName =
                          '${su['firstName'] ?? ''} ${su['lastName'] ?? ''}'
                              .trim();
                      final subjectName =
                          g['subject']?['name']?.toString() ?? 'مادة';
                      final score = g['score'] is num
                          ? (g['score'] as num).toDouble()
                          : 0.0;
                      final maxScore = g['maxScore'] is num
                          ? (g['maxScore'] as num).toDouble()
                          : 20.0;
                      final term = (g['term'] ?? '').toString();

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          studentName.isEmpty
                                              ? 'طالب'
                                              : studentName,
                                          style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        Text(
                                          '${term.isNotEmpty ? "$term • " : ""}$subjectName • ${g['examType'] ?? 'اختبار'}',
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: ErpColors.textMuted),
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
                              if ((g['comments'] ?? '').toString().isNotEmpty ||
                                  g['recordedDate'] != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  '${formatDateShort(g['recordedDate'])}${(g['comments'] ?? '').toString().isNotEmpty ? " • ${g['comments']}" : ""}',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: ErpColors.textSecondary),
                                ),
                              ],
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => _openFormModal(g),
                                    icon: const Icon(Icons.edit_outlined,
                                        size: 16),
                                    label: const Text('تعديل'),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                        foregroundColor: ErpColors.danger),
                                    onPressed: () => _deleteGrade(g),
                                    icon: const Icon(Icons.delete_outline,
                                        size: 16),
                                    label: const Text('حذف'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  Widget _chip(String label, String id) {
    final active = _subjectFilterId == id;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: active,
        selectedColor: ErpColors.primary,
        backgroundColor: ErpColors.surface,
        labelStyle: TextStyle(
          color: active ? Colors.white : ErpColors.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
        side: const BorderSide(color: ErpColors.border),
        onSelected: (_) => setState(() => _subjectFilterId = id),
      ),
    );
  }
}

