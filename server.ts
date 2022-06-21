import { File, Cors, Server, Router, Handler, Normalize } from 'https://deno.land/x/xserver@0.0.6/mod.ts';

const port = 8000;
const file = new File();
const cors = new Cors();
const router = new Router();
const handler = new Handler();
const normalize = new Normalize();

file.spa(true);
file.path('./web');
cors.get('/x-router.js', '*');
cors.get('/x-element.js', '*');
router.get('/*', context => file.handle(context));

handler.add(normalize);
handler.add(cors);
handler.add(router);

Server(request => handler.handle(request), { port });

console.log(`listening on port: ${port}`);
