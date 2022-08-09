#/bin/bash

trap clean INT
clean() {
    pkill -P $$
    trap - INT
    exit
}

rm web/404.html
cp web/index.html web/404.html

node watch.js & \
deno run --watch --allow-net --allow-read ./server.ts

return 0