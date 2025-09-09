## 4Sight

An experimental Next.js application for vision testing that includes gaze tracking and peripheral vision assessments. The app uses the device webcam and microphone, `face-api.js` models, and a modern UI built with Tailwind CSS and Radix UI.

### Vision
Half of the global population is expected to be myopic by 2050. 4Sight is an accessible, user-friendly way to screen for vision loss without needing a clinic. It provides a convenient, at-home method to track vision changes — see clearly, live fully.

### Features
- **Snellen Visual Acuity Test**: A classic letter-based distance acuity screen.
- **Peripheral Vision Test**: Presents stimuli to assess peripheral awareness and reaction.
- **Gaze Tracking Test**: Uses face landmarks to estimate and visualize gaze; includes a countdown, audio cues, and results pages.
- **Estimated Prescription & Recommendations**: Provides an estimated prescription and treatment suggestions based on results.
- **Voice & Microphone Support**: Optional voice/mic interaction components for prompts and feedback.
- **Distance Guidance**: On-screen guide to help users position themselves correctly from the camera.
- **Results Views**: Dedicated pages to review outcomes of tests.
- **Responsive UI**: Tailwind CSS, Radix UI components, and dark mode support via `next-themes`.

Note: 4Sight is not meant to replace optometrists or comprehensive eye exams. It is a complementary tool for regular vision monitoring and early detection of potential issues — a bridge between annual eye exams to help users stay proactive about their vision health.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript, React 18
- **UI**: Tailwind CSS, Radix UI primitives, shadcn/ui-style components
- **Gaze/Face**: `face-api.js` with bundled models under `public/models`
- **Charts/Visuals**: `recharts`, `embla-carousel-react` (where applicable)

### Screens & Key Routes
- `/` Home: Entry point to choose a test and see general instructions
- `/gaze-tester` Gaze test flow
- `/gaze-tester/results` Results for gaze test
- `/peripheral` Peripheral vision test flow
- `/results` Generic results screen

### Permissions
This application uses the webcam and may use the microphone depending on the test you run.
- When prompted by the browser, allow access to the camera (and mic if required).
- For best results, ensure good lighting and position your face within the guide.

### Model Files
`face-api.js` requires model files which are already included:
- `public/models/`
  - `tiny_face_detector_model-*`
  - `face_landmark_68_model-*`

These are loaded by the gaze tracking logic. No additional download is required in development.

### How we built it
- Next.js (App Router)
- Web Speech API
- TouchDesigner
- Tailwind CSS
- Procreate
- face-api.js

Built from blood, sweat, (jam) and tears.

### Accuracy across devices
Tests such as the Snellen test are currently designed for 13"–14" laptops at about 150% display scaling.

### Challenges we ran into
A major challenge was the highly interactive nature of 4Sight. Multiple components like eye gaze tracking, calibration, and voice recognition required constant updates and real-time feedback. This made it difficult to keep track of changes and debug issues efficiently — and sometimes, quite literally, hard to see the code.

### What we learned & accomplished
As a team of first-time hackers, we learned a lot and are proud of the final product. Highlights include collaborating effectively with Git and refining code logic across async flows and integrations of various libraries and APIs.

### Getting Started
Prerequisites:
- Node.js 18+
- npm or pnpm

Install dependencies:
```bash
npm install
# or
pnpm install
```

Run in development:
```bash
npm run dev
# or
pnpm dev
```

Build and start production server:
```bash
npm run build
npm run start
# or
pnpm build
pnpm start
```

Open the app at `http://localhost:3000`.

### Using the App
1. Navigate to the desired test (e.g., Gaze Tester or Peripheral Test).
2. Grant camera permission (and microphone if requested).
3. Use the on-screen distance guide to position yourself appropriately.
4. Follow the on-screen prompts and audio cues.
5. View results on the corresponding results page.

### Scripts
The most relevant scripts are defined in `package.json`:
- `dev`: Start Next.js in development mode
- `build`: Build the production bundle
- `start`: Start the production server
- `lint`: Run Next.js lint (build is configured to ignore lint/type errors by default)

### Project Structure (selected)
```text
app/
  gaze-tester/
    page.tsx
    results/page.tsx
  peripheral/page.tsx
  results/page.tsx
components/
  distance-guide.tsx
  letter-display.tsx
  microphone-setup.tsx
  voice-recognition.tsx
  webcam-feed.tsx
  ui/ ... (Radix/shadcn components)
public/
  gaze-tester/ (legacy/static assets for the gaze tester)
  models/ (face-api.js model files)
  sounds/ (audio cues)
styles/ and app/globals.css (styling)
```

### Configuration Notes
- `next.config.mjs` disables build blocking for ESLint and TypeScript errors and sets images to `unoptimized: true` for simplicity.
- Tailwind config is in `tailwind.config.ts` with dark mode support and component scanning for `app/`, `components/`, and more.

### Troubleshooting
- **Camera/Mic not working**: Ensure browser permissions are granted and no other app is using the camera/mic.
- **Models not loading**: Verify files exist under `public/models` and the served paths are correct. Use the browser devtools Network tab to confirm 200 responses.
- **Performance issues**: Good lighting improves face detection; close other camera apps; try a smaller viewport.

### What's next for 4Sight
- Professional verification with optometrists and specialists — working alongside them rather than separately.
- More testing options: Colour Blindness Test, Amsler Grid Test for macular degeneration, Colour Vision Test, Contrast Sensitivity Test, Duochrome Test.
- Link 4Sight to e-commerce: help users find glasses and treatment nearby based on location and budget.
- iOS and Android apps.

