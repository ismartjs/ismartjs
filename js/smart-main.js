/**
 * Created by Administrator on 2014/6/12.
 */
$(function () {
    window.Page = {};
    var href = window.location.href;
    var hash;
    if (href.indexOf("#") != -1) {
        hash = href.substring(href.indexOf("#") + 1);
    }

    Page.Main = {
        menuUrl: "json/menu.json",
        defaultIcon: "glyphicon glyphicon-file",
        topbarRightUrl: "topbar-right.html",
        topbarLeftUrl: "topbar-left.html",
        historyListener: {
            onPush: function (url) {
                history.replaceState(null, null, "#" + url);
            },
            onGet: function () {
                return hash;
            }
        }
    };
    Smart.UI.loadTemplate("js/plugins/ui-template.html");
    Smart.of($("body")).make();

});