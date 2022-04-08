#/bin/bash

deno bundle src/router/router.ts pro/x-router.js
deno bundle src/element/element.ts pro/x-element.js

banner="
// Name: X Element
// Version: 7.0.0
// License: MPL-2.0
// Author: Alexander Elias
// Email: alex.steven.elias@gmail.com
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

"

echo "$banner$(cat pro/x-router.js)" > pro/x-router.js
echo "$banner$(cat pro/x-element.js)" > pro/x-element.js