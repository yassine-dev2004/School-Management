import 'package:flutter/material.dart';

/// Matches the web frontend's Professional White & Black ERP CSS variables (index.css).
class ErpColors {
  static const Color bgBase = Color(0xFFF5F6F8);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceHover = Color(0xFFF0F1F4);

  static const Color primary = Color(0xFF1A1A1A);
  static const Color primaryDark = Color(0xFF111111);
  static const Color primaryHover = Color(0xFF333333);
  static const Color primaryLight = Color(0x0F1A1A1A);

  static const Color accent = Color(0xFF555555);
  static const Color secondary = Color(0xFF6B7280);

  static const Color success = Color(0xFF15803D);
  static const Color successLight = Color(0x1415803D);

  static const Color warning = Color(0xFFB45309);
  static const Color warningLight = Color(0x14B45309);

  static const Color danger = Color(0xFFB91C1C);
  static const Color dangerLight = Color(0x14B91C1C);

  static const Color info = Color(0xFF1D4ED8);
  static const Color infoLight = Color(0x141D4ED8);

  static const Color textMain = Color(0xFF111111);
  static const Color textSecondary = Color(0xFF4A4A4A);
  static const Color textMuted = Color(0xFF8C8C8C);

  static const Color border = Color(0xFFE2E4E9);
}

class ErpTheme {
  static ThemeData build() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ErpColors.primary,
      primary: ErpColors.primary,
      secondary: ErpColors.accent,
      surface: ErpColors.surface,
      error: ErpColors.danger,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ErpColors.bgBase,
      appBarTheme: const AppBarTheme(
        backgroundColor: ErpColors.surface,
        foregroundColor: ErpColors.textMain,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: ErpColors.textMain,
          fontSize: 17,
          fontWeight: FontWeight.w800,
        ),
        iconTheme: IconThemeData(color: ErpColors.textMain),
      ),
      cardTheme: CardTheme(
        color: ErpColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: ErpColors.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ErpColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ErpColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ErpColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ErpColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ErpColors.danger),
        ),
        labelStyle: const TextStyle(
          color: ErpColors.textSecondary,
          fontSize: 13.5,
          fontWeight: FontWeight.w600,
        ),
        hintStyle: const TextStyle(color: ErpColors.textMuted, fontSize: 13.5),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ErpColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ErpColors.textSecondary,
          side: const BorderSide(color: ErpColors.border),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
        ),
      ),
      dividerColor: ErpColors.border,
      dialogTheme: DialogTheme(
        backgroundColor: ErpColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );
  }
}

