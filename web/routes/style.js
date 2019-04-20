var title = 'Style';

export default {
    title: title,
    path: '/style',
    component: {
        name: 'r-style',
        model: {
            title: title,
            pretty: {
                color: 'blue'
            }
        },
        created: function () {
            var self = this;
            setTimeout(function () {
                self.model.pretty = { color: 'red' };
            }, 1000);
        },
        template: `
			<h2 o-text="title"></h2>
			<hr>

			<div o-style="pretty">I Am Blue</div>
		`
    }
};
