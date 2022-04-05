#/bin/bash

trap clean INT
clean() {
    pkill -P $$
    trap - INT
    exit
}

deno bundle --watch src/element/element.ts web/x-element.js & \
deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts ./web -p 8080

return 0