#/bin/bash

trap clean INT
clean() {
    pkill -P $$
    trap - INT
    exit
}

deno bundle --no-clear-screen --watch src/router/router.ts web/x-router.js & \
deno bundle --no-clear-screen --watch src/element/element.ts web/x-element.js & \
deno run --watch --allow-net --allow-read https://deno.land/std/http/file_server.ts ./web -p 8080

return 0