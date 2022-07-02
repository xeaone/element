#!/bin/bash

VERSION=$(git describe --tags $(git rev-list --tags --max-count=1))
VERSION=$(echo $VERSION | awk -F. -v OFS=. 'NF==1{print ++$NF}; NF>1{if(length($NF+1)>length($NF))$(NF-1)++; $NF=sprintf("%0*d", length($NF), ($NF+1)%(10^length($NF))); print}')

VERSION=$VERSION node deploy.js

rm -r docs/*
cp -r web/. docs/.

npm publish

git add .
git commit -m $VERSION
git push
git tag $VERSION
git push --tag

# VERSION=$1

# if [ "$VERSION" = "" ]; then
#     echo 'Error version required'
#     exit
# fi

# rm -r docs/*
# cp -r web/. docs/.

# deno bundle src/router/router.ts pro/x-router.js
# deno bundle src/element/element.ts pro/x-element.js

# BANNER=''
# BANNER="${BANNER}// Name: X Element\n"
# BANNER="${BANNER}// Version: ${VERSION}\n"
# BANNER="${BANNER}// License: MPL-2.0\n"
# BANNER="${BANNER}// Author: Alexander Elias\n"
# BANNER="${BANNER}// Email: alex.steven.elias@gmail.com\n"
# BANNER="${BANNER}// This Source Code Form is subject to the terms of the Mozilla Public\n"
# BANNER="${BANNER}// License, v. 2.0. If a copy of the MPL was not distributed with this\n"
# BANNER="${BANNER}// file, You can obtain one at http://mozilla.org/MPL/2.0/.\n"

# sed -i -e "1i${BANNER}" pro/x-router.js
# sed -i -e "1i${BANNER}" pro/x-element.js

# git add .
# git commit -m $VERSION
# git push
# git tag $VERSION
# git push --tag