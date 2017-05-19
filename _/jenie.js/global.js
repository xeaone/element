
module.exports = {

	// sViewElement: 'j-view',

	sPrefix: '(data-)?j-',
	sValue: '(data-)?j-value',
	sFor: '(data-)?j-for-(.*?)=',

	sAccepts: '(data-)?j-',
	sRejects: '^\w+(-\w+)+|^iframe|^object|^script',

	rPath: /\s?\|(.*?)$/,
	rPrefix: /(data-)?j-/,
	rValue: /(data-)?j-value/,
	rModifier: /^(.*?)\|\s?/,
	rFor: /(data-)?j-for-(.*?)=/,

	rAccepts: /(data-)?j-/,
	rRejects: /^\w+(-\w+)+|^iframe|^object|^script/,

	rAttributeAccepts: /(data-)?j-/,

	rElementAccepts: /(data-)?j-/,
	rElementRejectsChildren: /(data-)?j-each/,
	rElementRejects: /^\w+(-\w+)+|^iframe|^object|^script/

};
