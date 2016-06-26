/**
 * Created by Administrator on 2014/6/17.
 */
(function ($) {
    var zIndex = 1000;
    var UI_TEMPLATE = {};
    Smart.UI = {
        /**
         * config: uiTemplateUrl, mainUrl, bootUrl
         * */
        booting: function (root, config) {
            this.root = root;
            this.config = config;
            var deferreds = [];
            var that = this;
            if (config.uiTemplateUrl) {
                deferreds.push(function () {
                    return that.loadTemplate(config.uiTemplateUrl);
                })
            }
            var $root = Smart.of(root);
            deferreds.push(function(){
                return $root.render();
            });
            var deferred = $.Deferred();
            Smart.deferredQueue(deferreds).done(function(){
                deferred.resolve($root);
            }).fail(function(){
                deferred.reject($root);
            })
            return deferred;
        },
        zIndex: function () {
            return zIndex++;
        },
        template: function (role) {
            return UI_TEMPLATE[role].clone();
        },
        loadTemplate: function (url) {
            return $.get(url, function (html) {
                html = $("<div />").append(html);
                $("*[s-ui-role]", html).each(function () {
                    var node = $(this);
                    UI_TEMPLATE[node.attr("s-ui-role")] = node;
                });
            });
        },
        backdrop: (function () {

            var BACKDROP_ZINDEX_STACK = [];

            var backdrop;

            var isShown = false;

            return function (show) {
                if (!backdrop) {
                    backdrop = $(Smart.UI.template('backdrop')).clone();
                    backdrop.appendTo("body");
                }
                var deferred = $.Deferred();
                show = show == undefined ? true : show;
                if (show) {

                    var zIndex = Smart.UI.zIndex();
                    BACKDROP_ZINDEX_STACK.push(zIndex);

                    backdrop.show().css("z-index", zIndex);
                    if (isShown) {
                        return deferred.resolve();
                    }

                    var callback = function () {
                        deferred.resolve();
                    };

                    isShown = true;

                    var doAnimate = $.support.transition;
                    if (doAnimate) backdrop[0].offsetWidth; // force reflow

                    backdrop.addClass('in');
                    doAnimate ?
                        backdrop
                            .one($.support.transition.end, callback)
                            .emulateTransitionEnd(150) :
                        callback()

                } else {
                    BACKDROP_ZINDEX_STACK.pop();
                    if (BACKDROP_ZINDEX_STACK.length) {
                        backdrop.css("zIndex", BACKDROP_ZINDEX_STACK[BACKDROP_ZINDEX_STACK.length - 1]);
                        return deferred.resolve();
                    }
                    var callback = function () {
                        if (!backdrop.hasClass('in')) {
                            backdrop.hide();
                        }
                        deferred.resolve();
                    };
                    isShown = false;
                    backdrop.removeClass('in');
                    $.support.transition ?
                        backdrop
                            .one($.support.transition.end, callback)
                            .emulateTransitionEnd(150) :
                        callback()

                }
                return deferred.promise();
            }
        })()
    };
})(jQuery);
