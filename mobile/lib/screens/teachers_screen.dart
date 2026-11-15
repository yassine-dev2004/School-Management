import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class TeachersScreen extends StatefulWidget {
  const TeachersScreen({super.key});

  @override
  State<TeachersScreen> createState() => _TeachersScreenState();
}

class _TeachersScreenState extends State<TeachersScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _subjects = [];
  String _search = '';
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
      ApiService.getList('/teachers'),
      ApiService.getList('/subjects'),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _subjects = results[1];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((t) {
      final user = t['user'] ?? {};
      final name =
          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
      final qual = (t['qualification'] ?? '').toString().toLowerCase();
      return name.contains(q) || qual.contains(q);
    }).toList();
  }

  Future<void> _deleteTeacher(dynamic t) async {
    final user = t['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف معلم',
      message:
          'هل أنت متأكد من حذف المعلم "$name"؟ سيتم إلغاء تعيينه كمعلم مسؤول من الفصول تلقائياً.',
      confirmText: 'حذف المعلم',
    );
    if (!ok) return;

    final res = await ApiService.delete('/teachers/${t['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == t['id']));
      showErpToast(context, 'تم حذف المعلم بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic teacher]) async {
    final user = teacher?['user'] ?? {};
    final firstCtrl =
        TextEditingController(text: user['firstName']?.toString() ?? '');
    final lastCtrl =
        TextEditingController(text: user['lastName']?.toString() ?? '');
    final usernameCtrl =
        TextEditingController(text: user['username']?.toString() ?? '');
    final emailCtrl =
        TextEditingController(text: user['email']?.toString() ?? '');
    final phoneCtrl =
        TextEditingController(text: user['phone']?.toString() ?? '');
    final passwordCtrl = TextEditingController();
    final qualCtrl =
        TextEditingController(text: teacher?['qualification']?.toString() ?? '');
    final joinCtrl = TextEditingController(
      text: teacher?['joiningDate']?.toString() ??
          DateTime.now().toIso8601String().split('T').first,
    );
    final hourlyRateCtrl = TextEditingController(
      text: teacher?['hourlyRate']?.toString() ?? '25.0',
    );

    final selectedSubjectIds = <int>{};
    if (teacher != null && teacher['subjects'] is List) {
      for (final s in teacher['subjects']) {
        if (s is Map && s['id'] is num) {
          selectedSubjectIds.add((s['id'] as num).toInt());
        }
      }
    }
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
                        teacher != null
                            ? 'تعديل بيانات المعلم'
                            : 'إضافة معلم جديد',
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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: firstCtrl,
                        decoration:
                            const InputDecoration(labelText: 'الاسم الأول *'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: lastCtrl,
                        decoration:
                            const InputDecoration(labelText: 'الاسم الأخير *'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: usernameCtrl,
                        decoration:
                            const InputDecoration(labelText: 'اسم المستخدم'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration:
                            const InputDecoration(labelText: 'رقم الهاتف'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration:
                      const InputDecoration(labelText: 'البريد الإلكتروني'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passwordCtrl,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: teacher != null
                        ? 'كلمة المرور (اختياري)'
                        : 'كلمة المرور',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: qualCtrl,
                        decoration:
                            const InputDecoration(labelText: 'المؤهل العلمي'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: joinCtrl,
                        decoration: const InputDecoration(
                            labelText: 'تاريخ الانضمام (YYYY-MM-DD)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: hourlyRateCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'سعر ساعة التدريس (دينار تونسي TND) *',
                    helperText: 'يُعتمد لاحتساب أجور حصص الأستاذ ومستحقاته',
                  ),
                ),
                if (_subjects.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'المواد المسندة:',
                    style:
                        TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _subjects.map((sub) {
                      final sid = (sub['id'] as num).toInt();
                      final selected = selectedSubjectIds.contains(sid);
                      return FilterChip(
                        label: Text(sub['name']?.toString() ?? ''),
                        selected: selected,
                        selectedColor: ErpColors.primary,
                        checkmarkColor: Colors.white,
                        labelStyle: TextStyle(
                          color:
                              selected ? Colors.white : ErpColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                        onSelected: (v) {
                          setModalState(() {
                            if (v) {
                              selectedSubjectIds.add(sid);
                            } else {
                              selectedSubjectIds.remove(sid);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (firstCtrl.text.trim().isEmpty ||
                              lastCtrl.text.trim().isEmpty) {
                            showErpToast(
                                context, 'يرجى إدخال الاسم الأول والأخير',
                                isWarning: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = <String, dynamic>{
                            'firstName': firstCtrl.text.trim(),
                            'lastName': lastCtrl.text.trim(),
                            if (usernameCtrl.text.trim().isNotEmpty)
                              'username': usernameCtrl.text.trim(),
                            if (emailCtrl.text.trim().isNotEmpty)
                              'email': emailCtrl.text.trim(),
                            if (phoneCtrl.text.trim().isNotEmpty)
                              'phone': phoneCtrl.text.trim(),
                            if (passwordCtrl.text.trim().isNotEmpty)
                              'password': passwordCtrl.text.trim(),
                            'qualification': qualCtrl.text.trim(),
                            'joiningDate': joinCtrl.text.trim(),
                            'hourlyRate': double.tryParse(hourlyRateCtrl.text.trim()) ?? 25.0,
                            'subjectIds': selectedSubjectIds.toList(),
                          };
                          final res = teacher != null
                              ? await ApiService.put(
                                  '/teachers/${teacher['id']}', payload)
                              : await ApiService.post('/teachers', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) {
                              showErpToast(
                                  context,
                                  teacher != null
                                      ? 'تم تحديث بيانات المعلم'
                                      : 'تمت إضافة المعلم بنجاح');
                            }
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ المعلم'),
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
      currentRoute: ErpRoute.teachers,
      onRefresh: _loadAll,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: ErpColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _openFormModal(),
        icon: const Icon(Icons.add),
        label: const Text('إضافة معلم',
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
                    title: 'إدارة المعلمين',
                    subtitle: 'العدد الإجمالي: ${_items.length} معلم',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث عن معلم بالاسم أو المؤهل...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.school_outlined,
                      message: 'لا يوجد معلمون مطابقون للبحث',
                    )
                  else
                    ...list.map((t) {
                      final user = t['user'] ?? {};
                      final name =
                          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'
                              .trim();
                      final subs = (t['subjects'] as List<dynamic>?) ?? [];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: ErpColors.primary,
                                    child: Text(
                                      name.isNotEmpty ? name[0] : 'م',
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          name.isEmpty ? 'معلم' : name,
                                          style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        Text(
                                          (t['qualification'] ?? '')
                                                  .toString()
                                                  .isNotEmpty
                                              ? t['qualification'].toString()
                                              : 'معلم',
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: ErpColors.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              if (subs.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: [
                                    ...subs.map((s) => ErpBadge(
                                        label: s['name']?.toString() ?? '')),
                                    ErpBadge(
                                      label: '${t['hourlyRate'] ?? 25} د.ت/ساعة',
                                      tone: ErpBadgeTone.success,
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 12,
                                children: [
                                  if ((user['phone'] ?? '')
                                      .toString()
                                      .isNotEmpty)
                                    Text('📞 ${user['phone']}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: ErpColors.textSecondary)),
                                  if ((user['email'] ?? '')
                                      .toString()
                                      .isNotEmpty)
                                    Text('✉️ ${user['email']}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: ErpColors.textSecondary)),
                                ],
                              ),
                              const Divider(height: 18),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => _openFormModal(t),
                                    icon: const Icon(Icons.edit_outlined,
                                        size: 16),
                                    label: const Text('تعديل'),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                        foregroundColor: ErpColors.danger),
                                    onPressed: () => _deleteTeacher(t),
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
}

