
var Uid = {};

Uid.count = 0;

Uid.generate = function () {
	return (Date.now().toString(36) + (this.count++).toString(36));
};

export default Uid;
