import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../navigation/erp_router.dart';
import '../services/api_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_shell.dart';
import '../widgets/erp_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _serverCtrl = TextEditingController();

  String _username = '';
  String _role = 'PARENT';
  bool _loading = true;
  bool _savingProfile = false;
  bool _testingServer = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _serverCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final session = await ApiService.getUserSession();
    _username = session['username'] ?? 'المستخدم';
    _role = session['role'] ?? 'PARENT';

    final results = await Future.wait([
      ApiService.getProfile(),
      ApiService.getBaseUrl(),
    ]);

    final profile = results[0] as Map<String, dynamic>?;
    final serverUrl = results[1] as String;

    if (!mounted) return;
    setState(() {
      _firstCtrl.text = profile?['firstName']?.toString() ?? _username;
      _lastCtrl.text = profile?['lastName']?.toString() ?? '';
      _emailCtrl.text =
          profile?['email']?.toString() ?? (session['email'] ?? '');
      _phoneCtrl.text = profile?['phone']?.toString() ?? '';
      _serverCtrl.text = serverUrl;
      _loading = false;
    });
  }

  Future<void> _saveProfile() async {
    if (_firstCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty) {
      showErpToast(context, 'الرجاء إدخال الاسم الأول والبريد الإلكتروني',
          isWarning: true);
      return;
    }

    setState(() => _savingProfile = true);
    final res = await ApiService.put('/users/profile', {
      'firstName': _firstCtrl.text.trim(),
      'lastName': _lastCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _savingProfile = false);
    if (res.success) {
      showErpToast(context, 'تم حفظ التغييرات بنجاح');
    } else {
      showErpToast(context, res.message, isError: true);
    }
  }

  Future<void> _saveAndTestServer() async {
    final url = _serverCtrl.text.trim();
    if (url.isEmpty) return;
    setState(() => _testingServer = true);
    final ok = await ApiService.checkHealth(url);
    await ApiService.setBaseUrl(url);
    if (!mounted) return;
    setState(() => _testingServer = false);
    showErpToast(
      context,
      ok
          ? 'تم الحفظ والاتصال بالخادم بنجاح ✅'
          : 'تم حفظ الرابط، لكن الخادم لا يستجيب حالياً ⚠️',
      isWarning: !ok,
    );
  }

  Future<void> _resetServer() async {
    await ApiService.resetBaseUrl();
    final url = await ApiService.getBaseUrl();
    if (!mounted) return;
    setState(() => _serverCtrl.text = url);
    showErpToast(context, 'تمت استعادة رابط الخادم الافتراضي');
  }

  @override
  Widget build(BuildContext context) {
    final initial = _username.isNotEmpty ? _username[0].toUpperCase() : 'م';

    return ErpShell(
      currentRoute: ErpRoute.settings,
      onRefresh: _loadData,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                const ErpPageHeader(
                  title: 'إعدادات الحساب والنظام',
                  subtitle: 'تحديث بيانات الملف الشخصي وإعدادات الاتصال بالخادم',
                ),
                // Profile Summary + Form Card
                ErpCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: ErpColors.primary,
                            child: Text(
                              initial,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_firstCtrl.text} ${_lastCtrl.text}'.trim(),
                                  style: const TextStyle(
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  _emailCtrl.text,
                                  style: const TextStyle(
                                      fontSize: 12.5,
                                      color: ErpColors.textMuted),
                                ),
                                const SizedBox(height: 5),
                                ErpBadge(
                                  label: ApiService.roleLabel(_role),
                                  icon: Icons.verified_user_outlined,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _firstCtrl,
                              decoration: const InputDecoration(
                                labelText: 'الاسم الأول',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: _lastCtrl,
                              decoration: const InputDecoration(
                                labelText: 'الاسم الأخير',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'البريد الإلكتروني',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'رقم الهاتف',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _savingProfile ? null : _saveProfile,
                        icon: const Icon(Icons.save_outlined, size: 18),
                        label: Text(_savingProfile
                            ? 'جاري الحفظ...'
                            : 'حفظ بيانات الحساب'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                // Server URL Settings Card
                ErpCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'اتصال الخادم (Backend API)',
                        style: TextStyle(
                            fontSize: 15.5, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _serverCtrl,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          labelText: 'رابط الخادم (API URL)',
                          prefixIcon: Icon(Icons.link),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _resetServer,
                              child: const Text('استعادة الافتراضي'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed:
                                  _testingServer ? null : _saveAndTestServer,
                              child: Text(
                                  _testingServer ? 'جاري الفحص...' : 'حفظ وفحص'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                // Logout Card
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ErpColors.danger,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () async {
                    await ApiService.logout();
                    if (!context.mounted) return;
                    ErpRouter.goToLogin(context);
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('تسجيل الخروج من التطبيق'),
                ),
              ],
            ),
    );
  }
}

