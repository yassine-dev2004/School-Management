import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/erp_theme.dart';
import '../widgets/erp_widgets.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      showErpToast(context, 'الرجاء إدخال اسم المستخدم وكلمة المرور',
          isWarning: true);
      return;
    }

    setState(() => _isLoading = true);
    final result = await ApiService.login(username, password);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      final role = result['role']?.toString() ??
          (result['data']?['roles'] != null &&
                  (result['data']['roles'] as List).isNotEmpty
              ? result['data']['roles'][0].toString()
              : null);
      NotificationService.setupUserSubscriptions(role: role);

      showErpToast(context, 'تم تسجيل الدخول بنجاح');
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } else {
      _showErrorDialog(result['message'] ?? 'فشل تسجيل الدخول');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: ErpColors.danger),
            SizedBox(width: 8),
            Text('خطأ في تسجيل الدخول',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        content: Text(message),
        actions: [
          OutlinedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _showServerConfigDialog();
            },
            child: const Text('إعدادات الخادم'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }

  Future<void> _showServerConfigDialog() async {
    final currentUrl = await ApiService.getBaseUrl();
    final urlController = TextEditingController(text: currentUrl);
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.dns_outlined, color: ErpColors.primary),
            SizedBox(width: 8),
            Text('عنوان خادم النظام',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'أدخل رابط الـ API الخاص بالخادم:',
              style: TextStyle(fontSize: 13, color: ErpColors.textSecondary),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: urlController,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                labelText: 'رابط الخادم (API URL)',
                prefixIcon: Icon(Icons.link),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await ApiService.resetBaseUrl();
              if (dialogCtx.mounted) Navigator.pop(dialogCtx);
              if (!mounted) return;
              showErpToast(context, 'تم استعادة عنوان الخادم الافتراضي');
            },
            child: const Text('الافتراضي'),
          ),
          OutlinedButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (urlController.text.trim().isNotEmpty) {
                final ok =
                    await ApiService.checkHealth(urlController.text.trim());
                await ApiService.setBaseUrl(urlController.text.trim());
                if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                if (!mounted) return;
                showErpToast(
                  context,
                  ok
                      ? 'تم الحفظ والاتصال بالخادم بنجاح ✅'
                      : 'تم حفظ الرابط، لكن الخادم لا يستجيب حالياً ⚠️',
                  isWarning: !ok,
                );
              }
            },
            child: const Text('حفظ وفحص'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ErpColors.bgBase,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined, color: ErpColors.textSecondary),
            tooltip: 'إعدادات الخادم',
            onPressed: _showServerConfigDialog,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: ErpCard(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF111111), Color(0xFF374151)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.14),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.school,
                            color: Colors.white, size: 34),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'المدرسة الابتدائية الخاصة بن خلدون',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: ErpColors.textMain,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'École Primaire Privée Bn Khaldoun — بوابة الإدارة والمعلمين والأولياء',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: ErpColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _usernameController,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'اسم المستخدم',
                        hintText: 'أدخل اسم المستخدم',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      onSubmitted: (_) => _login(),
                      decoration: InputDecoration(
                        labelText: 'كلمة المرور',
                        hintText: 'أدخل كلمة المرور',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined),
                          onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _login,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'تسجيل الدخول',
                                style: TextStyle(
                                    fontSize: 15.5, fontWeight: FontWeight.w800),
                              ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: _showServerConfigDialog,
                      icon: const Icon(Icons.wifi,
                          size: 16, color: ErpColors.textMuted),
                      label: const Text(
                        'إعدادات عنوان الخادم (Server API)',
                        style: TextStyle(
                            color: ErpColors.textMuted, fontSize: 12.5),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
