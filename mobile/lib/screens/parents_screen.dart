import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class ParentsScreen extends StatefulWidget {
  const ParentsScreen({super.key});

  @override
  State<ParentsScreen> createState() => _ParentsScreenState();
}

class _ParentsScreenState extends State<ParentsScreen> {
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
    final res = await ApiService.getList('/parents');
    if (!mounted) return;
    setState(() {
      _items = res;
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((p) {
      final user = p['user'] ?? {};
      final name =
          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
      final phone = (user['phone'] ?? '').toString().toLowerCase();
      final occ = (p['occupation'] ?? '').toString().toLowerCase();
      return name.contains(q) || phone.contains(q) || occ.contains(q);
    }).toList();
  }

  Future<void> _deleteParent(dynamic p) async {
    final user = p['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف ولي أمر',
      message:
          'هل أنت متأكد من حذف ولي الأمر "$name"؟ سيتم فك ارتباط الأبناء دون حذفهم.',
      confirmText: 'حذف ولي الأمر',
    );
    if (!ok) return;

    final res = await ApiService.delete('/parents/${p['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == p['id']));
      showErpToast(context, 'تم حذف ولي الأمر بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic parent]) async {
    final user = parent?['user'] ?? {};
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
    final occCtrl =
        TextEditingController(text: parent?['occupation']?.toString() ?? '');
    final addressCtrl =
        TextEditingController(text: parent?['address']?.toString() ?? '');
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
                        parent != null
                            ? 'تعديل بيانات ولي الأمر'
                            : 'إضافة ولي أمر جديد',
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
                    labelText: parent != null
                        ? 'كلمة المرور (اختياري)'
                        : 'كلمة المرور',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: occCtrl,
                  decoration: const InputDecoration(labelText: 'المهنة'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: addressCtrl,
                  decoration: const InputDecoration(labelText: 'العنوان'),
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
                            'occupation': occCtrl.text.trim(),
                            'address': addressCtrl.text.trim(),
                          };
                          final res = parent != null
                              ? await ApiService.put(
                                  '/parents/${parent['id']}', payload)
                              : await ApiService.post('/parents', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) {
                              showErpToast(
                                  context,
                                  parent != null
                                      ? 'تم تحديث بيانات ولي الأمر'
                                      : 'تمت إضافة ولي الأمر بنجاح');
                            }
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري الحفظ...' : 'حفظ ولي الأمر'),
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
      currentRoute: ErpRoute.parents,
      onRefresh: _loadAll,
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('إضافة ولي أمر',
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
                    title: 'إدارة أولياء الأمور',
                    subtitle: 'العدد الإجمالي: ${_items.length} ولي أمر',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث بالاسم أو رقم الهاتف أو المهنة...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.family_restroom_outlined,
                      message: 'لا يوجد أولياء أمور مطابقون للبحث',
                    )
                  else
                    ...list.map((p) {
                      final user = p['user'] ?? {};
                      final name =
                          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'
                              .trim();
                      final childrenCount =
                          (p['children'] as List<dynamic>?)?.length ?? 0;

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
                                      name.isNotEmpty ? name[0] : 'و',
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
                                          name.isEmpty ? 'ولي أمر' : name,
                                          style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        if ((p['occupation'] ?? '')
                                            .toString()
                                            .isNotEmpty)
                                          Text(
                                            p['occupation'].toString(),
                                            style: const TextStyle(
                                                fontSize: 12.5,
                                                color: ErpColors.textMuted),
                                          ),
                                      ],
                                    ),
                                  ),
                                  ErpBadge(
                                    label: '$childrenCount أبناء',
                                    tone: ErpBadgeTone.info,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
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
                                  if ((p['address'] ?? '')
                                      .toString()
                                      .isNotEmpty)
                                    Text('📍 ${p['address']}',
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
                                      onPressed: () => _openFormModal(p),
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 16),
                                      label: const Text('تعديل'),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                          foregroundColor: ErpColors.danger),
                                      onPressed: () => _deleteParent(p),
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

