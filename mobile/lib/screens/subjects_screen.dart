import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class SubjectsScreen extends StatefulWidget {
  const SubjectsScreen({super.key});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
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
    final res = await ApiService.getList('/subjects');
    if (!mounted) return;
    setState(() {
      _items = res;
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((s) {
      final name = (s['name'] ?? '').toString().toLowerCase();
      final code = (s['code'] ?? '').toString().toLowerCase();
      return name.contains(q) || code.contains(q);
    }).toList();
  }

  Future<void> _deleteSubject(dynamic s) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف مادة دراسية',
      message: 'هل أنت متأكد من حذف المادة "${s['name']}"؟',
      confirmText: 'حذف المادة',
    );
    if (!ok) return;

    final res = await ApiService.delete('/subjects/${s['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == s['id']));
      showErpToast(context, 'تم حذف المادة بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic subject]) async {
    final nameCtrl =
        TextEditingController(text: subject?['name']?.toString() ?? '');
    final codeCtrl =
        TextEditingController(text: subject?['code']?.toString() ?? '');
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      subject != null
                          ? 'تعديل مادة دراسية'
                          : 'إضافة مادة جديدة',
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
                decoration:
                    const InputDecoration(labelText: 'اسم المادة *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: codeCtrl,
                decoration: const InputDecoration(
                    labelText: 'الرمز الأكاديمي (مثال: MATH101)'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (nameCtrl.text.trim().isEmpty) {
                          showErpToast(context, 'يرجى إدخال اسم المادة',
                              isWarning: true);
                          return;
                        }
                        setModalState(() => saving = true);
                        final payload = {
                          'name': nameCtrl.text.trim(),
                          'code': codeCtrl.text.trim().toUpperCase(),
                        };
                        final res = subject != null
                            ? await ApiService.put(
                                '/subjects/${subject['id']}', payload)
                            : await ApiService.post('/subjects', payload);
                        if (!ctx.mounted) return;
                        setModalState(() => saving = false);
                        if (res.success) {
                          Navigator.pop(ctx);
                          if (mounted) {
                            showErpToast(
                                context,
                                subject != null
                                    ? 'تم تحديث المادة بنجاح'
                                    : 'تمت إضافة المادة بنجاح');
                          }
                          _loadAll();
                        } else {
                          if (mounted) showErpToast(context, res.message, isError: true);
                        }
                      },
                child: Text(saving ? 'جاري الحفظ...' : 'حفظ المادة'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return ErpShell(
      currentRoute: ErpRoute.subjects,
      onRefresh: _loadAll,
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('إضافة مادة',
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
                    title: 'المواد الدراسية',
                    subtitle: 'العدد الإجمالي: ${_items.length} مادة',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث باسم المادة أو الرمز...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.menu_book_outlined,
                      message: 'لا توجد مواد دراسية مطابقة',
                    )
                  else
                    ...list.map((s) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: ErpColors.primary,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.menu_book_outlined,
                                    color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s['name']?.toString() ?? '',
                                      style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800),
                                    ),
                                    if ((s['code'] ?? '').toString().isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: ErpBadge(
                                            label: s['code'].toString()),
                                      ),
                                  ],
                                ),
                              ),
                              if (_isAdmin) ...[
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined,
                                      size: 20),
                                  onPressed: () => _openFormModal(s),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      size: 20, color: ErpColors.danger),
                                  onPressed: () => _deleteSubject(s),
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

