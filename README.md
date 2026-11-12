# 🎓 ScholarAI – AI-Powered Scholarship Management System

An intelligent scholarship management platform built using the **MERN Stack and Google Gemini AI**. ScholarAI helps students discover scholarship opportunities, evaluate their eligibility, manage applications, and receive personalized AI-powered guidance.

## 🚀 Project Overview

Finding suitable scholarships can be difficult because students need to search through multiple opportunities and understand complex eligibility requirements.

ScholarAI simplifies this process by combining scholarship management, deterministic eligibility evaluation, and an AI-powered scholarship assistant.

The platform aims to make scholarship discovery more accessible, personalized, and transparent.

## ✨ Key Features

### 👨‍🎓 Student Module
- Student registration and login.
- Secure JWT authentication.
- Student profile management.
- Academic and financial information management.
- Scholarship discovery.
- Scholarship eligibility evaluation.
- Application management.
- Notification support.

### 🤖 AI Scholarship Assistant
- Powered by Google Gemini API.
- Answers scholarship-related questions.
- Provides personalized guidance using student profile information.
- Explains scholarship eligibility criteria.
- Identifies missing profile information.
- Explains why a student is eligible or not eligible.
- Maintains conversation context.

### 🎯 Scholarship Eligibility Engine
A deterministic backend eligibility engine evaluates students against scholarship requirements.

Supported criteria:
- Minimum CGPA.
- Eligible courses.
- Eligible branches.
- Year of study.
- Maximum family income.

Eligibility results:
- **Eligible**
- **Not Eligible**
- **Needs Verification**

The eligibility engine is the source of truth. Gemini explains pre-computed results but cannot override them.

### 🏆 Personalized Scholarship Recommendations
Planned recommendation capabilities:
- Rank eligible scholarships.
- Consider scholarship amount and application deadlines.
- Separate scholarships requiring verification.
- Explain recommendation reasons.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Token (JWT) |
| AI Integration | Google Gemini API |
| API Testing | Postman |
| Version Control | Git, GitHub |

## 🏗️ Project Architecture

```text
ScholarAI/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── assets/
│       └── ...
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env
│   └── server.js
│
└── README.md
```

*The structure above is a representative overview. Keep it synchronized with the actual repository.*

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Harsh-Tiwari-27/ScholarAI.git
```

```bash
cd ScholarAI
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with your actual credentials.

**Security:** Never commit your `.env` file or expose API keys and JWT secrets publicly.

### 5. Start the backend

From the server directory:

```bash
npm run dev
```

### 6. Start the frontend

From the client directory:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## 🔌 API Overview

The application uses REST APIs for communication between frontend and backend.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Student login |
| `/api/profile` | GET | Retrieve student profile |
| `/api/profile` | PATCH | Update student profile |
| `/api/scholarships` | GET | Retrieve scholarships |
| `/api/ai/ask` | POST | Ask AI Scholarship Assistant |

Most student-specific operations require JWT authentication.

## 🧠 How AI Scholarship Assistance Works

```text
Student Question
       |
       v
JWT Authentication
       |
       v
Fetch Student Profile
       |
       v
Fetch Active Scholarships
       |
       v
Deterministic Eligibility Engine
       |
       v
Pre-computed Eligibility Results
       |
       v
Google Gemini API
       |
       v
Personalized AI Explanation
       |
       v
Student Dashboard
```

This architecture separates eligibility calculation from AI-generated explanations to improve reliability and transparency.

## 🔐 Security Considerations

- JWT-based authentication.
- Protected backend routes.
- Password hashing.
- Environment-based API credentials.
- Server-side eligibility evaluation.
- Student-specific profile access.
- No exposure of Gemini API keys in frontend code.

## 🧪 Testing

Tools used:
- Postman for API testing.
- MongoDB Atlas for database verification.
- Manual frontend and backend integration testing.

AI eligibility tests include:
- Correctly explaining eligible scholarships.
- Refusing attempts to override pre-computed eligibility.
- Explaining failed and passed eligibility criteria.
- Handling missing student information.

## 🗺️ Future Enhancements

- Advanced scholarship recommendation algorithm.
- Scholarship deadline reminders.
- Automated application tracking.
- Document upload and verification.
- Scholarship search filters.
- Improved AI-powered student guidance.
- Analytics dashboard.
- Production deployment.

## 👨‍💻 Developer

**Harsh Tiwari**

B.Tech – Computer Science and Engineering (AI & ML)

- GitHub: [Harsh-Tiwari-27](https://github.com/Harsh-Tiwari-27)

## ⭐ Support

If you find this project interesting, consider giving the repository a star!

---

*ScholarAI – Making scholarship discovery smarter with AI.*
