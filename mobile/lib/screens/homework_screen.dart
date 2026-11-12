import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class HomeworkScreen extends StatefulWidget {
  const HomeworkScreen({super.key});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  List<dynamic> _teachers = [];
  String _search = '';
  String _classFilterId = '';
  String _role = 'PARENT';
  bool _loading = true;

  bool get _isStaff => ApiService.isStaffRole(_role);
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
    _role = session['role'] ?? 'PARENT';

    if (_isStaff) {
      final results = await Future.wait([
        ApiService.getList('/homework'),
        ApiService.getList('/classes'),
        ApiService.getList('/subjects'),
        _isAdmin ? ApiService.getList('/teachers') : Future.value(<dynamic>[]),
      ]);
      if (!mounted) return;
      setState(() {
        _items = results[0];
        _classes = results[1];
        _subjects = results[2];
        _teachers = results[3];
        _loading = false;
      });
    } else {
      final parentData = await ApiService.getParentDashboard();
      final children = (parentData?['children'] as List<dynamic>?) ?? [];
      final hw = await ApiService.getHomeworkForParentChildren(children);
      if (!mounted) return;
      setState(() {
        _items = hw;
        _loading = false;
      });
    }
  }

  List<dynamic> get _filtered {
    return _items.where((h) {
      if (_classFilterId.isNotEmpty) {
        final cid = h['schoolClass']?['id']?.toString() ?? '';
        if (cid != _classFilterId) return false;
      }
      if (_search.isEmpty) return true;
      final q = _search.toLowerCase();
      final title = (h['title'] ?? '').toString().toLowerCase();
      final desc = (h['description'] ?? '').toString().toLowerCase();
      final sub = (h['subject']?['name'] ?? '').toString().toLowerCase();
      return title.contains(q) || desc.contains(q) || sub.contains(q);
    }).toList();
  }

  Future<void> _deleteHomework(dynamic h) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف واجب',
      message: 'هل أنت متأكد من حذف الواجب "${h['title']}"؟',
      confirmText: 'حذف الواجب',
    );
    if (!ok) return;

    final res = await ApiService.delete('/homework/${h['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == h['id']));
      showErpToast(context, 'تم حذف الواجب بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic hw]) async {
    final titleCtrl =
        TextEditingController(text: hw?['title']?.toString() ?? '');
    final descCtrl =
        TextEditingController(text: hw?['description']?.toString() ?? '');
    final dueCtrl = TextEditingController(
      text: hw?['dueDate'] != null
          ? formatDateShort(hw['dueDate'])
          : DateTime.now()
              .add(const Duration(days: 2))
              .toIso8601String()
              .split('T')
              .first,
    );
    String classId = hw?['schoolClass']?['id']?.toString() ??
        (_classes.isNotEmpty ? _classes.first['id'].toString() : '');
    String subjectId = hw?['subject']?['id']?.toString() ??
        (_subjects.isNotEmpty ? _subjects.first['id'].toString() : '');
    String teacherId = hw?['teacher']?['id']?.toString() ??
        (_teachers.isNotEmpty ? _teachers.first['id'].toString() : '');
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
                        hw != null ? 'تعديل واجب' : 'إضافة واجب جديد',
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
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'عنوان الواجب *'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'تفاصيل الواجب'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _classes.any((c) => c['id'].toString() == classId)
                      ? classId
                      : null,
                  decoration: const InputDecoration(labelText: 'الفصل الدراسي'),
                  items: _classes
                      .map((c) => DropdownMenuItem(
                            value: c['id'].toString(),
                            child: Text(
                                '${c['name'] ?? ''} - ${c['section'] ?? ''}'),
                          ))
                      .toList(),
                  onChanged: (v) => setModalState(() => classId = v ?? ''),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _subjects.any((s) => s['id'].toString() == subjectId)
                      ? subjectId
                      : null,
                  decoration: const InputDecoration(labelText: 'المادة الدراسية'),
                  items: _subjects
                      .map((s) => DropdownMenuItem(
                            value: s['id'].toString(),
                            child: Text(s['name']?.toString() ?? ''),
                          ))
                      .toList(),
                  onChanged: (v) => setModalState(() => subjectId = v ?? ''),
                ),
                if (_teachers.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value:
                        _teachers.any((t) => t['id'].toString() == teacherId)
                            ? teacherId
                            : null,
                    decoration: const InputDecoration(labelText: 'المعلم'),
                    items: _teachers.map((t) {
                      final u = t['user'] ?? {};
                      return DropdownMenuItem(
                        value: t['id'].toString(),
                        child: Text(
                            '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                                .trim()),
                      );
                    }).toList(),
                    onChanged: (v) => setModalState(() => teacherId = v ?? ''),
                  ),
                ],
                const SizedBox(height: 10),
                TextField(
                  controller: dueCtrl,
                  decoration: const InputDecoration(
                      labelText: 'تاريخ التسليم (YYYY-MM-DD)'),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (titleCtrl.text.trim().isEmpty) {
                            showErpToast(context, 'يرجى إدخال عنوان الواجب',
                                isWarning: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = {
                            'title': titleCtrl.text.trim(),
                            'description': descCtrl.text.trim(),
                            'dueDate': dueCtrl.text.trim().isNotEmpty
                                ? '${dueCtrl.text.trim()}T12:00:00.000Z'
                                : null,
                            'classId':
                                classId.isNotEmpty ? int.parse(classId) : null,
                            'subjectId': subjectId.isNotEmpty
                                ? int.parse(subjectId)
                                : null,
                            'teacherId': teacherId.isNotEmpty
                                ? int.parse(teacherId)
                                : null,
                          };
                          final res = hw != null
                              ? await ApiService.put(
                                  '/homework/${hw['id']}', payload)
                              : await ApiService.post('/homework', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) showErpToast(context, 'تم حفظ الواجب بنجاح');
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ الواجب'),
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
      currentRoute: ErpRoute.homework,
      onRefresh: _loadAll,
      floatingActionButton: _isStaff
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('إضافة واجب',
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
                    title: _isStaff ? 'إدارة الواجبات' : 'الواجبات المدرسية',
                    subtitle: _isStaff
                        ? 'إجمالي الواجبات: ${_items.length}'
                        : 'الواجبات المطلوبة لفصول أبنائك (${_items.length})',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث بعنوان الواجب أو المادة...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  if (_isStaff && _classes.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _chip('الكل', ''),
                          ..._classes.map((c) => _chip(
                              '${c['name'] ?? ''} ${c['section'] ?? ''}'.trim(),
                              c['id'].toString())),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.description_outlined,
                      message: 'لا توجد واجبات مسجلة حالياً',
                    )
                  else
                    ...list.map((h) {
                      final sc = h['schoolClass'];
                      final className = sc != null
                          ? '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'
                          : 'عام';
                      final subName = h['subject']?['name']?.toString() ?? 'مادة';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      h['title']?.toString() ?? 'واجب',
                                      style: const TextStyle(
                                          fontSize: 15.5,
                                          fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  ErpBadge(label: subName),
                                ],
                              ),
                              if ((h['description'] ?? '')
                                  .toString()
                                  .isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  h['description'].toString(),
                                  style: const TextStyle(
                                      fontSize: 13,
                                      color: ErpColors.textSecondary,
                                      height: 1.45),
                                ),
                              ],
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  ErpBadge(
                                      label: 'الفصل: $className',
                                      tone: ErpBadgeTone.info),
                                  ErpBadge(
                                      label:
                                          'التسليم: ${formatDateShort(h['dueDate'])}',
                                      tone: ErpBadgeTone.warning),
                                ],
                              ),
                              if (_isStaff) ...[
                                const Divider(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => _openFormModal(h),
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 16),
                                      label: const Text('تعديل'),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                          foregroundColor: ErpColors.danger),
                                      onPressed: () => _deleteHomework(h),
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

  Widget _chip(String label, String id) {
    final active = _classFilterId == id;
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
        onSelected: (_) => setState(() => _classFilterId = id),
      ),
    );
  }
}

