import 'package:flutter/material.dart';
import '../theme/erp_theme.dart';

void showErpToast(BuildContext context, String message,
    {bool isError = false, bool isWarning = false}) {
  if (!context.mounted) return;
  Color bg = ErpColors.primary;
  if (isError) bg = ErpColors.danger;
  if (isWarning) bg = ErpColors.warning;

  ScaffoldMessenger.of(context).hideCurrentSnackBar();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        message,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      ),
      backgroundColor: bg,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      duration: const Duration(seconds: 3),
    ),
  );
}

Future<bool> showErpConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmText = 'تأكيد الحذف',
  bool isDanger = true,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isDanger ? ErpColors.dangerLight : ErpColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isDanger ? Icons.delete_outline : Icons.help_outline,
              color: isDanger ? ErpColors.danger : ErpColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
      content: Text(
        message,
        style: const TextStyle(
          color: ErpColors.textSecondary,
          fontSize: 13.5,
          height: 1.5,
        ),
      ),
      actions: [
        OutlinedButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: isDanger ? ErpColors.danger : ErpColors.primary,
          ),
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmText),
        ),
      ],
    ),
  );
  return result == true;
}

class ErpCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool selected;

  const ErpCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ErpColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: padding ?? const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? ErpColors.primary : ErpColors.border,
              width: selected ? 1.8 : 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}

class ErpStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconBg;
  final VoidCallback? onTap;

  const ErpStatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.iconBg = ErpColors.primary,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ErpCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: ErpColors.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: ErpColors.textMain,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          if (onTap != null)
            const Icon(Icons.arrow_forward_ios,
                size: 13, color: ErpColors.textMuted),
        ],
      ),
    );
  }
}

enum ErpBadgeTone { neutral, success, warning, danger, info }

class ErpBadge extends StatelessWidget {
  final String label;
  final ErpBadgeTone tone;
  final IconData? icon;

  const ErpBadge({
    super.key,
    required this.label,
    this.tone = ErpBadgeTone.neutral,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (tone) {
      case ErpBadgeTone.success:
        bg = ErpColors.successLight;
        fg = ErpColors.success;
        break;
      case ErpBadgeTone.warning:
        bg = ErpColors.warningLight;
        fg = ErpColors.warning;
        break;
      case ErpBadgeTone.danger:
        bg = ErpColors.dangerLight;
        fg = ErpColors.danger;
        break;
      case ErpBadgeTone.info:
        bg = ErpColors.infoLight;
        fg = ErpColors.info;
        break;
      case ErpBadgeTone.neutral:
        bg = ErpColors.primaryLight;
        fg = ErpColors.primary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: fg.withValues(alpha: 0.16)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class ErpPageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget>? actions;

  const ErpPageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: ErpColors.textMain,
                    ),
                  ),
                  if (subtitle != null && subtitle!.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: ErpColors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (actions != null && actions!.isNotEmpty) ...[
              const SizedBox(width: 8),
              Wrap(spacing: 6, runSpacing: 6, children: actions!),
            ],
          ],
        ),
        const SizedBox(height: 14),
      ],
    );
  }
}

class ErpSearchField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String> onChanged;

  const ErpSearchField({
    super.key,
    required this.controller,
    required this.hint,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search, color: ErpColors.textMuted, size: 20),
        suffixIcon: controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, size: 18, color: ErpColors.textMuted),
                onPressed: () {
                  controller.clear();
                  onChanged('');
                },
              )
            : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: ErpColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: ErpColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: const BorderSide(color: ErpColors.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
    );
  }
}

class ErpEmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const ErpEmptyState({
    super.key,
    required this.icon,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return ErpCard(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 46, color: ErpColors.textMuted.withValues(alpha: 0.5)),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: ErpColors.textMuted,
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String formatDateShort(dynamic raw) {
  if (raw == null) return '—';
  final str = raw.toString();
  if (str.length >= 10) return str.substring(0, 10);
  return str;
}

