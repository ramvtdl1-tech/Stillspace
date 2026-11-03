# Competition alignment and release gates

Stillspace is an original, seated, hands-first **Productivity / New Experience** project. Its core loop is to choose one task, complete a short focus session, and grow a small spatial garden. It uses full virtual reality (VR), rather than passthrough mixed reality. XR means the immersive headset session. Hands operate the task queue, custom keyboard, timer, and navigation through pointing and pinching.

This document is an implementation and submission checklist, not a determination of eligibility or legal compliance. The entrant and organizer must resolve the unchecked gates below. Nothing in this repository establishes that a headset test, publication, or contest submission has occurred.

## Authoritative requirements

The [official rules](https://start-developer-competition-26.devpost.com/rules) and [competition resources](https://start-developer-competition-26.devpost.com/resources) were reviewed on November 3, 2026, together with the rules supplied by the user. Organizer decisions and any updated official instructions control.

| Item | Requirement / planned response |
| --- | --- |
| Entry window | September 24, 2026, 10:00 PT through November 18, 2026, 12:00 PST. |
| Deadline in India | **November 19, 2026, 01:30 IST**. Allow time for uploading, checking links, and completing Devpost fields. |
| Judging | Approximately November 18–December 9, 2026; announcement approximately December 11, 2026. |
| Platform | A VR/MR application for Meta VR devices. This project uses publicly available IWSDK with WebXR. |
| Input | Entire experience must be usable using hands; controllers are optional. Desktop controls support development and data management. |
| Division | New Experience requires conception and build during the contest window. The app is newly authored during that window using the standard SDK scaffold and licensed dependencies, not an earlier app codebase. Entrant must confirm provenance. |
| Delivery | IWSDK/WebXR entries provide a free, accessible hosted application link. GitHub Pages or another host is permitted. The APK **Competition** release channel requirement applies to other-engine submissions, not this WebXR route. |
| Materials | English description, track/division, hosted link, and public YouTube/Vimeo demonstration under three minutes showing actual Quest or equivalent emulator footage. |
| Availability | Keep the submitted version free and available to judges through the winner announcement, including any announced delay. |
| Freeze | No changes to the submitted entry after the deadline. Freeze source, built files, URL, video, description, and configuration. |

## Eligibility — entrant must resolve

- [ ] Each participant was at least 18 and of majority age in their jurisdiction at the start of the entry period, and meets residency/sanctions restrictions in the rules.
- [ ] The submitter/authorized team representative is a Meta VR Start member by submission.
- [ ] Required Meta account/developer access is active by submission; the representative has authority to act for the team/organization.
- [ ] The representative submits no other entry as a solo entrant or representative. Non-representative participation is subject to the rules.
- [ ] No disqualifying employment, household relationship, political affiliation, contractual restriction, or conflict of interest applies.
- [ ] The project has not received separate Meta development funding or other disallowed financial/preferential support. Ask the organizer if the broad support language is unclear for your circumstances.
- [ ] Entrant confirms authorship, permission for dependencies/assets, and ability to grant the rights required by the rules.
- [ ] Register for the competition and complete every Devpost field before the deadline. Building or hosting alone does not enter the competition.

## Equally weighted judging criteria

Stage one screens viability, theme, and appropriate use of required tools/features. Stage two applies four criteria at **25% each**. The following maps the supplied rules to the intended design; it does not assign a score.

| Criterion | Stillspace response | Evidence needed before submission |
| --- | --- | --- |
| Innovation & Creativity — 25% | Spatial task selection, short focus ritual, and a persistent local garden that grows from completed sessions. Core behavior is independent of an external AI/media service. | Show the full loop and explain what spatial placement and hands contribute. |
| Experience Design — 25% | Seated/stationary use; task entry via pinch keyboard; 2/5/8 minute choices; narrow central workspace; clear pause, resume, and exit. | First-time hand-only test, 2ft-radius comfort test, readable controls on target headset. |
| Technical Implementation — 25% | Official IWSDK, hand input, local persistence, timer recovery, visibility-loss pause, restrained procedural scene. | Actual Quest measurements meeting the rules' **minimum 60 fps**, error-free repeated use, tracking-loss and lifecycle tests. |
| Polish & Presentation — 25% | Coherent visual direction, readable UI, optional synthesized sound, concise English onboarding and truthful demonstration materials. | Real app captures, complete Devpost fields, accurate claims and links. |

The implementation deliberately does **not** claim passthrough, room scanning/MRUK, eye tracking, persistent spatial anchors, multiplayer, or AI-agent behavior. Saved garden/task data is browser-local persistence, not persistent physical-space anchoring. The rules discuss gaze with Unity/Unreal ISDK v207+; that is not the WebXR SDK version used here. Passthrough would require a different design and room-aware validation before it could be claimed.

## Release gates

- [ ] Reproducible install, typecheck, tests, and production build completed against the release commit.
- [ ] All hardware checks in [TESTING.md](TESTING.md) completed with device/browser versions and evidence.
- [ ] **60 fps on Quest remains unverified until measured on a physical device.** Emulator or desktop performance is insufficient evidence.
- [ ] No-controller journey succeeds from opening the URL through onboarding, task entry, focus, pause/resume, completion, garden, recenter, and exit.
- [ ] English copy, original visuals/audio, dependency notices, and absence of third-party commercial advertising reviewed.
- [ ] Free HTTPS deployment checked on Quest, including assets, refresh, permissions, and anonymous judge access.
- [ ] Actual-footage video uploaded publicly and tested while signed out.
- [ ] Final source commit, artifact checksum, deployment URL, video URL, screenshots, and submitted text recorded.
- [ ] Manual GitHub Pages deployment workflow is used for the selected final version; no automatic redeploy is enabled after the freeze. Avoid dispatching it again after the deadline.
- [ ] Judge URL remains unchanged and reachable through the announcement. Work on later versions on a different branch and deployment.

## Tools appropriate to this route

Use IWSDK, TypeScript, Vite, the SDK CLI and its IWER browser emulator for iteration. IWER simulates immersive devices in a desktop browser; it does not prove physical headset comfort, hand accuracy, or frame rate. Meta Quest Developer Hub (MQDH) supports sending the app URL to a device, casting, and actual-footage capture. Unity/Unreal ISDK, native APK upload, and MRUK are not dependencies of this full-VR WebXR project.

Official references:

- [IWSDK project setup](https://developers.meta.com/vr/documentation/iwsdk/guides/01-project-setup/)
- [IWSDK testing guide](https://iwsdk.dev/guides/02-testing-experience.html)
- [IWSDK build and deploy guide](https://developers.meta.com/vr/documentation/iwsdk/guides/08-build-deploy/)
- [Using MQDH with Browser](https://developers.meta.com/vr/documentation/web/browser-mqdh/)
- [WebXR performance optimization](https://developers.meta.com/vr/documentation/web/webxr-perf/)
- [Meta agentic tools](https://github.com/meta-quest/agentic-tools)

