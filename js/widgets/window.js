/**
 * Created by Administrator on 2014/6/11.
 */
(function ($) {
    var SCRIPT_RE = /<script((?:.|\s)*?)>((?:.|\s)*?)<\/script>/gim;
    var META_RE = /<meta(.*?)\/>/gim;
    var META_ITEM_RE = /(\S+)=(['"])([^\2]*?)\2/gi;

    var META_VALUE_RE = /\{%=(.*)%}/gi;

    var parseMeta = function (str) {
        var meta = {};
        str.replace(META_ITEM_RE, function ($0, $1, $2, $3) {
            meta[$1] = $3;
        });

        //特殊处理args参数
        if (meta.args && meta.args.length) {
            var argsStr = $.trim(meta.args);
            meta.args = [];
            $.each(argsStr.split(","), function (i, arg) {
                meta.args.push($.trim(arg));
            });
        }

        return meta;
    };
    var parseHtml = function (html) {
        var scriptTexts = [];
        var scriptSrcs = [];
        var meta = {};
        html = html.replace(META_RE, function ($0, $1) {
            meta = parseMeta($1);
            return "";
        });
        html = html.replace(SCRIPT_RE, function ($0, $1, $2) {
            var srcGroup = /src=(\S+)?/gi.exec($1);
            if (srcGroup && srcGroup.length == 2) {
                scriptSrcs.push(srcGroup[1].replace(/['"]/g, ""));
            }
            scriptTexts.push($2);
            return "";
        });
        return {
            meta: meta,
            html: html,
            scriptTexts: scriptTexts,
            scriptSrcs: scriptSrcs
        }
    };

    var process = function (result, href) {
        var html = result.html;
        var scriptTexts = result.scriptTexts;
        var applyArgs = Smart.SLICE.call(arguments, 2);
        var scripts = [];
        //处理模板
        var meta = result.meta;
        var argsScripts = [];
        var metaScripts = [];
        scripts.push("(function(){");
        scripts.push("    return function(){");
        if (meta.args) { //则说明有参数传递进来，传递参数依次对应arguments的位置1开始一次往后
            $.each(meta.args, function (i, arg) {
                var argStr = "var " + arg + " = arguments[" + i + "];";
                metaScripts.push("var " + arg + " = arguments[" + (i + 1) + "];");
                argsScripts.push(argStr);
                scripts.push(argStr);
            });
        }
        scripts.push("var S = this;");
        scripts.push(scriptTexts.join("\n"));
        scripts.push("			return function(key){");
        scripts.push("				try{");
        scripts.push("					key += ';//@ sourceURL=" + href + "_context.js'");
        scripts.push("					return eval(key);");
        scripts.push("				}catch(e){Smart.error(e);}");
        scripts.push("			};");
        scripts.push("		};");
        scripts.push("})();//@ sourceURL=" + href + ".js");
        if (meta.template == "true") {//如果需要模板化处理才进行模板化处理。不做统一全部处理
            var compiledFnBody = [];
            compiledFnBody.push("(function(){");
            compiledFnBody.push("   return function(){\n");
            compiledFnBody.push(argsScripts.join("\n"));
            compiledFnBody.push($.template.compile(html));
            compiledFnBody.push("   }");
            compiledFnBody.push("})();//@ sourceURL=" + href + "_template.js");
            var fn = eval(compiledFnBody.join("\n"));
            html = fn.apply(this, applyArgs);
            html = html.replace(/\n{2,}/gm, "\n");
        }
        //替换掉id,为id加上当前窗口的窗口id TODO 正则表达式无法匹配，采用jQuery的方法替换
        //html = this._tidyId(html);

        this._WNODE = $(html);

        //替换掉id,为id加上当前窗口的窗口id TODO 正则表达式无法匹配，采用jQuery的方法替换
        var that = this;
        this._WNODE.find("*[id]").add(this._WNODE.filter("*[id]")).each(function () {
            var id = $(this).attr("id");
            $(this).attr("id", that.trueId(id)).attr("_id_", id);
        });
        this.meta = meta;
        this.dataTable("window","meta", meta);
        var metaScript = metaScripts.join("\n");
        metaScript += "\n  try{\n return eval(arguments[0]);\n}catch(e){\nreturn null}";
        var metaScript = new Function(metaScript);
        $.each(meta, function (key, val) {
            if (key == 'args') {
                return;
            }
            meta[key] = val.replace(META_VALUE_RE, function ($0, $1) {
                return metaScript.apply(this, [$1].concat(applyArgs));
            });
        });

        var scriptFn = eval(scripts.join("\n"));
        var context = scriptFn.apply(this, applyArgs);
        this.setContext(context);
        this.setNode(this._WNODE);
        //处理锚点滚动
        if (href.indexOf("#") != -1) {
            var anchor = href.substring(href.indexOf("#"));
            this.scrollTo(anchor);
        }
    };

    var CURRENT_WINDOW_ID = 0;

    var ON_BEFORE_CLOSE_FN_KEY = "_onBeforeCloseFns_";
    var EVENT_ON_CACHE = "_EVENT_ON_CACHE";

    var STOP_ANCHOR_SCROLLIN_KEY = "_stop_anchor_scrollin_";

    Smart.widgetExtend({
        id: "window",
        options: "href"
    }, {
        onRun: function () {
            var deferred = $.Deferred();
            var options = this.options.window;
            if (options && options.href) {
                this.load(options.href).always(function () {
                    deferred.resolve()
                });
                return deferred.promise();
            } else {
                return deferred.resolve();
            }
        },
        onPrepare: function () {
            this._WINDOW_ID = "_w_" + (CURRENT_WINDOW_ID++);
            this[ON_BEFORE_CLOSE_FN_KEY] = [];
            this[EVENT_ON_CACHE] = [];
            if (!this.node.attr("id")) {
                this.node.attr("id", this._WINDOW_ID);
            }
        }
    },{
        refresh: function () {
            return this.load.apply(this, [this.currentHref()].concat(this.dataTable("window", "_loadArgs")));
        },
        currentHref: function(){
            return this.dataTable("window", "href");
        },
        load: function (href) {
            this._clean();
            this.dataTable("window", "loadState", true);//是否已经加载
            this.trigger("loading");
            var deferred = $.Deferred();
            var args = $.makeArray(arguments);
            this.dataTable("window","_loadArgs", args);
            var that = this;
            this.dataTable("window","href", href);
            this.get(href, null, "text").done(function (html) {
                var result = parseHtml(html);
                var scriptSrcs = result.scriptSrcs;
                Smart.loadFiles(scriptSrcs, href).done(function () {
                    process.apply(that, [result].concat(args));
                    //当页面存在锚点的时候，页面滚动的时候，监听锚点的位置，并触发事件。
                    that._listenAnchorPos();
                }).fail(function () {
                    Smart.error(href + "的依赖处理失败");
                }).always(function () {
                    that.trigger("load");
                    deferred.resolve(that);
                });
            }).fail(function(){
                that.trigger("load");
            });
            return deferred;
        },
        setMeta: function (key, value) {
            this.meta[key] = value;
            this.trigger("meta", key, value);
        },
        scrollTo: function (selector) {
            var anchorNode = selector;
            if ($.type(selector) == "string") {
                anchorNode = this.N(selector);
            }
            var deferred = $.Deferred();
            if (anchorNode.size() != 0) {
                var pos = anchorNode.position();
                var scrollTop = this.node.scrollTop();
                this.node.animate({
                    scrollTop: scrollTop + pos.top + "px"
                }, 400, "easeOutQuint", function () {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
            return deferred;
        },
        scrollToAnchor: function (id) {
            this.dataTable("window",STOP_ANCHOR_SCROLLIN_KEY, true);
            var that = this;
            return this.scrollTo("#" + id).done(function () {
                that.removeDataTable("window", STOP_ANCHOR_SCROLLIN_KEY);
            });
        },
        _listenAnchorPos: function () {
            var nodes = this._getAnchorNodes();
            var nodesLength = nodes.size();
            if (nodesLength > 0) {
                var that = this;
                var anchorScrollListener = function () {
                    if (that.dataTable("window", STOP_ANCHOR_SCROLLIN_KEY)) {
                        return;
                    }
                    var height = $(this).innerHeight();
                    for (var i = 0; i < nodesLength; i++) {
                        var node = $(nodes[i]);
                        var posTop = node.position().top;
                        if (posTop <= height / 3 && posTop >= 0) {
                            that.trigger("anchor.scrollin", node.attr("_id_"));
                            return;
                        }
                    }
                };
                this.on("clean", function(){
                    that.node.unbind("scroll", anchorScrollListener);
                });
                this.node.scroll(anchorScrollListener).on("anchor.scrollin", function (e) {
                    e.stopPropagation();
                });
            }
        },
        getAnchors: function () {
            var anchors = this.dataTable("window","_anchors_");
            if (!anchors) {
                anchors = [];
                this.dataTable("window","_anchors_", anchors);
                this._getAnchorNodes().each(function () {
                    var n = $(this);
                    anchors.push({id: n.attr("_id_"), title: n.attr("title")});
                });
            }
            return anchors;
        },
        _getAnchorNodes: function () {
            var attrName = Smart.optionAttrName("window", "role");
            return this.node.find("*["+attrName+"='a']");
        },
        _clean: function () {
            this.trigger("clean");
            this.clearDataTable();
            this[ON_BEFORE_CLOSE_FN_KEY] = [];
            var that = this;
            $.each(this[EVENT_ON_CACHE], function (i, paramAry) {
                that.off.apply(that, paramAry);
            });
        },
        //预关闭；
        preClose: function () {
            var deferred = $.Deferred();
            var onBeforeCloseFns = this[ON_BEFORE_CLOSE_FN_KEY];
            if (onBeforeCloseFns.length > 0) {
                Smart.deferredQueue(onBeforeCloseFns.reverse()).then(function () {
                    deferred.resolve();
                }, function () {
                    deferred.reject();
                });
            } else {
                return deferred.resolve();
            }
            return deferred.promise();
        },

        open: function(){
            var deferred = $.Deferred();
            var e = $.Event("open", {deferred: deferred, smart: this});
            this.trigger(e, $.makeArray(arguments));
            return deferred;
        },

        close: function () {
            //触发beforeClose监听事件。
            var that = this;
            var args = arguments;
            that.clearDataTable();
            var deferred = $.Deferred();
            deferred.done(function(){
                that.node.remove();
            });
            var event = $.Event("close", {deferred: deferred});
            that.trigger(event, Smart.SLICE.call(args));
            event.deferred['resolve'] && event.deferred.resolve();
        },
        closeWithConfirm: function () {
            var that = this;
            var args = arguments;
            return this.preClose().done(function () {
                that.close.apply(that, Smart.SLICE.call(args));
            });
        },
        //监听窗口关闭事件。
        onBeforeClose: function (fn) {
            this[ON_BEFORE_CLOSE_FN_KEY].push(fn);
            return this;
        },

        action: function (script) {
            var script_body = [];
//            script_body.push(" var e = arguments[1]; ");
//            script_body.push(script);
//            script_body = script_body.join("\n");
//            var ___context_holder__ = this;
//            var action = function (e) {
//                ___context_holder__.context.apply(this, [script_body, e]);
//            };
//            return action;
            script_body.push("(function(){");
            script_body.push("      return function(){");
            script_body.push("          "+script);
            script_body.push("      }")
            script_body.push("})()");
            return this.context(script_body.join("\n"));
        },
        _tidyId: function (html) {//整理清理html，
            //清理html的id
            var that = this;
            html = html.replace(/<\w+\s+(id=['"])(.+)(['"])\s*?[^>]*?>/gi, function ($0, $1, $2, $3) {
                return $1 + that.trueId($2) + $3;
            });
            return html;
        },
        S: function (selector) {
            var smart = Smart.of(this.N(selector));
            smart.setContextSmart(this);
            return smart;
        },
        N: function (selector) {
            var _selector = [];
            selector = selector.split(",");
            if(selector.length == 1){
                selector = selector[0];
                if (selector.charAt(0) == "#") {
                    selector = "#" + this.trueId(selector.substring(1));
                }
            } else {
                for(var i = 0; i < selector.length; i++){
                    var _sel = $.trim(selector[i]);
                    if (_sel.charAt(0) == "#") {
                        _sel = "#" + this.trueId(_sel.substring(1));
                    }
                    _selector.push(_sel);
                }
                selector = _selector.join(",");
            }

            return this._WNODE.filter(selector).add(this._WNODE.find(selector));
        },
        trueId: function (id) {
            return this._WINDOW_ID + "_" + id;
        },
        //这里修改on的方法，当页面渲染完成之后所有的on的事件都缓存起来，在refresh，和load新页面的时候要去除掉这些事件。
        on: function (events, selector, fn) {
            if(this.dataTable("window", "loadState")){
                //如果已经加载了，on的事件将会被记录，在重新load的时候会移除掉这些事件。
                this[EVENT_ON_CACHE].push([events, selector, fn]);
            }
            return this.inherited([events, selector, fn]);
        }
    });
})(jQuery);