import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../navigation/erp_route.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final _picker = ImagePicker();
  List<dynamic> _documents = [];
  List<dynamic> _classes = [];
  bool _loading = true;
  String _search = '';
  String _selectedPurpose = 'ALL';

  static const List<String> purposes = [
    'فرض / امتحان كتابي',
    'مذكرة درس / تحضير بيداغوجي',
    'صورة ورقة إجابة / كشف',
    'شهادة طبية / تبرير غياب',
    'تقرير إداري أو تربوي',
    'أخرى (مستند عام)'
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      ApiService.getDocuments(),
      ApiService.getList('/classes'),
    ]);
    if (!mounted) return;
    setState(() {
      _documents = results[0];
      _classes = results[1];
      _loading = false;
    });
  }

  List<dynamic> get _filteredDocs {
    return _documents.where((d) {
      final title = (d['title'] ?? '').toString().toLowerCase();
      final submitter = (d['submittedByName'] ?? d['submittedBy'] ?? '').toString().toLowerCase();
      final purpose = (d['purpose'] ?? '').toString();
      final matchSearch = _search.isEmpty || title.contains(_search.toLowerCase()) || submitter.contains(_search.toLowerCase());
      final matchPurpose = _selectedPurpose == 'ALL' || purpose == _selectedPurpose;
      return matchSearch && matchPurpose;
    }).toList();
  }

  Future<void> _openUploadModal() async {
    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String purpose = purposes.first;
    String? selectedClassId;
    List<int>? fileBytes;
    String? pickedFileName;
    bool uploading = false;

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
                    const Expanded(
                      child: Text(
                        'رفع وثيقة أو تصوير ورقة',
                        style: TextStyle(
                            fontSize: 16.5, fontWeight: FontWeight.w900),
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

                // Camera and File buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: ErpColors.primary,
                          side: const BorderSide(color: ErpColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () async {
                          try {
                            final photo = await _picker.pickImage(
                              source: ImageSource.camera,
                              imageQuality: 85,
                            );
                            if (photo != null) {
                              final bytes = await photo.readAsBytes();
                              setModalState(() {
                                fileBytes = bytes;
                                pickedFileName = photo.name.isNotEmpty
                                    ? photo.name
                                    : 'photo_${DateTime.now().millisecondsSinceEpoch}.jpg';
                                if (titleCtrl.text.isEmpty) {
                                  titleCtrl.text = 'صورة ورقة اختبار / وثيقة';
                                }
                              });
                            }
                          } catch (e) {
                            if (mounted) {
                              showErpToast(context, 'تعذر فتح الكاميرا: $e', isError: true);
                            }
                          }
                        },
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: const Text('تصوير بالكاميرا'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () async {
                          try {
                            final res = await FilePicker.platform.pickFiles(
                              type: FileType.custom,
                              allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'],
                              withData: true,
                            );
                            if (res != null && res.files.isNotEmpty) {
                              final f = res.files.first;
                              if (f.bytes != null) {
                                setModalState(() {
                                  fileBytes = f.bytes;
                                  pickedFileName = f.name;
                                  if (titleCtrl.text.isEmpty) {
                                    titleCtrl.text = f.name.replaceAll(RegExp(r'\.[^/.]+$'), '');
                                  }
                                });
                              }
                            }
                          } catch (e) {
                            if (mounted) {
                              showErpToast(context, 'تعذر اختيار الملف: $e', isError: true);
                            }
                          }
                        },
                        icon: const Icon(Icons.attach_file_outlined),
                        label: const Text('ملف (PDF / Word)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Selected File Banner
                if (pickedFileName != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: Colors.green, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'تم تحديد: $pickedFileName',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'عنوان الوثيقة أو الورقة *',
                    hintText: 'مثال: فرض مراقبة عدد 1 في مادة الرياضيات',
                  ),
                ),
                const SizedBox(height: 10),

                DropdownButtonFormField<String>(
                  value: purpose,
                  decoration: const InputDecoration(labelText: 'الغرض والتصنيف *'),
                  items: purposes
                      .map((p) => DropdownMenuItem(value: p, child: Text(p, style: const TextStyle(fontSize: 13))))
                      .toList(),
                  onChanged: (v) => setModalState(() => purpose = v ?? purposes.first),
                ),
                const SizedBox(height: 10),

                DropdownButtonFormField<String>(
                  value: selectedClassId,
                  decoration: const InputDecoration(labelText: 'الفصل المرتبط (اختياري)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('-- عام (بدون فصل) --')),
                    ..._classes.map((c) => DropdownMenuItem(
                          value: c['id'].toString(),
                          child: Text('${c['name'] ?? ''} ${c['section'] ?? ''}'.trim()),
                        )),
                  ],
                  onChanged: (v) => setModalState(() => selectedClassId = v),
                ),
                const SizedBox(height: 10),

                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات أو تفاصيل للإدارة',
                    hintText: 'أي توضيحات مرفقة مع الوثيقة...',
                  ),
                ),
                const SizedBox(height: 16),

                ElevatedButton(
                  onPressed: uploading || fileBytes == null
                      ? null
                      : () async {
                          if (titleCtrl.text.trim().isEmpty) {
                            showErpToast(context, 'يرجى إدخال عنوان الوثيقة', isWarning: true);
                            return;
                          }
                          setModalState(() => uploading = true);
                          final classIdNum = selectedClassId != null ? int.tryParse(selectedClassId!) : null;

                          final res = await ApiService.uploadDocumentBytes(
                            bytes: fileBytes!,
                            filename: pickedFileName ?? 'document.pdf',
                            title: titleCtrl.text.trim(),
                            purpose: purpose,
                            classId: classIdNum,
                            notes: notesCtrl.text.trim(),
                          );

                          if (!ctx.mounted) return;
                          setModalState(() => uploading = false);

                          if (res.success) {
                            Navigator.pop(ctx);
                            if (mounted) {
                              showErpToast(context, 'تم رفع الوثيقة بنجاح وإشعار الإدارة 🎉');
                              _loadData();
                            }
                          } else {
                            if (mounted) {
                              showErpToast(context, res.message, isError: true);
                            }
                          }
                        },
                  child: Text(uploading ? 'جاري الرفع...' : 'تأكيد الرفع والإرسال'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _deleteDoc(dynamic doc) async {
    final ok = await showErpConfirmDialog(
      context,
      title: 'حذف وثيقة',
      message: 'هل أنت متأكد من حذف الوثيقة "${doc['title']}"؟',
      confirmText: 'حذف',
    );
    if (!ok) return;

    final res = await ApiService.deleteDocument(doc['id']);
    if (res.success) {
      setState(() => _documents.removeWhere((d) => d['id'] == doc['id']));
      if (mounted) showErpToast(context, 'تم حذف الوثيقة بنجاح');
    } else {
      if (mounted) showErpToast(context, res.message, isError: true);
    }
  }

  IconData _getFileIcon(String? fileType, String? fileName) {
    final lower = '${fileType ?? ""} ${fileName ?? ""}'.toLowerCase();
    if (lower.contains('pdf')) return Icons.picture_as_pdf_outlined;
    if (lower.contains('xls') || lower.contains('sheet')) return Icons.table_chart_outlined;
    if (lower.contains('doc') || lower.contains('word')) return Icons.description_outlined;
    if (lower.contains('image') || lower.contains('jpg') || lower.contains('png')) return Icons.image_outlined;
    return Icons.insert_drive_file_outlined;
  }

  @override
  Widget build(BuildContext context) {
    return ErpShell(
      currentRoute: ErpRoute.documents,
      onRefresh: _loadData,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  ErpPageHeader(
                    title: 'مستودع الوثائق والأوراق المرفوعة',
                    subtitle:
                        'رفع وتوثيق الفروض، المذكرات، أوراق الامتحانات المصورة في مدرسة ابن خلدون',
                    actions: [
                      ElevatedButton.icon(
                        onPressed: _openUploadModal,
                        icon: const Icon(Icons.upload_file_outlined, size: 18),
                        label: const Text('رفع / تصوير ورقة'),
                      ),
                    ],
                  ),

                  // Search and purpose filters
                  ErpCard(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Column(
                      children: [
                        TextField(
                          decoration: const InputDecoration(
                            hintText: 'البحث باسم الوثيقة أو الأستاذ...',
                            prefixIcon: Icon(Icons.search, size: 20),
                            border: InputBorder.none,
                          ),
                          onChanged: (v) => setState(() => _search = v.trim()),
                        ),
                        const Divider(height: 1),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(
                            children: [
                              FilterChip(
                                selected: _selectedPurpose == 'ALL',
                                label: const Text('الكل'),
                                onSelected: (_) => setState(() => _selectedPurpose = 'ALL'),
                              ),
                              const SizedBox(width: 6),
                              ...purposes.map((p) => Padding(
                                    padding: const EdgeInsets.only(left: 6),
                                    child: FilterChip(
                                      selected: _selectedPurpose == p,
                                      label: Text(p),
                                      onSelected: (_) => setState(() => _selectedPurpose = p),
                                    ),
                                  )),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_filteredDocs.isEmpty)
                    const ErpEmptyState(
                      icon: Icons.folder_open_outlined,
                      message: 'لا توجد وثائق مرفوعة مطابقة',
                    )
                  else
                    ..._filteredDocs.map((doc) {
                      final title = doc['title']?.toString() ?? 'وثيقة';
                      final purpose = doc['purpose']?.toString() ?? 'عام';
                      final submitter = doc['submittedByName'] ?? doc['submittedBy'] ?? 'المعلم';
                      final role = doc['submitterRole'] == 'TEACHER' ? 'أستاذ' : 'إدارة';
                      final date = doc['submissionDate']?.toString() ?? '';
                      final fileName = doc['originalFileName'] ?? doc['fileName'] ?? '';
                      final className = doc['schoolClass']?['name']?.toString();

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
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: ErpColors.primary.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _getFileIcon(doc['fileType'], fileName),
                                      color: ErpColors.primary,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: const TextStyle(
                                            fontSize: 14.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          'الملف: $fileName',
                                          style: const TextStyle(
                                            fontSize: 11.5,
                                            color: ErpColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: ErpColors.danger, size: 20),
                                    onPressed: () => _deleteDoc(doc),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  ErpBadge(label: purpose, tone: ErpBadgeTone.info),
                                  ErpBadge(label: 'بواسطة: $submitter ($role)', tone: ErpBadgeTone.neutral),
                                  if (className != null)
                                    ErpBadge(label: 'فصل: $className', tone: ErpBadgeTone.success),
                                ],
                              ),
                              if (date.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  'تاريخ التقديم: $date',
                                  style: const TextStyle(fontSize: 11, color: ErpColors.textMuted),
                                ),
                              ],
                              if (doc['notes'] != null && doc['notes'].toString().isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: ErpColors.bgBase,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    doc['notes'].toString(),
                                    style: const TextStyle(fontSize: 12, color: ErpColors.textSecondary),
                                  ),
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
