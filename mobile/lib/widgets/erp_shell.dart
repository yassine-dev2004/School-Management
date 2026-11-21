import 'dart:async';
import 'package:flutter/material.dart';
import '../navigation/erp_route.dart';
import '../navigation/erp_router.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../theme/erp_theme.dart';
import 'erp_widgets.dart';

class _MenuSection {
  final String title;
  final List<_MenuItem> items;

  const _MenuSection({required this.title, required this.items});
}

class _MenuItem {
  final ErpRoute route;
  final IconData icon;
  final String label;

  const _MenuItem({
    required this.route,
    required this.icon,
    required this.label,
  });
}

class ErpShell extends StatefulWidget {
  final ErpRoute currentRoute;
  final Widget body;
  final Future<void> Function()? onRefresh;
  final Widget? floatingActionButton;

  const ErpShell({
    super.key,
    required this.currentRoute,
    required this.body,
    this.onRefresh,
    this.floatingActionButton,
  });

  @override
  State<ErpShell> createState() => _ErpShellState();
}

class _ErpShellState extends State<ErpShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _username = '';
  String _role = 'PARENT';
  StreamSubscription? _notifSub;

  @override
  void initState() {
    super.initState();
    _loadSession();
    _notifSub = NotificationService.onNotificationReceived.stream.listen((msg) {
      if (!mounted) return;
      final title = msg.notification?.title ?? msg.data['title'] ?? 'إشعار مدرسي جديد';
      final body = msg.notification?.body ?? msg.data['body'] ?? '';
      showErpToast(context, '🔔 $title: $body');
    });
  }

  @override
  void dispose() {
    _notifSub?.cancel();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final session = await ApiService.getUserSession();
    if (!mounted) return;
    setState(() {
      _username = session['username'] ?? 'المستخدم';
      _role = ApiService.normalizeRole(session['role']);
    });
  }

  bool get _isAdmin => ApiService.isAdminRole(_role);
  bool get _isStaff => ApiService.isStaffRole(_role);

  List<_MenuSection> _buildSections() {
    if (_isStaff) {
      return [
        const _MenuSection(
          title: 'الرئيسية',
          items: [
            _MenuItem(
              route: ErpRoute.dashboard,
              icon: Icons.dashboard_outlined,
              label: 'لوحة التحكم',
            ),
          ],
        ),
        _MenuSection(
          title: 'الإدارة الأكاديمية والمالية',
          items: [
            const _MenuItem(
              route: ErpRoute.students,
              icon: Icons.people_outline,
              label: 'إدارة الطلاب',
            ),
            const _MenuItem(
              route: ErpRoute.payments,
              icon: Icons.account_balance_wallet_outlined,
              label: 'أقساط ورسوم الطلاب',
            ),
            if (_isAdmin)
              const _MenuItem(
                route: ErpRoute.teachers,
                icon: Icons.school_outlined,
                label: 'إدارة المعلمين',
              ),
            const _MenuItem(
              route: ErpRoute.teacherAttendance,
              icon: Icons.more_time_outlined,
              label: 'حضور المعلمين بالساعة',
            ),
            const _MenuItem(
              route: ErpRoute.parents,
              icon: Icons.family_restroom_outlined,
              label: 'أولياء الأمور',
            ),
            const _MenuItem(
              route: ErpRoute.classes,
              icon: Icons.meeting_room_outlined,
              label: 'الفصول والرسوم السنوية',
            ),
            const _MenuItem(
              route: ErpRoute.subjects,
              icon: Icons.menu_book_outlined,
              label: 'المواد الدراسية',
            ),
          ],
        ),
        const _MenuSection(
          title: 'المتابعة والتقييم والتوثيق',
          items: [
            _MenuItem(
              route: ErpRoute.dailyLogbook,
              icon: Icons.auto_stories_outlined,
              label: 'كراس الدروس اليومي',
            ),
            _MenuItem(
              route: ErpRoute.documents,
              icon: Icons.folder_shared_outlined,
              label: 'الوثائق والمستندات',
            ),
            _MenuItem(
              route: ErpRoute.attendance,
              icon: Icons.fact_check_outlined,
              label: 'الحضور والغياب',
            ),
            _MenuItem(
              route: ErpRoute.grades,
              icon: Icons.assignment_outlined,
              label: 'الدرجات والتقييمات',
            ),
            _MenuItem(
              route: ErpRoute.homework,
              icon: Icons.description_outlined,
              label: 'الواجبات المدرسية',
            ),
            _MenuItem(
              route: ErpRoute.announcements,
              icon: Icons.campaign_outlined,
              label: 'الإعلانات والتعاميم',
            ),
          ],
        ),
        const _MenuSection(
          title: 'النظام',
          items: [
            _MenuItem(
              route: ErpRoute.settings,
              icon: Icons.settings_outlined,
              label: 'الإعدادات العامة',
            ),
          ],
        ),
      ];
    }

    return const [
      _MenuSection(
        title: 'بوابة ولي الأمر',
        items: [
          _MenuItem(
            route: ErpRoute.dashboard,
            icon: Icons.dashboard_outlined,
            label: 'لوحة التحكم',
          ),
          _MenuItem(
            route: ErpRoute.children,
            icon: Icons.child_care_outlined,
            label: 'أبنائي والنتائج والرسوم',
          ),
          _MenuItem(
            route: ErpRoute.dailyLogbook,
            icon: Icons.auto_stories_outlined,
            label: 'كراس الدروس اليومي',
          ),
          _MenuItem(
            route: ErpRoute.homework,
            icon: Icons.description_outlined,
            label: 'الواجبات المدرسية',
          ),
          _MenuItem(
            route: ErpRoute.announcements,
            icon: Icons.campaign_outlined,
            label: 'الإعلانات',
          ),
        ],
      ),
      _MenuSection(
        title: 'الحساب والنظام',
        items: [
          _MenuItem(
            route: ErpRoute.settings,
            icon: Icons.settings_outlined,
            label: 'الإعدادات والحساب',
          ),
        ],
      ),
    ];
  }

  List<_MenuItem> _bottomQuickTabs() {
    if (_isStaff) {
      return const [
        _MenuItem(
          route: ErpRoute.dashboard,
          icon: Icons.dashboard_outlined,
          label: 'الرئيسية',
        ),
        _MenuItem(
          route: ErpRoute.students,
          icon: Icons.people_outline,
          label: 'الطلاب',
        ),
        _MenuItem(
          route: ErpRoute.attendance,
          icon: Icons.fact_check_outlined,
          label: 'الحضور',
        ),
        _MenuItem(
          route: ErpRoute.grades,
          icon: Icons.assignment_outlined,
          label: 'الدرجات',
        ),
      ];
    }

    return const [
      _MenuItem(
        route: ErpRoute.dashboard,
        icon: Icons.dashboard_outlined,
        label: 'الرئيسية',
      ),
      _MenuItem(
        route: ErpRoute.children,
        icon: Icons.child_care_outlined,
        label: 'أبنائي',
      ),
      _MenuItem(
        route: ErpRoute.homework,
        icon: Icons.description_outlined,
        label: 'الواجبات',
      ),
      _MenuItem(
        route: ErpRoute.announcements,
        icon: Icons.campaign_outlined,
        label: 'الإعلانات',
      ),
    ];
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (!mounted) return;
    ErpRouter.goToLogin(context);
  }

  void _navigate(ErpRoute route) {
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.pop(context);
    }
    if (route == widget.currentRoute) return;
    ErpRouter.go(context, route);
  }

  @override
  Widget build(BuildContext context) {
    final sections = _buildSections();
    final quickTabs = _bottomQuickTabs();
    final initialChar =
        _username.isNotEmpty ? _username[0].toUpperCase() : 'م';

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: ErpColors.bgBase,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: Container(
          decoration: const BoxDecoration(
            color: ErpColors.surface,
            border: Border(bottom: BorderSide(color: ErpColors.border)),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Row(
                children: [
                  // Drawer Menu button
                  InkWell(
                    onTap: () => _scaffoldKey.currentState?.openDrawer(),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: ErpColors.bgBase,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ErpColors.border),
                      ),
                      child: const Icon(Icons.menu,
                          size: 20, color: ErpColors.textMain),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Brand Logo + Name (matches .mobile-top-brand on Web)
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF111111), Color(0xFF374151)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child:
                        const Icon(Icons.school, color: Colors.white, size: 17),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'المدرسة الابتدائية الخاصة بن خلدون',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w900,
                        color: ErpColors.textMain,
                      ),
                    ),
                  ),
                  if (widget.onRefresh != null) ...[
                    IconButton(
                      icon: const Icon(Icons.refresh,
                          size: 20, color: ErpColors.textSecondary),
                      tooltip: 'تحديث',
                      onPressed: widget.onRefresh,
                    ),
                  ],
                  // Avatar shortcut to Settings
                  InkWell(
                    onTap: () => _navigate(ErpRoute.settings),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        color: ErpColors.primary,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initialChar,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Topbar Logout Button (matches .top-bar-logout-btn on Web)
                  InkWell(
                    onTap: _handleLogout,
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 7),
                      decoration: BoxDecoration(
                        color: ErpColors.dangerLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: ErpColors.danger.withValues(alpha: 0.18)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.logout,
                              size: 16, color: ErpColors.danger),
                          SizedBox(width: 4),
                          Text(
                            'خروج',
                            style: TextStyle(
                              color: ErpColors.danger,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      drawer: Drawer(
        width: 285,
        backgroundColor: ErpColors.surface,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        child: SafeArea(
          child: Column(
            children: [
              // Sidebar Brand Header
              Container(
                height: 64,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: ErpColors.border)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF111111), Color(0xFF374151)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.school,
                          color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'المدرسة الابتدائية الخاصة بن خلدون',
                            style: TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w900,
                              color: ErpColors.textMain,
                            ),
                          ),
                          Text(
                            'École Primaire Privée Bn Khaldoun',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: ErpColors.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close,
                          size: 20, color: ErpColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // Grouped Sidebar Navigation Links
              Expanded(
                child: ListView.builder(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                  itemCount: sections.length,
                  itemBuilder: (context, sIdx) {
                    final section = sections[sIdx];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(12, 2, 12, 6),
                            child: Text(
                              section.title,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: ErpColors.textMuted,
                              ),
                            ),
                          ),
                          ...section.items.map((item) {
                            final active = item.route == widget.currentRoute;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 3),
                              child: Material(
                                color: active
                                    ? ErpColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(10),
                                  onTap: () => _navigate(item.route),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 11),
                                    child: Row(
                                      children: [
                                        Icon(
                                          item.icon,
                                          size: 19,
                                          color: active
                                              ? Colors.white
                                              : ErpColors.textSecondary,
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            item.label,
                                            style: TextStyle(
                                              fontSize: 13.8,
                                              fontWeight: active
                                                  ? FontWeight.w800
                                                  : FontWeight.w600,
                                              color: active
                                                  ? Colors.white
                                                  : ErpColors.textSecondary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  },
                ),
              ),
              // Sidebar Footer (User card + Logout)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Color(0xFFFAFAFA),
                  border: Border(top: BorderSide(color: ErpColors.border)),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 8),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: ErpColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ErpColors.border),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 17,
                            backgroundColor: ErpColors.primary,
                            child: Text(
                              initialChar,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _username,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: ErpColors.textMain,
                                  ),
                                ),
                                Text(
                                  ApiService.roleLabel(_role),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: ErpColors.textMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        onTap: _handleLogout,
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: ErpColors.dangerLight,
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.logout,
                                  size: 18, color: ErpColors.danger),
                              SizedBox(width: 10),
                              Text(
                                'تسجيل الخروج',
                                style: TextStyle(
                                  color: ErpColors.danger,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: widget.body,
      floatingActionButton: widget.floatingActionButton,
      // Web-matching Mobile Quick Bottom Navigation Bar
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: ErpColors.surface,
          border: Border(top: BorderSide(color: ErpColors.border)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 62,
            child: Row(
              children: [
                ...quickTabs.map((tab) {
                  final active = tab.route == widget.currentRoute;
                  return Expanded(
                    child: InkWell(
                      onTap: () => _navigate(tab.route),
                      child: Container(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 3, vertical: 6),
                        decoration: BoxDecoration(
                          color: active
                              ? ErpColors.primaryLight
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              tab.icon,
                              size: 20,
                              color: active
                                  ? ErpColors.primary
                                  : ErpColors.textMuted,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tab.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight:
                                    active ? FontWeight.w800 : FontWeight.w600,
                                color: active
                                    ? ErpColors.primary
                                    : ErpColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                Expanded(
                  child: InkWell(
                    onTap: () => _scaffoldKey.currentState?.openDrawer(),
                    child: Container(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 3, vertical: 6),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.grid_view_rounded,
                              size: 20, color: ErpColors.textMuted),
                          SizedBox(height: 2),
                          Text(
                            'القائمة',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: ErpColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

