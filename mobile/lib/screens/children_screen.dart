import 'package:flutter/material.dart';

class ChildrenScreen extends StatelessWidget {
  final List<dynamic> children;

  const ChildrenScreen({Key? key, required this.children}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('قائمة الأبناء والنتائج'),
        backgroundColor: Colors.indigo,
      ),
      body: children.isEmpty
          ? const Center(
              child: Text(
                'لا يوجد أبناء مسجلين حالياً',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: children.length,
              itemBuilder: (context, index) {
                final child = children[index];
                final firstName = child['firstName'] ?? '';
                final lastName = child['lastName'] ?? '';
                final schoolClass = child['schoolClass'];
                final className = schoolClass != null
                    ? '${schoolClass['name']} - ${schoolClass['section']}'
                    : 'غير محدد';
                final grades = child['grades'] as List<dynamic>? ?? [];
                final attendance = child['attendance'] as List<dynamic>? ?? [];

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.indigo.shade100,
                              child: Text(
                                firstName.isNotEmpty ? firstName[0] : 'S',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$firstName $lastName',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  'الفصل: $className',
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Chip(
                              label: Text('${grades.length} درجات مسجلة'),
                              backgroundColor: Colors.blue.shade50,
                            ),
                            Chip(
                              label: Text('${attendance.length} سجلات حضور'),
                              backgroundColor: Colors.green.shade50,
                            ),
                          ],
                        ),
                        if (grades.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          const Text(
                            'أحدث الدرجات:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          Column(
                            children: grades.take(3).map((g) {
                              final score = g['score'] ?? 0;
                              return ListTile(
                                dense: true,
                                title: Text(g['subjectName'] ?? 'مادة غير محددة'),
                                subtitle: Text(g['examType'] ?? ''),
                                trailing: Text(
                                  '$score',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: score >= 70 ? Colors.green : Colors.red,
                                  ),
                                ),
                              );
                            }).toList(),
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
}
