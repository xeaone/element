
// await Deno.run({ cmd: ['deno', 'bundle', 'src/index.ts', 'pro/x-element.js'] }).status();
await Deno.run({ cmd: ['deno', 'bundle', 'src/index.ts', '../budget/web/x-element.js'] }).status();