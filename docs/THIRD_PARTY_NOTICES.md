# Third-party software and content

Stillspace's app-specific task/session logic, interaction flow, and procedural visuals are newly authored for this project during the competition window. It uses the public IWSDK standard scaffold and licensed software dependencies. Use of a standard scaffold is disclosed here; the repository is not a claim that SDK/library code was authored by the entrant.

No stock gameplay video, identifiable non-entrant people, third-party commercial advertising, or AI-generated gameplay footage is required by the project. App feedback audio is intended to be synthesized. Remove any unused scaffold demo assets from the release. A final release asset inventory should be reviewed before submission.

## Direct dependency inventory

The lockfile is the authority for exact resolved dependencies. The following package license metadata was inspected locally during development; verify it after any dependency change and retain notices for all redistributed transitive libraries/assets as well.

`scripts/generate-notices.mjs` generates `public/third-party-licenses.txt` from the installed production dependency closure represented in the lockfile. This is a conservative inventory: it may include packages removed from the final JavaScript by tree shaking. It preserves available installed notice files and flags missing-license material explicitly. Review and resolve any such markers before release; an inventory alone is not proof of a complete license review. The generated public file accompanies static builds and should remain available when the site is deployed.

| Package | Purpose | Inspected license |
| --- | --- | --- |
| `@iwsdk/core` 1.1.0-rc.2 | Immersive runtime, scene and input infrastructure | MIT |
| `@iwsdk/cli`, `@iwsdk/reference`, `@iwsdk/vite-plugin-dev` 1.1.0-rc.2 | Development, reference and build tooling | MIT (verify shipped package notice) |
| `@pmndrs/uikit`, `@pmndrs/uikit-horizon`, `@pmndrs/uikit-lucide` | Spatial UI/toolkit | Package license files contain MIT-form grants; retain their complete files. |
| `three` alias to `super-three` 0.185.0 | 3D rendering, re-exported by IWSDK | MIT |
| `vite` | Development and production bundling | MIT |
| `typescript` | Type checking/build development | Apache-2.0 |
| `@meta-quest/metavr` | Development tool, not an app feature | Meta Platform Technologies SDK License; review its terms before use/distribution. |

The dependency inventory is not a blanket grant for every optional asset or transitive package. Do not infer an asset's license from its filename, or assume a development tool must be shipped. Preserve package license files and any required font/icon/asset notices when packaging. Review the final production bundle and public folder for unused template content and external URLs.

References: [official IWSDK source](https://github.com/facebook/immersive-web-sdk), [UIKit source](https://github.com/pmndrs/uikit), [super-three source](https://github.com/supermedium/three.js), [Meta development tools](https://github.com/meta-quest/agentic-tools).

## IWSDK MIT notice

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## UIKit notices

Copyright 2024 Bela Bohlender

Copyright 2023 Coconut Capital

Copyright (c) 2025 Meta Platforms LLC

For each copyright holder above, the following grant and disclaimer apply:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Three.js / super-three MIT notice

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## License texts recovered from upstream

The notices generator includes version-matched overrides because some published packages omit their license files. Copies are preserved under `scripts/license-overrides/` with their source URLs in `manifest.json`; notice generation itself remains offline.

| Package | Evidence included |
| --- | --- |
| `yoga-layout` 3.2.1 | Exact MIT license from the [official v3.2.1 source](https://github.com/facebook/yoga/blob/v3.2.1/LICENSE). |
| `@sentry/server-utils` 10.78.0 | Exact MIT license from the [official 10.78.0 source](https://github.com/getsentry/sentry-javascript/blob/10.78.0/LICENSE); packaged third-party notices are also retained. |
| `railroad-diagrams` 1.0.0 | Exact CC0 declaration from the header of the installed version's `railroad-diagrams.js`, associated with the [official source repository](https://github.com/tabatkins/railroad-diagrams). |

`@drawcall/uikitml` 0.1.8 does not declare a license in its installed package, and the [exact v0.1.8 upstream tree](https://github.com/drawcall-ai/uikitml/tree/c82fe59144d515a325add968309b3f18f9924d6c) contains no license/notice file. No license is inferred. Stillspace does not use UIKitML: the production client replaces that import with a project-owned disabled adapter, and its build gate rejects included `@drawcall/uikitml` modules. The installed upstream package remains available to SDK/build tooling; do not copy it into the distributed app. If future work enables UIKitML, obtain and document appropriate licensing evidence before removing the exclusion.

Run `node scripts/generate-notices.mjs --strict` to reject missing license text for packages in the inventory, apart from the explicit client-distribution exclusion. Passing this check verifies the stated inventory, not every possible copyright or submission obligation.
