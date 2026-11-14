import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _items = [];
  List<dynamic> _students = [];
  List<dynamic> _classes = [];
  String _search = '';
  String _classFilterId = '';
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
      ApiService.getList('/attendance'),
      ApiService.getList('/students'),
      ApiService.getList('/classes'),
    ]);
    if (!mounted) return;
    setState(() {
      _items = results[0];
      _students = results[1];
      _classes = results[2];
      _loading = false;
    });
  }

  List<dynamic> get _filtered {
    return _items.where((a) {
      if (_classFilterId.isNotEmpty) {
        final cid = a['student']?['schoolClass']?['id']?.toString() ?? '';
        if (cid != _classFilterId) return false;
      }
      if (_search.isEmpty) return true;
      final q = _search.toLowerCase();
      final user = a['student']?['user'] ?? {};
      final name =
          '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
      final status = (a['status'] ?? '').toString().toLowerCase();
      return name.contains(q) || status.contains(q);
    }).toList();
  }

  ErpBadgeTone _statusTone(String status) {
    final s = status.toLowerCase();
    if (s == 'حاضر' || s == 'present') return ErpBadgeTone.success;
    if (s == 'غائب' || s == 'absent') return ErpBadgeTone.danger;
    if (s == 'متأخر' || s == 'late') return ErpBadgeTone.warning;
    return ErpBadgeTone.neutral;
  }

  Future<void> _deleteAttendance(dynamic a) async {
    final user = a['student']?['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف سجل حضور',
      message:
          'هل أنت متأكد من حذف سجل حضور "$name" بتاريخ ${formatDateShort(a['date'])}؟',
      confirmText: 'حذف السجل',
    );
    if (!ok) return;

    final res = await ApiService.delete('/attendance/${a['id']}');
    if (!mounted) return;
    if (res.success) {
      setState(() => _items.removeWhere((i) => i['id'] == a['id']));
      showErpToast(context, 'تم حذف السجل بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _openSingleModal([dynamic att]) async {
    String studentId = att?['student']?['id']?.toString() ??
        (_students.isNotEmpty ? _students.first['id'].toString() : '');
    String status = att?['status']?.toString() ?? 'حاضر';
    final dateCtrl = TextEditingController(
      text: att?['date'] != null
          ? formatDateShort(att['date'])
          : DateTime.now().toIso8601String().split('T').first,
    );
    final remarksCtrl = TextEditingController(
      text: att?['remarks']?.toString() ?? '',
    );
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
                      att != null ? 'تعديل سجل الحضور' : 'تسجيل حضور طالب',
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
                        '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim()),
                  );
                }).toList(),
                onChanged: (v) => setModalState(() => studentId = v ?? ''),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: ['حاضر', 'غائب', 'متأخر'].contains(status)
                    ? status
                    : 'حاضر',
                decoration: const InputDecoration(labelText: 'الحالة'),
                items: const [
                  DropdownMenuItem(value: 'حاضر', child: Text('حاضر (Présent)')),
                  DropdownMenuItem(value: 'غائب', child: Text('غائب (Absent)')),
                  DropdownMenuItem(value: 'متأخر', child: Text('متأخر (En retard)')),
                ],
                onChanged: (v) => setModalState(() => status = v ?? 'حاضر'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: dateCtrl,
                decoration:
                    const InputDecoration(labelText: 'التاريخ (YYYY-MM-DD)'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: remarksCtrl,
                decoration:
                    const InputDecoration(labelText: 'سبب الغياب / التأخير أو ملاحظات'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (studentId.isEmpty) {
                          showErpToast(context, 'يرجى اختيار الطالب',
                              isWarning: true);
                          return;
                        }
                        setModalState(() => saving = true);
                        final payload = {
                          'student': {'id': int.parse(studentId)},
                          'status': status,
                          'date': dateCtrl.text.trim(),
                          'remarks': remarksCtrl.text.trim(),
                        };
                        final res = att != null
                            ? await ApiService.put(
                                '/attendance/${att['id']}', payload)
                            : await ApiService.post('/attendance', payload);
                        if (!ctx.mounted) return;
                        setModalState(() => saving = false);
                        if (res.success) {
                          Navigator.pop(ctx);
                          if (mounted) showErpToast(context, 'تم حفظ سجل الحضور بنجاح');
                          _loadAll();
                        } else {
                          if (mounted) showErpToast(context, res.message, isError: true);
                        }
                      },
                child: Text(saving ? 'جاري الحفظ...' : 'حفظ الحضور'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openBulkModal() async {
    if (_classes.isEmpty) {
      showErpToast(context, 'لا توجد فصول دراسية متاحة', isWarning: true);
      return;
    }
    String selectedClassId = _classes.first['id'].toString();
    final dateCtrl = TextEditingController(
      text: DateTime.now().toIso8601String().split('T').first,
    );

    List<Map<String, dynamic>> buildBulkForClass(String cid) {
      return _students
          .where((s) => s['schoolClass']?['id']?.toString() == cid)
          .map((s) {
        final u = s['user'] ?? {};
        return {
          'studentId': s['id'],
          'name': '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim(),
          'status': 'حاضر',
        };
      }).toList();
    }

    List<Map<String, dynamic>> bulkRows = buildBulkForClass(selectedClassId);
    bool saving = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ErpColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.85,
          ),
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
                  const Expanded(
                    child: Text(
                      'تحضير جماعي للفصل',
                      style:
                          TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: selectedClassId,
                      decoration: const InputDecoration(labelText: 'الفصل'),
                      items: _classes
                          .map((c) => DropdownMenuItem(
                                value: c['id'].toString(),
                                child: Text(
                                    '${c['name'] ?? ''} - ${c['section'] ?? ''}'),
                              ))
                          .toList(),
                      onChanged: (v) {
                        if (v == null) return;
                        setModalState(() {
                          selectedClassId = v;
                          bulkRows = buildBulkForClass(v);
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: dateCtrl,
                      decoration: const InputDecoration(labelText: 'التاريخ'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setModalState(() {
                        for (final r in bulkRows) {
                          r['status'] = 'حاضر';
                        }
                      }),
                      child: const Text('تحديد الكل حاضر'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setModalState(() {
                        for (final r in bulkRows) {
                          r['status'] = 'غائب';
                        }
                      }),
                      child: const Text('تحديد الكل غائب'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Flexible(
                child: bulkRows.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text('لا يوجد طلاب في هذا الفصل',
                              style: TextStyle(color: ErpColors.textMuted)),
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: bulkRows.length,
                        itemBuilder: (ctx, i) {
                          final row = bulkRows[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: ErpColors.bgBase,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    row['name'].toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13.5),
                                  ),
                                ),
                                SegmentedButton<String>(
                                  segments: const [
                                    ButtonSegment(
                                        value: 'حاضر', label: Text('حاضر')),
                                    ButtonSegment(
                                        value: 'غائب', label: Text('غائب')),
                                    ButtonSegment(
                                        value: 'متأخر', label: Text('متأخر')),
                                  ],
                                  selected: {row['status'].toString()},
                                  onSelectionChanged: (sel) => setModalState(
                                      () => row['status'] = sel.first),
                                  style: const ButtonStyle(
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: saving || bulkRows.isEmpty
                    ? null
                    : () async {
                        setModalState(() => saving = true);
                        final records = bulkRows
                            .map((r) => {
                                  'student': {'id': r['studentId']},
                                  'status': r['status'],
                                  'date': dateCtrl.text.trim(),
                                })
                            .toList();
                        final res = await ApiService.post(
                            '/attendance/bulk', records);
                        if (!ctx.mounted) return;
                        setModalState(() => saving = false);
                        if (res.success) {
                          Navigator.pop(ctx);
                          if (mounted) {
                            showErpToast(context,
                                'تم تسجيل الحضور الجماعي لـ ${records.length} طالب');
                          }
                          _loadAll();
                        } else {
                          if (mounted) showErpToast(context, res.message, isError: true);
                        }
                      },
                child: Text(
                    saving ? 'جاري الحفظ...' : 'حفظ تحضير الفصل (${bulkRows.length})'),
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
      currentRoute: ErpRoute.attendance,
      onRefresh: _loadAll,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: ErpColors.primary,
        foregroundColor: Colors.white,
        onPressed: _openSingleModal,
        icon: const Icon(Icons.add),
        label: const Text('تسجيل حضور',
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
                    title: 'الحضور والغياب',
                    subtitle: 'إجمالي السجلات: ${_items.length}',
                    actions: [
                      ElevatedButton.icon(
                        onPressed: _openBulkModal,
                        icon: const Icon(Icons.groups_outlined, size: 17),
                        label: const Text('تحضير جماعي'),
                      ),
                    ],
                  ),
                  ErpSearchField(
                    controller: _searchController,
                    hint: 'ابحث باسم الطالب أو الحالة...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  if (_classes.isNotEmpty) ...[
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
                      icon: Icons.fact_check_outlined,
                      message: 'لا توجد سجلات حضور مطابقة',
                    )
                  else
                    ...list.map((a) {
                      final u = a['student']?['user'] ?? {};
                      final name =
                          '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                              .trim();
                      final sc = a['student']?['schoolClass'];
                      final className = sc != null
                          ? '${sc['name'] ?? ''} - ${sc['section'] ?? ''}'
                          : '';
                      final status = a['status']?.toString() ?? '—';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ErpCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name.isEmpty ? 'طالب' : name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14.5),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${formatDateShort(a['date'])}${className.isNotEmpty ? " • $className" : ""}',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: ErpColors.textMuted),
                                    ),
                                    if ((a['remarks'] ?? '')
                                        .toString()
                                        .trim()
                                        .isNotEmpty) ...[
                                      const SizedBox(height: 3),
                                      Text(
                                        'ملاحظة: ${a['remarks']}',
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          color: ErpColors.textSecondary,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              ErpBadge(
                                  label: status, tone: _statusTone(status)),
                              IconButton(
                                icon:
                                    const Icon(Icons.edit_outlined, size: 19),
                                onPressed: () => _openSingleModal(a),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline,
                                    size: 19, color: ErpColors.danger),
                                onPressed: () => _deleteAttendance(a),
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

