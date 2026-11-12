# Quiz Practice System Function Map

This map translates the supplied data-flow diagram into app functions and records their current implementation status.

## Learner

| Diagram function | App function | Status |
| --- | --- | --- |
| Registration / sign up | Create a learner account with a unique email and password | Implemented: `POST /api/auth/signup` |
| Authentication and profile | Sign in and manage learner profile | Implemented: login, profile read/update, and expiring bearer tokens under `/api/auth` |
| Practice preferences | Save learner-specific quiz and practice settings | Not implemented; question and option shuffle settings are configured per quiz |
| Search / filter criteria | Find published quizzes by title, subject, and topic | Implemented: `GET /api/learner/quizzes` |
| Select quiz / quiz data request | View quiz details and questions | Implemented: `GET /api/learner/quizzes/:id` |
| Submitted answers | Start an attempt, save progress, and submit answers for grading | Implemented: learner attempt endpoints under `/api/learner/attempts` |
| Quiz results / answer explanations | View scores, pass status, and answer explanations | Implemented: `GET /api/learner/attempts/:attemptId/results` |

## Instructor

| Diagram function | App function | Status |
| --- | --- | --- |
| Authentication and profile | Sign in and manage instructor profile | Not implemented; instructor pages are not protected by authentication |
| Question data / upload | Manage the question bank and import questions | Implemented: question CRUD and `POST /api/questions/import` |
| Subject / topic information | Manage subjects and topics | Implemented: `/api/subjects` routes |
| Quiz information / configuration | Create, edit, publish, preview, and archive quizzes | Implemented: `/api/quizzes` routes |
| Assignment information | Assign quizzes to specific learners or groups | Not implemented |
| Report request / quiz statistics | View submission totals, pass rate, scores, and per-question accuracy | Implemented for submitted attempts: `GET /api/quizzes/:id/report` |

## Admin

| Diagram function | App function | Status |
| --- | --- | --- |
| User role assignment | Assign learner, instructor, and admin roles | Not implemented |
| User account management | Create, disable, and manage accounts | Not implemented |
| System configuration | Manage system-wide settings | Not implemented |
| System status | View application and database health | Not implemented beyond the API root health response |
| Activity logs | Review administrative and user activity | Not implemented |

## Mailing System

| Diagram function | App function | Status |
| --- | --- | --- |
| Send email request / email content | Deliver assignment or account emails | Not implemented; requires a mail provider and configuration |
| Delivery status | Record and expose delivery outcomes | Not implemented |

## Implementation Notes

- The backend uses Microsoft SQL Server (`mssql`), so the schema and migration scripts target SQL Server.
- The report endpoint only counts attempts with `Submitted` status. Question response rates are calculated from submitted answer records.
- Assignment, admin, and mailing workflows still need their own database tables and authorization rules before they can be safely exposed as app functions.