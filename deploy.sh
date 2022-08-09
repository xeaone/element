#!/bin/bash

# VERSION=$1
# if [ "$VERSION" = "" ]; then
#     echo 'Error version required'
#     exit
# fi

VERSION=$(git describe --tags $(git rev-list --tags --max-count=1))
VERSION=$(echo $VERSION | awk -F. -v OFS=. 'NF==1{print ++$NF}; NF>1{if(length($NF+1)>length($NF))$(NF-1)++; $NF=sprintf("%0*d", length($NF), ($NF+1)%(10^length($NF))); print}')
VERSION=$VERSION node deploy.js

rm web/404.html
cp web/index.html web/404.html

rm -r docs/*
cp -r web/. docs/.

npm publish --access public

git add .
git commit -m $VERSION
git push
git tag $VERSION
git push --tag