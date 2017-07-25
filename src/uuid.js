// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

export default function (length) {
	var uuid = [], i;

	if (length) {

		for (i = 0; i < length; i++) {
			uuid[i] = chars[0 | Math.random() * length];
		}

	} else {

		// rfc4122, version 4 form
		var r;

		// rfc4122 requires these characters
		uuid[8] = '-', uuid[13] = '-', uuid[14] = '4', uuid[18] = '-', uuid[23] = '-';

		// Fill in random data. At i==19 set the high bits of clock sequence as per rfc4122, sec. 4.1.5
		for (i = 0; i < 36; i++) {
			if (!uuid[i]) {
				r = 0 | Math.random() * 16;
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
			}
		}

	}

	return uuid.join('');
}

// https://gist.github.com/jed/982883
// function uuid (a) {
// 	return a                 // if the placeholder was passed, return
// 		? (                  // a random number from 0 to 15
// 			a ^              // unless b is 8,
// 			Math.random()	 // in which case
// 			* 16             // a random number from
// 			>> a / 4         // 8 to 11
// 			).toString(16)   // in hexadecimal
// 		: (                  // or otherwise a concatenated string:
// 			[1e7] +          // 10000000 +
// 			-1e3 +           // -1000 +
// 			-4e3 +           // -4000 +
// 			-8e3 +           // -80000000 +
// 			-1e11            // -100000000000,
// 			).replace(       // replacing
// 				/[018]/g,    // zeroes, ones, and eights with
// 				uuid         // random hex digits
// 			);
// }
