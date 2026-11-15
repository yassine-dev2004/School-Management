import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class ClassesScreen extends StatefulWidget {
  const ClassesScreen({super.key});

  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _teachers = [];
  String _search = '';
  String _role = 'TEACHER';
  bool _loading = true;

  bool get _isAdmin => ApiService.isAdminRole(_role);

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
    final session = await ApiService.getUserSession();
    _role = session['role'] ?? 'TEACHER';
    final results = await Future.wait([
      ApiService.getList('/classes'),
      _isAdmin ? ApiService.getList('/teachers') : Future.value(<dynamic>[]),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _teachers = results[1];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((c) {
      final name = (c['name'] ?? '').toString().toLowerCase();
      final sec = (c['section'] ?? '').toString().toLowerCase();
      return name.contains(q) || sec.contains(q);
    }).toList();
  }

  Future<void> _deleteClass(dynamic c) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف فصل دراسي',
      message:
          'هل أنت متأكد من حذف الفصل "${c['name']}"؟ سيتم إلغاء تسكين الطلاب دون حذفهم.',
      confirmText: 'حذف الفصل',
    );
    if (!ok) return;

    final res = await ApiService.delete('/classes/${c['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == c['id']));
      showErpToast(context, 'تم حذف الفصل بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic cls]) async {
    final nameCtrl =
        TextEditingController(text: cls?['name']?.toString() ?? '');
    final sectionCtrl =
        TextEditingController(text: cls?['section']?.toString() ?? '');
    final annualFeeCtrl =
        TextEditingController(text: cls?['annualFee']?.toString() ?? '1200');
    final initialTeacherIds = (cls?['teachers'] as List<dynamic>?)
            ?.map((t) => t['id']?.toString() ?? '')
            .where((id) => id.isNotEmpty)
            .toSet() ??
        (cls?['teacher']?['id'] != null
            ? {cls!['teacher']['id'].toString()}
            : <String>{});
    final selectedTeacherIds = Set<String>.from(initialTeacherIds);
    String teacherId = cls?['teacher']?['id']?.toString() ??
        (selectedTeacherIds.isNotEmpty ? selectedTeacherIds.first : '');
    bool saving = false;

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
                        cls != null
                            ? 'تعديل بيانات الفصل'
                            : 'إضافة فصل دراسي',
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
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                      labelText: 'اسم الفصل * (مثال: السنة الأولى)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: sectionCtrl,
                  decoration:
                      const InputDecoration(labelText: 'الشعبة (مثال: أ)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: annualFeeCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'الرسوم الدراسية السنوية (دينار تونسي TND) *',
                    helperText: 'الرسوم المعتمدة لحساب أقساط ومستحقات كل طالب بهذا الفصل',
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'المعلمون المسندون للفصل (اختيار متعدد):',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _teachers.map((t) {
                    final tu = t['user'] ?? {};
                    final id = t['id'].toString();
                    final name =
                        '${tu['firstName'] ?? ''} ${tu['lastName'] ?? ''}'
                            .trim();
                    final isSel = selectedTeacherIds.contains(id);
                    return FilterChip(
                      selected: isSel,
                      label: Text(name),
                      selectedColor: ErpColors.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : ErpColors.textMain,
                        fontWeight:
                            isSel ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 12,
                      ),
                      onSelected: (val) {
                        setModalState(() {
                          if (val) {
                            selectedTeacherIds.add(id);
                            if (teacherId.isEmpty) teacherId = id;
                          } else {
                            selectedTeacherIds.remove(id);
                            if (teacherId == id) {
                              teacherId = selectedTeacherIds.isNotEmpty
                                  ? selectedTeacherIds.first
                                  : '';
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedTeacherIds.contains(teacherId)
                      ? teacherId
                      : (selectedTeacherIds.isNotEmpty
                          ? selectedTeacherIds.first
                          : ''),
                  decoration: const InputDecoration(
                      labelText: 'رائد الفصل (المعلم الرئيسي المسؤول)'),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('غير معين')),
                    ..._teachers
                        .where((t) =>
                            selectedTeacherIds.contains(t['id'].toString()))
                        .map((t) {
                      final tu = t['user'] ?? {};
                      return DropdownMenuItem(
                        value: t['id'].toString(),
                        child: Text(
                            '${tu['firstName'] ?? ''} ${tu['lastName'] ?? ''}'
                                .trim()),
                      );
                    }),
                  ],
                  onChanged: (v) => setModalState(() => teacherId = v ?? ''),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (nameCtrl.text.trim().isEmpty) {
                            showErpToast(context, 'يرجى إدخال اسم الفصل',
                                isWarning: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = {
                            'name': nameCtrl.text.trim(),
                            'section': sectionCtrl.text.trim(),
                            'annualFee': double.tryParse(annualFeeCtrl.text.trim()) ?? 1200.0,
                            'teacherId': teacherId.isNotEmpty
                                ? int.parse(teacherId)
                                : null,
                            'teacherIds': selectedTeacherIds
                                .map((id) => int.parse(id))
                                .toList(),
                          };
                          final res = cls != null
                              ? await ApiService.put(
                                  '/classes/${cls['id']}', payload)
                              : await ApiService.post('/classes', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) {
                              showErpToast(
                                  context,
                                  cls != null
                                      ? 'تم تحديث الفصل بنجاح'
                                      : 'تمت إضافة الفصل بنجاح');
                            }
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ الفصل'),
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
      currentRoute: ErpRoute.classes,
      onRefresh: _loadAll,
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('إضافة فصل',
                  style: TextStyle(fontWeight: FontWeight.w800)),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAll,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 86),
                children: [
                  ErpPageHeader(
                    title: 'الفصول الدراسية',
                    subtitle: 'العدد الإجمالي: ${_items.length} فصل',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث باسم الفصل أو الشعبة...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.meeting_room_outlined,
                      message: 'لا توجد فصول مطابقة للبحث',
                    )
                  else
                    ...list.map((c) {
                      final teacherUser = c['teacher']?['user'];
                      final teacherName = teacherUser != null
                          ? '${teacherUser['firstName'] ?? ''} ${teacherUser['lastName'] ?? ''}'
                              .trim()
                          : 'غير معين';
                      final studentsCount =
                          (c['students'] as List<dynamic>?)?.length ?? 0;

                      final allTeachers =
                          (c['teachers'] as List<dynamic>?) ?? [];
                      final otherTeachersCount = allTeachers
                          .where((t) =>
                              t['id']?.toString() !=
                              c['teacher']?['id']?.toString())
                          .length;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: ErpColors.primary,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                        Icons.meeting_room_outlined,
                                        color: Colors.white),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${c['name'] ?? ''} ${(c['section'] ?? '').toString().isNotEmpty ? "- ${c['section']}" : ""}',
                                          style: const TextStyle(
                                              fontSize: 15.5,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        Text(
                                          'رائد الفصل: $teacherName${otherTeachersCount > 0 ? " (+$otherTeachersCount معلمين)" : ""}',
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: ErpColors.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      ErpBadge(
                                        label: '$studentsCount طالب',
                                        tone: ErpBadgeTone.info,
                                      ),
                                      const SizedBox(height: 4),
                                      ErpBadge(
                                        label: '${c['annualFee'] ?? 1200} د.ت/سنة',
                                        tone: ErpBadgeTone.success,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              if (_isAdmin) ...[
                                const Divider(height: 18),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => _openFormModal(c),
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 16),
                                      label: const Text('تعديل'),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                          foregroundColor: ErpColors.danger),
                                      onPressed: () => _deleteClass(c),
                                      icon: const Icon(Icons.delete_outline,
                                          size: 16),
                                      label: const Text('حذف'),
                                    ),
                                  ],
                                ),
                              ],
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
}

