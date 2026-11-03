/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { defineAssets } from '@iwsdk/core';
import { createGarden, createSprout } from './scene-assets/garden.scene-asset.js';

export default defineAssets({ garden: createGarden(), sprout: createSprout() });
