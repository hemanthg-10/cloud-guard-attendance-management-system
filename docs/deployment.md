> **Status:** Implementation plan only, not a verified deployment procedure. The repository does not include the backend, infrastructure templates, or a deployed AWS environment. Review and implement security controls before using cloud resources.

# AWS Deployment Guide

This guide outlines the steps required to deploy the Cloud Guard Serverless architecture from scratch into an AWS environment.

## Prerequisites
- An active AWS Account.
- AWS CLI installed and configured (`aws configure`).
- Node.js (for frontend build and Lambda packaging).

---

## Step 1: Amazon Cognito (Authentication)
1. Go to the **Amazon Cognito** console.
2. Create a new **User Pool**.
   - **Sign-in options:** Email.
   - **Password policy:** Minimum 8 characters, require numbers/special characters.
   - **MFA:** Optional based on organization policy.
3. Add an **App Client**.
   - Do NOT generate a client secret (since this is for a web frontend).
   - Allow `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`.
4. Note down the **User Pool ID** and **App Client ID**. Add these to your `.env` file.

---

## Step 2: Amazon DynamoDB (Database)
1. Go to the **DynamoDB** console.
2. Create `CloudGuard_Students` Table.
   - **Partition key:** `section_id` (String)
   - **Sort key:** `student_id` (String)
3. Create `CloudGuard_Attendance` Table.
   - **Partition key:** `date` (String)
   - **Sort key:** `student_id` (String)
4. Leave capacity mode on **On-Demand** to minimize costs during low-traffic periods.

---

## Step 3: AWS Lambda (Backend Logic)
1. Go to the **IAM** console. Create a new Role `CloudGuardLambdaExecutionRole`.
   - Attach policies: `AWSLambdaBasicExecutionRole` and custom inline policy granting `dynamodb:PutItem`, `dynamodb:Query`, `dynamodb:Scan` on the two tables created above.
2. Go to the **Lambda** console.
3. Create 4 Node.js 18.x functions:
   - `cg-getStudents`
   - `cg-saveAttendance`
   - `cg-getDashboardStats`
   - `cg-getAttendanceHistory`
4. Assign the `CloudGuardLambdaExecutionRole` to each function.
5. Zip and upload your backend code to each respective function.

---

## Step 4: Amazon API Gateway (API Layer)
1. Go to the **API Gateway** console.
2. Create a new **REST API** named `CloudGuardAPI`.
3. Create a **Cognito User Pool Authorizer**.
   - Link it to the User Pool created in Step 1.
   - Token Source: `Authorization`
4. Define Resources and Methods matching the API spec:
   - `/students` (GET)
   - `/attendance` (POST)
   - `/dashboard/stats` (GET)
   - `/attendance/history` (GET)
5. For each Method:
   - Integration Type: **Lambda Function Proxy**.
   - Select the corresponding Lambda function.
   - Set the Method Request Authorizer to the Cognito Authorizer created above.
6. Enable **CORS** on all resources (Allow Origin: `*` or your specific S3 domain).
7. Click **Deploy API** to a new stage (e.g., `prod`).
8. Note the **Invoke URL** and add it to your `.env` file as `VITE_API_BASE_URL`.

---

## Step 5: Amazon S3 (Frontend Hosting)
1. In your local repository, run:
   ```bash
   npm run build
   ```
   This generates optimized files in the `dist/` directory.
2. Go to the **Amazon S3** console.
3. Create a new bucket (e.g., `cloud-guard-frontend-prod`).
   - Uncheck "Block all public access" (you need public read access for a website).
4. Enable **Static Website Hosting** in bucket properties.
   - Index document: `index.html`
   - Error document: `index.html` (important for SPA routing).
5. Attach a Bucket Policy allowing `s3:GetObject` for `*` (public read).
6. Upload the contents of your `dist/` folder to the bucket.
7. Access your application via the provided S3 website endpoint!
