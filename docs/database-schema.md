> **Status:** Proposed data model only. The current demo stores data in browser `localStorage`; it does not connect to DynamoDB.

# Database Schema (Amazon DynamoDB)

The system relies on Amazon DynamoDB for fast, scalable NoSQL data storage. This document outlines the expected schema based on the application's data access patterns.

## 1. Students Table
Stores static information about the students enrolled in various sections.

- **Table Name**: `CloudGuard_Students`
- **Partition Key**: `section_id` (String) - e.g., "A", "B", "C"
- **Sort Key**: `student_id` (String) - e.g., "A001"

### Attributes
- `name` (String) - The student's full name.
- `registration_number` (String) - Official institution ID.
- `enrollment_date` (String, ISO-8601 Date)

### Example Record
```json
{
  "section_id": "A",
  "student_id": "A001",
  "name": "Ava Brown",
  "registration_number": "REG-2024-001",
  "enrollment_date": "2024-01-15T08:00:00Z"
}
```

## 2. Attendance Table
Stores the daily attendance records for students.

- **Table Name**: `CloudGuard_Attendance`
- **Partition Key**: `date` (String) - e.g., "2026-07-30"
- **Sort Key**: `student_id` (String) - e.g., "A001"

### Attributes
- `section_id` (String) - e.g., "A"
- `status` (String) - Enum: `"P"` (Present), `"A"` (Absent), `"L"` (Late)
- `marked_by` (String) - Email or ID of the teacher who submitted the record.
- `timestamp` (String, ISO-8601) - Exact time the record was saved.

### Example Record
```json
{
  "date": "2026-07-30",
  "student_id": "A001",
  "section_id": "A",
  "status": "P",
  "marked_by": "teacher@institution.edu",
  "timestamp": "2026-07-30T09:15:32Z"
}
```

## Data Relationships & Access Patterns
Because DynamoDB is a NoSQL database, we design around access patterns rather than normalized relations:

1. **"Get all students in Section A"**: 
   - `Query` on `StudentsTable` where `section_id = "A"`.
2. **"Get attendance for all students on Date X"**: 
   - `Query` on `AttendanceTable` where `date = "2026-07-30"`.
3. **"Get attendance history for Student Y"**:
   - Requires a Global Secondary Index (GSI) on `AttendanceTable` with Partition Key: `student_id` and Sort Key: `date`.
