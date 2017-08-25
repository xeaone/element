
export default function Extend () {

	// variables
	var extended = {};
	var deep = false;
	var i = 0;
	var length = arguments.length;

	// check if a deep merge
	if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
		deep = arguments[0];
		i++;
	}

	// nerge the object into the extended object
	var merge = function (obj) {
		for ( var prop in obj ) {
			if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
				// If deep merge and property is an object, merge properties
				if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
					extended[prop] = Extend( true, extended[prop], obj[prop] );
				} else {
					extended[prop] = obj[prop];
				}
			}
		}
	};

	// loop through each object and conduct a merge
	for (i; i < length; i++ ) {
		var obj = arguments[i];
		merge(obj);
	}

	return extended;

}
