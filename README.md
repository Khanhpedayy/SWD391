# Quiz Practice System - CRUD Starter

Tech stack:
- Frontend: ReactJS + Vite
- Backend: Node.js + Express.js
- Database: MySQL
- API: REST
- CRUD module: Questions

## Requirements
- Node.js 18+
- MySQL 8+

## 1. Create database

Open MySQL and run:

```sql
SOURCE database/schema.sql;
```

Or copy the contents of `database/schema.sql` into MySQL Workbench.

## 2. Configure backend

Go to `backend/.env.example`, copy it to `.env`, then change the database password if needed.

Example:

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=quiz_system
PORT=5000

## 3. Install and run backend

```bash
cd backend
npm install
npm run dev
```

Backend:
http://localhost:5000

## 4. Install and run frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:
http://localhost:5173

## CRUD API

GET    /api/questions
GET    /api/questions/:id
POST   /api/questions
PUT    /api/questions/:id
DELETE /api/questions/:id

The UI supports:
- Create question
- Read/list questions
- Edit question
- Delete question
- Search questions
- Filter by difficulty

## Learner Quiz Practice

Apply the learner migration after the base schema:

```sql
SOURCE database/schema.sql;
SOURCE database/migration_instructor.sql;
SOURCE database/migration_learner.sql;
```

Learner APIs (require `X-Learner-Key` header):

```
GET    /api/learner/quizzes
GET    /api/learner/quizzes/:id
POST   /api/learner/quizzes/:id/attempts
GET    /api/learner/attempts
GET    /api/learner/attempts/:attemptId
PUT    /api/learner/attempts/:attemptId/progress
POST   /api/learner/attempts/:attemptId/submit
GET    /api/learner/attempts/:attemptId/results
```

Open the frontend Learner tab to browse published quizzes, take a practice quiz, save progress, submit answers, and view explanations. Login/profile is not included because the project has no user authentication module.


## AI Tutor Chatbot

The Learner pages include a floating AI Tutor chat button. The chatbot uses the OpenAI Responses API through the backend; the API key is never sent to the browser.

### Configure the AI

1. Create or obtain an API key from the OpenAI platform. API usage may incur charges.
2. Copy `backend/.env.example` to `backend/.env` (keep `.env` private).
3. Set `OPENAI_API_KEY` to your own key. Optionally set `OPENAI_MODEL` to a model enabled for your API account.
4. In a terminal, run:

```bash
cd backend
npm install
npm run dev
```

5. In another terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

6. Open the Learner section in the website and click **Hỏi AI Tutor**.

AI endpoint: `POST /api/ai/chat`, body example:

```json
{
  "messages": [
    { "role": "user", "content": "Explain JavaScript closures with an example." }
  ]
}
```

The API key is required for real AI responses. If no key is configured, the endpoint returns a setup message. The chatbot currently keeps conversation history in the browser for the active page session; it does not save chat history to the database.
