var Path = require('path')
var Fs = require('fs')

Fs.readdir(Path.join(__dirname, 'setup'), function (error, files) {
	if (error) throw error

	files.forEach(function (file) {

		Fs.readFile(Path.join(__dirname, 'setup', file), 'utf8', function (error, data) {
			if (error) throw error;

			file = file.replace('.js', '');
			var char = file.slice(0,1).toUpperCase();
			file = char+file.slice(1)

			data = data.replace('export default', `export var ${file} =`);
			// data = data.replace(/\n$/, '');

			Fs.appendFile(Path.join(__dirname, 'setup.js'), data, function (error) {
				if (error) throw error;

			})
		})
	})
})
