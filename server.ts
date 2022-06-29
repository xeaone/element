import { File, Cors, Server, Router, Handler, Normalize } from '../server/mod.ts';

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

// router.get('/element/*', context => {
//     context.url.pathname = context.url.pathname.startsWith('/element') ? context.url.pathname.slice('/element'.length) : context.url.pathname || '/';
//     return file.handle(context);
// });

handler.add(normalize);
handler.add(cors);
handler.add(router);

Server(request => handler.handle(request), { port });

console.log(`listening on port: ${port}`);
