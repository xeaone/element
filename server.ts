import { File, Server, Router, Handler, Normalize } from 'https://deno.land/x/xserver/mod.ts';

const port = 8000;
const file = new File();
const router = new Router();
const handler = new Handler();
const normalize = new Normalize();

file.spa(true);
file.path('./web');
router.get('/*', context => file.handle(context));

handler.add(normalize);
handler.add(router);

Server(request => handler.handle(request), { port });

console.log(`listening on port: ${port}`);
