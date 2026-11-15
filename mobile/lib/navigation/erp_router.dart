import 'package:flutter/material.dart';
import '../screens/announcements_screen.dart';
import '../screens/attendance_screen.dart';
import '../screens/children_screen.dart';
import '../screens/classes_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/documents_screen.dart';
import '../screens/grades_screen.dart';
import '../screens/homework_screen.dart';
import '../screens/login_screen.dart';
import '../screens/parents_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/students_screen.dart';
import '../screens/subjects_screen.dart';
import '../screens/teachers_screen.dart';
import 'erp_route.dart';

class ErpRouter {
  static Widget screenFor(ErpRoute route) {
    switch (route) {
      case ErpRoute.dashboard:
        return const DashboardScreen();
      case ErpRoute.students:
        return const StudentsScreen();
      case ErpRoute.teachers:
        return const TeachersScreen();
      case ErpRoute.parents:
        return const ParentsScreen();
      case ErpRoute.classes:
        return const ClassesScreen();
      case ErpRoute.subjects:
        return const SubjectsScreen();
      case ErpRoute.attendance:
        return const AttendanceScreen();
      case ErpRoute.grades:
        return const GradesScreen();
      case ErpRoute.homework:
        return const HomeworkScreen();
      case ErpRoute.announcements:
        return const AnnouncementsScreen();
      case ErpRoute.documents:
        return const DocumentsScreen();
      case ErpRoute.children:
        return const ChildrenScreen();
      case ErpRoute.settings:
        return const SettingsScreen();
    }
  }

  static void go(BuildContext context, ErpRoute route) {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => screenFor(route),
        transitionDuration: const Duration(milliseconds: 160),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
      ),
    );
  }

  static void goToLogin(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }
}

