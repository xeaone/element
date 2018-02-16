'use strict';

const Global = {};

Global.encoding = 'utf8';

Global.oRouterPlaceholderEnd = '<!--/o-router-placeholder-->';
Global.oRouterPlaceholderStart = '<!--o-router-placeholder-->';
Global.oRouterPlaceholder = `${Global.oRouterPlaceholderStart}${Global.oRouterPlaceholderEnd}`;

Global.oScriptPlaceholderEnd = '<!--o-script-placeholder-->';
Global.oScriptPlaceholderStart = '<!--/o-script-placeholder-->';
Global.oScriptPlaceholder = `${Global.oScriptPlaceholderStart}${Global.oScriptPlaceholderEnd}`;

module.exports = Global;
