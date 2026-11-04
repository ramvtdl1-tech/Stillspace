# Stillspace Afterlight submission kit

The project text below is ready to paste into Devpost after the entrant reviews the final release. The application is built; this file does not establish that a contest entry was submitted. Exact links and entrant declarations are tracked in [entry.json](../submission/entry.json). Any field marked pending must be completed using real evidence.

## Title and tagline

**Stillspace Afterlight — a night garden for focus**

A seated, hands-first night garden. Choose one intention, follow the lit trail, and leave a lantern behind.

**Track:** Productivity. **Proposed division:** New Experience, subject to entrant confirmation that the project was conceived and built during the competition window. **Language:** English. **Target:** Meta Quest with hand tracking and a WebXR-compatible browser.

## Inspiration

There are useful moments between meetings, before the day begins, and when a long day needs a clear ending. Those moments are easily lost to a busy task list. Stillspace gives them a small ritual: bring one intention into view, choose a short interval, and spend a few uninterrupted minutes with it. A twilight diorama turns elapsed focus time into a trail of lights. The garden keeps a lantern from each completed session until its twelve visible positions are filled.

## What it does

Stillspace is a compact virtual workspace designed to be used while seated. Pointing and pinching operate the task list, timer, navigation, sound controls, recentering, and exit. A spatial keyboard supports task entry and a short reflection note inside VR. No controller is required for the intended focus loop.

Choose a two-, five-, or eight-minute session. Pause or resume deliberately. When the application or immersive session loses visibility, the running timer pauses; returning does not silently restart it. Completing a session records progress once and lights a lantern in the Night Grove. Marking the task done is a separate choice, so one task can take several focus sessions.

Tasks, notes, and progress stay in the current browser profile. The workspace supports eight intentions of up to 72 characters, a 500-character reflection note, and the latest 500 completed sessions. The garden displays up to twelve lanterns; totals and streaks reflect retained history. A desktop companion provides the same task and timer model, plus local backup export, validated backup import, and explicit data erasure. Optional sound is synthesized by the app.

## How it was built

Stillspace began as a new application during the competition window using the official public Immersive Web SDK standard scaffold. It uses IWSDK 1.1.0-rc.2, TypeScript, and Vite. App-specific task and timer logic, desktop and spatial interfaces, the pinch keyboard, and the procedural night diorama were newly authored for this experience. SDK and rendering dependencies retain their own licenses and notices.

The spatial controls use the SDK's hand-ray selection path. The interface stays in a stationary world-space arrangement rather than following every head movement; recentering places it in front of the seated user. The scene uses original procedural geometry, and the core application works without an AI API, media platform, account service, or backend.

## Challenges and learning

The main design challenge was deciding how little should be on screen. A focus ritual should be easy to enter, easy to pause, and easy to finish. We kept essential controls central, used short sessions as the unit of progress, and added an in-world keyboard so the hands-first journey includes creating something of your own.

Reliability mattered as much as the visual setting. Timer completion must award once; paused time must stay paused; reloading an interrupted session must not count time away; and a malformed backup must not replace valid data. The state model is independent of the renderer and is tested directly. Browser and XR emulator checks exercise the actual interfaces. Physical Quest comfort and sustained frame rate are separate release checks.

## Accomplishments

- A complete local focus loop, with task creation, short sessions, progress, reflection, and return visits.
- Shared state across desktop and spatial controls, including hand-operated text entry.
- Original procedural art and synthesized sound with a cohesive, restrained visual style.
- Reproducible source and static build, dependency notices, and manual release tooling.

## Future plans and target launch

The proposed wider public launch is **November 17, 2026, pending physical Quest validation and release review**. A hosted competition build may be available earlier. Future work could add more task organization, improved note editing, additional comfort/accessibility options, and richer history. These are plans, not claims about the submitted build. Work after the competition deadline must use a separate release and must not alter the judging version.

## Current scope and validation

The release uses fully immersive VR. It does not use passthrough, room scanning, eye tracking, physical-space anchors, cloud synchronization, or multiplayer. Saved garden progress is browser-local data, rather than an object anchored in the physical room. The release targets Quest; Meta VR Glasses compatibility is not claimed.

The recorded local results are in [TESTING.md](TESTING.md). Automated state, desktop/mobile, and emulated hand-interaction checks passed on the earlier validated build. The final release must retain a matching validation record. **Physical Quest interaction, comfort, and the competition's minimum 60 fps remain unverified until measured on a headset.**

## Judge testing instructions

Use the final free HTTPS application link from `submission/entry.json`. The desktop view is a useful preview; use Quest Browser and an active immersive session to evaluate hands-first interaction. Allow approximately four minutes for the short complete-session path.

1. Enable hand tracking, put controllers aside, and sit comfortably. Open the application URL in Quest Browser. No application account, payment, or API key is needed. If hosting adds an access gate, the release link is not ready for judging until the gate is resolved.
2. Select **Enter your space in VR**, approve the browser's immersive-session request, and read the in-world introduction. Point at **Enter the grove** and pinch thumb and index finger to select. Use **Recenter** after settling into your seat.
3. Open **Intentions**, select **+ New intention**, and use the spatial keyboard to type a short task. **Space**, **Delete**, **Cancel**, and **Save intention** are available. Save, then select the new intention to return to Focus.
4. Select **2 min**, then **Begin a little moment**. Select the same main button to pause. Wait briefly, confirm the timer stays paused, then resume. A running or paused session keeps its task and duration fixed; use **Reset** first if you want to choose something else.
5. Select **Grove** to keep the running countdown in view while the rest of the workspace recedes. Watch the stones light along the path. Let the timer finish naturally and confirm that one lantern appears. Select **Mark intention done** when you consider the task finished. A completed focus session does not automatically mark a task done.
6. Open **Field notes**, select **Write a field note**, enter a brief reflection, and save. View the retained session/minute/streak summary. The **Focus**, **Intentions**, **Grove**, **Field notes**, and **Help** dock remains available.
7. Start another moment, then select **Save & exit**. The timer pauses and the desktop view returns. Enter VR again and resume explicitly, or refresh and confirm that the local workspace is retained with the timer paused.

Optional desktop checks: add/select an intention, inspect **Lantern log**, export a backup under **Settings & your data**, and import it into a dedicated test profile. Import replaces the current workspace after validation. **Clear local data** requires confirmation and returns to three starter intentions and a fresh garden. Do not erase a workspace you need without a backup.

If VR cannot start, record the device/browser version and displayed error. A desktop screenshot cannot establish physical tracking or frame-rate performance. Use [TESTING.md](TESTING.md) for the extended lifecycle, tracking-loss, FoV, and performance tests.

## Demonstration — maximum 2:45

The film must show actual Quest or equivalent XR emulator footage. If using IWER, label it clearly as **Quest 3 emulator footage**; do not imply a physical-device test. An English voiceover or captions can use [narration.txt](../submission/narration.txt). No generated gameplay footage is needed.

| Time | Actual footage | Message |
| --- | --- | --- |
| 0:00–0:15 | Open on the real task, timer, and garden. | One intention, a few quiet minutes, a visible return. |
| 0:15–0:35 | Enter VR, dismiss onboarding, show a real pinch selection. | Seated use and the hand interaction model. |
| 0:35–1:00 | Create a short task with the spatial keyboard, then select it. | Text entry is part of the immersive journey. |
| 1:00–1:25 | Choose 2 min; start, pause, and resume with actual controls. | Short sessions and deliberate interruption handling. |
| 1:25–1:55 | Show the running timer and genuine session completion. Use a clearly labeled time cut if needed. | A completed session records once and lights a lantern. |
| 1:55–2:20 | Show field notes and the retained summary. | A useful return visit, with local data. |
| 2:20–2:45 | Recenter, start a moment, and exit; show its paused state. End on the app title. | A complete small moment, easy to leave and return to. |

If a behavior is not captured, omit its claim from narration. Never shorten a timer by modifying application state for the film; record real completion and label any edit that removes elapsed time. Keep the final uploaded video strictly under three minutes.

## Media and link checklist

- [ ] Free HTTPS judge URL tested while signed out and on Quest; exact URL recorded in `entry.json`.
- [ ] Public YouTube or Vimeo link, under three minutes, tested while signed out and recorded in `entry.json`. A local video file is useful but does not fulfill the public video-link requirement.
- [ ] Cover/screenshot of the real focus garden and timer, captured from the final build.
- [ ] Screenshot of actual in-world hand UI or task keyboard, correctly labeled as headset or emulator footage.
- [ ] Optional progress screenshot after a genuine completed session.
- [ ] Captions/narration match the visible build; no unsupported hardware, MR, eye-tracking, or performance claims.
- [ ] No identifiable non-entrant people, unrelated commercial advertising, stock footage presented as gameplay, or implied sponsor endorsement.
- [ ] Source commit, deployment version, artifact hashes, text, images, and video retained together.

## Final fields and freeze

| Field | Status / final value |
| --- | --- |
| Track | Productivity |
| Division | New Experience — entrant confirmation pending |
| Free HTTPS application URL | Pending final deployment and access test |
| Public YouTube or Vimeo URL | Pending public upload |
| Representative/team identity | Entrant supplied; pending |
| Eligibility, Start membership, developer access, funding/conflict declarations | Entrant confirmation pending |
| Physical Quest test record | Pending |
| Proposed wider launch | November 17, 2026, subject to validation |

Complete the entry before **November 18, 2026, 12:00 PST / November 19, 2026, 01:30 IST**. The entrant should register, review declarations, submit through Devpost, and retain the receipt. After the deadline, preserve the exact submitted app, URL, text, images, and video, and keep judge access available through the winner announcement (approximately December 11, 2026, subject to organizer updates). Use a separate release for later development. These obligations come from the [official rules](https://start-developer-competition-26.devpost.com/rules).
