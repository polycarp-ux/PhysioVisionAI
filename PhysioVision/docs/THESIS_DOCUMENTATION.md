# PhysioVision AI

## Thesis and Technical Documentation

## Abstract

PhysioVision AI is a mobile physiotherapy and exercise-support application that
uses computer vision to analyse exercise movements. The application captures
camera frames on a mobile device, sends them to a FastAPI processing service,
extracts human pose landmarks with MediaPipe Pose, calculates joint angles, and
returns movement feedback to the user. A client-side repetition counter uses
exercise-specific angle thresholds to determine when a repetition has been
completed.

The application also provides onboarding personalisation, accessibility
preferences, exercise history, rehabilitation programmes, progress reports,
user profiles, authentication, and cloud persistence through Firebase
Authentication and Cloud Firestore. The frontend is implemented with React
Native and Expo Router. The backend is implemented with Python, FastAPI,
OpenCV, NumPy, and MediaPipe.

This document describes the problem, objectives, requirements, system design,
implementation, database structure, testing approach, deployment procedure,
limitations, ethical considerations, and future improvements.

---

# Chapter One: Introduction

## 1.1 Background

Physical rehabilitation exercises are often prescribed to patients who must
repeat movements outside a hospital or clinic. Correct technique is important:
an exercise performed with poor posture, insufficient range of motion, or an
unsafe angle may reduce its therapeutic value or increase injury risk.

Traditional supervision requires a physiotherapist to observe each movement.
This is difficult when a patient exercises at home, when clinical staff are
busy, or when a patient needs immediate feedback. Mobile phones provide a
convenient platform for delivering guided exercise support because they include
a camera, a screen, audio output, and network connectivity.

PhysioVision AI was designed to provide an accessible exercise-analysis tool
that gives immediate visual and textual feedback while recording completed
exercise sessions for later review.

## 1.2 Problem Statement

Many exercise applications count repetitions using manual buttons or simple
timers. These approaches do not verify whether the user has reached the
required movement position. Other systems may provide computer-vision analysis
but lack user personalisation, accessibility features, session history, or
cloud storage.

The project addresses the following problems:

1. Users need immediate feedback while performing exercises.
2. Repetitions should be counted based on movement phases rather than button
   presses.
3. Different exercises require different joint-angle targets.
4. Users may have different roles, disabilities, and accessibility needs.
5. Exercise sessions should be stored for later review.
6. A user profile should be associated with the correct authentication identity.
7. The application should be usable on mobile devices for demonstrations and
   future deployment.

## 1.3 Aim

The aim is to develop a mobile physiotherapy-support application that combines
computer-vision exercise analysis, personalised guidance, repetition counting,
session history, user authentication, and cloud data storage.

## 1.4 Objectives

The project objectives are to:

- Develop a cross-platform mobile frontend using React Native and Expo.
- Provide authentication and user profile handling.
- Capture camera frames during exercise.
- Detect pose landmarks using MediaPipe Pose.
- Calculate joint angles from detected landmarks.
- Count repetitions using exercise-specific movement thresholds.
- Display skeleton, form, angle, repetition, and feedback information.
- Store users and completed sessions in Cloud Firestore.
- Provide history, reports, rehabilitation programmes, and accessibility
  preferences.
- Improve responsiveness by reducing frame size and processing complexity.
- Support local presentation mode and a path toward hosted deployment.

## 1.5 Scope

The application currently covers:

- Email/password authentication through the backend and Firebase.
- Optional presentation/demo authentication.
- Patient and role-oriented onboarding.
- Disability and accessibility preferences.
- Camera-based exercise analysis.
- Squats, lunges, push-ups, bicep curls, shoulder press, deadlift, plank,
  glute bridge, and sit-to-stand configurations.
- Repetition counting and target-angle guidance.
- Local and Firestore session history.
- User profiles and clinical progress reports.
- Rehabilitation and care-mode navigation.
- PDF report generation and sharing.

The system is an exercise-support prototype and is not a replacement for a
licensed medical professional or clinical diagnosis.

---

# Chapter Two: Requirements Analysis

## 2.1 Functional Requirements

### Authentication

- A user can register with an email, password, and optional display name.
- A registered user can sign in.
- The system stores the authenticated user identity.
- The presentation build can accept demonstration credentials without contacting
  Firebase when demo mode is enabled.

### Onboarding

- The user selects a role or user category.
- The user selects one or more disability or support profiles.
- The user enables voice guidance, large text, or high contrast.
- Preferences are stored locally and used by relevant screens.

### Exercise Analysis

- The user selects an exercise.
- The application requests camera permission.
- A five-second animated exercise demonstration is displayed.
- Analysis starts immediately after the demonstration.
- Frames are captured repeatedly while the session is active.
- The backend returns pose landmarks, angles, and feedback.
- The frontend displays a skeleton overlay.
- Poor or incomplete form changes the skeleton to red.
- Correct form uses the positive feedback colour.
- The user sees repetitions, duration, current angle, and form score.

### Session Management

- A completed exercise is written to local device history.
- The session is uploaded to Firestore.
- The record contains the user identity and exercise metrics.
- The History screen loads cloud sessions first.
- Local history is used as a fallback if cloud access is unavailable.

### Reporting

- The user can view performance statistics.
- The system identifies weaknesses from low form scores.
- The system provides recommendations and safety notes.
- The report can be printed or shared as a PDF.

## 2.2 Non-functional Requirements

- The application should respond quickly enough for exercise feedback.
- Camera processing should not unnecessarily consume bandwidth.
- Firebase credentials must not be included in the mobile application bundle.
- The interface should support accessibility preferences.
- The backend should expose a health endpoint.
- The design should separate frontend, API, processing, and persistence logic.
- Errors should be visible rather than silently ignored.

## 2.3 Users and Stakeholders

- Patients or exercise users perform guided movements.
- Physiotherapists may review progress reports.
- Researchers or lecturers evaluate the prototype.
- Project administrators maintain Firebase and backend configuration.
- Demonstration audiences interact with the application using presentation mode.

---

# Chapter Three: System Architecture

## 3.1 High-level Architecture

The system contains four principal layers:

1. **Mobile presentation layer**: React Native and Expo.
2. **Application/API layer**: FastAPI routes and request validation.
3. **Computer-vision layer**: OpenCV, NumPy, MediaPipe Pose, and angle
   calculation.
4. **Persistence layer**: Firebase Authentication and Cloud Firestore.

The normal exercise flow is:

```text
Mobile camera
    |
    v
React Native Analysis screen
    |
    | base64 image over HTTP
    v
FastAPI /analyze-frame
    |
    v
OpenCV + MediaPipe Pose
    |
    | landmarks, angles, feedback
    v
Mobile skeleton and repetition counter
    |
    | completed session
    v
FastAPI /api/save-session
    |
    v
Firestore users/{uid}/exercise_sessions/{sessionId}
```

## 3.2 Frontend Technology

The frontend uses:

- React Native for cross-platform mobile UI.
- Expo SDK for camera, speech, printing, sharing, and development tooling.
- Expo Router for file-based navigation.
- TypeScript for static typing.
- AsyncStorage for local preferences, authentication state, and offline
  session history.
- React Native SVG for skeleton rendering.

## 3.3 Backend Technology

The backend uses:

- FastAPI for HTTP routes.
- Uvicorn as the application server.
- Pydantic models for request validation.
- OpenCV for image decoding and resizing.
- NumPy for image-buffer handling.
- MediaPipe Pose for body-landmark detection.
- Firebase Admin SDK for Firestore and user administration.
- Firebase Identity Toolkit REST endpoints for email/password authentication.

## 3.4 Navigation Structure

The main routes are:

| Route | Purpose |
|---|---|
| `/auth` | Registration and login |
| `/onboarding` | Role, disability, and accessibility setup |
| `/` | Main dashboard |
| `/library` | Exercise library |
| `/analysis` | Camera analysis and repetition counting |
| `/history` | Cloud and local exercise history |
| `/profile` | User profile and settings |
| `/rehab` | Rehabilitation programmes |
| `/romtracker` | Range-of-motion information |
| `/report` | Progress report and PDF sharing |
| `/elderly` | Guided elderly exercise mode |
| `/therapist` | Therapist-oriented dashboard prototype |

---

# Chapter Four: Frontend Implementation

## 4.1 Authentication Screen

The authentication screen is implemented in `app/auth.tsx`. It supports
registration and login modes and displays the PhysioVision logo from the
application assets.

In production mode, the screen calls the backend authentication routes. In
presentation mode, the frontend creates a local demonstration identity from
the entered email. The demo identity is stored in AsyncStorage so that the
same user can be associated with local activity during a presentation.

The production setting is controlled by:

```env
EXPO_PUBLIC_DEMO_AUTH=false
```

For a presentation where arbitrary credentials are required:

```env
EXPO_PUBLIC_DEMO_AUTH=true
```

Demo mode must not be used for a public production deployment because it does
not provide real identity verification.

## 4.2 Onboarding and Personalisation

The onboarding screen stores preferences such as:

- `userRole`
- `userCategory`
- `disabilities`
- `voiceGuidance`
- `largeText`
- `highContrast`
- `onboardingComplete`

These settings are read by analysis, dashboard, rehabilitation, report, and
profile screens. For example, voice guidance enables spoken feedback, while
large text and high contrast modify presentation choices.

## 4.3 Analysis Screen

The Analysis screen performs the main interactive task. Its responsibilities
include:

1. Requesting camera access.
2. Displaying the selected exercise.
3. Showing target-angle guidance.
4. Running the five-second demonstration animation.
5. Capturing camera frames while analysis is active.
6. Sending frames to the backend.
7. Drawing returned landmarks.
8. Showing form status and feedback.
9. Counting repetitions.
10. Saving the completed session.

For performance, the implementation uses a low camera image quality setting,
server-side resizing to a maximum width, MediaPipe `model_complexity=0`, and a
short polling interval. These choices reduce processing time and network
payload size.

## 4.4 Skeleton Feedback

The backend returns normalized landmark coordinates. The frontend maps these
coordinates to the screen width and height and renders SVG lines and circles.

The skeleton uses:

- A positive colour when the current angle is acceptable.
- Red when the movement is outside the configured target range or backend
  feedback indicates a form warning.

This gives the user a visual alert without requiring them to read every
feedback message.

## 4.5 Repetition Counter

The repetition counter is implemented in `utils/repCounter.ts`. It uses a
phase-based state machine:

```text
extended -> contracted = one repetition
```

For extension-based movements, the direction is reversed:

```text
contracted -> extended = one repetition
```

The counter avoids counting a repetition from a single noisy frame. A user
must reach the configured movement phase and then return through the required
range.

Example thresholds include:

| Exercise | Primary angle | Contracted target | Extended target |
|---|---|---:|---:|
| Squat | Knee | 110 degrees or less | 160 degrees or more |
| Lunge | Knee | 110 degrees or less | 160 degrees or more |
| Push-up | Elbow | 95 degrees or less | 160 degrees or more |
| Bicep curl | Elbow | 65 degrees or less | 145 degrees or more |
| Shoulder press | Elbow | 95 degrees or less | 160 degrees or more |
| Deadlift | Hip | 100 degrees or less | 160 degrees or more |
| Glute bridge | Knee | 110 degrees or less | 160 degrees or more |
| Sit-to-stand | Knee | 115 degrees or less | 160 degrees or more |
| Plank | Hip/body line | 145-195 degrees | Hold range |

These are application heuristics and should be validated by a qualified
physiotherapist before clinical use.

## 4.6 History and Local Fallback

The History screen first requests cloud sessions for the stored user ID.
When the backend or Firestore is unavailable, it reads the local
`physio_sessions` AsyncStorage record.

This approach provides resilience during demonstrations, but local and cloud
records should be reconciled more formally in a production release. A robust
future implementation would assign client IDs and maintain a pending-upload
queue.

## 4.7 Progress Reports

The report screen aggregates exercise performance and generates clinical-style
observations. It can include:

- User role and accessibility profile.
- Session count.
- Total repetitions.
- Average form score.
- Weaknesses inferred from low form scores.
- Recommendations.
- Safety disclaimer.

PDF generation and sharing are handled through Expo printing and sharing
modules.

---

# Chapter Five: Backend Implementation

## 5.1 FastAPI Application

The backend entry point is `backend/main.py`. FastAPI provides structured
routes and Pydantic validation.

The server binds to all network interfaces for local mobile testing:

```python
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
```

## 5.2 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/auth/register` | Create Firebase email/password account |
| POST | `/auth/login` | Authenticate an existing Firebase account |
| POST | `/analyze-frame` | Process one camera frame |
| POST | `/api/save-session` | Save one completed exercise |
| GET | `/api/sessions/{user_id}` | Read a user's sessions |

## 5.3 Frame Processing Pipeline

The `/analyze-frame` route:

1. Receives a base64 encoded image.
2. Decodes the image into bytes.
3. Converts the bytes into a NumPy buffer.
4. Decodes the buffer with OpenCV.
5. Resizes large frames.
6. Converts BGR to RGB.
7. Runs MediaPipe Pose.
8. Extracts all 33 landmarks.
9. Calculates relevant joint angles.
10. Produces feedback and form status.
11. Returns landmarks and measurements as JSON.

The frame route is intentionally separate from session storage. This allows
high-frequency analysis requests without creating a database record for every
camera frame.

## 5.4 Error Handling

The backend reports configuration errors when the Firebase Web API key or
service-account credential is missing. Invalid authentication requests return
HTTP errors. Image-processing failures return feedback indicating that the
frame could not be analysed.

Production improvements should add structured logging, request IDs, rate
limits, and monitoring.

---

# Chapter Six: Firebase and Database Design

## 6.1 Firebase Services

The project uses:

- Firebase Authentication for real email/password accounts.
- Cloud Firestore for user profiles and exercise sessions.
- Firebase Admin SDK on the backend for trusted server access.

The mobile app does not contain the service-account private key. The key is
kept in the backend environment and must never be committed or shared.

## 6.2 Firestore Data Model

The current structure is:

```text
users/{user_id}
  user_id
  email
  name
  updated_at

users/{user_id}/exercise_sessions/{session_id}
  session_id
  user_id
  user_email
  user_name
  exercise_id
  exercise_name
  reps
  duration_seconds
  accuracy_score
  created_at
```

The user document is created or updated during authentication and session
storage. The nested session collection keeps activity grouped by user.

## 6.3 Session Persistence Flow

When a user stops an exercise:

1. The frontend creates a local history object.
2. The frontend reads the stored user identity.
3. The frontend builds a session payload.
4. The payload is sent to `/api/save-session`.
5. The backend validates the payload with Pydantic.
6. Firestore updates the user document.
7. Firestore creates a new session document.
8. The response returns the session ID and path.

## 6.4 Security Considerations

The production design should verify the Firebase bearer token on every
user-specific route. The current prototype accepts user identity fields from
the client for presentation flexibility. This is not sufficient for a public
production system because a malicious client could submit another user ID.

Before public deployment:

- Verify ID tokens in session save and session read routes.
- Derive the user ID from the verified token, not the request body or URL.
- Restrict CORS to the deployed frontend origin.
- Apply Firestore security rules.
- Rotate any credentials that may have been exposed.
- Store secrets in hosting-provider secret settings.
- Disable demo authentication.

---

# Chapter Seven: Authentication and Identity

## 7.1 Production Authentication Flow

The production authentication flow is:

```text
Frontend
   |
   | email and password
   v
FastAPI authentication route
   |
   | Firebase Identity Toolkit request
   v
Firebase Authentication
   |
   | ID token
   v
FastAPI verifies token with Firebase Admin
   |
   v
Frontend stores token and user profile
```

The token is included in subsequent authenticated requests.

## 7.2 Presentation Authentication

Presentation mode avoids network delays by generating a local demo identity.
This is useful when the lecturer requires a reliable demonstration and the
Firebase authentication network is unavailable.

The mode is controlled by `EXPO_PUBLIC_DEMO_AUTH`. It must be documented to
evaluators as a demonstration configuration rather than production
authentication.

## 7.3 User Profile Data

The stored profile contains the user's UID, email, and display name. Exercise
session documents repeat the email and name to make exported or reviewed
session records understandable without repeatedly resolving the user document.

---

# Chapter Eight: Testing and Evaluation

## 8.1 Unit-level Checks

The following areas should be tested independently:

- Exercise ID normalisation.
- Angle threshold validation.
- Rep-counter phase transitions.
- Session payload construction.
- User profile parsing.
- History cloud-to-local fallback.
- Backend request validation.

## 8.2 Integration Tests

An end-to-end test should:

1. Start the backend.
2. Confirm `GET /` returns an online response.
3. Sign in or register.
4. Confirm the user document exists in Firestore.
5. Start an exercise.
6. Confirm `/analyze-frame` returns landmarks.
7. Complete and stop the exercise.
8. Confirm the session document exists.
9. Open History.
10. Confirm the new session appears with the correct user and metrics.

## 8.3 Manual Test Matrix

| Test | Expected result |
|---|---|
| Valid login | User reaches onboarding |
| Demo login | User reaches onboarding without Firebase request |
| Missing camera permission | Application explains the permission requirement |
| No body in frame | Warning asks the user to step back |
| Valid movement | Skeleton is positive and rep can count |
| Invalid angle | Skeleton turns red and rep does not count |
| Stop session | Session is saved locally and uploaded |
| Backend unavailable | Local history remains available |
| Different exercise | Threshold and instruction change |
| Different disability profile | Guidance and accessibility settings update |

## 8.4 Performance Evaluation

Useful measurements include:

- Average frame round-trip time.
- Frames processed per second.
- Time from movement completion to rep update.
- Backend CPU and memory usage.
- Image payload size.
- Percentage of frames with detectable landmarks.
- Cloud save success rate.

The current implementation prioritises responsiveness by using low-resolution
frames, lightweight MediaPipe configuration, and throttled polling.

## 8.5 Clinical Evaluation

Clinical validity requires comparison against physiotherapist-labelled
movements. Suggested evaluation measures include:

- Rep-count accuracy.
- Precision and recall for valid repetitions.
- Mean absolute angle error.
- Form-classification accuracy.
- False-positive and false-negative feedback rates.

---

# Chapter Nine: Deployment and Presentation

## 9.1 Local Presentation

Start the backend:

```powershell
cd "C:\Users\Polycarp Gerrard\Desktop\PhysioVisionAI\PhysioVision\backend"
python main.py
```

Start Expo on the local network:

```powershell
cd "C:\Users\Polycarp Gerrard\Desktop\PhysioVisionAI\PhysioVision"
npx expo start -c --lan
```

The phone and computer must use the same network. The backend listens on port
8000 and Expo Metro usually listens on port 8081.

## 9.2 Hosted Deployment

For an internet-accessible deployment:

1. Deploy the FastAPI backend to a service such as Render, Railway, or a
   comparable HTTPS host.
2. Add Firebase credentials as protected hosting secrets.
3. Configure `FIREBASE_WEB_API_KEY`.
4. Set the mobile `EXPO_PUBLIC_API_URL` to the HTTPS backend URL.
5. Set `EXPO_PUBLIC_DEMO_AUTH=false`.
6. Build the mobile application with EAS or distribute through TestFlight.

A LocalTunnel URL is temporary and should only be used for short demonstrations.

## 9.3 iOS Presentation

For two iPhones, Expo Go can be used during development. Both users install
Expo Go and scan the current Expo QR code. The computer must remain available
if the app is using a local backend.

For a more stable distribution, use an Expo EAS iOS build and TestFlight.
This requires Apple Developer enrollment.

---

# Chapter Ten: Limitations

Current limitations include:

- Camera-based pose estimation depends on lighting, camera angle, body
  visibility, and clothing.
- The current thresholds are heuristic and are not clinically validated.
- Some clinical dashboard content is prototype or static content.
- Demo authentication is intentionally not secure.
- Public deployment requires token enforcement on session routes.
- Local history fallback can produce records that have not yet synchronised.
- The backend currently processes frames synchronously.
- A single backend instance may not scale to many concurrent users.
- CORS is broad for development and must be restricted for production.
- Firebase queries may require indexes as the data model grows.

---

# Chapter Eleven: Ethical, Privacy, and Safety Considerations

The application processes exercise images and personal identity information.
The project should follow data-minimisation principles:

- Collect only information required for the application.
- Do not store raw camera frames unless explicitly required.
- Protect service-account credentials.
- Explain the difference between demo and production authentication.
- Give users control over their stored history.
- Provide a safety warning that the system is not a diagnosis.
- Encourage users to stop when they feel pain or discomfort.
- Avoid presenting automated form feedback as a professional medical verdict.

Before real clinical use, the system would require appropriate clinical
validation, consent procedures, access control, privacy documentation, and
regulatory review.

---

# Chapter Twelve: Conclusion and Future Work

PhysioVision AI demonstrates how a mobile application, a computer-vision
service, and a cloud database can be combined to support exercise monitoring.
The architecture separates camera interaction, pose processing, repetition
logic, authentication, and persistence. This separation makes the prototype
extendable and supports later improvements.

Future work should include:

- Verified-token authorization on every session route.
- A production-hosted backend with HTTPS.
- Real-time streaming or WebSocket analysis.
- Better temporal filtering for noisy landmarks.
- Physiotherapist-labelled training and validation data.
- Personalised thresholds based on clinical assessment.
- Offline upload queues and conflict resolution.
- Automated database indexes and retention policies.
- Therapist accounts with controlled patient access.
- Secure account recovery and refresh-token handling.
- Automated unit, integration, and mobile UI tests.
- A full EAS/TestFlight distribution pipeline.

## Appendix A: Important Project Files

| File | Responsibility |
|---|---|
| `app/_layout.tsx` | Root navigation and authentication routing |
| `app/auth.tsx` | Login and registration UI |
| `app/onboarding.tsx` | Personalisation and accessibility setup |
| `app/analysis.tsx` | Camera analysis and session completion |
| `app/history.tsx` | Cloud/local session history |
| `app/profile.tsx` | User profile and settings |
| `app/report.tsx` | Progress report and PDF generation |
| `utils/api.ts` | Frontend API, auth, and session requests |
| `utils/repCounter.ts` | Exercise thresholds and repetition state machine |
| `backend/main.py` | FastAPI routes and MediaPipe processing |
| `backend/database.py` | Firebase Admin and Firestore operations |
| `backend/pose_math.py` | Joint-angle calculations |
| `backend/.env` | Backend-only configuration and Firebase Web API key |
| `.env` | Mobile build configuration |

## Appendix B: Demonstration Checklist

- Backend starts successfully.
- Expo starts successfully.
- Phone and computer share a network.
- Camera permission is granted.
- Presentation mode is clearly understood.
- At least one exercise is tested.
- The five-second demonstration plays.
- Analysis starts after the demonstration.
- Skeleton and angle feedback are visible.
- The session appears in History.
- Firebase user and session documents are visible.
- No service-account key is shared with the audience.

