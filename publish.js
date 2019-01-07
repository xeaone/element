const Package = require('./package.json');
const ChildProcess = require('child_process');

const command = [
	'node build.js',
	'rm -r ./docs/*',
	'muleify -p ./web ./docs',
	'git add .',
	`git commit -m "${Package.version}"`,
	'git push',
	'npm publish'
].join(' && ');

ChildProcess.exec(command, function (error, stdout, stderr) {
	if (error) console.error(error);
	if (stdout) console.log(stdout);
	if (stderr) console.warn(stderr);
});
