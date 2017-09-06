
var counter = 0;

export default function Uid () {
	return (Date.now().toString(36) + (counter++).toString(36));
}
