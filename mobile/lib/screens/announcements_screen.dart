import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _classes = [];
  String _search = '';
  String _role = 'PARENT';
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
    _role = session['role'] ?? 'PARENT';

    final results = await Future.wait([
      ApiService.getAnnouncementsForRole(_role),
      ApiService.isStaffRole(_role)
          ? ApiService.getList('/classes')
          : Future.value(<dynamic>[]),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _classes = results[1];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((a) {
      final title = (a['title'] ?? '').toString().toLowerCase();
      final content = (a['content'] ?? '').toString().toLowerCase();
      return title.contains(q) || content.contains(q);
    }).toList();
  }

  Future<void> _deleteAnnouncement(dynamic a) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف إعلان',
      message: 'هل أنت متأكد من حذف الإعلان "${a['title']}"؟',
      confirmText: 'حذف الإعلان',
    );
    if (!ok) return;

    final res = await ApiService.delete('/announcements/${a['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == a['id']));
      showErpToast(context, 'تم حذف الإعلان بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openFormModal([dynamic ann]) async {
    final titleCtrl =
        TextEditingController(text: ann?['title']?.toString() ?? '');
    final contentCtrl =
        TextEditingController(text: ann?['content']?.toString() ?? '');
    String targetRole = ann?['targetRole']?.toString() ?? 'ALL';
    String targetClassId = ann?['targetClass']?['id']?.toString() ?? '';
    bool saving = false;

    const roles = {
      'ALL': 'الجميع',
      'PARENT': 'أولياء الأمور',
      'TEACHER': 'المعلمون',
      'STUDENT': 'الطلاب',
    };
    if (!roles.containsKey(targetRole)) targetRole = 'ALL';

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
                        ann != null ? 'تعديل إعلان' : 'نشر إعلان جديد',
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
                  decoration:
                      const InputDecoration(labelText: 'عنوان الإعلان *'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: contentCtrl,
                  maxLines: 4,
                  decoration:
                      const InputDecoration(labelText: 'محتوى الإعلان *'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: targetRole,
                  decoration:
                      const InputDecoration(labelText: 'الفئة المستهدفة'),
                  items: roles.entries
                      .map((e) =>
                          DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) =>
                      setModalState(() => targetRole = v ?? 'ALL'),
                ),
                if (_classes.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: targetClassId,
                    decoration:
                        const InputDecoration(labelText: 'فصل محدد (اختياري)'),
                    items: [
                      const DropdownMenuItem(
                          value: '', child: Text('عام لجميع الفصول')),
                      ..._classes.map((c) => DropdownMenuItem(
                            value: c['id'].toString(),
                            child: Text(
                                '${c['name'] ?? ''} - ${c['section'] ?? ''}'),
                          )),
                    ],
                    onChanged: (v) =>
                        setModalState(() => targetClassId = v ?? ''),
                  ),
                ],
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: ErpColors.primaryLight,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ErpColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.notifications_active_outlined, size: 18, color: ErpColors.primary),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'سيتم إرسال هذا الإعلان تلقائياً كإشعار فوري (Push Notification) لهواتف الفئة المحددة.',
                          style: TextStyle(fontSize: 11.5, color: ErpColors.primary, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (titleCtrl.text.trim().isEmpty ||
                              contentCtrl.text.trim().isEmpty) {
                            showErpToast(
                                context, 'يرجى إدخال العنوان والمحتوى',
                                isWarning: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = {
                            'title': titleCtrl.text.trim(),
                            'content': contentCtrl.text.trim(),
                            'targetRole': targetRole,
                            'targetClass': targetClassId.isNotEmpty
                                ? {'id': int.parse(targetClassId)}
                                : null,
                          };
                          final res = ann != null
                              ? await ApiService.put(
                                  '/announcements/${ann['id']}', payload)
                              : await ApiService.post('/announcements', payload);
                          if (!ctx.mounted) return;
                          setModalState(() => saving = false);
                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) showErpToast(context, 'تم حفظ الإعلان وإرسال الإشعار بنجاح 🚀');
                            _loadAll();
                          } else {
                            if (mounted) showErpToast(context, res.message, isError: true);
                          }
                        },
                  child: Text(saving ? 'جاري النشر...' : 'حفظ ونشر الإعلان وإرسال الإشعار 🚀'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _roleTargetLabel(dynamic roleVal) {
    switch (roleVal?.toString()) {
      case 'PARENT':
        return 'أولياء الأمور';
      case 'TEACHER':
        return 'المعلمون';
      case 'STUDENT':
        return 'الطلاب';
      default:
        return 'الجميع';
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return ErpShell(
      currentRoute: ErpRoute.announcements,
      onRefresh: _loadAll,
      floatingActionButton: _isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: ErpColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => _openFormModal(),
              icon: const Icon(Icons.add),
              label: const Text('نشر إعلان',
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
                    title: 'إعلانات المدرسة',
                    subtitle: 'التعاميم والأخبار (${_items.length})',
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث في الإعلانات...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 14),
                  if (list.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.campaign_outlined,
                      message: 'لا توجد إعلانات حالياً',
                    )
                  else
                    ...list.map((a) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: ErpColors.primary,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.campaign_outlined,
                                        color: Colors.white),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          a['title']?.toString() ?? 'إعلان',
                                          style: const TextStyle(
                                              fontSize: 15.5,
                                              fontWeight: FontWeight.w800),
                                        ),
                                        const SizedBox(height: 4),
                                        Wrap(
                                          spacing: 6,
                                          children: [
                                            ErpBadge(
                                                label: _roleTargetLabel(
                                                    a['targetRole']),
                                                tone: ErpBadgeTone.info),
                                            if (a['datePosted'] != null)
                                              ErpBadge(
                                                  label: formatDateShort(
                                                      a['datePosted'])),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                a['content']?.toString() ?? '',
                                style: const TextStyle(
                                    fontSize: 13.5,
                                    color: ErpColors.textSecondary,
                                    height: 1.55),
                              ),
                              if (_isAdmin) ...[
                                const Divider(height: 18),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => _openFormModal(a),
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 16),
                                      label: const Text('تعديل'),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                          foregroundColor: ErpColors.danger),
                                      onPressed: () => _deleteAnnouncement(a),
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
