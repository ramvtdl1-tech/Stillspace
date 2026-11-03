# Validation and Quest test plan

The automated results below were recorded on November 3, 2026 (IST). The physical-device and deployment checklist remains pending until each result is recorded. A production build verifies packaging, not physical headset correctness. **Actual Quest performance, including the competition's minimum 60 fps, is unverified.**

| Recorded validation | Result |
| --- | --- |
| Strict TypeScript check and production build | Passed |
| Nine focus-state/persistence tests | Passed |
| Desktop task creation/selection, timer start/pause/reset, explicit task completion, notes, data-reset confirmation | Passed in managed Chromium |
| 390 px mobile layout and task/navigation controls | Passed; no horizontal overflow |
| Active IWER Quest 3 session with hand tracking enabled | Confirmed |
| Emulated hand pinches: onboarding, start/pause/reset, task keyboard entry/save, in-world exit | Passed; exit paused the running timer |
| Procedural scene validation | Passed; original garden about 11,200 triangles / 42 scene draw calls (editor view, not headset performance) |
| Dependency audit | Zero npm vulnerabilities after patched sharp override |
| License inventory and client-distribution gate | Passed; optional undeclared-license UIKitML code excluded from client |
| Physical Quest comfort, tracking and sustained frame rate | Pending |
| Public production URL and actual-footage video | Pending |

To replay the browser checks, start the SDK runtime with browser automation enabled, then run these commands sequentially. The tests edit/reset the local test browser's garden; use a dedicated development profile.

```sh
npx @iwsdk/cli dev up --headless --allow-browser-automation
npx @iwsdk/cli browser run scripts/browser-smoke.mjs --timeout 20000
node scripts/xr-smoke.mjs
npx @iwsdk/cli browser run scripts/mobile-smoke.mjs --timeout 15000
```

The XR smoke script opens VR through the app button, uses emulated hands, captures `artifacts/immersive.png`, and exits. Choosing headless mode here is an explicit test workflow. Use the headed workflow for interactive development. These results establish emulator behavior only.

XR means the immersive headset session. IWER is IWSDK's browser-based XR emulator. It is useful for iteration and simulated hands, but it does not replace physical Quest validation. See the [official testing guide](https://iwsdk.dev/guides/02-testing-experience.html).

## Record the environment

| Field | Result |
| --- | --- |
| Date and tester | Pending |
| Source commit and built artifact checksum | Pending |
| Headset model and OS | Pending |
| Quest Browser version | Pending |
| Hosted URL / local test URL | Pending |
| Hand tracking enabled; controllers unpaired/off | Pending |
| Frame-rate method, sample duration, minimum and sustained rate | Pending |
| Errors, videos, screenshots and issue references | Pending |

## Local build and state checks

Run commands from the project directory using a Node version accepted by `package.json`.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Run only test scripts actually present in the final package. Record the command output and commit. If dependencies or source change, repeat relevant checks. Use the SDK-managed development server (`npm run dev` / `npx @iwsdk/cli dev up`), rather than assuming a bare Vite server supplies the SDK tooling. For automation, inspect `npx @iwsdk/cli dev status` and wait for readiness before issuing browser commands.

- [ ] First visit creates valid default state; refresh preserves tasks, completed sessions, and preferences.
- [ ] Tasks can be added, selected, completed/removed, and handled when none remain. Empty titles, titles over 72 characters, and adding beyond the 8-task limit are rejected safely. Notes accept up to 500 characters.
- [ ] 2/5/8 minute selection changes the intended duration; start, pause, resume, reset, and completion are consistent.
- [ ] A completed session rewards once, including refresh/reentry near completion. Paused time is not counted.
- [ ] Stored state is validated; malformed or unsupported data falls back safely without an uncaught exception.
- [ ] Export then import replaces the current workspace with the intended state; running timers import paused. Malformed/oversized imports are rejected without discarding good data. Session history retains the latest 500 records, and totals reflect that retained history.
- [ ] Erase resets progress and garden to a fresh initial workspace with three starter tasks; no old note or session remains.
- [ ] Browser storage unavailable/full does not silently claim persistence or crash the experience.
- [ ] Sound can be enabled and disabled; muted use remains complete.
- [ ] Keyboard-only desktop navigation, focus visibility, and narrow-screen layout work where offered.

## Browser emulator iteration

Use the bundled IWSDK/IWER tools or the official [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik). Activate emulation for the test site, select a Quest profile, and select hand input. Keep simulator results explicitly labeled.

- [ ] Active XR session confirmed before testing hand/pose behavior.
- [ ] Runtime view, rather than editor-only view, renders the app systems and UI.
- [ ] Simulated left and right pointing/pinching select correct targets without double activation.
- [ ] Essential UI is visible in a narrower simulated FoV; text and controls do not depend on peripheral vision.
- [ ] Recenter, repeated enter/exit, and simulated visibility changes preserve coherent state.
- [ ] Full console output inspected, including warnings and errors. No missing assets or exceptions.

Do not claim Meta VR Glasses compatibility on the basis of Quest emulation. The release targets Quest; glasses/gaze require separate device-profile and interaction validation.

## Physical Quest — hands-only acceptance

Enable developer mode and hand tracking following [Meta's setup resources](https://start-developer-competition-26.devpost.com/resources). Use [MQDH with Browser](https://developers.meta.com/vr/documentation/web/browser-mqdh/) to send the URL and capture actual footage if useful. Test the production HTTPS URL as well as local development. Local certificates and emulation should not be necessary for judges.

For this sequence, keep controllers unpaired/off. Stay seated with every physical interaction in an approximately 2ft radius. Use both hands where appropriate and repeat with the non-dominant hand.

| Step | Expected result | Result |
| --- | --- | --- |
| Open the hosted URL using headset hand controls | Entry and browser interaction require no paired controller. | Pending |
| Enter immersive mode and dismiss onboarding | Permission/error states are understandable; hand selection starts the experience. | Pending |
| Create a task with the pinch keyboard | All characters, space, deletion, cancellation, and confirmation work without physical keyboard/controller. | Pending |
| Select task and duration | Selection is clear, targets are readable and forgiving. | Pending |
| Start a 2-minute session | Timer advances consistently; app has no uncontrolled movement. | Pending |
| Pause, wait, resume | Paused time is excluded; resume is explicit. | Pending |
| Open browser/system UI, remove/re-wear headset, or background the session | Visibility loss pauses the session; return does not unexpectedly run/complete it. Test each supported lifecycle path. | Pending |
| Put hands outside tracking volume, occlude fingers, then recover | No accidental clicks; recovery is clear and existing state survives. Note whether the session is still visible; hand loss alone and visibility loss are different conditions. | Pending |
| Recenter while seated | Workspace returns to a comfortable direction without corrupting tasks/timer. | Pending |
| Complete a real session | Completion occurs once, task/progress remains coherent, garden changes, and reward is visible. | Pending |
| Return for a second session | Saved state and reward loop work; task entry remains available. | Pending |
| Exit and enter VR again | Clean exit, explicit restart/resume policy, no duplicate UI/input handlers. | Pending |

Also test darker/bright indoor lighting, hands resting low, one-hand use, shaky/slow pinches, repeated quick pinches, and different seated heights. Record failures rather than assuming hand tracking behaves like a mouse. No medical or accessibility certification is implied by these checks.

## Performance and comfort

Follow [Meta's WebXR performance workflow](https://developers.meta.com/vr/documentation/web/webxr-perf/). Use a physical Quest performance tool appropriate to Browser and record the method; desktop requestAnimationFrame rates and emulator statistics cannot establish headset performance.

- [ ] Measure cold start and a continuous 8-minute session on the intended release device(s).
- [ ] Measure while typing on the spatial keyboard, updating timer, and rendering a grown garden.
- [ ] Record sustained/minimum fps, frame-time spikes, thermal behavior, and console errors. Meet the competition's **minimum 60 fps** and aim for a stable device-supported refresh rate.
- [ ] Test essential controls/text with narrower FoV and different Quest models if available; disclose untested models.
- [ ] Readability and pinch targets remain comfortable without leaning, standing, reaching behind, or moving the chair.
- [ ] No artificial locomotion, flashing surprise, or mandatory sound; pause and exit remain easy to find.

## Deployment smoke test and freeze

- [ ] HTTPS works from a clean Quest Browser session, with no login/payment gate.
- [ ] Application, SDK hand assets, fonts, scene assets, and relative paths load on the final GitHub Pages subpath (if used).
- [ ] Refresh and direct navigation preserve a usable entry point; content type and WebXR permissions are correct.
- [ ] No debug-only emulation/control panel is exposed in the production judging experience.
- [ ] Final public video and app URL work while signed out.
- [ ] Record exact deployed commit and build hash; retain the build artifact.
- [ ] Manual deployment is frozen after the contest deadline; no later source or dependency change alters the judging URL.

