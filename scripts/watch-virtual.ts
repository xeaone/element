import { basename } from '@std/path';

const handle = async (path: string) => {
    console.log('building:', path);

    const data = (
        await Deno.readTextFile(`source/virtual/${path}`)
    ).replace(
        /([}]\s*from\s*['"].*?)(['"];)$/gm,
        '$1.ts$2',
    );

    await Deno.writeTextFile(`tmp/virtual/${path}`, data);
};

(async () => {
    const entries = Deno.readDir('source/virtual');
    for await (const entry of entries) {
        await handle(entry.name);
    }
})();

const watcher = Deno.watchFs('source/virtual');
for await (const event of watcher) {
    if (!['create', 'modify', 'remove'].includes(event.kind)) continue;
    for (const path of event.paths) {
        await handle(basename(path));
    }
}
