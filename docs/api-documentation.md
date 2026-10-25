> **Status:** Proposed API contract only. The current application uses a mock browser-local API and does not call these endpoints.

# API Documentation

This document outlines the REST API endpoints exposed via Amazon API Gateway and handled by AWS Lambda functions. All requests must include a valid JWT token in the `Authorization` header, obtained via Amazon Cognito.

---

## 1. Get Students List

Retrieves the list of students for a specific section.

- **Endpoint:** `GET /students`
- **Method:** `GET`
- **Purpose:** Populate the attendance marking roster.

### Request Parameters
| Name      | Type   | In    | Required | Description |
| --------- | ------ | ----- | -------- | ----------- |
| `section` | String | Query | Yes      | The section ID (e.g., 'A', 'B') |

### Successful Response (200 OK)
```json
{
  "students": [
    {
      "reg_id": "A001",
      "name": "Ava Brown",
      "section": "A"
    },
    {
      "reg_id": "A002",
      "name": "Noah Singh",
      "section": "A"
    }
  ]
}
```

---

## 2. Submit Attendance

Saves attendance records for a batch of students.

- **Endpoint:** `POST /attendance`
- **Method:** `POST`
- **Purpose:** Record daily attendance statuses.

### Request Body
```json
{
  "date": "2026-07-30",
  "records": [
    {
      "student_id": "A001",
      "section": "A",
      "status": "P"
    },
    {
      "student_id": "A002",
      "section": "A",
      "status": "A"
    }
  ]
}
```

### Successful Response (200 OK)
```json
{
  "success": true,
  "message": "Attendance recorded successfully for 2 entries.",
  "processed_count": 2
}
```

---

## 3. Get Dashboard Statistics

Retrieves aggregated statistics for the current day.

- **Endpoint:** `GET /dashboard/stats`
- **Method:** `GET`
- **Purpose:** Provide metrics for the dashboard charts.

### Request Parameters
| Name   | Type   | In    | Required | Description |
| ------ | ------ | ----- | -------- | ----------- |
| `date` | String | Query | No       | Date to query (defaults to today) |

### Successful Response (200 OK)
```json
{
  "totalStudents": 120,
  "present": 88,
  "absent": 24,
  "late": 8,
  "attendancePercentage": 73,
  "sections": {
    "A": 31,
    "B": 29,
    "C": 28
  }
}
```

---

## 4. Get Attendance History

Retrieves recent historical attendance events.

- **Endpoint:** `GET /attendance/history`
- **Method:** `GET`
- **Purpose:** Populate the 'Recent Activity' log.

### Successful Response (200 OK)
```json
[
  {
    "date": "2026-07-30",
    "section": "Section A",
    "status": "P"
  },
  {
    "date": "2026-07-31",
    "section": "Section C",
    "status": "A"
  }
]
```

---

## Error Handling

All endpoints follow standard HTTP status codes:
- **400 Bad Request:** Missing required parameters or invalid payload.
- **401 Unauthorized:** Missing or invalid Cognito JWT token.
- **403 Forbidden:** User lacks the necessary role permissions.
- **500 Internal Server Error:** Unexpected backend error (details are logged to CloudWatch, not returned to the client to avoid leaking internals).

**Error Response Format:**
```json
{
  "error": "Bad Request",
  "message": "Missing required field: section"
}
```
