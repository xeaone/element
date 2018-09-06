
export default function (action, complete) {

	if (action && action.constructor.name === 'AsyncFunction') {

		return Promise.resolve().then(function () {
			return action();
		}).then(function (data) {
			if (complete) {
				return complete(data);
			}
		}).catch(console.error);

	} else {
		var result = action();

		if (result && result.constructor.name === 'Promise') {

			return Promise.resolve().then(function () {
				return result;
			}).then(function (data) {
				if (complete) {
					return complete(data);
				}
			}).catch(console.error);

		} else {
			if (complete) {
				return complete(result);
			}
		}

	}

}
