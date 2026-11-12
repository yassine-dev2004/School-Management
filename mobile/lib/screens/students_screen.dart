import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _parents = [];
  List<dynamic> _classes = [];
  String _search = '';
  String _classFilterId = '';
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
      ApiService.getList('/students'),
      ApiService.getList('/parents'),
      ApiService.getList('/classes'),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _parents = results[1];
      _classes = results[2];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    return _items.where((s) {
      if (_classFilterId.isNotEmpty) {
        final cid = s['schoolClass']?['id']?.toString() ?? '';
        if (cid != _classFilterId) return false;
      }
      if (_search.isEmpty) return true;
      final q = _search.toLowerCase();
      final user = s['user'] ?? {};
      final fullName =
          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
      final uname = (user['username'] ?? '').toString().toLowerCase();
      final email = (user['email'] ?? '').toString().toLowerCase();
      return fullName.contains(q) || uname.contains(q) || email.contains(q);
    }).toList();
  }

  Future<void> _deleteStudent(dynamic s) async {
    final user = s['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف طالب',
      message:
          'هل أنت متأكد من حذف الطالب "$name"؟ سيتم حذف سجلات الحضور والدرجات المرتبطة به.',
      confirmText: 'حذف نهائي',
    );
    if (!ok) return;

    final res = await ApiService.delete('/students/${s['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == s['id']));
      showErpToast(context, 'تم حذف الطالب بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic student]) async {
    final user = student?['user'] ?? {};
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
    final emergencyCtrl = TextEditingController(
        text: student?['emergencyContact']?.toString() ?? '');

    String status = student?['status']?.toString() ?? 'نشط';
    String parentId = student?['parent']?['id']?.toString() ?? '';
    String classId = student?['schoolClass']?['id']?.toString() ?? '';
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
                        student != null
                            ? 'تعديل بيانات الطالب'
                            : 'إضافة طالب جديد',
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
                    labelText: student != null
                        ? 'كلمة المرور (اتركه فارغاً للإبقاء)'
                        : 'كلمة المرور (اختياري)',
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: status,
                  decoration: const InputDecoration(labelText: 'الحالة'),
                  items: const [
                    DropdownMenuItem(value: 'نشط', child: Text('نشط')),
                    DropdownMenuItem(value: 'موقوف', child: Text('موقوف')),
                    DropdownMenuItem(value: 'متخرج', child: Text('متخرج')),
                  ],
                  onChanged: (v) =>
                      setModalState(() => status = v ?? 'نشط'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: classId,
                  decoration:
                      const InputDecoration(labelText: 'الفصل الدراسي'),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('بدون فصل')),
                    ..._classes.map((c) => DropdownMenuItem(
                          value: c['id'].toString(),
                          child: Text(
                              '${c['name'] ?? ''} - ${c['section'] ?? ''}'),
                        )),
                  ],
                  onChanged: (v) => setModalState(() => classId = v ?? ''),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: parentId,
                  decoration: const InputDecoration(labelText: 'ولي الأمر'),
                  items: [
                    const DropdownMenuItem(
                        value: '', child: Text('بدون ولي أمر')),
                    ..._parents.map((p) {
                      final pu = p['user'] ?? {};
                      return DropdownMenuItem(
                        value: p['id'].toString(),
                        child: Text(
                            '${pu['firstName'] ?? ''} ${pu['lastName'] ?? ''}'
                                .trim()),
                      );
                    }),
                  ],
                  onChanged: (v) => setModalState(() => parentId = v ?? ''),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: emergencyCtrl,
                  decoration: const InputDecoration(labelText: 'رقم الطوارئ'),
                ),
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
                            'status': status,
                            'emergencyContact': emergencyCtrl.text.trim(),
                            'parentId':
                                parentId.isNotEmpty ? int.parse(parentId) : null,
                            'classId':
                                classId.isNotEmpty ? int.parse(classId) : null,
                          };
                          final res = student != null
                              ? await ApiService.put(
                                  '/students/${student['id']}', payload)
                              : await ApiService.post('/students', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) {
                              showErpToast(
                                  context,
                                  student != null
                                      ? 'تم تحديث الطالب بنجاح'
                                      : 'تمت إضافة الطالب بنجاح');
                            }
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ البيانات'),
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
      currentRoute: ErpRoute.students,
      onRefresh: _loadAll,
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('إضافة طالب',
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
                    title: 'إدارة الطلاب',
                    subtitle: 'العدد الإجمالي: ${_items.length} طالب',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث بالاسم أو البريد أو اسم المستخدم...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  if (_classes.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _filterChip('الكل', ''),
                          ..._classes.map((c) => _filterChip(
                              '${c['name'] ?? ''} ${c['section'] ?? ''}'.trim(),
                              c['id'].toString())),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.people_outline,
                      message: 'لا يوجد طلاب مطابقون للبحث',
                    )
                  else
                    ...list.map((s) {
                      final user = s['user'] ?? {};
                      final name =
                          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'
                              .trim();
                      final sc = s['schoolClass'];
                      final className = sc != null
                          ? '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'
                          : 'بدون فصل';
                      final parentUser = s['parent']?['user'];
                      final parentName = parentUser != null
                          ? '${parentUser['firstName'] ?? ''} ${parentUser['lastName'] ?? ''}'
                              .trim()
                          : null;
                      final status = s['status']?.toString() ?? 'نشط';

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
                                      name.isNotEmpty ? name[0] : 'ط',
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
                                          name.isEmpty ? 'طالب' : name,
                                          style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        Text(
                                          className,
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: ErpColors.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ErpBadge(
                                    label: status,
                                    tone: status == 'نشط'
                                        ? ErpBadgeTone.success
                                        : ErpBadgeTone.warning,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 12,
                                runSpacing: 4,
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
                                  if (parentName != null &&
                                      parentName.isNotEmpty)
                                    Text('👨‍👩‍👧 ولي الأمر: $parentName',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: ErpColors.textSecondary)),
                                ],
                              ),
                              if (_isAdmin) ...[
                                const Divider(height: 18),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => _openFormModal(s),
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 16),
                                      label: const Text('تعديل'),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: ErpColors.danger,
                                      ),
                                      onPressed: () => _deleteStudent(s),
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

  Widget _filterChip(String label, String id) {
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

