# Cloud-Native Teacher Feedback Management System

A full-stack, cloud-native application designed for evaluating teacher performance. Built using React (Vite) on the frontend and AWS Lambda (Python) with DynamoDB on the backend.

## Architecture Overview
*   **Frontend**: React.js (via Vite), React Context for global state, Vanilla CSS with premium glassmorphism design.
*   **Backend API**: Amazon API Gateway to expose REST endpoints.
*   **Compute Engine**: AWS Lambda (Serverless Python functions) to process requests.
*   **Database**: Amazon DynamoDB (NoSQL) for high-performance, real-time data storage.

---

## AWS Deployment Guide (Real-Time Integration)

To make this application fully functional, you must deploy the provided backend scripts to your AWS account. Follow these step-by-step instructions.

### Step 1: Create DynamoDB Tables
You need to create three tables. Go to the **DynamoDB Console** and click **Create table**.

1. **Users Table** (For Admins and Students)
   - Table name: `EduUsers`
   - Partition key: `email` (String)
   - Click *Create table*.

2. **Teachers Table**
   - Table name: `EduTeachers`
   - Partition key: `id` (String)
   - Click *Create table*.

3. **Feedback Table**
   - Table name: `EduFeedback`
   - Partition key: `feedback_id` (String)
   - Click *Create table*.

### Step 2: Create IAM Execution Role for Lambda
Before creating Lambdas, ensure they have permissions to access DynamoDB.
1. Go to **IAM Console** -> **Roles** -> **Create role**.
2. Select **AWS service** -> **Lambda**.
3. Attach policies: `AWSLambdaBasicExecutionRole` and `AmazonDynamoDBFullAccess` (For production, use least privilege instead of FullAccess).
4. Name the role: `EduFeedbackLambdaRole` and create it.

### Step 3: Deploy Lambda Functions
Go to the **Lambda Console** and create four separate functions. For each function:
- Click **Create function** -> **Author from scratch**.
- Runtime: `Python 3.10` or higher.
- Under **Permissions** -> Change default execution role -> Use an existing role -> Select `EduFeedbackLambdaRole`.

Create the following functions and paste the code from the corresponding files in the `backend/lambda/` folder:
1.  **Name:** `EduAuthHandler` -> Paste code from `auth_handler.py`
2.  **Name:** `EduStudentHandler` -> Paste code from `student_handler.py`
3.  **Name:** `EduTeacherHandler` -> Paste code from `teacher_handler.py`
4.  **Name:** `EduFeedbackHandler` -> Paste code from `feedback_handler.py`

*(Click **Deploy** after pasting the code for each function).*

### Step 4: Configure API Gateway
Go to the **API Gateway Console** -> Click **Build** under **HTTP API**.

1. **Integrations & Routes:**
   Click **Add integration**, select **Lambda**, and point it to the functions you just created. Set up the following routes:
   - `POST /login` -> `EduAuthHandler`
   - `GET /students` -> `EduStudentHandler`
   - `POST /students` -> `EduStudentHandler`
   - `DELETE /students` -> `EduStudentHandler`
   - `GET /teachers` -> `EduTeacherHandler`
   - `POST /teachers` -> `EduTeacherHandler`
   - `DELETE /teachers` -> `EduTeacherHandler`
   - `GET /feedback` -> `EduFeedbackHandler`
   - `POST /feedback` -> `EduFeedbackHandler`

2. **Configure CORS:**
   - Go to **CORS** in the left menu.
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type`, `Authorization`
   - Access-Control-Allow-Methods: `GET, POST, DELETE, OPTIONS`

3. **Deploy API:**
   - Go to **Deployments** -> Create a Stage (e.g., `prod`).
   - Copy the **Invoke URL** (e.g., `https://abcde123.execute-api.us-east-1.amazonaws.com/prod`).

---

## Local Frontend Setup

Once your AWS infrastructure is running, connect your frontend:

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Crucial Step:** Create or edit the `.env` file in the `frontend` folder and add your API Gateway Invoke URL:
    ```env
    VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Application Usage
*   **Admin Login**: `admin@system.com` / `admin` (Hardcoded in `auth_handler.py` as the master account).
*   Use the Admin Dashboard to create students and teachers.
*   Log out and log back in using the newly created student credentials.
*   Submit feedback and verify it appears in the Admin Dashboard!
