'use strict';

const Global = {};

Global.encoding = 'utf8';

Global.oTitlePlaceholderEnd = `<!--/o-title-placeholder-->`;
Global.oTitlePlaceholderStart = `<!--o-title-placeholder-->`;
Global.oTitlePlaceholder = `${Global.oTitlePlaceholderStart}${Global.oTitlePlaceholderEnd}`;

Global.oRouterPlaceholderEnd = '<!--/o-router-placeholder-->';
Global.oRouterPlaceholderStart = '<!--o-router-placeholder-->';
Global.oRouterPlaceholder = `${Global.oRouterPlaceholderStart}${Global.oRouterPlaceholderEnd}`;

Global.oScriptPlaceholderEnd = '<!--o-script-placeholder-->';
Global.oScriptPlaceholderStart = '<!--/o-script-placeholder-->';
Global.oScriptPlaceholder = `${Global.oScriptPlaceholderStart}${Global.oScriptPlaceholderEnd}`;

module.exports = Global;
