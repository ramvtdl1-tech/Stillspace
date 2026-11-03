# Stillspace privacy and local data

Stillspace is designed as a local personal workspace. The application does not require an account or an external AI service. Task names, reflection note, focus/session progress, garden progress, and preferences are stored in the browser profile using localStorage under `stillspace.v1`. There is no application database or automatic cloud synchronization. The workspace supports 8 tasks of up to 72 characters, a note of up to 500 characters, and the most recent 500 completed sessions. Displayed progress totals and streak are derived from those retained sessions.

Browser storage belongs to the current site origin and profile. Another browser/device starts with separate data. Clearing site data, using a private session, changing the hosted origin, or browser storage eviction can remove progress. An unavailable/full storage area can prevent persistence. Use the desktop export feature to retain a copy before relying on stored tasks.

Exports are user-created local files. An import reads a file selected by the user and **replaces** the current workspace with validated app data; export first to keep the current data. A running timer is restored paused. The app does not intentionally upload those files. Exports may contain task text, notes and progress, so review them before sharing. The app's erase action resets the local workspace and garden, restoring the three starter tasks. Browser site-data settings can remove local storage entirely; the next visit creates a fresh initial workspace.

The browser and headset runtime supply hand/pose input needed for the immersive interaction. Stillspace does not intentionally record, retain, or transmit raw hand, head, eye, camera, room-scan, or biometric data. It does not request room scanning, passthrough camera access, or eye tracking. The application's local session/progress data is different from raw tracking data.

The optional feedback sound is synthesized by the application. No microphone permission, voice recording, advertising SDK, or app analytics is part of the intended app behavior. Check the actual production network requests before release, especially after dependency updates.

Hosting providers and the browser/headset platform may process ordinary connection information such as IP addresses, user agents, access logs, or diagnostics under their own policies. This document describes the app's behavior, not those services. Development tools/emulators have their own permissions and should not be confused with production app data collection.

The entrant should review this notice against the final release, hosting setup, and applicable disclosure requirements before publication. Add the actual operator/contact information to any public policy if required. Do not enter confidential or sensitive information into a competition demo or a shared headset profile.

