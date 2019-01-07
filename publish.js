const Package = require('./package.json');
const Util = require('util');
const ChildProcess = require('child_process');

const Exec = Util.promisify(ChildProcess.exec);

(async function() {

	const commands = [
		'node build.js',
		'rm -r ./docs/*',
		'muleify -p ./web ./docs',
		'git add .',
		`git commit -m "${Package.version}"`,
		'git push',
		'npm publish'
	];

	for (const command of commands) {

		const { error, stdout, stderr } = await Exec(command);

		if (error) console.error(error);
		if (stdout) console.log(stdout);
		if (stderr) console.warn(stderr);

	}

}()).catch(console.error);
