import { increment, ReleaseType } from '@std/semver';
import { copy, emptyDir } from '@std/fs';

// const [release] = Deno.args;
// if (!release) {
//     console.warn('argument required: major, minor, patch');
//     Deno.exit();
// }

const f = await (new Deno.Command('git', { args: ['fetch'] }).spawn()).output();
if (!f.success) {
    console.warn('git auth check failed');
    Deno.exit();
}

const n = await (new Deno.Command('npm', { args: ['whoami'] }).spawn()).output();
if (!n.success) {
    console.warn('npm auth check failed');
    Deno.exit();
}

const [ version ] = Deno.args;
if (!version) {
    console.warn('version required');
    Deno.exit();
}

const dc = JSON.parse(await Deno.readTextFile('deno.json'));
const nc = JSON.parse(await Deno.readTextFile('package.json'));

dc.version = version;
nc.version = version;

// const proceed = confirm(`Do you want to deploy version ${version}?`);
// if (!proceed) Deno.exit();

await Deno.writeTextFile('deno.json', JSON.stringify(dc, null, '    '));
await Deno.writeTextFile('package.json', JSON.stringify(nc, null, '    '));

await copy('public/index.html', 'public/404.html', { overwrite: true });
await copy('public/index.html', 'public/guide/index.html', { overwrite: true });
await copy('public/index.html', 'public/security/index.html', { overwrite: true });

await emptyDir('docs/');
await copy('public', 'docs', { overwrite: true });

await (new Deno.Command('git', { args: ['commit', '-a', '-m', version] }).spawn()).output();
await (new Deno.Command('git', { args: ['push'] }).spawn()).output();
await (new Deno.Command('git', { args: ['tag', version] }).spawn()).output();
await (new Deno.Command('git', { args: ['push', '--tag'] }).spawn()).output();

await (new Deno.Command('npm', { args: ['publish', '--access', 'public'] }).spawn()).output();
