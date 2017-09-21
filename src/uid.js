
var COUNT = 0;

export default function Uid () {
	return (Date.now().toString(36) + (COUNT++).toString(36));
}
