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
        defaultTabIcon: "glyphicon glyphicon-file",
        defaultMenuIcon: "",
        topbarRightUrl: "topbar-right.html",
        topbarLeftUrl: "topbar-left.html",
        bottomUrl: "main-bottom.html",
        layout: "layouts/main0.html",
        historyListener: {
            onPush: function (url) {
                history.replaceState(null, null, "#" + url);
            },
            onGet: function () {
                return hash;
            }
        }
    };
    Smart.UI.loadTemplate("ui-template.html");
    Smart.of($("body")).make();

});