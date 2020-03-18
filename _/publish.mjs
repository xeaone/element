import Util from 'util';
import Package from './package.json';
import ChildProcess from 'child_process';

const Exec = Util.promisify(ChildProcess.exec);

(async function () {

    const commands = [
        'npm run dev',
        'npm run dst',
        'rm -r ./docs/*',
        'muleify -p ./web ./docs',
        'git add .',
        `git commit -m "${Package.version}"`,
        'git push',
        'npm publish'
    ];

    for (const command of commands) {

        const { stdout, stderr } = await Exec(command);

        if (stdout) console.log(stdout);
        if (stderr) console.warn(stderr);

    }

}()).catch(console.error);
