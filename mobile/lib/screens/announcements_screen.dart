import 'package:flutter/material.dart';

class AnnouncementsScreen extends StatelessWidget {
  final List<dynamic> announcements;

  const AnnouncementsScreen({Key? key, required this.announcements}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إعلانات المدرسة'),
        backgroundColor: Colors.indigo,
      ),
      body: announcements.isEmpty
          ? const Center(
              child: Text(
                'لا توجد إعلانات حالياً',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: announcements.length,
              itemBuilder: (context, index) {
                final item = announcements[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: const CircleAvatar(
                      backgroundColor: Colors.amber,
                      child: Icon(Icons.campaign, color: Colors.white),
                    ),
                    title: Text(
                      item['title'] ?? 'إعلان',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 6.0),
                      child: Text(
                        item['content'] ?? '',
                        style: TextStyle(color: Colors.grey.shade800),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
