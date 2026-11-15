import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final _searchCtrl = TextEditingController();
  List<dynamic> _students = [];
  List<dynamic> _classes = [];
  bool _loading = true;

  String _academicYear = '2025-2026';
  String _selectedClassId = '';
  String _statusFilter = 'ALL';
  String _search = '';

  static const List<String> kAcademicYears = [
    '2026-2027',
    '2025-2026',
    '2024-2025',
  ];

  static const Map<String, String> kMonths = {
    'سبتمبر': 'سبتمبر (09)',
    'أكتوبر': 'أكتوبر (10)',
    'نوفمبر': 'نوفمبر (11)',
    'ديسمبر': 'ديسمبر (12)',
    'جانفي': 'جانفي (01)',
    'فيفري': 'فيفري (02)',
    'مارس': 'مارس (03)',
    'أفريل': 'أفريل (04)',
    'ماي': 'ماي (05)',
    'جوان': 'جوان (06)',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      ApiService.getList('/students'),
      ApiService.getList('/classes'),
    ]);
    if (!mounted) return;
    setState(() {
      _students = results[0];
      _classes = results[1];
      _loading = false;
    });
  }

  List<dynamic> get _filteredStudents {
    return _students.where((s) {
      final user = s['user'] ?? {};
      final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
      final code = (s['studentCode'] ?? '').toString().toLowerCase();
      final matchesSearch = _search.isEmpty || name.contains(_search.toLowerCase()) || code.contains(_search.toLowerCase());

      final classObj = s['schoolClass'] ?? {};
      final matchesClass = _selectedClassId.isEmpty || classObj['id']?.toString() == _selectedClassId;

      final tuition = s['tuition'] ?? {};
      final status = tuition['yearStatus'] ?? 'UNPAID';
      final matchesStatus = _statusFilter == 'ALL' || status == _statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    }).toList();
  }

  Map<String, dynamic> _calcStats() {
    double totalExpected = 0;
    double totalCollected = 0;
    double totalMissing = 0;
    int paidCount = 0;
    int partialCount = 0;
    int unpaidCount = 0;

    for (final s in _students) {
      final classObj = s['schoolClass'] ?? {};
      final tuition = s['tuition'] ?? {};
      final fee = (tuition['annualFee'] ?? classObj['annualFee'] ?? 1200.0).toDouble();
      final paid = (tuition['totalPaid'] ?? 0.0).toDouble();
      final missing = (tuition['missingAmount'] ?? (fee - paid > 0 ? fee - paid : 0.0)).toDouble();

      totalExpected += fee;
      totalCollected += paid;
      totalMissing += missing;

      final status = tuition['yearStatus'] ?? 'UNPAID';
      if (status == 'PAID') {
        paidCount++;
      } else if (status == 'PARTIAL') {
        partialCount++;
      } else {
        unpaidCount++;
      }
    }

    return {
      'expected': totalExpected,
      'collected': totalCollected,
      'missing': totalMissing,
      'paid': paidCount,
      'partial': partialCount,
      'unpaid': unpaidCount,
    };
  }

  Future<void> _handleQuickStatus(dynamic student, String targetStatus) async {
    final user = student['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final isPaid = targetStatus == 'PAID';

    final confirmed = await showErpConfirmDialog(
      context,
      title: isPaid ? '⚡ خلاص السنة بالكامل' : 'تغيير الحالة إلى غير خالص',
      message: isPaid
          ? 'هل تريد تأكيد خلاص كامل الرسوم السنوية للطالب "$name" وتسوية الرصيد المتبقي كخالص؟'
          : 'هل تريد إلغاء حالة الخلاص وتعيين الطالب "$name" كغير مسدد؟',
      confirmText: isPaid ? 'نعم، تأكيد الخلاص' : 'تعيين غير خالص',
    );
    if (!confirmed) return;

    final res = await ApiService.quickSettleTuition(
      student['id'],
      academicYear: _academicYear,
      status: targetStatus,
    );

    if (!mounted) return;
    if (res.success) {
      showErpToast(context, isPaid ? 'تم تسجيل خلاص السنة بالكامل بنجاح 🎉' : 'تم تحديث الحالة إلى غير خالص');
      _loadData();
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  void _openPaymentModal(dynamic student) {
    final user = student['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final classObj = student['schoolClass'] ?? {};
    final className = classObj['name'] ?? 'غير مسكن';

    String month = 'سبتمبر';
    final amountCtrl = TextEditingController(text: '120.0');
    final dateCtrl = TextEditingController(text: DateTime.now().toIso8601String().substring(0, 10));
    String method = 'نقداً (Cash)';
    final receiptCtrl = TextEditingController(text: 'REC-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}');
    String status = 'PAID';
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
                        'تسجيل دفعة قسط دراسي',
                        style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w900),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: ErpColors.bgBase,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: ErpColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.person_outline, size: 20, color: ErpColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '$name | الفصل: $className',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: month,
                  decoration: const InputDecoration(labelText: 'الشهر الدراسي المستهدف *'),
                  items: kMonths.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setModalState(() => month = v ?? 'سبتمبر'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'المبلغ المدفوع (دينار تونسي TND) *',
                    suffixText: 'د.ت',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: dateCtrl,
                  decoration: const InputDecoration(
                    labelText: 'تاريخ السداد (YYYY-MM-DD) *',
                    suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: method,
                  decoration: const InputDecoration(labelText: 'طريقة الدفع *'),
                  items: const [
                    DropdownMenuItem(value: 'نقداً (Cash)', child: Text('نقداً (Cash)')),
                    DropdownMenuItem(value: 'شيك بنكي (Chèque)', child: Text('شيك بنكي (Chèque)')),
                    DropdownMenuItem(value: 'تحويل بنكي (Virement)', child: Text('تحويل بنكي (Virement)')),
                    DropdownMenuItem(value: 'بطاقة بنكية (Carte)', child: Text('بطاقة بنكية (Carte)')),
                  ],
                  onChanged: (v) => setModalState(() => method = v ?? 'نقداً (Cash)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: receiptCtrl,
                  decoration: const InputDecoration(
                    labelText: 'رقم الوصل / الإيصال',
                    hintText: 'مثال: REC-00123',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: status,
                  decoration: const InputDecoration(labelText: 'حالة الدفعة الشهرية *'),
                  items: const [
                    DropdownMenuItem(value: 'PAID', child: Text('خالص بالكامل (Paid)')),
                    DropdownMenuItem(value: 'PARTIAL', child: Text('تسديد جزئي (Partial)')),
                    DropdownMenuItem(value: 'UNPAID', child: Text('غير مسدد (Unpaid)')),
                  ],
                  onChanged: (v) => setModalState(() => status = v ?? 'PAID'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات إضافية',
                    hintText: 'أي توضيحات أو تفاصيل خاصة بالدفعة...',
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          final amount = double.tryParse(amountCtrl.text.trim()) ?? 0;
                          if (amount <= 0) {
                            showErpToast(context, 'الرجاء إدخال مبلغ صحيح', isError: true);
                            return;
                          }
                          setModalState(() => saving = true);
                          final payload = {
                            'studentId': student['id'],
                            'student': {'id': student['id']},
                            'academicYear': _academicYear,
                            'month': month,
                            'amount': amount,
                            'paymentDate': dateCtrl.text.trim(),
                            'paymentMethod': method,
                            'receiptNumber': receiptCtrl.text.trim(),
                            'status': status,
                            'notes': notesCtrl.text.trim(),
                          };
                          final res = await ApiService.recordPayment(payload);
                          setModalState(() => saving = false);
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (!mounted) return;
                          if (res.success) {
                            showErpToast(context, 'تم تسجيل الدفعة وتحديث الرصيد بنجاح 🎉');
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
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('حفظ الدفعة وتحديث الرصيد', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openSummaryModal(dynamic student) async {
    final user = student['user'] ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ErpColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => FutureBuilder<Map<String, dynamic>?>(
        future: ApiService.getStudentTuitionSummary(student['id'], academicYear: _academicYear),
        builder: (ctx, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final data = snapshot.data;
          if (data == null) {
            return const Padding(
              padding: EdgeInsets.all(30),
              child: Center(child: Text('تعذر تحميل كشف حساب الطالب')),
            );
          }

          final annualFee = (data['annualFee'] ?? 1200.0).toDouble();
          final totalPaid = (data['totalPaid'] ?? 0.0).toDouble();
          final missing = (data['missingAmount'] ?? 0.0).toDouble();
          final breakdown = (data['monthlyBreakdown'] as List<dynamic>?) ?? [];
          final payments = (data['paymentsList'] as List<dynamic>?) ?? [];

          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.75,
            maxChildSize: 0.95,
            minChildSize: 0.5,
            builder: (ctx, scrollCtrl) => SingleChildScrollView(
              controller: scrollCtrl,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'كشف الرسوم: $name',
                          style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w900),
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
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ErpColors.bgBase,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: ErpColors.border),
                          ),
                          child: Column(
                            children: [
                              const Text('الرسوم السنوية', style: TextStyle(fontSize: 11, color: ErpColors.textMuted)),
                              const SizedBox(height: 4),
                              Text('$annualFee د.ت', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Column(
                            children: [
                              const Text('المحصل', style: TextStyle(fontSize: 11, color: Color(0xFF065F46))),
                              const SizedBox(height: 4),
                              Text('$totalPaid د.ت', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF047857))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Column(
                            children: [
                              const Text('المتبقي', style: TextStyle(fontSize: 11, color: Color(0xFF991B1B))),
                              const SizedBox(height: 4),
                              Text('$missing د.ت', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFFDC2626))),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Text('جدول الأشهر الدراسية (سبتمبر - جوان)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 8),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: breakdown.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (ctx, idx) {
                      final m = breakdown[idx];
                      final isPaid = m['status'] == 'PAID' || m['paidAmount'] >= m['expectedFee'];
                      final isPartial = m['status'] == 'PARTIAL' || (m['paidAmount'] > 0 && !isPaid);
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          radius: 12,
                          backgroundColor: isPaid
                              ? const Color(0xFFD1FAE5)
                              : isPartial
                                  ? const Color(0xFFFEF3C7)
                                  : const Color(0xFFFEE2E2),
                          child: Icon(
                            isPaid
                                ? Icons.check
                                : isPartial
                                    ? Icons.timelapse
                                    : Icons.close,
                            size: 14,
                            color: isPaid
                                ? const Color(0xFF059669)
                                : isPartial
                                    ? const Color(0xFFD97706)
                                    : const Color(0xFFDC2626),
                          ),
                        ),
                        title: Text(m['month'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                        subtitle: Text('المقدر: ${m['expectedFee']} د.ت'),
                        trailing: Text(
                          '${m['paidAmount']} د.ت',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: isPaid ? const Color(0xFF059669) : ErpColors.textMain,
                          ),
                        ),
                      );
                    },
                  ),
                  if (payments.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    const Text('سجل الدفعات والإيصالات المسجلة', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: payments.length,
                      itemBuilder: (ctx, idx) {
                        final p = payments[idx];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: ErpColors.bgBase,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: ErpColors.border),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.receipt_long_outlined, size: 20, color: ErpColors.primary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${p['receiptNumber'] ?? 'REC'} — ${p['month'] ?? ''}',
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
                                    ),
                                    Text(
                                      '${p['paymentDate'] ?? ''} | ${p['paymentMethod'] ?? ''}',
                                      style: const TextStyle(fontSize: 11, color: ErpColors.textMuted),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '${p['amount']} د.ت',
                                style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669), fontSize: 14),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stats = _calcStats();
    final filtered = _filteredStudents;

    return ErpShell(
      currentRoute: ErpRoute.payments,
      onRefresh: _loadData,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const ErpPageHeader(
                    title: 'أقساط ورسوم الطلاب',
                    subtitle: 'متابعة الرسوم الدراسية السنوية والشهرية وتسجيل الدفعات',
                  ),
                  const SizedBox(height: 12),

                  // KPI Summary Cards
                  Row(
                    children: [
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('إجمالي الرسوم', style: TextStyle(fontSize: 11, color: ErpColors.textMuted)),
                              const SizedBox(height: 4),
                              Text('${stats['expected']} د.ت', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('المحصل', style: TextStyle(fontSize: 11, color: Color(0xFF059669))),
                              const SizedBox(height: 4),
                              Text('${stats['collected']} د.ت', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ErpCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('المتبقي', style: TextStyle(fontSize: 11, color: Color(0xFFDC2626))),
                              const SizedBox(height: 4),
                              Text('${stats['missing']} د.ت', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFFDC2626))),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Filter Bar
                  ErpCard(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        TextField(
                          controller: _searchCtrl,
                          decoration: InputDecoration(
                            hintText: 'البحث باسم الطالب أو رقم القيد...',
                            prefixIcon: const Icon(Icons.search, size: 20),
                            suffixIcon: _search.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 18),
                                    onPressed: () {
                                      _searchCtrl.clear();
                                      setState(() => _search = '');
                                    },
                                  )
                                : null,
                          ),
                          onChanged: (v) => setState(() => _search = v.trim()),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _academicYear,
                                decoration: const InputDecoration(labelText: 'السنة الدراسية'),
                                items: kAcademicYears
                                    .map((y) => DropdownMenuItem(value: y, child: Text(y, style: const TextStyle(fontSize: 12.5))))
                                    .toList(),
                                onChanged: (v) => setState(() => _academicYear = v ?? '2025-2026'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _selectedClassId,
                                decoration: const InputDecoration(labelText: 'الفصل'),
                                items: [
                                  const DropdownMenuItem(value: '', child: Text('جميع الفصول', style: TextStyle(fontSize: 12.5))),
                                  ..._classes.map((c) => DropdownMenuItem(
                                        value: c['id'].toString(),
                                        child: Text(c['name'] ?? '', style: const TextStyle(fontSize: 12.5)),
                                      )),
                                ],
                                onChanged: (v) => setState(() => _selectedClassId = v ?? ''),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _buildStatusChip('ALL', 'الكل (${_students.length})'),
                              _buildStatusChip('PAID', 'خالص بالكامل (${stats['paid']})'),
                              _buildStatusChip('PARTIAL', 'دفع جزئي (${stats['partial']})'),
                              _buildStatusChip('UNPAID', 'غير خالص (${stats['unpaid']})'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Student Tuition List
                  if (filtered.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(child: Text('لا توجد سجلات مطابقة للبحث', style: TextStyle(color: ErpColors.textMuted))),
                    )
                  else
                    ...filtered.map((s) {
                      final user = s['user'] ?? {};
                      final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
                      final classObj = s['schoolClass'] ?? {};
                      final className = classObj['name'] ?? 'غير معين';
                      final tuition = s['tuition'] ?? {};
                      final fee = (tuition['annualFee'] ?? classObj['annualFee'] ?? 1200.0).toDouble();
                      final paid = (tuition['totalPaid'] ?? 0.0).toDouble();
                      final missing = (tuition['missingAmount'] ?? (fee - paid > 0 ? fee - paid : 0.0)).toDouble();
                      final yearStatus = tuition['yearStatus'] ?? (paid >= fee ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID');

                      return ErpCard(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5)),
                                      const SizedBox(height: 3),
                                      Text('الفصل: $className | كود: ${s['studentCode'] ?? '—'}', style: const TextStyle(fontSize: 11.5, color: ErpColors.textMuted)),
                                    ],
                                  ),
                                ),
                                _buildYearStatusBadge(yearStatus),
                              ],
                            ),
                            const Divider(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('الرسوم السنوية', style: TextStyle(fontSize: 10.5, color: ErpColors.textMuted)),
                                    Text('$fee د.ت', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    const Text('المسدد', style: TextStyle(fontSize: 10.5, color: Color(0xFF059669))),
                                    Text('$paid د.ت', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF059669), fontSize: 13)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('المتبقي', style: TextStyle(fontSize: 10.5, color: Color(0xFFDC2626))),
                                    Text('$missing د.ت', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFDC2626), fontSize: 13)),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => _openSummaryModal(s),
                                    icon: const Icon(Icons.receipt_long_outlined, size: 16),
                                    label: const Text('كشف الحساب', style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _openPaymentModal(s),
                                    icon: const Icon(Icons.add, size: 16),
                                    label: const Text('تسجيل دفعة', style: TextStyle(fontSize: 12)),
                                    style: ElevatedButton.styleFrom(backgroundColor: ErpColors.primary),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              child: TextButton.icon(
                                onPressed: () => _handleQuickStatus(s, yearStatus == 'PAID' ? 'UNPAID' : 'PAID'),
                                icon: Icon(
                                  yearStatus == 'PAID' ? Icons.undo : Icons.bolt,
                                  size: 16,
                                  color: yearStatus == 'PAID' ? Colors.grey : const Color(0xFF059669),
                                ),
                                label: Text(
                                  yearStatus == 'PAID' ? 'تعيين غير خالص' : '⚡ خلاص كامل للسنة (1-Click)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: yearStatus == 'PAID' ? Colors.grey : const Color(0xFF059669),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  Widget _buildStatusChip(String status, String label) {
    final active = _statusFilter == status;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11.5, color: active ? Colors.white : ErpColors.textMain, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
        selected: active,
        selectedColor: ErpColors.primary,
        onSelected: (_) => setState(() => _statusFilter = status),
      ),
    );
  }

  Widget _buildYearStatusBadge(String status) {
    switch (status) {
      case 'PAID':
        return const ErpBadge(label: 'خالص بالكامل', color: Color(0xFF059669), backgroundColor: Color(0xFFD1FAE5));
      case 'PARTIAL':
        return const ErpBadge(label: 'تسديد جزئي', color: Color(0xFFD97706), backgroundColor: Color(0xFFFEF3C7));
      default:
        return const ErpBadge(label: 'غير مسدد', color: Color(0xFFDC2626), backgroundColor: Color(0xFFFEE2E2));
    }
  }
}
