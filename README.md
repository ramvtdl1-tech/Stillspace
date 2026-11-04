# Stillspace Afterlight

Stillspace Afterlight is a seated, hands-first focus workspace for Meta Quest. Choose one intention, follow a trail of lights through a 2, 5, or 8 minute session, and light a lantern in your Night Grove.

This project targets **Productivity / New Experience**. The public judge build is available at [Stillspace](https://stillspace-quest-garden-26.cozyebony2.chatgpt.site/). Actual Quest hand interaction, comfort, and the competition's minimum **60 fps** remain release gates until measured on a physical headset. See [testing](docs/TESTING.md).

## Run locally

Use **Node 24 or newer**, with Node 24 selected by `.nvmrc`. The tests use Node's TypeScript stripping support. From this directory:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

`npm run dev` uses the IWSDK CLI to start the managed development browser and server. XR means the immersive headset session. The SDK's IWER browser emulator simulates headset and hand input for iteration; it does not prove physical-device behavior. See [the official testing guide](https://iwsdk.dev/guides/02-testing-experience.html).

```sh
npm run dev:status
npm run dev:down
npm run preview -- --host 127.0.0.1
```

Use `preview` after building to inspect the static production output. It is a local preview, not a public deployment. For a physical Quest use a trusted HTTPS hosted URL, or the SDK's documented local-device workflow. Do not launch a bare Vite development command when you need the SDK-managed emulator/tool bridge.

## The experience

- Point and pinch to operate the spatial interface; a custom pinch keyboard supports task entry inside VR.
- Keep up to **8 tasks**, with **72 characters** per task. Choose a task and a two-, five-, or eight-minute focus interval.
- Pause/resume intentionally. Losing page/session visibility pauses a running focus session. Reloading or importing a running timer restores it paused.
- The timer and spatial status panels use sage when ready, amber during focus, violet when paused, and mint on completion. Each state has a text label. The stepping stones light up as the timer runs and share the active phase color. Open **Grove** in VR for a quieter view with the countdown and lantern count. A completed session lights one lantern, with up to **12 visible lanterns**. History retains the most recent **500 sessions**; the displayed totals and streak are calculated from that retained history.
- Write a reflection note (up to **500 characters**) in VR or the desktop companion. The desktop companion also supports JSON backup export/import and local-data erasure. An import **replaces** the current workspace after validation; export first if you want to keep it.
- Sound is optional and synthesized. No AI API, account, external content service, or backend is required.

The release uses full VR. It does not claim passthrough, room scanning, eye tracking, physical-space anchors, multiplayer, or Meta VR Glasses support. Browser-local garden persistence is different from anchoring objects in a physical room. The desktop companion is useful on an ordinary browser; judge the hands-first experience in an active immersive session.

Tasks, notes, preferences, and retained sessions live in `localStorage` under `stillspace.v1`. Different origins/devices/profiles have separate data. Erasing local data resets to the initial workspace and fresh garden, including the three starter tasks. Read [privacy and local data](docs/PRIVACY.md) before using shared hardware.

## Build and release files

```sh
npm run typecheck
npm test
npm run build
node scripts/package-release.mjs
```

The packaging script needs the system `zip` program (standard on macOS and Ubuntu). It packages the current `dist/`; it does not build or claim tests passed. Outputs go to `artifacts/`:

- `stillspace-deploy.zip` — static site files at the archive root, plus release documentation/notices.
- `stillspace-source.zip` — app source, lockfile, configuration, docs, and release scripts; excludes dependencies, environment files, development state, and build output.
- `release.json` and `SHA256SUMS` — archive hashes, inventory, and source commit if available.

Keep the exact built files and hashes used for the judging URL. Do not treat a packaging timestamp or passing local checks as hardware certification. Never open `index.html` with `file://` to test WebXR: serve the files over HTTP locally or HTTPS publicly.

## Deploy to Vercel

1. Import the repository in Vercel. If this project stays inside the parent repository, set **Root Directory = `stillspace`**. If its contents are placed in their own repository, use the repository root (`.`).
2. Use install command `npm ci`, build command `npm run build`, and output directory `dist`. The included `vercel.json` sets these and WebXR-compatible headers. No environment variables or server functions are required.
3. Deploy, then open the resulting HTTPS URL directly in Quest Browser and complete [the deployment smoke test](docs/TESTING.md#deployment-smoke-test-and-freeze). Ensure the judge URL is free and accessible while signed out; any host deployment protection must allow judges access.
4. Pin the final submission deployment. Disconnect/disable automatic production redeploys, or use a separate frozen project/domain before the deadline. Later commits must not replace the judging build.

The headers permit same-origin WebXR spatial tracking and fullscreen while disabling camera, microphone and geolocation APIs the app does not use. No cross-origin isolation/COEP requirement is added. The host supplies HTTPS. See [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json).

## Deploy to GitHub Pages

The included `.github/workflows/pages.yml` assumes **Stillspace is the repository root**. GitHub will not discover a workflow nested inside `stillspace/.github` in a larger parent repository. Copy/extract the entire Stillspace project, including dotfiles, into its own repository before using this workflow, or deliberately adapt it at the parent repository root with the correct working directory and paths.

1. Push that project repository and select **Settings → Pages → Source → GitHub Actions**.
2. Open **Actions → Deploy Stillspace to GitHub Pages → Run workflow** on the selected release branch. The workflow runs install, typecheck, tests, build, upload, and Pages deployment.
3. Open the reported HTTPS page URL directly in Quest Browser. The Vite relative base supports a repository subpath; test the exact deployed path and its assets.
4. Record the release commit and resulting URL. The workflow has **only `workflow_dispatch`**, with no push or scheduled trigger. After the deadline, do not dispatch it again or change the hosted judging version.

GitHub Pages ignores `_headers` and `vercel.json`; its platform headers apply. Same-origin WebXR is permitted by the browser's default spatial-tracking policy, but the final Quest smoke test is still required. See [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Other static hosts

Deploy the contents of `dist/`, or extract `stillspace-deploy.zip` as the static root, on an HTTPS host. `public/_headers` is copied into the build for hosts that support the Netlify/Cloudflare Pages `_headers` format. Do not upload `src/`, `node_modules/`, `.env` files, or emulator state as the public site. Any host configuration must leave WebXR spatial tracking available to the app's own origin. Test every chosen host on Quest.

## Competition handoff

- [Rules, judging alignment and eligibility gates](docs/COMPETITION.md)
- [English Devpost draft and actual-footage storyboard](docs/SUBMISSION.md)
- [Build, hands-only, tracking-loss, FoV and performance testing](docs/TESTING.md)
- [Privacy and local data](docs/PRIVACY.md)
- [Third-party software notices](docs/THIRD_PARTY_NOTICES.md)

The [official rules](https://start-developer-competition-26.devpost.com/rules) require a hosted WebXR link and a public YouTube/Vimeo demonstration under three minutes using actual Quest or equivalent emulator footage. Eligibility, Meta VR Start membership, final footage, physical-device validation, public deployment, and Devpost entry remain the entrant's release steps.

Deadline: **November 18, 2026, 12:00 PST / November 19, 2026, 01:30 IST**. Freeze the submitted project and materials at the deadline and keep the judging version free and reachable through the winner announcement (approximately December 11, 2026, subject to organizer updates).

## Project layout

`iwsdk.config.json` controls SDK scene/world/input features. `src/state.ts` owns the standalone focus model. Other `src/` modules implement the desktop/spatial interfaces and garden. `public/` contains self-hosted runtime assets. `tests/` covers meaningful state-machine and data-validation behavior. `docs/` contains the release and submission handoff.

The application starts from the official public IWSDK standard scaffold; its task/focus loop and garden experience are newly authored. Underlying dependencies retain their licenses and notices. There is no implied affiliation or endorsement by the competition sponsor.
