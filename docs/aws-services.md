> **Status:** These services form the proposed cloud design. The repository does not include deployed AWS infrastructure or live service integrations.

# AWS Services Overview

This document provides a detailed explanation of why specific AWS services were chosen for the Cloud Guard Serverless Attendance System and how they contribute to the system's reliability, scalability, and security.

## 1. Amazon Cognito
**Purpose:** User Identity & Access Management
- **Why chosen?** Building secure authentication from scratch is error-prone and time-consuming. Cognito provides out-of-the-box secure JWT issuance, password resets, brute-force protection, and user management.
- **Role in Cloud Guard:** Manages Teacher and Admin identities. It issues the JWT tokens that API Gateway uses to authorize requests, ensuring only authenticated personnel can view or modify attendance data.

## 2. Amazon API Gateway
**Purpose:** API Routing and Throttling
- **Why chosen?** We need a secure front-door for our backend logic. API Gateway natively integrates with Cognito and Lambda.
- **Role in Cloud Guard:** Acts as the RESTful endpoint for the frontend. It intercepts incoming HTTP requests, validates the Cognito JWT token, and if valid, proxies the request to the appropriate AWS Lambda function. It also handles CORS policies to secure the browser environment.

## 3. AWS Lambda
**Purpose:** Serverless Compute
- **Why chosen?** Educational institutions have highly variable traffic (spikes during morning attendance, zero traffic at night). Traditional servers would incur costs 24/7. Lambda scales instantly to handle spikes and costs nothing when idle.
- **Role in Cloud Guard:** Contains the core business logic (e.g., parsing attendance submissions, aggregating dashboard statistics). It acts as the bridge between the API layer and the database layer.

## 4. Amazon DynamoDB
**Purpose:** NoSQL Database
- **Why chosen?** Attendance systems require rapid, frequent writes (saving attendance for entire classes at once) and fast reads (loading student rosters). DynamoDB provides single-digit millisecond performance at any scale.
- **Role in Cloud Guard:** Stores all student records and historical attendance logs. Its schema is optimized for querying attendance by date and section.

## 5. Amazon S3 (Simple Storage Service)
**Purpose:** Static Web Hosting
- **Why chosen?** S3 is the most cost-effective and highly available way to host modern Single Page Applications (SPAs) built with React/Vite/Vanilla JS.
- **Role in Cloud Guard:** Hosts the compiled HTML, CSS, JavaScript, and image assets. It serves the frontend application globally with low latency.
