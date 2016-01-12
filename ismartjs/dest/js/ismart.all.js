/**
 * User: Administrator
 * Date: 13-10-19
 * Time: 下午3:32
 */
/**
 * 模板处理
 * */

(function ($) {

    var OUT_SCRIPT = " var out = {\n" +
        "     output : [],\n" +
        "     print : function(str){\n" +
        "          this.output.push(str);\n" +
        "     },\n" +
        "     println : function(str){\n" +
        "          this.print(str == null ? '' : str + '\\n');\n" +
        "     }\n" +
        " };\n";
    var token = 1;
    var compile = function (body) {
        var scripts = [];
        scripts.push(OUT_SCRIPT);
        var line = [];
        var inScriptFlag = false;
        var writeLine = function (type) {
            var lineStr = line.join("");
            if (type == "script") {
                //TODO FIX LATTER 对于 out.print("xxx lt xxx");这样的脚本，则也会替换成 out.print("xxx < xxx");这样
                //lineStr = lineStr.replace(/\slt\s/gi,"<").replace(/\sgt\s/gi, ">");
                //lineStr = lineStr.replace(/\slte\s/gi,"<=").replace(/\sgte\s/gi, ">=");
                lineStr = lineStr.replace(/&amp;/gi,"&");
				lineStr = lineStr.replace(/&gt;/gi,">");
				lineStr = lineStr.replace(/&lt;/gi,"<");
                scripts.push(lineStr);
                line = [];
            } else {
                if ($.trim(lineStr) == "") {
                    line = [];
                    return;
                }
                lineStr = lineStr.replace(/'/gi, "\\'");
                scripts.push("out.print('" + lineStr + "');");
                line = [];
            }
        };
        var scriptOutputFlag = false;
        var skipFlag = false;
        for (var i = 0; i < body.length; i++) {
            var char = body.charAt(i);
            if(char == "\n"){
                if (!inScriptFlag) {
                    writeLine("output");
                    line.push("\\n");
                    writeLine("output");
                } else {
                    line.push(char);
                }
                continue;
            }
            if(char == "\r"){
                continue;
            }
            if(char == "#"){
                if (body.charAt(i+1) == "}" && skipFlag) {
                    writeLine("output");
                    i++;
                    skipFlag = false;
                    continue;
                }
            }
            if(skipFlag){
                line.push(char);
                continue;
            }
            switch (char) {
                case "{" :
                    if (body.charAt(i+1) == "#") {
                        //则表示skip，不做任何处理
                        skipFlag = true;
                        i++;
                        writeLine(inScriptFlag ? "script" : "output");
                        break;
                    }
                    if (body.charAt(i+1) == "%" && !inScriptFlag) {//则说明脚本开始
                        writeLine("output");
                        i++;
                        inScriptFlag = true;
                        break;
                    }
                    line.push(char);
                    break;
                case "%" :
                    if (body.charAt(i+1) == "}" && inScriptFlag) {//则说明脚本结束
                        if (scriptOutputFlag) {
                            line.push(");");
                            scriptOutputFlag = false;
                        }
                        i++;
                        inScriptFlag = false;
                        writeLine("script");
                        break;
                    }
                    line.push(char);
                    break;
                case "=" :
                    if (inScriptFlag && i - 2 >= 0 && body.charAt(i - 2)== "{" && body.charAt(i-1) == "%") {//则表示是输出
                        line.push("out.print(");
                        scriptOutputFlag = true;
                    } else {
                        line.push(char);
                    }
                    break;
                default :
                    line.push(char);
                    break;
            }
        }
        writeLine("output");
        scripts.push("return out.output.join('');");
        return scripts.join("\n");
    }

    $.template = {
        compile: compile
    };
})(jQuery);
;/**
 * Created by Administrator on 2015/8/29.
 */

(function ($) {

    //声明一些常量

    var CONST = {
        /**
         * 所有Smart控件默认的上下文环境，该上下文环境是当前的window作用域
         * */
        DEFAULT_CONTEXT: function () {

            var __SMART_VALUE_CONTEXT__ = {};

            try {
                return eval(arguments[0]);
            } catch (e) {
                Smart.error(e);
                return null;
            }
        },
        SMART_NODE_CACHE_KEY: "__SMART__",
        SMART_ATTR_KEY: "s",//smart控件声明的属性
        DEFAULT_STOPPED_EVENT: ["s-ready", "s-prepared", "s-rendered", "s-loaded", 's-loading', 's-data', 's-build']
    };


    window.Smart = function Smart(node) {
        this.node = node || $();
        this.node.data(CONST.SMART_NODE_CACHE_KEY, this);
        this.widgets = [];
        this.widget = {};
        if (this.isWindow()) {
            this.CONTEXT = CONST.DEFAULT_CONTEXT;
        }
        var that = this;
        $.each(CONST.DEFAULT_STOPPED_EVENT, function (i, evt) {
            that.on(evt, function (e) {
                e.stopPropagation();
            });
        });
    };

    /**
     * Smart静态方法
     * */
    Smart.extend = function (obj, obj1) {
        if (arguments.length == 1) {
            obj1 = obj;
            obj = Smart;
        }
        return $.extend(obj, obj1);
    };
    Smart.fn = {
        extend: function (objs) {
            if (!$.isArray(objs)) {
                objs = [objs];
            }
            $.each(objs, function (i, obj) {
                Smart.extend(Smart.prototype, obj);
            });
        }
    };

    /**
     * Smart元素操作方法扩展
     * */
    Smart.extend({
        DEFINE_KEY: CONST.SMART_ATTR_KEY,
        VALUE_CONTEXT: "__SMART_VALUE_CONTEXT__",
        isSmart: function (smart) {
            if (smart == undefined) {
                return false;
            }
            if (smart.constructor == Smart) {
                return true;
            }
            return false;
        },
        isWidgetNode: function (node) {
            return node && node.attr(CONST.SMART_ATTR_KEY) !== undefined;
        },
        /**
         * 使元素可用不可用
         * */
        disableNode: function (btnNode, flag) {
            if (flag == null) flag = true;
            if (flag) {
                btnNode.attr("disabled", 'disabled').addClass("disabled");
            } else {
                btnNode.removeAttr("disabled").removeClass("disabled");
            }
        },
        clickDeferred: function (node, fn) {
            node.click(function (e) {
                Smart.disableNode(node);
                var rs = fn(e);
                if (!Smart.isDeferred(rs)) {
                    Smart.disableNode(node, false);
                } else {
                    rs.always(function () {
                        Smart.disableNode(node, false);
                    });
                }
            });
        },
        serializeToObject: function (form) {
            if (!form.is("form")) {
                return {};
            }
            var data = {};
            var arrays = form.serializeArray();
            $.each(arrays, function (i, n) {
                var key = n.name;
                var value = n.value;
                var _value = data[key];
                if (_value === undefined) {
                    data[key] = value;
                    return;
                }
                if ($.isArray(_value)) {
                    _value.push(value);
                } else {
                    data[key] = [_value, value];
                }
            });
            return data;
        },
        formData: function (nodes) {
            nodes = $(nodes);
            if (nodes.size() == 1 && nodes.is("form")) {
                return new FormData(nodes[0]);
            }
            var formData = new FormData();
            nodes.each(function () {
                var node = $(this);
                var name = node.attr("name");
                if (node.is(":file")) {//如果是文件域
                    $.each(this.files, function (i, file) {
                        formData.append(name, file);
                    });
                } else if (node.is(":checkbox,:radio")) {
                    if (node.prop("checked")) {
                        formData.append(name, node.val());
                    }
                } else {
                    formData.append(name, node.val());
                }
            });
            return formData;
        },
        optionAttrName: function (id, name) {
            return CONST.SMART_ATTR_KEY + "-" + id + "-" + name;
        }
    });

    /**
     * Smart工具方法扩展
     * */
    Smart.extend({
        SLICE: Array.prototype.slice,
        TO_STRING: Object.prototype.toString,
        noop: function () {
        },
        uniqueId: function () {
            return "SMART_" + new Date().getTime();
        },
        removeArrayElement: function (el, array) {
            var i = $.inArray(el, array);
            if (i == -1)
                return array;
            return array.slice(0, i).concat(array.splice(i + 1));
        },
        equalArray: function (ary1, ary2) {
            if (ary1.length == 0 && ary2.length == 0) {
                return true;
            }
            if (ary1.length != ary2.length) {
                return false;
            }
            for (var i in ary1) {
                if (ary1[i] != ary2[i]) {
                    return false;
                }
            }
            return true;
        },
        isEmpty: function (val) {
            if (val == null) {
                return true;
            }
            if (Smart.TO_STRING.call(val) == "[object String]") {
                return $.trim(val).length == 0;
            }
            if (Smart.TO_STRING.call(val) == '[object Array]') {
                return val.length == 0;
            }
            return false;
        },
        isDeferred: function (obj) {
            return obj && "done" in obj && $.isFunction(obj.done);
        },
        deferredChain: function (defer, listenDefer) {
            listenDefer.done(function () {
                defer.resolve.apply(defer, $.makeArray(arguments));
            }).fail(function () {
                defer.reject.apply(defer, $.makeArray(arguments));
            });
        },
        deferDelegate: function (obj) {
            if (Smart.isDeferred(obj)) {
                return obj;
            }
            var _deferred = $.Deferred();
            return _deferred.resolve(obj);
        },
        map: function (datas, key) {
            var _datas = [];
            for (var i = 0; i < datas.length; i++) {
                var d = datas[i];
                if ($.isFunction(key)) {
                    _datas.push(key(d));
                } else if (Smart.TO_STRING.call(key) == '[object String]') {
                    _datas.push(d[key]);
                }
            }
            return _datas;
        },
        dataTransfer: function (rs, fn, ref) {
            if (Smart.isDeferred(rs)) {
                var deferred = $.Deferred();
                rs.done(function (_rs) {
                    deferred.resolve(fn.call(ref, _rs));
                }).fail(function () {
                    deferred.reject();
                });
                return deferred;
            } else {
                return fn.call(ref, rs);
            }
        },
        //数据适配
        adaptData: function (data, adapter) {
            var rs;
            if ($.isFunction(data)) {
                rs = data();
            } else {
                rs = data;
            }
            function adapt(_data) {
                if ($.isFunction(adapter)) {
                    return adapter(_data);
                }
                return _data[adapter];
            }

            return Smart.dataTransfer(rs, adapt);
        },
        /**
         * 清理json反序列化后的引用问题，该问题可能来自于fastjson序列化后的json。
         * */
        cleanJsonRef: (function () {

            function clean($$, obj, parent) {
                if (arguments.length == 1) {
                    obj = $$;
                }
                $.each(obj, function (key, val) {
                    if (!$.isPlainObject(val) && !$.isArray(val)) {
                        return;
                    }
                    if (val.hasOwnProperty('$ref')) {
                        if (val['$ref'] == '..') {
                            obj[key] = parent;
                            return;
                        }
                        obj[key] = eval("$" + val['$ref']);
                    } else {
                        clean($$, val, obj);
                    }
                })
                return obj;
            }

            return function (obj) {
                return Smart.dataTransfer(obj, clean);
            }
        })(),
        encodeHtml: (function () {
            var REGEX_HTML_ENCODE = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
            return function (s) {
                return (typeof s != "string") ? s :
                    s.replace(REGEX_HTML_ENCODE,
                        function ($0) {
                            var c = $0.charCodeAt(0), r = ["&#"];
                            c = (c == 0x20) ? 0xA0 : c;
                            r.push(c);
                            r.push(";");
                            return r.join("");
                        });
            }
        })(),
        walkTree: (function () {
            function _walkTree(tree, walker, childrenKey) {
                childrenKey = childrenKey || "children";
                if (!$.isArray(tree)) {
                    tree = [tree];
                }
                $.each(tree, function (i, node) {
                    walker(node);
                    if (node[childrenKey]) {
                        _walkTree(node[childrenKey], walker, childrenKey);
                    }
                });
            }

            return _walkTree;
        })(),
        //参数的fns为异步方法的数组，该方法都接受一个deferred的参数，该方法会依次执行，
        // 在上一个方法的deferred resolved的时候。如果一个方法的deferred没有被resolve，则不会执行下一个方法。
        //当所有方法执行完成时，才会触发deferredQueue的done。
        deferredQueue: function (fns) {
            var deferred = $.Deferred();
            if (arguments.length == 1) {
                if ($.type(fns) != "array") {
                    fns = [fns];
                }
            } else if (arguments.length > 1) {
                fns = Array.prototype.slice.call(arguments);
            }
            var results = [];

            function callFn(i) {
                if (i == fns.length) {
                    deferred.resolve(results);
                    return;
                }
                var fn = fns[i];
                if (!$.isFunction(fn)) {
                    results.push(fn);
                    callFn(i + 1);
                    return;
                }
                var fnDefer = fn();
                if (!fnDefer || !$.isFunction(fnDefer['done'])) {
                    results.push(fnDefer);
                    callFn(i + 1);
                    return;
                }
                fnDefer.done(function (rs) {
                    results.push(rs);
                    callFn(i + 1);
                }).fail(function () {
                    deferred.reject.apply(deferred, $.makeArray(arguments));
                });
            }

            callFn(0);
            return deferred.promise();
        },
        realPath: (function () {
            //路径处理，摘自seajs
            var DIRNAME_RE = /[^?#]*\//

            var DOT_RE = /\/\.\//g
            var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//

            // Extract the directory portion of a path
            // dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
            // ref: http://jsperf.com/regex-vs-split/2
            function dirName(path) {
                var ms = path.match(DIRNAME_RE);
                return ms ? ms[0] : "";
            }

            // Canonicalize a path
            // realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
            function realPath(path) {
                // /a/b/./c/./d ==> /a/b/c/d
                path = path.replace(DOT_RE, "/")

                // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
                while (path.match(DOUBLE_DOT_RE)) {
                    path = path.replace(DOUBLE_DOT_RE, "/")
                }

                return path;
            }

            return function (path, baseUrl) {
                if (/^(http|https|ftp|):.*$/.test(path)) {
                    return path;
                }
                if (path[0] == "/") return path;
                path = baseUrl === undefined ? path : dirName(baseUrl) + path;
                return realPath(path);
            }
        })()
    });

    (function () {
        var console = window.console || {
                info: Smart.noop,
                debug: Smart.noop,
                warn: Smart.noop
            };

        Smart.extend({
            info: function () {
                console.info.apply(console, arguments);
            },
            error: function () {
                console.error.apply(console, arguments);
            },
            warn: function () {
                console.warn.apply(console, arguments);
            }
        });
    })();

    /**
     * Smart对象操作的静态方法
     * */
    Smart.extend({
        /**
         * 挑选出Smart控件
         * */
        pick: function (node) {
            var smart = Smart.of();
            node.each(function () {
                var n = $(this);
                if (Smart.isWidgetNode(n)) {
                    smart.add(n);
                } else {
                    smart.add(Smart.of(n).children());
                }
            });
            return smart;
        },
        of: function (node) {
            if (Smart.isSmart(node)) {
                return node;
            }
            if (node === undefined || node.size() == 0) {
                return new Smart();
            }
            if (node.size() > 1) {
                var smart = Smart.of();
                $.each(node, function (i, n) {
                    smart.add($(n));
                });
                return smart;
            }
            var smart = node.data(CONST.SMART_NODE_CACHE_KEY);
            if (smart) {
                return smart;
            }
            smart = new Smart(node);
            node.data(CONST.SMART_NODE_CACHE_KEY, smart);
            return smart;
        }
    });


    /**
     * 扩展Smart对象的实例方法
     * */
    Smart.extend(Smart.prototype, {
        extend: function (api) {
            return $.extend(this, api);
        },
        each: function (fn) {
            this.node.each(function (i, node) {
                node = $(node);
                fn.call(Smart.of(node), i, node);
            });
        },
        parent: function () {
            var p = this.node.parent().closest("[" + CONST.SMART_ATTR_KEY + "]");
            if (p.size() == 0)
                p = Smart.of($(window));
            return Smart.of(p);
        },
        closest: function (wId) {
            function check(smart) {
                if (smart.isWindow()) return null;
                if (smart.isWidget(wId)) return smart;
                return check(smart.parent());
            }

            return check(this);
        },
        isWidget: function (wId) {
            var s = this.node.attr(CONST.SMART_ATTR_KEY);
            if (!s) return false;
            var wIds = s.split(",");
            for (var i = 0; i < wIds.length; i++) {
                if ($.trim(wIds[i]) == wId) return true;
            }
            return false;
        },
        isWindow: function () {
            return this.node.size() == 1 ? this.node[0] == window : false;
        },
        add: function (smart) {
            if (Smart.isSmart(smart)) {
                smart = smart.node;
            }
            var that = this;
            smart.each(function (i, node) {
                that.node = that.node.add(node);
            });
        },
        size: function () {
            return this.node.size();
        },
        pick: function (selector) {
            var children = this.node.children();
            if (children.size() == 0)
                return Smart.of();
            var smart = Smart.of();
            $.map(children, function (child) {
                child = $(child);
                if (child.is(selector)) {
                    smart.add(child);
                } else {
                    //排除掉某些表单元素
                    /**
                     * input textarea radio checkbox img select
                     * */
                    if (child.is("input,textarea,radio,checkbox,img,select")) {
                        return;
                    }
                    smart.add(Smart.of(child).pick());
                }
            });
            return smart;
        },
        find: function (selector) {
            var nodes = this.node.find(selector);
            var smart = Smart.of();
            nodes.each(function () {
                smart.add($(this));
            });
            return smart;
        },
        children: function () {
            var children = this.node.children();
            if (children.size() == 0)
                return Smart.of();
            var smart = Smart.of();
            $.map(children, function (child) {
                child = $(child);
                if (child.attr(CONST.SMART_ATTR_KEY) !== undefined) {
                    smart.add(child);
                } else {
                    //排除掉某些表单元素
                    /**
                     * input textarea radio checkbox img select
                     * */
                    if (child.is("input,textarea,radio,checkbox,img,select")) {
                        return;
                    }
                    smart.add(Smart.of(child).children());
                }
            });
            return smart;
        }
    });

    Smart.extend(Smart.prototype, {
        setNode: function (node) {
            this.node.empty();
            return this._insertNode(node);
        },
        prependNode: function (node) {
            return this._insertNode(node, "prepend");
        },
        appendNode: function (node) {
            return this._insertNode(node);
        },
        _insertNode: function (node, mode) {
            //插入的node不能是textnode的节点，否则无法插入进去
            try {
                if ($.type(node) == "string") {
                    node = $(node);
                }
                this.node[mode || "append"](node);
                Smart.pick(node).render();
                return this;
            } catch (e) {
                this.node[mode || "append"](node);
                Smart.error(e);
            }
        }
    });

    Smart.extend(Smart.prototype, {
        _getContext: function () {
            if (!this.CONTEXT) {
                this.CONTEXT = this.parent()._getContext();
            }
            return this.CONTEXT;
        },
        /**
         * 从当前的上下文中获取数据
         * */
        context: function (key, that) {
            if (/^\s*\{.+}\s*$/g.test(key)) {
                //如果是json的字符串，则需要加（）号
                key = "(" + key + ")";
            }
            return this._getContext().call(that || this, key);
        },
        /**
         * 有些控件需要在当前的context环境下保存一些数据，那么就需要当前的context闭包中需要一个对象来存取数据，那么就规定，所有实现自己context的控件都需要
         * 在context中定义一个 valueContext对象。
         * */
        contextValue: function (key, value) {
            var valueContext = this.context(Smart.VALUE_CONTEXT);
            if (arguments.length == 1) {
                return valueContext[key];
            } else {
                valueContext[key] = value;
            }
        },
        action: function (script) {
            var script_body = [];
            script_body.push("(function(){");
            script_body.push("      return function(){");
            script_body.push("          " + script);
            script_body.push("      }")
            script_body.push("})()");
            return this.context(script_body.join("\n"));
        }
    });

    //ui扩展
    Smart.extend(Smart.prototype, {
        alert: function (msg) {
            window.alert(msg);
        }
    });

    //事件，事件依赖与jquery的事件。
    Smart.extend(Smart.prototype, {
        on: function (events, selector, fn) {
            this.node.on(events, selector, fn);
            return this;
        },
        off: function (events, selector, fn) {
            this.node.off(events, selector, fn);
            return this;
        },
        trigger: function (type, data) {
            this.node.trigger(type, data);
            return this;
        }
    });
    //AJAX扩展
    (function () {

        var URL_PLACEHOLDER_REGEX = /\{([^}]+)}/gi;

        var ajaxCfg = {
            startTip: "正在操作，请稍候……",
            successTip: "操作成功",
            errorTip: "操作失败",
            silent: false,
            getErrorMsg: function (xhr, url) {
                if (xhr.status == "404") {
                    return url + " " + xhr.statusText;
                }
                return xhr.responseText;
            }
        };

        Smart.ajaxSetup = function (cfg) {
            $.extend(ajaxCfg, cfg);
        };

        $.each(['get', 'post', 'put', 'remove', 'update'], function (i, method) {
            Smart.prototype[method] = function (url, data, type, cfg, ajaxSetting) {
                if (Smart.TO_STRING.call(type) == "[object Object]") {
                    ajaxSetting = cfg;
                    cfg = type;
                    type = null;
                }

                cfg = $.extend($.extend({}, ajaxCfg), cfg || {});

                if (method == 'remove') {
                    method = 'delete';
                }
                type = type || "json";//默认json请求
                var deferred = $.Deferred();
                if (!cfg.silent) {
                    this.trigger("smart-ajaxStart", [cfg.startTip]);
                }

                var _this = this;

                url = url.replace(URL_PLACEHOLDER_REGEX, function ($1, $2) {
                    return _this.context($2);
                });

                var ajaxOptions = {
                    url: url,
                    type: method,
                    dataType: type,
                    data: data,
                    cache: false
                };
                if (data != undefined && (data.constructor == FormData || data.constructor == File)) {
                    ajaxOptions.contentType = false;
                    ajaxOptions.processData = false;
                }
                $.extend(ajaxOptions, ajaxSetting || {});


                function doRequest() {
                    $.ajax(ajaxOptions).done(function (result) {
                        var event = $.Event('smart-ajaxSuccess');
                        deferred.resolve.apply(deferred, [result, event]);
                        if (!cfg.silent && !event.isPropagationStopped()) {
                            _this.trigger(event, [cfg.successTip, result]);
                        }
                        if (!cfg.silent) {
                            _this.trigger("smart-ajaxComplete");
                        }
                    }).fail(function (xhr) {
                        var event = $.Event('smart-ajaxError', {
                            retryRequest: doRequest
                        });
                        if (!cfg.silent && !event.isPropagationStopped()) {
                            _this.trigger(event, [cfg.errorTip, ajaxCfg.getErrorMsg(xhr, url), xhr]);
                            if (event.isPropagationStopped()) {
                                return;
                            }
                        }
                        if (!cfg.silent) {
                            _this.trigger("smart-ajaxComplete");
                        }
                        if(!event.isPropagationStopped()){
                            deferred.reject.apply(deferred, [xhr, event]);
                        }
                    });
                }

                doRequest();
                return deferred;
            };
        });
    })();

    //加载文件
    Smart.loadFiles = (function () {
        var loadedFiles = [];
        var loadingFiles = {};
        var loadJs = function (jsFile, baseUrl) {
            var deferred = $.Deferred();
            var path = Smart.realPath(jsFile, baseUrl);
            if (path in loadingFiles) {
                loadingFiles[path].push(deferred);
                return deferred;
            }
            //检查是否加载过
            if ($.inArray(path, loadedFiles) != -1 || $("script[src$='" + path + "']").size() != 0) {
                deferred.resolve();
                return deferred;
            }
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = path;

            if (path in loadingFiles) {
                var deferreds = loadingFiles[path];
                deferreds.push(deferred);
            } else {
                loadingFiles[path] = [deferred];
            }

            script.onload = function () {
                loadedFiles.push(path);
                var deferreds = loadingFiles[path];
                delete loadingFiles[path];
                $.each(deferreds, function (i, defer) {
                    defer.resolve();
                });
            };
            script.onerror = function () {
                Smart.error("未能加载：" + jsFile);
                loadedFiles.push(path);
                deferred.resolve();
            };
            document.getElementsByTagName("head")[0].appendChild(script);
            return deferred;
        };
        var loadCss = function (cssFile, baseUrl) {
            var deferred = $.Deferred();
            var path = Smart.realPath(cssFile, baseUrl);
            //检查是否加载过
            if ($.inArray(path, loadedFiles) != -1 || $("link[href$='" + path + "']").size() != 0) {
                deferred.resolve();
                return deferred;
            }
            var styleLink = document.createElement("link");
            styleLink.rel = "stylesheet";
            styleLink.href = path;
            document.getElementsByTagName("head")[0].appendChild(styleLink);
            loadedFiles.push(path);
            deferred.resolve();
            return deferred;
        };

        var loadFile = function (file, baseUrl) {
            if (/^.*\.css([?,#].*){0,1}$/.test(file)) { //如果是css文件
                return loadCss(file, baseUrl);
            }
            if (/^.*\.js([?,#].*){0,1}$/.test(file)) { //如果是js文件
                return loadJs(file, baseUrl);
            }
        };

        return function (files, baseUrl) {
            var deferred = $.Deferred();
            if (files === undefined) {
                deferred.resolve();
                return;
            }
            if (!$.isArray(files)) {
                files = files.split(",");
            }
            var _load = function () {
                if (!files.length) {
                    deferred.resolve();
                } else {
                    var file = files.shift();
                    if (file.indexOf('?') != -1) {
                        file += "&_=" + new Date().getTime();
                    } else {
                        file += "?_=" + new Date().getTime();
                    }
                    loadFile(file, baseUrl).done(function () {
                        _load();
                    }).fail(function () {
                        deferred.resolve();
                    });
                }
            }
            _load();
            return deferred;
        }
    })();

    /**
     * Smart 控件渲染相关
     * */

        //class 继承
    Smart.Class = function (constructor, superClass, prototype, staticMethod) {
        var SUPER;
        if (!$.isFunction(superClass)) {
            staticMethod = prototype;
            prototype = superClass;
            superClass = constructor;
            constructor = superClass;
        } else {
            SUPER = function () {
                superClass.apply(this, Array.prototype.slice.call(arguments));
            };
        }

        var obj = function () {
            SUPER && (this.SUPER = SUPER);
            constructor.apply(this, Array.prototype.slice.call(arguments));
        };

        var inheritedFnMap = {};

        obj.prototype = {
            inherited: function () {
                var caller = arguments.callee.caller;
                if (!caller in inheritedFnMap) {
                    console.error("该方法没有super方法");
                    throw "该方法没有super方法";
                }
                var superFn = inheritedFnMap[caller];
                return superFn.apply(this, Array.prototype.slice.call(arguments));
            }
        };

        //设置prototype
        Smart.extend(obj.prototype, superClass.prototype);
        for (var key in prototype) {
            var fn = prototype[key];
            if (key in obj.prototype) {
                inheritedFnMap[fn] = obj.prototype[key];
            }
            obj.prototype[key] = fn;
        }

        //处理静态方法
        Smart.extend(obj, superClass);
        Smart.extend(obj, staticMethod);

        return obj;

    };

    //Smart控件相关
    (function () {

        //控件扩展

        Smart.extend(Smart.prototype, {
            isRendered: function () {
                return this.lifeStage == SmartWidget.LIFE_STAGE.RENDERED
            },
            onRendered: function (fn) {
                var that = this;
                if (this.lifeStage == SmartWidget.LIFE_STAGE.RENDERED) {
                    fn.call(that);
                }
                this.on("s-rendered", function () {
                    fn.apply(that, Smart.SLICE.call(arguments));
                });
                return this;
            },
            render: function () {
                if (this.lifeStage == SmartWidget.LIFE_STAGE.RENDERED) {
                    Smart.warn("该控件已经创建过了！");
                    return $.Deferred().resolve();
                }
                var length = this.size();
                if (length == 0) {
                    return $.Deferred().resolve();
                }
                if (length > 1) {
                    var dFns = [];
                    this.each(function () {
                        var that = this;
                        dFns.push(function () {
                            return that.render();
                        });
                    });
                    return Smart.deferredQueue(dFns);
                }
                return renderSmart(Smart.of(this.node));
            },

            renderChildren: function () {
                var children = this.children();
                if (children.size() == 0) {
                    return $.Deferred().resolve();
                }
                var deferredFns = [];
                children.each(function () {
                    var that = this;
                    deferredFns.push(function () {
                        return that.render();
                    });
                });

                return Smart.deferredQueue(deferredFns);
            },
            _addWidget: function (widget) {
                this.widgets.push(widget);
                this.widget[widget.meta.id] = widget;
            }
        })

        function SmartWidget(smart, meta) {
            this.options = {};
            this.S = smart;
            this.meta = meta;
        };

        SmartWidget.prototype = {
            onPrepare: Smart.noop,//控件准备
            onBuild: Smart.noop,//构建控件
            onData: Smart.noop,//控件赋值事件
            onReady: Smart.noop,//控件准备完成
            onDestroy: Smart.noop,//销毁控件
            onClean: Smart.noop//重置控件
        };

        Smart.extend(SmartWidget, {
            LIFE_STAGE: {
                RENDERED: "RENDERED"
            }
        })

        Smart.extend(SmartWidget.prototype, {
            optionName: function (key) {
                return Smart.optionAttrName(this.meta.id, key);
            },
            optionValue: function (node, key) {
                return node.attr(this.optionName(key));
            },
            processOptions: function () {

                var optionAttr = CONST.SMART_ATTR_KEY + "-" + this.meta.id;
                var optionStr = this.S.node.attr(optionAttr);
                //mixin options与widget.defaultOptions
                var tmpOptions = {};
                if (this.meta.defaultOptions) {
                    $.extend(tmpOptions, this.meta.defaultOptions); //复制widget.defaultOptions
                }
                if (optionStr) {
                    var optionValues = this.S.context(optionStr);
                    $.extend(tmpOptions, optionValues);
                }
                this.options = tmpOptions;
            }
        });

        var SMART_WIDGET_MAPPING = {};

        Smart.widgetExtend = function (meta, Widget, api) {
            if (Smart.TO_STRING.call(meta) == "[object String]") {
                meta = {id: meta}
            }

            var _Widget = Smart.Class(SmartWidget, Widget);
            _Widget.meta = meta;
            _Widget.api = api;
            SMART_WIDGET_MAPPING[meta.id] = _Widget;
        };

        /**
         * 默认扩展的api，当一个元素被声明成为smart，将自动获取如下的API
         * */
        var DEFAULT_EXTEND_API = {
            /**
             * 获取控件的数据需要实现的方法
             * */
            dataGetter: function () {
                return this.__SMART__DATA__;
            }
            ,
            dataSetter: function (data) {
                var dataType = $.type(data);
                if (dataType == "boolean" || dataType == "number" || dataType == "string" || data == undefined) {
                    //如果没有子元素
                    if (this.node.is("input[type='text'],input[type='hidden'],select,textarea," +
                            "input[type='password'],input[type='email'],input[type='number']")) {
                        data = data == undefined ? '' : data;
                        this.node.val(data + '');
                        return;
                    } else if (this.node.is("input[type='radio']")) {
                        data = data == undefined ? '' : data;
                        if (data + "" == this.node.val()) {
                            this.node.prop("checked", true);
                        }
                        return;
                    }
                    this.node.html(data);
                    return;
                }
                if (dataType == "array") {
                    if (this.node.is("input[type='checkbox']")) {
                        var val = this.node.val();
                        if ($.inArray(val, data) != -1) {
                            this.node.prop("checked", true);
                            return;
                        } else {
                            return false;
                        }
                    }
                    return false;
                }
            },
            data: function () {
                if (arguments.length == 0) {
                    return this.dataGetter ? this.dataGetter.apply(this, Smart.SLICE.call(arguments)) : undefined;
                }
                var args = Smart.SLICE.call(arguments);
                var value = args;
                var dataFilter = this.node.attr("s-data-filter");
                if (dataFilter != null) {
                    dataFilter = this.context(dataFilter);
                    if (!$.isFunction(dataFilter)) {
                        var data = args[0];
                        var fn_flag = (dataFilter.indexOf(".") != -1 || /^.+\(.*\).*$/.test(dataFilter)) ? true : false;
                        value = [data == undefined ? null : fn_flag ? eval("data." + dataFilter) : data[dataFilter]];
                    } else {
                        value = dataFilter.apply(null, value);
                    }
                }
                value = (value == null ? [this.widget.smart.options['null']] : value);
                if (arguments.length == 1) {
                    this.__SMART__DATA__ = value[0];
                } else {
                    this.__SMART__DATA__ = value;
                }
                var that = this;
                return Smart.deferDelegate(this.dataSetter.apply(this, value)).done(function () {
                    that.trigger("s-data");
                });
            },
            build: function () {
                if (arguments.length == 0) {
                    return this.buildGetter ? this.buildGetter.apply(this, Smart.SLICE.call(arguments)) : undefined;
                }
                var args = Smart.SLICE.call(arguments);
                var value = args;
                var buildFilter = this.node.attr("s-build-filter");
                if (buildFilter != null) {
                    buildFilter = this.context(buildFilter);
                    if (!$.isFunction(buildFilter)) {
                        var data = args[0];
                        var fn_flag = (buildFilter.indexOf(".") != -1 || /^.+\(.*\).*$/.test(buildFilter)) ? true : false;
                        value = [data == undefined ? null : fn_flag ? eval("data." + buildFilter) : data[buildFilter]];
                    } else {
                        value = buildFilter(value);
                    }
                }
                value = (value == null ? [this.widget.smart.options['null']] : value);
                if (arguments.length == 1) {
                    this.__SMART_BUILD_DATA__ = value[0];
                } else {
                    this.__SMART_BUILD_DATA__ = value;
                }
                var that = this;
                return Smart.deferDelegate(this.buildSetter.apply(this, value)).done(function () {
                    that.trigger("s-build");
                });
            },
            buildGetter: function () {
                return this.__SMART_BUILD_DATA__;
            },
            buildSetter: function () {

            },
            _executeBuild: function () {
                var buildAttrStr = this.node.attr("s-build");
                if (buildAttrStr == undefined) {
                    return;
                }
                var buildData = this.context(buildAttrStr);
                var deferred = $.Deferred();
                if (Smart.isDeferred(buildData)) {
                    var that = this;
                    buildData.done(function (data) {
                        Smart.deferDelegate(that.build(data)).done(function () {
                            deferred.resolve();
                        }).fail(function () {
                            deferred.reject();
                        })
                    }).fail(function () {
                        deferred.reject();
                    })
                } else {
                    var deferred = $.Deferred();
                    Smart.deferDelegate(this.build(buildData)).done(function () {
                        deferred.resolve();
                    }).fail(function () {
                        deferred.reject();
                    })
                }
                return deferred;
            }
            ,
            _executeData: function () {
                var dataAttrStr = this.node.attr("s-data");
                if (dataAttrStr == undefined) {
                    return;
                }
                /**
                 * 该属性只会触发一次，当再次执行的时候将会被忽略掉。
                 * */
                var dataLazy = this.node.attr("s-data-lazy");
                if (dataLazy != undefined) {
                    this.node.removeAttr("s-data-lazy");
                    dataLazy = this.context(dataLazy);
                    if ($.isFunction(dataLazy)) {
                        dataLazy = dataLazy();
                    }
                    if (dataLazy == true) {
                        return;
                    }
                }
                var dataValue = this.context(dataAttrStr);
                var deferred = $.Deferred();
                if ($.isPlainObject(dataValue) && Smart.isDeferred(dataValue)) {
                    var that = this;
                    dataValue.done(function (data) {
                        Smart.deferDelegate(that.data(data)).done(function () {
                            deferred.resolve.apply(deferred, $.makeArray(arguments));
                        }).fail(function () {
                            deferred.reject.apply(deferred, $.makeArray(arguments));
                        })
                    }).fail(function () {
                        deferred.reject.apply(deferred, $.makeArray(arguments));
                    })
                } else {
                    Smart.deferDelegate(this.data(dataValue)).done(function () {
                        deferred.resolve.apply(deferred, $.makeArray(arguments));
                    }).fail(function () {
                        deferred.reject.apply(deferred, $.makeArray(arguments));
                    })
                }
                return deferred;
            }
            ,
            _executeReady: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onReady();
                });
                this.trigger("s-ready");
            }
            ,
            destroy: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onDestroy();
                });
                this.widgets = {};
                this.node.remove();
            }
            ,
            refresh: function () {
                var that = this;
                this.clean();//先清理。

                var deferreds = [];

                $.each(this.widgets, function (i, widget) {
                    deferreds.push(function () {
                        return widget.onBuild();
                    });
                });

                //build控件
                deferreds.push(function () {
                    return that._executeBuild();
                });

                $.each(this.widgets, function (i, widget) {
                    deferreds.push(function () {
                        return widget.onData();
                    });
                });

                deferreds.push(function () {
                    return that._executeData();
                });

                return Smart.deferredQueue(deferreds);
            }
            ,
            clean: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onClean();
                });
            }

        };

        function processApis(smart, apis) {
            smart._inherited_api_map = {};
            apis.unshift(DEFAULT_EXTEND_API);
            for (var i in apis) {
                var api = apis[i];
                for (var key in api) {
                    if (key in smart) {
                        smart._inherited_api_map[api[key]] = smart[key];
                    }
                    smart[key] = api[key];
                }
            }

            //调用super的同方法
            smart.inherited = function (args) {
                var caller = arguments.callee.caller;
                var superFn = smart._inherited_api_map[caller];
                return superFn.apply(this, args);
            }
        };

        /**
         * 渲染控件
         * */
        function renderSmart(smart) {
            var node = smart.node;
            var wIds = node.attr(CONST.SMART_ATTR_KEY);
            if (wIds == undefined) {
                return smart.renderChildren();
            }

            wIds = wIds.replace(/ /g, "");
            wIds = wIds.split(",");

            var widgetApis = [];

            $.each(wIds, function (i, wId) {
                var Widget = SMART_WIDGET_MAPPING[wId];
                if (!Widget) return;
                widgetApis.push(Widget.api);
                smart._addWidget(new Widget(smart, Widget.meta))
            });

            //merge api
            processApis(smart, widgetApis);

            $.each(smart.widgets, function (i, widget) {
                widget.processOptions();
            });

            $.each(smart.widgets, function (i, widget) {
                widget.onPrepare();
            });

            smart.trigger("s-prepared");

            var deferreds = [];

            $.each(smart.widgets, function (i, widget) {
                deferreds.push(function () {
                    return widget.onBuild();
                });
            });

            //build控件
            deferreds.push(function () {
                return smart._executeBuild();
            });

            deferreds.push(function () {
                return smart.renderChildren();
            });

            $.each(smart.widgets, function (i, widget) {
                deferreds.push(function () {
                    return widget.onData();
                });
            });

            deferreds.push(function () {
                return smart._executeData();
            });

            deferreds.push(function () {
                //子元素render成功后，开始运行控件
                smart._executeReady();
            });

            return Smart.deferredQueue(deferreds).fail(function () {
            }).done(function () {
                smart.lifeStage = SmartWidget.LIFE_STAGE.RENDERED;
                smart.trigger("s-rendered");
            }).promise();

        }

    })();

})
(jQuery);;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var CHECK_ITEM_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='i']";
    var CHECK_ITEM_HANDLER_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='h']";
    var CHECK_PATH_ATTR = Smart.optionAttrName('check', 'path');
    var CHECKED_ATTR = "s_check_checked";
    var CHECKED_CLASS = "s-ui-check-checked";
    var CHECK_ROW_IG_SELECTOR = "*[" + Smart.optionAttrName('check', 'ig') + "]";
    var CHECK_DISABLE_ATTR = "s-check-role-disabled";
    //选中控件
    Smart.widgetExtend({
        id: "check",
        options: "checkedStyle,turn, multiple, ctx:checkallHandler, handlerCheckStyle, path",
        defaultOptions: {
            "turn": "on",
            "checkedStyle": "warning",
            multiple: true,
            "handlerCheckStyle": "",
            "path": "false"
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.delegate(CHECK_ITEM_SELECTOR, "change", function (e) {
                if (that.options.turn != "on") {
                    return;
                }
                that.S._toggleCheck($(this), e);
            });

            var checkallHandles = [];
            this.checkallHandles = checkallHandles;
            var innerCheckallHandle = $("*[s-check-role='checkall-h']", this.S.node);

            if (innerCheckallHandle.size() > 0) {
                checkallHandles.push(innerCheckallHandle);
                this.S.node.delegate("*[s-check-role='checkall-h']", "change", function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }
            if (this.options['checkallHandler']) {
                checkallHandles.push(this.options['checkallHandler']);
                this.options['checkallHandler'].click(function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }

            this.S.node.delegate(CHECK_ITEM_SELECTOR, "unchecked", function (e) {
                innerCheckallHandle.size() && that.S._uncheckHandle(innerCheckallHandle);
                that.options['checkallHandler'] && that.S._uncheckHandle(that.options['checkallHandler']);
                that.options['checkallHandler'] && that.options['checkallHandler'].prop("checked", false);
                e.stopPropagation();
            });
        },
        onReset: function () {
            this.S.uncheckAll();

        },
        onClean: function(){
            this.onReset();
        }
    }, {
        turn: function (type) {
            this.widget.check.options.turn = type;
            if (type != "on") {
                $(CHECK_ITEM_SELECTOR, this.node).attr(CHECK_DISABLE_ATTR, '');
                $("*[s-check-role='checkall-h']", this.node).prop("disabled", true);
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", true);
            } else {
                $(CHECK_ITEM_SELECTOR, this.node).removeAttr(CHECK_DISABLE_ATTR);
                $("*[s-check-role='checkall-h']", this.node).prop("disabled", false);
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", false);
            }
        },
        _toggleCheckAll: function (node) {
            var flag;
            if (!node.prop("checked")) {
                flag = false;
                node.removeClass(this.widget.check.options['handlerCheckStyle']).removeClass(CHECKED_CLASS);
            } else {
                flag = true;
                node.addClass(this.widget.check.options['handlerCheckStyle']).addClass(CHECKED_CLASS);
            }
            flag ? this.checkAll() : this.uncheckAll();
        },
        checkAll: function () {
            this._checkHandlesByFlag(true);
            var that = this;
            $(CHECK_ITEM_SELECTOR+":not(["+CHECK_DISABLE_ATTR+"])", this.node).each(function () {
                that._checkNode($(this));
            });
        },
        uncheckAll: function () {
            this._checkHandlesByFlag(false);
            var that = this;
            $(CHECK_ITEM_SELECTOR, this.node).each(function () {
                that._uncheckNode($(this));
            });
        },
        _checkHandlesByFlag: function (flag) {
            var checkallHandles = this.widget.check.checkallHandles;
            var that = this;
            $.each(checkallHandles, function () {
                flag ? that._checkHandle($(this)) : that._uncheckHandle($(this));
            });
        },
        _checkHandle: function (node) {
            node.addClass(this.widget.check.options['handlerCheckStyle']);
            if (node.is(":checkbox")) {
                node.prop("checked", true);
            }
        },
        _uncheckHandle: function (node) {
            node.removeClass(this.widget.check.options['handlerCheckStyle']);
            if (node.is(":checkbox")) {
                node.prop("checked", false);
            }
        },
        getChecked: function (type) {
            var smarts = [];
            $.each($(CHECK_ITEM_SELECTOR + "[" + CHECKED_ATTR + "]", this.node), function () {
                smarts.push(type == "node" ? $(this) : Smart.of($(this)));
            });
            return smarts;
        },
        getCheckedData: function (field) {
            var datas = [];
            $.each(this.getChecked(), function () {
                if (field) {
                    datas.push(this.data()[field]);
                } else {
                    datas.push(this.data());
                }
            });
            return datas;
        },
        _toggleCheck: function (node, e) {
            //如果选择项下面拥有选择句柄，而且选择事件不是选择句柄发出的，则跳过。
            if (e && $(CHECK_ITEM_HANDLER_SELECTOR, node).size() > 0) {
                if (!$(e.target).is(CHECK_ITEM_HANDLER_SELECTOR)) {
                    return;
                }
            }
            var checkedClass = this.widget.check.options['checkedStyle'];
            if (node.hasClass(checkedClass)) {
                this._uncheck(node);
            } else {
                this._check(node);
            }
        },
        _check: function (node) {
            if (node.hasClass(this.widget.check.options['checkedStyle'])) {
                return;
            }
            //如果是单选，则需要把其他的item取消选中
            var that = this;
            if (this.widget.check.options.multiple == "false" || !this.widget.check.options.multiple) {
                $(CHECK_ITEM_SELECTOR, this.node).not(node).each(function () {
                    that._uncheck($(this));
                });
            }

            this._checkNode(node);
            if (this.widget.check.options['path'] == 'true') this._checkNextUntil(node);
        },
        _checkNextUntil: function (node) {
            var i = node.attr(CHECK_PATH_ATTR);
            //将下级的所有节点选中
            var nextNodes = node.nextUntil(":not(*[" + CHECK_PATH_ATTR + "^=" + i + "/])");
            var that = this;
            nextNodes.each(function () {
                that._checkNode($(this));
            });
        },
        _uncheck: function (node) {
            if (!node.hasClass(this.widget.check.options['checkedStyle'])) {
                return;
            }
            this._uncheckNode(node);
            if (this.widget.check.options['path'] == 'true') {
                //取消选中下级的所有节点
                this._uncheckPrevUntil(node);
                //取消选中所有的上级节点
                this._uncheckNextUntil(node);
            }
        },
        _uncheckNextUntil: function (node) {
            var i = node.attr(CHECK_PATH_ATTR);
            //将下级的所有节点取消选中
            var nextNodes = node.nextUntil(":not(*[" + CHECK_PATH_ATTR + "^=" + i + "/])");
            var that = this;
            nextNodes.each(function () {
                that._uncheckNode($(this));
            });
        },
        _uncheckPrevUntil: function (node) {
            var path = node.attr(CHECK_PATH_ATTR);
            if (path == undefined) {
                return;
            }
            var segs = path.split("/");
            var currentNode = node;
            while (segs.length > 2) {
                segs.pop();
                var p = segs.join("/");
                var attr = "*[" + CHECK_PATH_ATTR + "=" + p + "]";
                var prevNode = currentNode.prevUntil(attr).last().prev();
                if (prevNode.size() == 0) {
                    prevNode = currentNode.prev();
                }
                if (prevNode.is(attr)) {
                    currentNode = prevNode;
                    this._uncheckNode(prevNode);
                }
            }
        },
        _checkNode: function (node) {
            if (node.attr(CHECKED_ATTR) || $(CHECK_ROW_IG_SELECTOR, node).size() > 0 || node.attr(CHECK_ROW_IG_SELECTOR)) {
                return;
            }
            node.attr(CHECKED_ATTR, true).addClass(this.widget.check.options['checkedStyle']).addClass(CHECKED_CLASS).trigger("checked");

            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.addClass(this.widget.check.options['handlerCheckStyle']).addClass(CHECKED_CLASS);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (!handler.prop("checked")) handler.prop("checked", true);
                }, 1);
            }
        },
        _uncheckNode: function (node) {
            if (!node.attr(CHECKED_ATTR)) {
                return;
            }
            node.removeAttr(CHECKED_ATTR).removeClass(this.widget.check.options['checkedStyle']).removeClass(CHECKED_CLASS).trigger("unchecked");
            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.removeClass(this.widget.check.options['handlerCheckStyle']).removeClass(CHECKED_CLASS);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (handler.prop("checked")) handler.prop("checked", false);
                }, 1);
            }
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    //为子控件赋值控件。
    Smart.widgetExtend({
        id: "datac"
    },null, {
        dataSetter: function(){
            var args = Smart.SLICE.call(arguments);
            var igAttr = this.widget.datac.optionName("ig");
            var fnAttr = this.widget.datac.optionName("fn");
            var deferreds = [];
            this.children().each(function(){
                var that = this;
                deferreds.push(function(){
                    var ig = that.node.attr(igAttr);
                    if(ig == "true" || ig == ""){
                        return;
                    }
                    var fn = that.node.attr(fnAttr) || "data";
                    return that[fn].apply(that, args);
                })
            });
            return Smart.deferredQueue(deferreds);
        }
    });
})();;/**
 * Created by nana on 2015/9/21.
 */
(function ($) {
    Smart.widgetExtend({
        id: "event"
    }, {
        onPrepare: function () {
            var that = this;
            $.each(this.options, function(evt, action){
                that.S.node.on(evt, function(e){
                    action.call(this, e);
                });
            });
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    var roleAttr = Smart.optionAttrName("loop", "role");

    function getRoleNode(val, node) {
        return $("*[" + roleAttr + "='" + val + "']:first", node);
    }

    //loop控件，可以用该控件来构建列表，grid。
    Smart.widgetExtend({
        id: "loop",
        options: "type,childrenKey,indentWidth,indentPre",
        defaultOptions: {
            'childrenKey': "children",
            indent: 20
        }
    }, {
        onPrepare: function () {
            this.cache = {};
            var emptyRow = getRoleNode("empty", this.S.node);
            var loadingRow = getRoleNode("loading", this.S.node);
            var loopRow = getRoleNode("row", this.S.node);
            var prepareRow = getRoleNode("prepare", this.S.node);
            this.S.node.empty();
            prepareRow.size() && this.S.node.append(prepareRow);
            emptyRow.size() && (this.cache.emptyRow = emptyRow);
            prepareRow.size() && (this.cache.prepareRow = prepareRow);
            loopRow.size() && (this.cache.loopRow = loopRow);
            loadingRow.size() && (this.cache.loadingRow = loadingRow);
        },
        onData: function () {
            if (this.cache.loadingRow) {
                this.S.empty();
                this.S.node.append(this.cache.loadingRow);
            }
        }
    }, {
        empty: function () {
            this.node.empty();
        },
        hideAssistRows: function () {
            this.widget.loop.cache.prepareRow && this.widget.loop.cache.prepareRow.is(':visible') && this.widget.loop.cache.prepareRow.remove();
            this.widget.loop.cache.emptyRow && this.widget.loop.cache.emptyRow.is(':visible') && this.widget.loop.cache.emptyRow.remove();
            this.widget.loop.cache.loadingRow && this.widget.loop.cache.loadingRow.is(':visible') && this.widget.loop.cache.loadingRow.remove();
        },
        addRow: function (data, mode, indentNum, igCheckAssistRow) {
            var row = this._getRow().show();
            if (igCheckAssistRow) {
                this.hideAssistRows();
            }
            if (indentNum) {
                var indentNode = row.find('*[s-loop-tree-role="indent"]');
                if (this.widget.loop.options['indentPre']) {
                    var str = this.widget.loop.options['indentPre'];
                    for (var i = 1; i < indentNum; i++) {
                        str += str;
                    }
                    indentNode.prepend(str);
                } else if (indentNode.size() >= 0) {
                    indentNode.css("text-indent", this.widget.loop.options.indent * indentNum + "px");
                }

            }
            var that = this;
            var rowSmart = Smart.of(row);
            this.node[mode || 'append'](rowSmart.node);
            rowSmart.render().done(function () {
                rowSmart.data(data);
                that.trigger("row-add", [row, data, mode, indentNum]);
            });
        },
        addRows: function (datas, mode, indentNum) {
            this.hideAssistRows();
            indentNum = indentNum == undefined ? 0 : indentNum;
            for (var i = 0; i < datas.length; i++) {
                this.addRow(datas[i], mode, indentNum, true);
                //如果是tree的方式
                if (this.widget.loop.options.type == "tree") {
                    var children = datas[i][this.widget.loop.options['childrenKey']];
                    if (children && children.length) {
                        this.addRows(children, mode, indentNum + 1);
                    }
                }
            }
        },
        _getRow: function () {
            var row = this.widget.loop.cache.loopRow.clone();
            return row;
        },
        _addEmptyRow: function () {
            var emptyRow = this.widget.loop.cache.emptyRow;
            if (emptyRow) {
                this.node.append(emptyRow.show());
            }
        },
        setRows: function (datas) {
            this.empty();
            if (datas.length == 0) {
                this._addEmptyRow();
                return;
            }
            var that = this;
            var deferred = $.Deferred();
            setTimeout(function () {
                that.addRows(datas);
                deferred.resolve();
            }, 10);
            return deferred;
        },
        dataSetter: function (data) {
            if (data == null) {
                data = [];
            }
            if (!$.isArray(data)) {
                Smart.error("loop控件接受的赋值参数必须是数组");
                return;
            }
            return this.setRows(data);
        }
    });
    Smart.widgetExtend({
        id: "row",
        options: "ctx:render"
    }, null, {
        dataSetter: function (data) {
            this.widget.row.cache_data = data;
            this.inherited([data]);
            this.widget.row.options.render && this.widget.row.options.render.call(this, this.node);
        },
        dataGetter: function () {
            return this.widget.row.cache_data;
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    //将该元素的所有 拥有 name 属性的子元素 适配成可接受赋值的控件，即默认的控件。
    //name的值作为 data-key的值，data-accept设置为true
    Smart.widgetExtend("nda", {
        onPrepare: function(){
            this.S.node.find("*[name]").each(function(){
                var nameNode = $(this);
                var ig = nameNode.attr('s-nda-ig');
                if(ig && ($.trim(ig) == "" || $.trim(ig) == 'true')){
                    return;
                }
                if(!Smart.isWidgetNode(nameNode)){
                    //如果不是控件
                    //则把它声明成为一个基本控件
                    nameNode.attr(Smart.DEFINE_KEY, "");
                }
                var attrName = Smart.optionAttrName("data", "filter");
                if(Smart.isEmpty(nameNode.attr(attrName))){
                    nameNode.attr(attrName, "'"+nameNode.attr("name")+"'");
                }
            });
        }
    });
})();;/**
 * Created by Administrator on 2014/6/21.
 */
//模板控件。
(function(){
    var token = 0;
    var TABLE_FN_KEY = "_TPL_FN_";
    Smart.widgetExtend({
        id: "tpl"
    }, {
        onPrepare: function(){
            this.cache = {};
            var tplText;
            var plainTextNode = this.S.node.find(" > script[type='text/template']");
            if(plainTextNode.size() > 0){
                tplText = plainTextNode.html();
            } else {
                tplText = this.S.node.html();
            }
            this.S.node.empty();
            var fn;
            var fn_map = this.S.contextValue("s-tpl-fn_map");
            if(!fn_map){
                fn_map = {};
                this.S.contextValue("s-tpl-fn_map", fn_map);
            }
            if(tplText in fn_map){
                fn = fn_map[tplText]
            } else {
                var compiledText = $.template.compile(tplText);
                var scripts = [];
                scripts.push("(function(){");
                scripts.push("      return function(){");
                scripts.push(compiledText);
                scripts.push("      }");
                scripts.push("})();//@ sourceURL=" + (token++) + "_template.js");
                var script = scripts.join("\n");
                fn = this.S.context(script);
                fn_map[tplText] = fn;
            }
            this.cache[TABLE_FN_KEY] = fn;
            if(this.S.node.hasClass('s-ui-tpl-hide')){
                this.S.node.removeClass("s-ui-tpl-hide");
            }
        }
    },{
        dataSetter: function(data){
            this._insertData(data)
        },
        appendData: function(data){
            this._insertData(data, "appendNode");
        },
        prependData: function(data){
            this._insertData(data, "prependNode");
        },
        _insertData: function(data, mode){
            var fn = this.widget.tpl.cache[TABLE_FN_KEY];
            var html = fn.call(data);
            this[mode || "setNode"](html);
        }
    });
})();;/**
 * Created by Administrator on 2014/6/11.
 */
(function ($) {
    var SCRIPT_RE = /<script(\s+.*['"]text\/javascript['"][^\w>]*|\s*?)>((?:.|\s)*?)<\/script>/gim;
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

    var process = function (result, href, loadArgs) {
        var html = result.html;
        loadArgs = loadArgs || {};
        var scriptTexts = result.scriptTexts;
//        var applyArgs = Smart.SLICE.call(arguments, 2);
        var scripts = [];
        //处理模板
        var meta = result.meta;
        var argsScripts = [];
        scripts.push("(function(){");
        scripts.push("    return function(){");
        if (meta.args) { //如果有参数定义，那么参数的值是
            //传递进来的加载参数对象是第二个参数。
            $.each(meta.args, function (i, arg) {
                var argSeg = arg.split(":");
                var argStr = "var " + argSeg[0] + " = arguments[0]['" + argSeg[0] + "'];\n";
                if (argSeg.length == 2) {
                    var tmpStr = argSeg[0] + " = " + argSeg[0] + " !==undefined ? " + argSeg[0] + " : " + argSeg[1] + ";";
                    argStr += tmpStr + "\n";
                }
                argsScripts.push(argStr);
                scripts.push(argStr);
            });
        }
        scripts.push("var S = this;");
        scripts.push("var " + Smart.VALUE_CONTEXT + " = {};");
        scripts.push(scriptTexts.join("\n"));
        scripts.push("			return function(key){");
        scripts.push("				try{");
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
            html = fn.call(this, loadArgs);
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
        this.meta = {};
        this.node.empty().append(this._WNODE);
        undelegateEvent(this);
        var scriptFn = this.context(scripts.join("\n"));
        //处理url后面的queryString，也把后面的queryString作为loadArgs
        var scriptArgs = {};
        var queryString = "";
        if (href.indexOf("#") != -1) {
            queryString = href.substring(href.indexOf("?") + 1, href.indexOf("#"));
        } else {
            queryString = href.substring(href.indexOf("?") + 1);
        }
        if (queryString != "") {
            $.each(queryString.split("&"), function (i, kv) {
                var tmps = kv.split("=");
                if (tmps.length > 1) {
                    scriptArgs[tmps[0]] = tmps[1];
                }
            });
        }
        $.extend(scriptArgs, loadArgs || {});
        var context = scriptFn.call(this, scriptArgs);
        this.CONTEXT = context;
        $.each(meta, function (key, val) {
            if (key == 'args') {
                return;
            }
            meta[key] = val.replace(META_VALUE_RE, function ($0, $1) {
                return that.context($1);
            });
        });
        $.each(meta, function (key, val) {
            if (!(key in that.meta)) {
                that.meta[key] = val;
            }
        });
        //绑定浏览器事件，click等
        delegateEvent(this);
        //处理自动焦点的元素
        this.node.find("*[s-window-role='focus']:first").focus();

        this.on("s-ready", function () {
            //处理锚点滚动
            if (href.indexOf("#") != -1) {
                var anchor = href.substring(href.indexOf("#"));
                that.scrollTo(anchor);
            }
        });
    };

    var EVENT_MAP = {
        "s-click": 'click',
        "s-change": 'change',
        "s-focus": 'focus',
        "s-blur": 'blur',
        "s-dblclick": 'dblclick',
        "s-mouseover": 'mouseover',
        "s-mousemove": "mousemove",
        "s-mouseout": "mouseout",
        "s-mouseleave": "mouseleave"
    };

    function undelegateEvent(smart) {
        smart.node.undelegate();
    }

    function delegateEvent(smart) {
        $.each(EVENT_MAP, function (key, val) {
            smart.node.delegate("*[" + key + "]", val, function (e) {
                var node = $(e.currentTarget);
                var delegateTarget = node.data("_window_delegateTarget_");
                if (!delegateTarget) {
                    delegateTarget = e.delegateTarget;
                    node.data("_window_delegateTarget_", delegateTarget);
                }
                if (smart.node[0] != delegateTarget) {
                    return;
                }
                var evtKey = "__SMART__EVENT__" + key;
                var action = node.data(evtKey);
                if (!action) {
                    var evtScript = node.attr(key);
                    action = smart.action(evtScript);
                    node.data(evtKey, action);
                }
                var result = action.call(Smart.of(node), e);
                if (result == null)
                    return;
                if (Smart.isDeferred(result)) {//说明这个是deferred对象
                    Smart.disableNode(node);
                    result.always(function () {
                        Smart.disableNode(node, false);
                    });
                }
                return result;
            });
        });
    }

    var CURRENT_WINDOW_ID = 0;

    var ON_BEFORE_CLOSE_FN_KEY = "_onBeforeCloseFns_";
    var EVENT_ON_CACHE = "_EVENT_ON_CACHE";

    var STOP_ANCHOR_SCROLLIN_KEY = "_stop_anchor_scrollin_";

    Smart.widgetExtend({
        id: "window",
        options: "href,args"
    }, {
        onPrepare: function () {
            this.cache = {};
            this.S._WINDOW_ID = "_w_" + (CURRENT_WINDOW_ID++);
            this.cache[ON_BEFORE_CLOSE_FN_KEY] = [];
            this.cache[EVENT_ON_CACHE] = [];
            this.location = {
                href: this.options.href,
                args: this.options.args
            };
            if (!this.S.node.attr("id")) {
                this.S.node.attr("id", this.S._WINDOW_ID);
            }
        },
        onBuild: function () {
            var deferred = $.Deferred();
            var that = this;
            if (this.location.href) {
                this.S._load.apply(this.S, [this.location.href].concat(this.location.args || [])).done(function () {
                    deferred.resolve();
                }).fail(function () {
                    deferred.reject();
                });
                return deferred.promise();
            } else {
                that.S.trigger("s-loaded");
                return deferred.resolve();
            }
        },
        onDestroy: function () {
            this.onClean();
        },
        onClean: function () {
            this.S._clean();
        }
    }, {
        _clean: function () {
            this.widget.window.cache[ON_BEFORE_CLOSE_FN_KEY] = [];
            this._offEvent();
            this.node.empty();
        },
        _offEvent: function () {
            var that = this;
            $.each(this.widget.window.cache[EVENT_ON_CACHE], function (i, paramAry) {
                that.off.apply(that, paramAry);
            });
            this.widget.window.cache[EVENT_ON_CACHE] = [];
        },
        refresh: function () {
            var that = this;
            var deferred = $.Deferred();
            this.preClose().done(function () {
                that.clean();
                Smart.deferredChain(deferred, that.load(that.widget.window.location.href, that.widget.window.location.args));
            })
            return deferred.promise();
        },
        load: function () {
            var that = this;
            var deferred = $.Deferred();
            this._load.apply(this, Smart.SLICE.call(arguments)).done(function () {
                that.renderChildren().done(function () {
                    that.trigger("s-ready");
                    deferred.resolve(that);
                }).fail(function () {
                    deferred.reject.apply(deferred, $.makeArray(arguments));
                })
            }).fail(function () {
                deferred.reject.apply(deferred, $.makeArray(arguments));
            });
            return deferred;
        },
        _load: function (href, loadArgs) {
            this.clean();
            this.widget.window.cache["loadState"] = true;//是否已经加载
            this._offEvent();
            this.trigger("s-loading");
            var deferred = $.Deferred();
            var args = $.makeArray(arguments);
            this.widget.window.location.args = loadArgs;
            var that = this;
            this.widget.window.location.href = href;
            this.get(href, null, "text").done(function (html) {
                var result = parseHtml(html);
                var scriptSrcs = result.scriptSrcs;
                Smart.loadFiles(scriptSrcs, href).done(function () {

                }).fail(function () {
                    Smart.error(href + "的依赖处理失败");
                }).always(function () {
                    process.apply(that, [result].concat(args));
                    that.trigger("s-loaded");
                    //当页面存在锚点的时候，页面滚动的时候，监听锚点的位置，并触发事件。
                    that._listenAnchorPos();
                    deferred.resolve();
                });

            }).fail(function () {
                deferred.reject.apply(deferred, $.makeArray(arguments));;
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
            this.widget.window.cache[STOP_ANCHOR_SCROLLIN_KEY] = true;
            var that = this;
            return this.scrollTo("#" + id).done(function () {
                delete that.widget.window.cache[STOP_ANCHOR_SCROLLIN_KEY];
            });
        },
        _listenAnchorPos: function () {
            var nodes = this._getAnchorNodes();
            var nodesLength = nodes.size();
            if (nodesLength > 0) {
                var that = this;
                var anchorScrollListener = function () {
                    if (that.widget.window.cache[STOP_ANCHOR_SCROLLIN_KEY]) {
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
                this.on("clean", function () {
                    that.node.unbind("scroll", anchorScrollListener);
                });
                this.node.scroll(anchorScrollListener).on("anchor.scrollin", function (e) {
                    e.stopPropagation();
                });
            }
        },
        getAnchors: function () {
            var anchors = this.widget.window.cache['_anchors_'];
            if (!anchors) {
                anchors = [];
                this.widget.window.cache['_anchors_'] = anchors;
                this._getAnchorNodes().each(function () {
                    var n = $(this);
                    anchors.push({id: n.attr("_id_"), title: n.attr("title")});
                });
            }
            return anchors;
        },
        _getAnchorNodes: function () {
            var attrName = Smart.optionAttrName("window", "role");
            return this.node.find("*[" + attrName + "='a']");
        },
        //预关闭；
        preClose: function () {
            var deferred = $.Deferred();
            var onBeforeCloseFns = this.widget.window.cache[ON_BEFORE_CLOSE_FN_KEY];
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

        open: function () {
            var deferred = $.Deferred();
            var e = $.Event("open", {deferred: deferred, smart: this});
            this.trigger(e, $.makeArray(arguments));
            return deferred;
        },

        close: function () {
            //触发beforeClose监听事件。
            var that = this;
            var args = arguments;
            setTimeout(function () {
                var deferred = $.Deferred();
                deferred.done(function () {
                    that._clean();
                    that.widget.window.cache = {};
                    that.node.remove();
                });
                var event = $.Event("close", {deferred: deferred});
                that.trigger(event, Smart.SLICE.call(args));
                event.deferred['resolve'] && event.deferred.resolve();
            }, 1);
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
            this.widget.window.cache[ON_BEFORE_CLOSE_FN_KEY].push(fn);
            return this;
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
            return Smart.of(this.N(selector));
        },
        N: function (selector) {
            var _selector = [];
            selector = selector.split(",");
            if (selector.length == 1) {
                selector = selector[0];
                if (selector.charAt(0) == "#") {
                    selector = "#" + this.trueId(selector.substring(1));
                }
            } else {
                for (var i = 0; i < selector.length; i++) {
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
            if (this.widget.window.cache.loadState) {
                //如果已经加载了，on的事件将会被记录，在重新load的时候会移除掉这些事件。
                this.widget.window.cache[EVENT_ON_CACHE].push([events, selector, fn]);
            }
            return this.inherited([events, selector, fn]);
        },
        action: function (script) {
            var script_body = [];
            script_body.push("(function(){");
            script_body.push("      return function(){");
            script_body.push("          " + script);
            script_body.push("      }")
            script_body.push("})()");
            return this.context(script_body.join("\n"));
        }
    });

})(jQuery);;/**
 * Created by Administrator on 2014/6/17.
 */
(function($){
    var zIndex = 1000;
    var UI_TEMPLATE = {};
    Smart.UI = {
        zIndex:function(){
            return zIndex++;
        },
        template: function(role){
            return UI_TEMPLATE[role].clone();
        },
        loadTemplate: function(url){
            return $.get(url, function(html){
                html = $("<div />").append(html);
                $("*[s-ui-role]", html).each(function(){
                    var node = $(this);
                    UI_TEMPLATE[node.attr("s-ui-role")] = node;
                });
            });
        },
        backdrop: (function(){

            var BACKDROP_ZINDEX_STACK = [];

            var backdrop;

            var isShown = false;

            return function(show){
                if(!backdrop){
                    backdrop = $(Smart.UI.template('backdrop')).clone();
                    backdrop.appendTo("body");
                }
                var deferred = $.Deferred();
                show = show == undefined ? true : show;
                if (show) {

                    var zIndex = Smart.UI.zIndex();
                    BACKDROP_ZINDEX_STACK.push(zIndex);

                    backdrop.show().css("z-index", zIndex);
                    if(isShown){
                        return deferred.resolve();
                    }

                    var callback = function(){
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
                    if(BACKDROP_ZINDEX_STACK.length){
                        backdrop.css("zIndex", BACKDROP_ZINDEX_STACK[BACKDROP_ZINDEX_STACK.length - 1]);
                        return deferred.resolve();
                    }
                    var callback = function(){
                        if(!backdrop.hasClass('in')){
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
;/**
 * Created by Administrator on 2015/1/8.
 */
(function ($) {
    'use strict';

    // AFFIX style DEFINITION
    // ======================

    var Affix = function (element, options) {
        this.options = $.extend({}, Affix.DEFAULTS, options)
        this.$window = $(this.options.target)
            .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
            .on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this))

        this.$element = $(element)
        this.affixed =
            this.unpin =
                this.pinnedOffset = null

        this.checkPosition()
    }

    Affix.RESET = 'affix affix-top affix-bottom'

    Affix.DEFAULTS = {
        offset: 0,
        target: window
    }

    Affix.prototype.getPinnedOffset = function () {
        if (this.pinnedOffset) return this.pinnedOffset
        this.$element.removeClass(Affix.RESET).addClass('affix')
        var scrollTop = this.$window.scrollTop()
        var position = this.$element.offset()
        return (this.pinnedOffset = position.top - scrollTop)
    }

    Affix.prototype.checkPositionWithEventLoop = function () {
        setTimeout($.proxy(this.checkPosition, this), 1)
    }

    Affix.prototype.checkPosition = function () {
        if (!this.$element.is(':visible')) return

        var scrollHeight = $(document).height()
        var scrollTop = this.$window.scrollTop()
        var position = this.$element.offset()
        var offset = this.options.offset
        var offsetTop = offset.top
        var offsetBottom = offset.bottom

        if (this.affixed == 'top') position.top += scrollTop

        if (typeof offset != 'object')         offsetBottom = offsetTop = offset
        if (typeof offsetTop == 'function')    offsetTop = offset.top(this.$element)
        if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

        var affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ? false :
            offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ? 'bottom' :
                offsetTop != null && (scrollTop <= offsetTop) ? 'top' : false

        if (this.affixed === affix) return
        if (this.unpin) this.$element.css('top', '')

        var affixType = 'affix' + (affix ? '-' + affix : '')
        var e = $.Event(affixType + '.bs.affix')

        this.$element.trigger(e)

        if (e.isDefaultPrevented()) return

        this.affixed = affix
        this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

        this.$element
            .removeClass(Affix.RESET)
            .addClass(affixType)
            .trigger($.Event(affixType.replace('affix', 'affixed')))

        if (affix == 'bottom') {
            this.$element.offset({top: scrollHeight - offsetBottom - this.$element.height()})
        }
    }


    // AFFIX PLUGIN DEFINITION
    // =======================

    var old = $.fn.affix

    $.fn.smartAffix = function (option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.affix')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.smartAffix.Constructor = Affix


    // AFFIX NO CONFLICT
    // =================

    $.fn.smartAffix.noConflict = function () {
        $.fn.affix = old
        return this
    }

})(jQuery);
(function ($) {
    Smart.widgetExtend({
        id: "affix",
        options: "ctx:offset,ctx:target,affixClass",
        defaultOptions: {
            affixClass: 's-ui-affix-bar'
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.addClass('s-ui-affix').smartAffix({
                offset: this.options.offset || (that.S.node.offset().top - that.options.target.offset().top),
                target: this.options.target
            });
            this.S.node.on("affix.bs.affix", function (e) {
                var node = $(e.currentTarget);
                var offset = that.options.target.offset();
                node.css({
                    top: offset.top
                });
            });
            if (this.options['affixClass']) {
                var that = this;
                this.S.node.on("affixed.bs.affix", function (e) {
                    e.stopPropagation();
                    that.S.node.addClass(that.options['affixClass']);
                }).on("affixed-top.bs.affix", function (e) {
                    e.stopPropagation();
                    that.S.node.removeClass(that.options['affixClass']);
                });
            }
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {
    var mark_class = "s-btnGroup-active";
    var active_class_def_attr = Smart.optionAttrName('btnGroup', 'activeClass');
    var actived_attr = Smart.optionAttrName('btnGroup', 'active');
    Smart.widgetExtend({
        id: "btnGroup",
        options: "activeClass"
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.delegate(" > * ", "click", function(e){
                var btn = $(this);
                if(btn.hasClass(mark_class))
                    return;
                var lastBtn = btn.siblings("."+mark_class);
                lastBtn.size() && lastBtn.removeClass(that.options['activeClass']).removeClass(mark_class);
                btn.addClass(mark_class).addClass(that._getBtnActiveClass(btn));
            });
            this.initActivedNode = $(" > *["+actived_attr+"] ", this.S.node).click();
        },
        _getBtnActiveClass: function(btn){
            return btn.attr(active_class_def_attr) || this.options['activeClass'];
        },
        onReset: function () {
            this.initActivedNode.click();
        }
    },{
        reset: function(){
            this.widget.btnGroup.initActivedNode.click();
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/6/21.
 */
(function(){
    Smart.UI.contextmenu = {
        target: null
    };

    var DISABLED_CLASS = "disabled";

    var CURRENT_SHOWN_CONTEXTMENU;

    Smart.widgetExtend({
        id: "contextmenu",
        options: "ctx:target,ctx:filter,delegate"
    },{
        onPrepare: function(){
            var target = this.options['target'];
            var that = this;
            if(target)
                this.S.bindTarget(target);
            this.S.node.delegate("li", "click", function(e){
                if($("ul", $(this)).size() > 0){
                    return;
                }
                that.S.hide();
            });
            $(document).click(function(e){
                that.S.hide();
            });
            this.S.node.find("li ul").each(function(e){
                var ul = $(this);
                var parentLi = ul.parent();
                parentLi.mouseover(function(){
                    if($(this).hasClass(DISABLED_CLASS)){
                        return;
                    }
                    ul.css("z-index",Smart.UI.zIndex()).show().position({
                        of: parentLi,
                        my: "left top",
                        at: "right-3 top+3",
                        collision: "flip flip"
                    });
                });
                parentLi.mouseleave(function(){
                    ul.fadeOut();
                });
            });
        }
    },{
        bindTarget: function(node, options){
            var that = this;
            options && (this.widget.contextmenu.options = options);
            if(this.widget.contextmenu.options.delegate){
                node.delegate(this.widget.contextmenu.options.delegate, "contextmenu", function(e){
                    that.show(e, $(e.currentTarget));
                    return false;
                })
            } else {
                node.bind("contextmenu", function(e){
                    that.show(e, $(this));
                    return false;
                });
            }

        },
        show: function(e, el){
            if(CURRENT_SHOWN_CONTEXTMENU && CURRENT_SHOWN_CONTEXTMENU != this){
                CURRENT_SHOWN_CONTEXTMENU.hide();
            }
            CURRENT_SHOWN_CONTEXTMENU = this;
            Smart.UI.contextmenu.target = Smart.of(el);
            Smart.UI.contextmenu.node = $(e.target);
            //过滤菜单
            if(this.widget.contextmenu.options.filter){
                var menuNodes = this.node.find("li[menuId]");
                var that = this;
                if(menuNodes.size()){
                    menuNodes.each(function(){
                        //如果filter的返回值是false，则说明该菜单不可用。
                        var node = $(this);
                        var menuId = node.attr("menuId");
                        if(that.widget.contextmenu.options.filter(menuId, node) == false){
                            that._disableMenu(node);
                        } else {
                            that._enableMenu(node);
                        }
                    });
                }
            }
            $(this.node).show().css({
                zIndex:Smart.UI.zIndex(),
                position: "absolute"
            }).position({
                of: e,
                my: "left top",
                at: "left top",
                collision: "flip flip"
            });
        },
        hide: function(){
            this.node.fadeOut(200);
        },
        disableMenuById: function(id){
            this._disableMenu(this.node.find("li[menuId='"+id+"']"));
        },
        _disableMenu: function(menu){
            menu.addClass(DISABLED_CLASS);
            $("i, span", menu).click(function(e){
                e.stopPropagation();
            });
        },
        enableMenuById: function(id){
            this._enableMenu(this.node.find("li[menuId='"+id+"']"));
        },
        _enableMenu: function(menu){
            menu.removeClass(DISABLED_CLASS);
            $("i, span", menu).unbind("click");
        }
    });
})();;/**
 * Created by Administrator on 2014/9/2.
 */
(function ($) {
    Smart.widgetExtend({
        id: "datetimepicker",
        options: "format,config,autoclose,minView,maxView,maxView,language,pickTime,startView",
        defaultOptions: {
            format: "yyyy-mm-dd",
            autoclose: true,
            language: 'zh-CN',
            minView: 'month',
            todayHighlight: true
        }
    }, {
        onPrepare: function () {
            this.S.node.datetimepicker(this.options);
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {
    var dropdown_val_attr = Smart.optionAttrName('dropdown', 'val');
    var dropdown_title_attr = Smart.optionAttrName('dropdown', 'title');
    var dropdown_title_selector = "*[" + Smart.optionAttrName('dropdown', 'role') + "='title']";
    Smart.widgetExtend({
        id: "dropdown",
        options: "action,ctx:t,ctx:reset-s"
    }, {
        onPrepare: function () {
            var that = this;
            if (that.options.action) {
                that.options.action = this.S.action(this.options.action)
            }
            this.cache.dropdownTitle = $(dropdown_title_selector, that.S.node);
            this.S.node.delegate("*[" + dropdown_val_attr + "]", 'click', function (e) {
                var val = $(this).attr(dropdown_val_attr);
                //如果配置了target，则把该值赋值给target
                if (that.options.t) {
                    that.options.t.val(val);
                }
                if (that.options.action) {//如果配置了e，则发送该事件
                    that.options.action.call(val);
                }
                var title = $(this).attr(dropdown_title_attr) || $(this).text();
                that.cache.dropdownTitle.html(title);
                if(that.options['reset-s']){
                    that.options['reset-s'].each(function(){
                        this.reset();
                    });
                }
            });
        },
        onReset: function () {
            this.cache.dropdownTitle.html("");
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/11/29.
 */
(function ($) {
    var dropdown_filter_selector = "*[" + Smart.optionAttrName('dropdownlist', 'role') + "='filter']";
    var dropdown_item_selector = "*[" + Smart.optionAttrName('dropdownlist', 'role') + "='item']";
    Smart.widgetExtend({
        id: "dropdownlist",
        options: "ctx:filter"
    }, {
        onPrepare: function () {
            var that = this;
            var filterNode = $(dropdown_filter_selector, this.S.node);
            var outerFilter = this.options.filter;
            filterNode.click(function(e){
                e.stopPropagation();
            });
            filterNode = filterNode.add(outerFilter);
            if(filterNode.size() > 0){
                filterNode.keyup(function(e){
                    $(dropdown_item_selector, that.S.node).hide();
                    $(dropdown_item_selector+":contains("+$(e.target).val()+")", that.S.node).show();
                    e.stopPropagation();
                });
                filterNode.focus(function(e){
                    e.stopPropagation();
                    $(e.target).select();
                });
            }
        },
        onReset: function () {
            $(dropdown_item_selector, this.S.node).show();
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/7/14.
 */
(function(){
    Smart.widgetExtend({
        id: "editable",
        options: "url,method",
        defaultOptions:{
            method: "put"
        }
    },{
        onPrepare: function(){
            var that = this;
            this.S.node.delegate("*[s-editable-role='i']", "change", function(e){
                that.S._submit($(e.target));
                e.stopPropagation();
            });
        }
    },{
        _submit:function(node){
            var that = this;
            node.addClass("focus");
            function submit(){
                var name = node.attr("name");
                var val = node.attr("s-editable-val") || node.val();
                var data = {};
                data[name] = val;
                that[that.widget.editable.options.method](that.widget.editable.options.url, data).done(function(){
                    that.reset();
                    node.removeClass("focus");
                });
            }

            if("validateNode" in this && $.isFunction(this.validateNode)){//说明该控件是验证控件
                this.validateNode(node).done(function(){
                    submit();
                });
            } else {
                submit();
            }

        }
    });
})();/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    //表单提交插件，作用于submit按钮，可以实现表单回车提交
    Smart.widgetExtend({
        id: "form",
        options: "ctx:action,ctx:done,ctx:fail,ctx:always",
        defaultOptions: {
            method: "post",
            enctype: "application/x-www-form-urlencoded"
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.options.action = this.S.node.attr("action") || this.options.action;
            this.options.method = this.S.node.attr("method") || this.options.method;
            this.options.enctype = this.S.node.attr("enctype") || this.options.enctype;
            var submitBtn = this.S.node.find(":submit");
            this.S.node[0].onsubmit = function (e) {
                e.stopPropagation();
                try {
                    Smart.disableNode(submitBtn);
                    that.S.submit().always(function () {
                        Smart.disableNode(submitBtn, false);
                    });
                } catch (e) {
                    Smart.error(e);
                }
                return false;
            };
        }
    }, {
        submit: function () {
            var deferred = $.Deferred();
            if (!('action' in this.widget.form.options)) {
                return deferred.resolve();
            }
            var that = this;

            deferred.done(function (rs) {
                that.widget.form.options.done && that.widget.form.options.done.call(that, rs);
            }).fail(function () {
                that.widget.form.options.fail && that.widget.form.options.fail.apply(that, $.makeArray(arguments));
            }).always(function () {
                that.widget.form.options.always && that.widget.form.options.always.call(that);
            });

            function getSubmitData() {
                switch (that.widget.form.options.enctype) {
                    case "multipart/form-data" :
                        return Smart.formData(that.node);
                    case "application/x-www-form-urlencoded" :
                    default:
                        return Smart.serializeToObject(that.node);
                }
            }

            if ($.isFunction(this.widget.form.options.action)) {//如果定义了submit action，则直接执行该action
                var actionSubmit = function () {
                    var result = that.widget.form.options.action.call(that, getSubmitData());
                    if (Smart.isDeferred(result)) {//说明是deferred对象
                        result.done(function (rs) {
                            deferred.resolve(rs);
                        }).fail(function () {
                            deferred.reject.call(deferred, $.makeArray(arguments));
                        });
                    } else {
                        deferred.resolve(result);
                    }
                };
                if ("validate" in this) {
                    this.validate().done(actionSubmit).fail(function () {
                        deferred.reject();
                    });
                } else {
                    actionSubmit();
                }

                return deferred;
            }
            var submit = function () {
                var data = getSubmitData();
                that[that.widget.form.options.method](that.widget.form.options.action, data).done(function (rs) {
                    deferred.resolve(rs);
                }).fail(function () {
                    deferred.reject.call(deferred, $.makeArray(arguments));
                });
            };

            //证明该form是需要验证的
            if ("validate" in this) {
                this.validate().done(function () {
                    submit();
                }).fail(function () {
                    deferred.reject();
                });
            } else {
                submit();
            }
            return deferred;
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var paging = function (page, pageSize, totalCount, showSize) {
        showSize = showSize || 10;
        page = page < 1 ? 1 : parseInt(page);
        pageSize = parseInt(pageSize)
        totalCount = parseInt(totalCount)
        showSize = parseInt(showSize)
        var totalPage = Math.ceil(totalCount / pageSize);
        var startPage = page - Math.floor(showSize / 2);
        if (startPage < 1)
            startPage = 1;
        var endPage = startPage + showSize;
        if (endPage > totalPage) {
            endPage = totalPage;
            startPage = endPage - showSize;
            if (startPage < 1)
                startPage = 1;
        }
        var startPrePage = 0;
        if (startPage > 1)
            startPrePage = startPage - 1;
        var endNextPage = 0;
        if (endPage < totalPage)
            endNextPage = endPage + 1;
        var prePage = 0;
        var nextPage = 0;
        if(page > 1) prePage = page - 1;
        if(page < totalPage) nextPage = page + 1;
        var startNum = (page - 1) * pageSize + 1;
        var endNum = startNum + pageSize - 1;
        if (endNum > totalCount)
            endNum = totalCount;
        totalPage = totalPage || 1;
        endPage = endPage || 1;
        return {
            page: page,
            pageSize: pageSize,
            totalCount: totalCount,
            startPage: startPage,
            endPage: endPage,
            startNum: startNum,
            endNum: endNum,
            startPrePage: startPrePage,
            endNextPage: endNextPage,
            prePage: prePage,
            nextPage: nextPage,
            totalPage: totalPage
        };
    };

    //分页控件
    Smart.widgetExtend({
        id: "pagination",
        options: "pagekey,pageSizeKey,totalKey,showSize,startText,endText,disabledClass,activeClass,preText,nextText,action",
        defaultOptions: {
            'pagekey': "page",
            'pageSizeKey': "pageSize",
            'totalKey': "total",
            "showSize": 11,
            "startText": "&laquo;",
            "endText": "&raquo;",
            "preText": "‹",
            "nextText": "›",
            "disabledClass": "disabled",
            "activeClass": "active"
        }
    }, {
        onPrepare: function(){
        }

    }, {
        dataSetter: function (data) {
            var pi = paging(data[this.widget.pagination.options['pagekey']],
                data[this.widget.pagination.options['pageSizeKey']],
                data[this.widget.pagination.options['totalKey']],
                data[this.widget.pagination.options['showSize']]);
            this.node.empty();
            var startPreLi = this._createLi(this.widget.pagination.options['startText']);
            if (pi.startPrePage <= 0) {
                startPreLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                startPreLi.click(function () {
                    that._triggerPage(pi.startPrePage);
                });
            }
            this.node.append(startPreLi);
            var preLi = this._createLi(this.widget.pagination.options.preText);
            if (pi.prePage <= 0) {
                preLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                preLi.click(function () {
                    that._triggerPage(pi.prePage);
                });
            }
            this.node.append(preLi);
            var that = this;
            for (var i = pi.startPage; i <= pi.endPage; i++) {
                (function (i) {
                    var pageLi = that._createLi(i);
                    if (i == pi.page) {
                        pageLi.addClass(that.widget.pagination.options['activeClass']);
                    }
                    pageLi.click(function () {
                        that._triggerPage(i);
                    });
                    that.node.append(pageLi);
                })(i);
            }
            var nextLi = this._createLi(this.widget.pagination.options.nextText);
            if (pi.nextPage <= 0) {
                nextLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                nextLi.click(function () {
                    that._triggerPage(pi.nextPage);
                });
            }
            this.node.append(nextLi);
            var endNextLi = this._createLi(this.widget.pagination.options['endText']);
            if (pi.endNextPage <= pi.endPage) {
                endNextLi.addClass(this.widget.pagination.options['disabledClass']);
            } else {
                endNextLi.click(function () {
                    that._triggerPage(pi.endNextPage);
                });
            }
            this.node.append(endNextLi);
        },
        _triggerPage: function(page){
            if(this.widget.pagination.options['action']){
                this.widget.pagination.options['action'].call(page);
            }
            this.trigger("pagination-page", [page]);
        },
        _createLi: function (txt) {
            var li = $("<li />").attr("_page", txt);
            var a = $("<a href='javascript:;' >" + txt + "</a>");
            li.append(a);
            return li;
        },
        getPage: function(){
            return this.node.find("li." + this.widget.pagination.options['activeClass']).attr("_page");
        }
    });
})(jQuery);
;/**
 * Created by nana on 2015/9/17.
 */
(function ($) {
    Smart.widgetExtend({
        id: "popover",
        defaultOptions: {
            trigger: "focus"
        }
    }, {
        onPrepare: function () {
            this.S.node.popover(this.options);
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    Smart.widgetExtend({
        id: "select",
        options: "form,ctx:title,ctx:value",
        defaultOptions: {
            form: "id:name,title"
        }
    }, {
        onPrepare: function () {
            this.cache = {};
            var originalOptions = this.S.node.children();
            this.cache.originalOptions = originalOptions;
            this.options.form = this.options.form.split(":");
            this.options.form[1] = this.options.form[1].split(",");
            this.cache.dataMap = {};
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                var _datas = datas;
                datas = [];
                $.each(_datas, function(key, value){
                    datas.push({title: value, id: key})
                });
            }
            this.widget.select.cache.dataMap = {};
            this.node.empty();
            this.node.append(this.widget.select.cache.originalOptions);
            for (var i in datas) {
                this.node.append(this._createOption(datas[i]));
            }
        },
        _createOption: function (data) {

            var value = this.widget.select.options.value ?
                this.widget.select.options.value(data) : data[this.widget.select.options.form[0]];
            var title = this.widget.select.options.title ?
                this.widget.select.options.title(data) : data[this.widget.select.options.form[1][0]];
            this.widget.select.cache.dataMap[value] = data;
            if (!title && this.widget.select.options.form[1].length == 2) {
                title = data[this.widget.select.options.form[1][1]];
            }
            var option = $('<option value="' + value + '">' + title + '</option>');
            return option;
        },
        getSelectData: function(){
            var val = this.node.val();
            return this.widget.select.cache.dataMap[val];
        }
    });
})(jQuery);;/**
 * Created by nana on 2015/10/8.
 */
(function ($) {
    //options phase
    var SOURCE_KEY = "_SH_SOURCE_";
    Smart.widgetExtend({
        id: "sh",
        defaultOptions: {
            phase: "render",
            sourceNode: null,
            source: null,
            brush: "Xml",
            brushOption: {toolbar: false, 'html-script': true}
        }
    }, {
        onPrepare: function () {
            if (this.options.phase == "source") {
                var html = $("<div></div>").append(this.S.node.html());
                html.find("*[_id_]").each(function(){
                    var node = $(this);
                    node.attr("id", node.attr("_id_")).removeAttr("_id_");
                });
                html.find("*[s-sh-role]").each(function(){
                   var node = $(this);
                    if(node.attr("s-sh-role") == "javascript"){
                        node.attr('type', "text/javascript");
                    }
                    node.removeAttr("s-sh-role");
                });
                this.S.node.data(SOURCE_KEY, html.html());
                return;
            }
        },
        onReady: function(){
            if (this.options.phase == "render") {
                var source;
                if (this.options.sourceNode) {
                    source = this.options.sourceNode.data(SOURCE_KEY) || this.options.sourceNode.html();
                } else if(this.options.source){
                    source = this.options.source;
                    if($.isFunction(source)){
                        source = source();
                    }
                }
                else {
                    source = this.S.node.html();
                }
                //var code = source.replace(/</gi, "&lt;").replace(/>/gi, "&gt;");
                var brush = new SyntaxHighlighter.brushes[this.options.brush]();
                brush.init(this.options.brushOption);
                this.S.node.html(brush.getHtml(source));
            }
        }
    });
})(jQuery);
;(function ($) {
    Smart.widgetExtend({
        id: "tooltip"
    }, {
        onPrepare: function () {
            this.S.node.tooltip(this.options)
        }
    });
})(jQuery);
;(function ($) {

    var DEFAULT_MSG = {};

    var VALID_NODE_ERROR_ATTR = Smart.optionAttrName("valid", "error");
    var VALID_NODE_LABEL_ATTR = Smart.optionAttrName("valid", "label");
    var VALID_NODE_WARNING_ATTR = Smart.optionAttrName("valid", "warning");
    var VALID_NODE_SELECTOR = "*[" + VALID_NODE_ERROR_ATTR + "]:not(:disabled),*[" + VALID_NODE_WARNING_ATTR + "]:not(:disabled)";
    var VALID_NODE_ID_ATTR = Smart.optionAttrName("valid", 'id');
    var VALID_NODE_MSG = Smart.optionAttrName("valid", 'msg');
    var VALID_NODE_SHOW_ATTR = Smart.optionAttrName("valid", 'show');
    var VALID_NODE_RESET_SHOW_ATTR = Smart.optionAttrName("valid", 'resetShow');
    var VALID_NODE_BLUR_IG_ATTR = Smart.optionAttrName("valid", "blur-ig");

    var ITEM_ROLE_SELECTOR = "*[" + Smart.optionAttrName("valid", "role") + "='item']";
    var MSG_ROLE_SELECTOR = "*[" + Smart.optionAttrName("valid", "role") + "='msg']";

    var NODE_ORIGINAL_VALID_MSG_KEY = "s-valid-original-msg";

    var LEVELS = {
        success: {
            style: "successClass",
            key: "success"
        },
        warning: {
            style: "warningClass",
            key: "warning"
        },
        error: {
            style: "errorClass",
            key: "error"
        }
    };

    //验证控件
    Smart.widgetExtend({
        id: "valid",
        options: "ctx:msg,ctx:show,ctx:resetShow,successClass,errorClass,warningClass,blur,ctx:validators,ctx:after",
        defaultOptions: {
            msg: DEFAULT_MSG,
            blur: "true",
            'successClass': "has-success",
            'errorClass': "has-error",
            'warningClass': "has-warning",
            notice: null,
            'show': function (node, msg, level) {
                level = level || LEVELS.error;
                var item = node.closest(ITEM_ROLE_SELECTOR);
                var msgNode = $(MSG_ROLE_SELECTOR, item);
                if (node.data(NODE_ORIGINAL_VALID_MSG_KEY) == undefined) {
                    node.data(NODE_ORIGINAL_VALID_MSG_KEY, msgNode.html());
                }
                item.removeClass(this.widget.valid.options['successClass'] + " " + this.widget.valid.options['errorClass'] + " " + this.widget.valid.options['warningClass']);
                item.addClass(this.widget.valid.options[level.style]);
                var msgNode = $(MSG_ROLE_SELECTOR, item);
                if (msgNode.size() > 0) {
                    $(MSG_ROLE_SELECTOR, item).html(msg || node.data(NODE_ORIGINAL_VALID_MSG_KEY) || "");
                } else {
                    if (level.style == "successClass") {
                        node.tooltip('destroy');
                        return;
                    }
                    function clearTo() {
                        var tooltipHideTimeout = node.data("tooltip_hide_timeout");
                        if (tooltipHideTimeout) {
                            clearTimeout(tooltipHideTimeout);
                            node.removeData("tooltip_hide_timeout");
                        }
                    }

                    function destroyTooltip() {
                        var hideTimeout = setTimeout(function () {
                            node.tooltip('destroy');
                            node.removeData("tooltip_hide_timeout");
                        }, 3000);
                        node.data("tooltip_hide_timeout", hideTimeout);
                    }

                    if (node.data("tooltip_hide_timeout")) {
                        clearTo();
                        destroyTooltip();
                        return;
                    }
                    node.tooltip({
                        container: node.parent(),
                        title: msg,
                        trigger: "manual",
                        delay: {"show": 200, "hide": 300}
                    });
                    //this.notice(msg);
                    setTimeout(function () {
                        node.tooltip('show');
                        clearTo();
                    }, 1);
                    node.on("shown.bs.tooltip", destroyTooltip);
                }
            },
            'resetShow': function (node) {
                var item = node.closest(ITEM_ROLE_SELECTOR);
                node.tooltip('destroy');
                $(MSG_ROLE_SELECTOR, item).html(node.data(NODE_ORIGINAL_VALID_MSG_KEY) || "");
                item.removeClass(this.widget.valid.options['successClass'] + " " + this.widget.valid.options['errorClass'] + " " + this.widget.valid.options['warningClass']);
            }
        },
        addValidators: addValidators,//添加新的验证器
        setValidatorMsg: setValidatorMsg//修改验证器的msg提示

    }, {
        onPrepare: function () {
            this.cache = {};
            if (this.options.blur === "true") {
                var that = this;
                this.S.node.delegate(VALID_NODE_SELECTOR, "blur", function () {
                    if ($(this).attr(VALID_NODE_BLUR_IG_ATTR) == "true") {
                        return;
                    }
                    that.S.validateNode($(this));
                });
            }
            if (this.options.validators) {
                var map = {};
                for (var i = 0; i < this.options.validators.length; i++) {
                    var v = this.options.validators[i];
                    map[v.id] = v;
                }
                this.cache.validatorMap = map;
            }
            this.cache.validateItemMap = {};
            this.cache.validedNodes = [];
        },
        onReset: function () {
            var validedNodes = this.cache.validedNodes;
            var that = this;
            $.each(validedNodes, function (i, node) {
                that.S.resetValidateNode(node);
            });
            this.cache.validedNodes = [];
        }
    }, {
        validate: function () {
            var validNodes = this.node.find(VALID_NODE_SELECTOR);
            var deferreds = [];
            var that = this;
            this.widget.valid.cache.validedNodes = [];
            var notice = this.widget.valid.options.notice;
            validNodes.each(function () {
                var node = $(this);
                deferreds.push(function () {
                    return that.validateNode(node, notice);
                });
            });
            if (this.widget.valid.options.after) {
                deferreds.push(function () {
                    return this.widget.valid.options.after();
                });
            }
            return Smart.deferredQueue(deferreds);
        },
        resetValidate: function () {
            var validNodes = this.node.find(VALID_NODE_SELECTOR);
            var that = this;
            validNodes.each(function () {
                var node = $(this);
                that.resetValidateNode(node);
            });
        },
        resetValidateNode: function (node) {
            var resetShow = node.attr(VALID_NODE_RESET_SHOW_ATTR);
            if (resetShow) {
                resetShow = this.context(resetShow);//resetShow是一个context闭包参数。
            }
            (resetShow || this.widget.valid.options.resetShow).call(this, node);
        },
        validateNode: function (node, notice) {
            var id = node.attr(VALID_NODE_ID_ATTR);
            this.widget.valid.cache.validedNodes.push(node);
            var nodeMsgAttrStr = node.attr(VALID_NODE_MSG);
            var defMsg = {};
            if(nodeMsgAttrStr){
                defMsg = this.context('(' + nodeMsgAttrStr + ')');
            }
            var errorExp = node.attr(VALID_NODE_ERROR_ATTR);
            var label = node.attr(VALID_NODE_LABEL_ATTR);
            var deferreds = [];
            var that = this;
            var show = node.attr(VALID_NODE_SHOW_ATTR);
            if (show) {
                show = this.context(show);//shown是一个context闭包参数。
            }
            var validateItem = {
                id: id,
                label: label ? label : "",
                node: node,
                value: node.val()
            };
            var validateItemMap = this.widget.valid.cache.validateItemMap;
            if (id != undefined) {
                validateItemMap[id] = validateItem;
            }

            var msg = "";
            var level;

            if (errorExp) {
                deferreds.push(function () {
                    var deferred = $.Deferred();
                    var errorDefMsg = defMsg['error'] || {};
                    executeExp(that, node, errorExp, errorDefMsg, validateItem, validateItemMap)
                        .done(function (result, _level) {
                            msg = result;
                            level = _level || LEVELS.success;
                            deferred.resolve();
                        }).fail(function (result, _level) {
                            level = _level || LEVELS.error;
                            result = result || defMsg[level.key + "Msg"] || "";
                            (show || that.widget.valid.options.show).call(that, node, result, level);
                            if (notice) {
                                notice(node, result, level.key);
                            }
                            deferred.reject();
                        });
                    return deferred;
                });
            }

            var warningExp = node.attr(VALID_NODE_WARNING_ATTR);
            if (warningExp) {
                deferreds.push(function () {
                    var deferred = $.Deferred();
                    var warningMsg = defMsg['warning'] || {};
                    executeExp(that, node, warningExp, warningMsg, validateItem, validateItemMap, LEVELS.warning).always(function (result, level) {
                        msg = result;
                        deferred.resolve();
                    }).done(function (result, _level) {
                        //warning级别的验证通过
                        level = _level || LEVELS.success;
                    }).fail(function (result, _level) {
                        //warning级别的验证不通过
                        level = _level || LEVELS.warning;
                    });

                    return deferred;
                });
            }
            deferreds.push(function () {
                msg = defMsg[level.key + "Msg"] || msg || "";
                (show || that.widget.valid.options.show).call(that, node, msg, level);
                if (notice) {
                    notice(node, msg, level.key);
                }
            });
            return Smart.deferredQueue(deferreds);
        }
    });

    /**
     * valid
     * */

    function Validation(smart, node, value, item, itemMap) {
        this.varMap = {};
        this.item = item;
        this.node = node;
        this.value = value;
        this.smart = smart;
        this._interrupt = false;
        this._validateItemMap = itemMap;
    }

    Validation.prototype = {
        putVar: function (key, val) {
            this.varMap[key] = val;
        },
        getItemById: function (id) {
            return this._validateItemMap[id];
        },
        processMsg: function (msg) {
            var placeholderRegex = /(\{.+?\})/g;
            var that = this;
            return msg.replace(placeholderRegex, function ($0) {
                var str = that.varMap[$0.substring(1, $0.length - 1)];
                return str != undefined ? str : "";
            });
        },
        interrupt: function () {//中断验证
            this._interrupt = true;
        },
        interrupted: function () {//是否中断
            return this._interrupt;
        }
    }

    //require:true,len(6,12),eq(ctx:S.N('#aaaaa').val())

    function executeExp(smart, node, exp, nodeMsg, item, validateItemMap, level) {
        var validSegs = getValidSegs(exp);
        var deferred = $.Deferred();
        var validMsg = "";
        var msgLevel = level || LEVELS.error

        function processMsg(validation, msg) {
            if (msg == null) {
                return ""
            }
            if (msg.indexOf('success:') == 0) {//说明验证成功
                msgLevel = LEVELS['success'];
                msg = msg.substring(8);
            } else if (msg.indexOf('error:') == 0) {//说明验证失败
                msgLevel = LEVELS.error;
                msg = msg.substring(6);
            } else if (msg.indexOf('warning:') == 0) {
                msgLevel = LEVELS.warning;
                msg = msg.substring(8);
            } else {
                msgLevel = msgLevel || LEVELS.error;
            }
            validMsg = validation.processMsg(msg);
        }

        var optionValidatorMap = smart.widget.valid.cache.validatorMap || {};

        var methodCount = {};

        function resolve() {
            return deferred.resolve(validMsg, msgLevel);
        }

        function reject() {
            return deferred.reject(validMsg, msgLevel);
        }

        function validate(i) {
            if (i == validSegs.length) {
                resolve();
                return;
            }
            var vs = validSegs[i];
            var s = /^(\w+)\((.*)\)$/g.exec(vs);
            var method = s[1];
            var validation = new Validation(smart, node, item.value, item, validateItemMap);
            validation.putVar('label', item.label);
            var argStr = ".valid.call(validation";
            if (s.length == 3 && $.trim(s[2]) != "") {
                argStr += "," + s[2];
            }
            var validator = optionValidatorMap[method] || getValidator(method);
            if (validator) {
                var rs = eval("validator" + argStr + ")");


                /**
                 * 如果表达式中出现了多个相同的验证器，那么寻找msg的时候，就根据 验证器名称"#"当前计数 的组合去查找msg定义。
                 * 如：regex(/(?=.*[a-zA-Z])(?=.*[0-9])/g),regex(/(?=.*[A-Z])(?=.*[a-z])(?=.*\W)/g)
                 * 那么可以定义msg为：
                 * {
                        regex: {
                            '0': "密码强度弱"
                        },
                        'regex#1': {
                            '0': "密码强度中"
                        },
                        'regex#2': {
                            '1': "密码强度强"
                        }
                    },
                 然后 regex#0是第一个验证器的msg， regex#1是第二个验证器的msg，regex#3是第三个验证器的msg，
                 如果根据这样的规则找不到验证器，则根据验证器名称去寻找，即 regex去寻找。
                 * */
                var count = methodCount[method];
                if (count == undefined) {
                    count = 0;
                } else {
                    count++;
                }
                methodCount[method] = count;//method计数
                msg = $.extend($.extend({}, validator.msg), nodeMsg[method + "#" + count] || nodeMsg[method] || {});
                function processSuccess(msgStr) {
                    msgLevel = LEVELS.success;
                    processMsg(validation, msgStr || msg['1']);
                    //如果验证成功，并且不继续往下验证，则中断验证。
                    if (validation.interrupted()) {
                        resolve();
                        return;
                    }
                    validate(i + 1);
                }

                if (rs == 1) {
                    processSuccess();
                    return;
                } else if ($.type(rs) == "object" && 'done' in rs) {
                    rs.done(function (code, _msg) {
                        if (code == 1) {
                            msgLevel = LEVELS.success;
                            processSuccess(_msg);
                        } else {
                            msgLevel = level;
                            processMsg(validation, _msg || msg[code]);//这里只显示错误提示
                            //处理msg消息
                            reject();
                        }
                    });
                } else {
                    msgLevel = level;
                    processMsg(validation, msg[rs]);
                    return reject();
                }
            } else {
                msgLevel = level;
                return reject();
            }
        }

        validate(0);
        return deferred.promise();
    }

    function getValidSegs(exp) {
        var validSegs = [];
        var inBraces = 0;
        var cache = [];
        for (var i = 0; i < exp.length; i++) {
            var char = exp[i];
            if (char == "," && inBraces == 0) {
                validSegs.push(cache.join(""));
                cache = [];
                continue;
            }
            if (char == "(" && !inBraces) {
                inBraces++;
            }
            if (char == ")" && inBraces) {
                inBraces--;
            }
            cache.push(char);
        }
        validSegs.push(cache.join(""));
        return validSegs;
    }

    var validatorMap = {};

    function addValidators(validators) {
        if (!$.isArray(validators)) {
            validators = [validators];
        }
        for (var i in validators) {
            var validtor = validators[i];
            addValidator(validtor);
        }
    }

    function setValidatorMsg(defs) {
        if (!$.isArray(defs)) {
            defs = [defs];
        }
        $.each(defs, function (i, def) {
            var validator = validatorMap[def.id];
            if (!validator) return;
            validator.msg = $.extend(validator.msg || {}, def.msg);
        });
    }

    function addValidator(validator) {
        validatorMap[validator.id] = validator;
    }

    function getValidator(id) {
        return validatorMap[id];
    }

    addValidators([
        {
            id: "require",
            valid: function (flag, emptyValue) {
                flag = flag == undefined ? true : flag;
                if (flag && (Smart.isEmpty(this.value) || this.value == emptyValue)) {
                    return 0;
                }
                if (!flag && Smart.isEmpty(this.value)) {
                    //如果不是必须的，并且验证的值为空，则中断验证，返回1
                    this.interrupt();//中断后续的验证
                    return 1;//验证通过
                }
                return 1;
            },
            msg: {
                '0': "{label}不能为空"
            }
        },
        {
            id: "remote",//远程验证
            valid: function (url, codeKey, msgKey) {
                var deferred = $.Deferred();
                url = url.replace("{val}", this.value);
                this.smart.get(url, null, null, {silent: true}).done(function (rs) {
                    var code, msgStr;
                    if ($.type(rs) == "object") {
                        code = rs[codeKey || "code"];
                        msgStr = rs[msgKey || "msg"];
                    } else {
                        code = rs;
                    }
                    deferred.resolve(code, msgStr);
                });
                return deferred.promise();
            },
            msg: {
                '0': "验证不通过"
            }
        },
        {
            id: "email",
            valid: (function () {
                var emailRegex = /^[a-z]([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/i;
                return function () {
                    if (emailRegex.test(this.value))
                        return 1;
                    return 0;
                }
            })(),
            msg: {
                '0': "{label|Email}输入格式不正确"
            }
        },
        {
            id: "regex",
            valid: function (regex) {
                if (regex.test(this.value))
                    return 1;
                return 0;
            },
            msg: {
                '0': "{label}输入格式不正确"
            }
        },
        {
            id: "checked",
            valid: function () {
                if (this.item.node.prop("checked")) {
                    return 1;
                }
                return 0;
            }
        },
        {
            id: "len",
            valid: function (min_len, max_len) {
                var val = $.trim(this.value);
                if (!max_len) {//如果max_len为空，则表示长度只能是min_len的长度。
                    if (val.length != min_len) {
                        this.putVar("len", min_len);
                        return -1;
                    }
                } else {
                    if (val.length < min_len) {
                        this.putVar("min_len", min_len);
                        return -2;
                    }
                    if (val.length > max_len) {
                        this.putVar("max_len", max_len);
                        return -3;
                    }
                }
                return 1;
            },
            msg: {
                "-1": "{label}长度必须为{len}位",
                "-2": "{label}长度不能小于{min_len}位",
                "-3": "{label}长度不能大于{max_len}位"
            }
        },
        {
            id: "range",
            valid: function (min, max) {
                if (this.value < min) {
                    this.putVar("min", min);
                    return -1;
                }
                if (this.value > max) {
                    this.putVar("max", max);
                    return -2;
                }
                return 1;
            },
            msg: {
                "-1": "{label}不能小于{min}",
                "-2": "{label}不能大于{max}"
            }
        },
        {
            id: "min",
            valid: function (min) {
                if (this.value < min) {
                    this.putVar("min", min);
                    return -1;
                }
                return 1;
            },
            msg: {
                "-1": "{label}不能小于{min}"
            }
        },
        {
            id: "word",
            valid: (function () {
                var regex = /^[A-Za-z0-9_\-]*$/;
                return function () {
                    if (regex.test(this.value))
                        return 1;
                    return 0;
                }
            })(),
            msg: {
                '0': "{label}只能是字母、数字、下划线、中划线的组合"
            }
        },
        {
            id: "words",
            valid: (function () {
                var regex = /^[A-Za-z0-9_\-\s]*$/;
                return function () {
                    if (regex.test(this.value))
                        return 1;
                    return 0;
                }
            })(),
            msg: {
                '0': "{label}只能是字母、数字、下划线、中划线、空格的组合"
            }
        },
        {
            id: "non_char",
            valid: function (chars) {
                if (!chars)
                    return 1;
                for (var i = 0; i < chars.length; i++) {
                    if (this.value.indexOf(chars[i]) != -1) {
                        this.putVar("char", chars[i]);
                        return 0;
                    }
                }
                return 1;
            },
            msg: {
                '0': "{label}中不能包含{char}字符"
            }
        },
        {
            id: "eq",
            valid: function (id) {
                var item = this.getItemById(id);
                if (item == undefined) {
                    return -1;
                }
                if (this.value != item.value) {
                    this.putVar("t_label", item.label);
                    return 0;
                }
                return 1;
            },
            msg: {
                '1': "{label}输入正确",
                '0': "{label}与{t_label}输入不一致",
                '-1': "未找到比较的对象"
            }
        },
        {
            id: "number",
            valid: function () {
                if (!isNaN(this.value))
                    return 1;
                return 0;
            },
            msg: {
                '0': "{label}只能输入数字"
            }
        },
        {
            id: "ip",
            valid: (function () {
                var regex = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
                return function () {
                    if (regex.test(this.value))
                        return 1;
                    return 0;
                }
            })(),
            msg: {
                '0': "{label|ip}格式输入不正确"
            }
        }, {
            id: "checkboxRequire",
            valid: function () {
                if (this.node.find(":checkbox:checked").size() > 0)
                    return 1;
                return 0;
            },
            msg: {
                '0': "请选择{label}"
            }
        },
        {
            id: "url",
            valid: (function () {
                var regex = "^((https|http|ftp|rtsp|mms)?://)"
                    + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
                    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
                    + "|" // 允许IP和DOMAIN（域名）
                    + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
                    + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
                    + "[a-z]{2,6})" // first level domain- .com or .museum
                    + "(:[0-9]{1,4})?" // 端口- :80
                    + "((/?)|" // a slash isn't require if there is no file label
                    + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
                return function () {
                    var re = new RegExp(regex);
                    if (re.test(this.value))
                        return 1;
                    return 0;
                }
            })(),
            msg: {
                '0': "{label|url}格式输入不正确"
            }
        }
    ]);
//    var exp = "require(),len(6,12),word(),remote('http://www.1234.com/aaa/{val}')";
//    executeExp(exp, 'luling1028', '用户名').done(function (msg) {
//        console.info(msg);
//    }).fail(function (msg) {
//        console.info(msg);
//    });
})(jQuery);;(function(){
    var ALERT_LEVEL = {
        warning: {
            sign: "fa fa-exclamation-triangle",
            color: "text-warning"
        },
        info: {
            sign: "fa fa-info-circle",
            color: "text-info"
        },
        success: {
            sign: "fa fa-check-circle",
            color: "text-success"
        },
        danger: {
            sign: "fa fa-times-circle",
            color: "text-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.info;
    var DEFAULT_OPTION = {title : "提示", btnName: "确定"};
    Smart.extend(Smart.prototype, {
        alert: function(msg, level, option){
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("alert");
            var alertLevel = ALERT_LEVEL[level] || DEFAULT_LEVEL;
            option = option || DEFAULT_OPTION;
            if($.type(option) == "string"){
                option = $.extend($.extend({}, DEFAULT_OPTION), {title: option});
            }
            $("*[s-ui-alert-role='title']", dialog).html(option.title);
            $("*[s-ui-alert-role='message']", dialog).html(msg);
            $("*[s-ui-alert-role='sign']", dialog).addClass(alertLevel.color).addClass(alertLevel.sign);
            var btn = $("*[s-ui-alert-role='btn']", dialog);
            btn.html(option.btnName);
            Smart.UI.backdrop();
            $(dialog).on("hide.bs.modal", function(){
                Smart.UI.backdrop(false).done(function(){
                    deferred.resolve();
                });
            }).on("hidden.bs.modal", function(){
                $(this).remove();
            }).on('shown.bs.modal', function(){
                btn.focus();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})();;/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    var ALERT_LEVEL = {
        warning: {
            sign: "fa fa-exclamation-triangle",
            color: "text-warning"
        },
        info: {
            sign: "fa fa-info-circle",
            color: "text-info"
        },
        success: {
            sign: "fa fa-check-circle",
            color: "text-success"
        },
        danger: {
            sign: "fa fa-times-circle",
            color: "text-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.warning;

    Smart.fn.extend({
        confirm: function (msg, option) {
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("confirm");
            var DEFAULT_OPTION = {title: "提示", sureBtnName: "确定", cancelBtnName: "取消", sign: "info"};
            option = $.extend(DEFAULT_OPTION, option || {});
            if ($.type(option) == "string") {
                option = $.extend($.extend({}, DEFAULT_OPTION), {sign: option});
            }
            var confirmLevel = ALERT_LEVEL[option.sign] || DEFAULT_LEVEL;

            $("*[s-ui-confirm-role='title']", dialog).html(option.title);
            $("*[s-ui-confirm-role='message']", dialog).html(msg);
            $("*[s-ui-confirm-role='sign']", dialog).addClass(confirmLevel.color).addClass(confirmLevel.sign);
            var sureBtn = $("*[s-ui-confirm-role='sureBtn']", dialog).html(option.sureBtnName);
            var cancelBtn = $("*[s-ui-confirm-role='cancelBtn']", dialog).html(option.cancelBtnName);
            Smart.UI.backdrop();
            var selectVal = 0;
            sureBtn.click(function () {
                selectVal = 1;
                dialog.modal('hide');
            });
            cancelBtn.click(function () {
                selectVal = 0;
                dialog.modal('hide');
            });
            $(dialog).on("hide.bs.modal", function () {
                Smart.UI.backdrop(false).done(function () {
                    deferred[selectVal ? 'resolve' : 'reject']();
                });
            }).on("hidden.bs.modal", function () {
                $(this).remove();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    var ALERT_LEVEL = {
        warning: {
            sign: "fa fa-exclamation-triangle",
            color: "text-warning"
        },
        info: {
            sign: "fa fa-info-circle",
            color: "text-info"
        },
        success: {
            sign: "fa fa-check-circle",
            color: "text-success"
        },
        danger: {
            sign: "fa fa-times-circle",
            color: "text-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.warning;

    var createBtn = function(btn){
        var button = $('<button class="btn" type="button"></button>');
        btn.id && button.attr("s-ui-dialog-btn-id", btn.id);
        var text = (btn.icon ? "<i class='"+btn.icon+"'></i> " : "") + btn.name;
        button.html(text);
        btn.style && button.addClass(btn.style || "btn-default");
        button.click(function(){
            button.prop("disabled", true);
            var rs = btn.click.call(this);
            if(Smart.isDeferred(rs)){
                rs.always(function(){
                    button.prop("disabled", false);
                })
            } else {
                button.prop("disabled", false);
            }
        });
        btn.hidden && button.hide();
        return button;
    };

    Smart.fn.extend({
        dialog: function (msg, option) {
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("confirm");
            var DEFAULT_OPTION = {title: "提示", sureBtnName: "确定", cancelBtnName: "取消", sign: "info"};
            option = $.extend(DEFAULT_OPTION, option || {});
            if ($.type(option) == "string") {
                option = $.extend($.extend({}, DEFAULT_OPTION), {sign: option});
            }
            var confirmLevel = ALERT_LEVEL[option.sign] || DEFAULT_LEVEL;

            $("*[s-ui-confirm-role='title']", dialog).html(option.title);
            $("*[s-ui-confirm-role='message']", dialog).html(msg);
            $("*[s-ui-confirm-role='sign']", dialog).addClass(confirmLevel.color).addClass(confirmLevel.sign);
            var sureBtn = $("*[s-ui-confirm-role='sureBtn']", dialog).html(confirmLevel.sureBtnName);
            var cancelBtn = $("*[s-ui-confirm-role='cancelBtn']", dialog).html(confirmLevel.cancelBtnName);
            Smart.UI.backdrop();
            var selectVal = 0;
            sureBtn.click(function () {
                selectVal = 1;
                dialog.modal('hide');
            });
            cancelBtn.click(function () {
                selectVal = 0;
                dialog.modal('hide');
            });
            $(dialog).on("hide.bs.modal", function () {
                Smart.UI.backdrop(false).done(function () {
                    deferred[selectVal ? 'resolve' : 'reject']();
                });
            }).on("hidden.bs.modal", function () {
                $(this).remove();
            }).css('zIndex', Smart.UI.zIndex()).modal({
                keyboard: false,
                backdrop: false
            });

            return deferred;
        }
    });
})(jQuery);;(function ($) {

    var ALERT_LEVEL = {
        warning: {
            sign: "fa fa-exclamation-triangle",
            color: "alert alert-warning"
        },
        info: {
            sign: "fa fa-info-circle",
            color: "alert alert-info"
        },
        success: {
            sign: "fa fa-check-circle",
            color: "alert alert-success"
        },
        danger: {
            sign: "fa fa-times-circle",
            color: "alert alert-danger"
        }
    };
    var DEFAULT_LEVEL = ALERT_LEVEL.info;

    var aTime = 200;

    var HOLDTIME = 3000;

    Smart.fn.extend({
        notice: function (msg, level, holdTime) {
            holdTime = holdTime || HOLDTIME;
            var noticeTpl = Smart.UI.template("notice");
            var noticeLevel = ALERT_LEVEL[level] || DEFAULT_LEVEL;
            $("*[s-ui-notice-role='message']", noticeTpl).html(msg);
            $(".s-ui-notice-sign", noticeTpl).addClass(noticeLevel.sign);
            noticeTpl.addClass(noticeLevel.color)
                .css({
                    "z-index": Smart.UI.zIndex(),
                    "transition": "all " + (aTime / 1000) + "s cubic-bezier(0.51, 0.12, 1, 1)"
                }).appendTo("body");
            setTimeout(function () {
                noticeTpl.addClass("notice-show");
                setTimeout(function(){
                    noticeTpl.css({"animation": "s-ui-notice-bounce 0.15s cubic-bezier(0.51, 0.18, 1, 1)"});
                }, aTime);
            }, 10);

            var removeTimeout = 0;

            function removeNoticeNode() {
                return setTimeout(function () {
                    noticeTpl.remove();
                }, 2000);
            }

            function removeNotice() {
                noticeTpl.css({
                    opacity: 0,
                    "transition": "all 2s cubic-bezier(0.51, 0.12, 1, 1)"
                });
                removeTimeout = removeNoticeNode();
            }

            $(".close", noticeTpl).click(function(){
                noticeTpl.remove();
            });
            var closeTimeout = setTimeout(removeNotice, holdTime);
            noticeTpl.mouseover(function () {
                noticeTpl.css({
                    opacity: 1,
                    "transition": "all .2s ease-out"
                });
                window.clearTimeout(closeTimeout);
                window.clearTimeout(removeTimeout);
            }).mouseleave(function () {
                closeTimeout = setTimeout(removeNotice, holdTime);
            });
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/25.
 */
(function ($) {
    /**
     * btn的定义
     * {
     *      id: "",
     *      name: "",
     *      click: function(){},
     *      style: "",
     *      icon: ""
     * }
     * */
    var DIALOG_DEFAULT_TITLE = "对话框";

    var createBtn = function(btn){
        var button = $('<button class="btn" type="button"></button>');
        btn.id && button.attr("s-ui-dialog-btn-id", btn.id);
        var text = (btn.icon ? "<i class='"+btn.icon+"'></i> " : "") + btn.name;
        button.html(text);
        btn.style && button.addClass(btn.style || "btn-default");
        button.click(function(){
            button.prop("disabled", true);
            var rs = btn.click.call(this);
            if(Smart.isDeferred(rs)){
                rs.always(function(){
                    button.prop("disabled", false);
                })
            } else {
                button.prop("disabled", false);
            }
        });
        btn.hidden && button.hide();
        return button;
    };

    var showDialog = function(dialog, zIndex){
        dialog.on("hide.bs.modal", function(e){
            if(this == e.target)
                Smart.UI.backdrop(false);
        }).css('zIndex', zIndex).modal({
            keyboard: false,
            backdrop: false
        });
    };

    var popupOpen = function () {
        var deferred = $.Deferred();
        var dialog = Smart.UI.template("dialog");
        var node = $("<div s='window' />");
        var nodeSmart = Smart.of(node);
        var bodyNode = $("*[s-ui-dialog-role='body']", dialog);
        var bodySmart = Smart.of(bodyNode);
        var titleNode = $("*[s-ui-dialog-role='title']", dialog);
        var footerNode = $("*[s-ui-dialog-role='footer']", dialog);
        var closeBtn = $("*[s-ui-dialog-role='close']", dialog);
        var dialogMain = $("*[s-ui-dialog-role='dialog']", dialog);

        bodySmart.setNode(node);

        closeBtn.click(function(){
            nodeSmart.closeWithConfirm();
        });
        Smart.UI.backdrop();
        var zIndex = Smart.UI.zIndex();
        nodeSmart.on("close", function(e){
            var eDeferred = e.deferred;
            var args = Smart.SLICE.call(arguments, 1);
            dialog.on("hidden.bs.modal", function(){
                eDeferred.resolve();
                dialog.remove();
                deferred.resolve.apply(deferred, args);
            });
            dialog.modal('hide');
            e.deferred = eDeferred.promise();
        }).on("s-loaded", function(){
            titleNode.html(nodeSmart.meta.title || DIALOG_DEFAULT_TITLE);
            if(nodeSmart.meta.btns){
                $.each(nodeSmart.meta.btns, function(i, btn){
                    footerNode.append(createBtn(btn));
                });
            } else {
                //如果底部没有按钮，则进行隐藏
                footerNode.hide();
            }

            nodeSmart.meta.height && node.height(nodeSmart.meta.height);
            nodeSmart.meta.width && node.width(nodeSmart.meta.width);
            //这里主要处理内容的高度
            dialogMain.css({"position":"absolute", "width": "auto"});
            bodyNode.css("padding", 0).css("position","relative");
            node.css({"overflow-y":"auto", padding: "0"});
            dialog.appendTo("body");
            dialog.show();
            dialogMain.width(dialogMain.innerWidth()).css("position","relative");
            footerNode.css("marginTop", "0");
            showDialog(dialog, zIndex);
        }).on("dialog.btn.disable", function(e, id){
            getButtonById(id).prop("disabled", true);
        }).on("dialog.btn.enable", function(e, id){
            getButtonById(id).prop("disabled", false);
        });

        function getButtonById(id){
            return $("button[s-ui-dialog-btn-id='"+id+"']", footerNode);
        }
        nodeSmart.getButtonById = getButtonById;
        nodeSmart.load.apply(nodeSmart, $.makeArray(arguments)).fail(function(xhr){
            var msg;
            if(xhr.status == 0){
                msg = "网络异常，请重试";
            } else {
                msg = "页面打开错误，请重试";
            }
            nodeSmart.notice(msg, "danger");
            Smart.UI.backdrop(false);
        });

        return $.extend(deferred, {
            close: function(){
                nodeSmart.close();
            }
        });
    };

    Smart.fn.extend({
        popupOpen: popupOpen,
        /**
         * @duplicate
         * */
        dialogOpen : function(){
            Smart.warn("dialogOpen 已经过时，请使用popupOpen代替。");
            return popupOpen.apply(this, Smart.SLICE.call(arguments));
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/7/2.
 */
(function(){

    var uploadListener = {

        setTarget: function(node){
            this.node = node;
        },
        onBegin: function(){
            this.progress = Smart.UI.template("progress")
                .css({
                    "position": "absolute",
                    zIndex: Smart.UI.zIndex()
                }).addClass("s-ui-upload-progressbar");
            this.progress.width(this.node.innerWidth());
            this.progress.appendTo("body");
            this.progressbar = this.progress.children();
        },
        onProgress: function(percent, total, loaded){
            this.progress.position({
                of: this.node,
                at: "left bottom+5",
                my: "left top"
            });
            this.progressbar.width(percent+"%");
        },
        onDone: function(){
            var that = this;
            setTimeout(function(){
                that.progress.fadeOut(function(){$(this).remove();});
            }, 1500);
        }
    };

    Smart.extend({
        uploadSetting: function(setting){
            setting = setting || {};
            if(setting.listener) uploadListener = setting.listener;
        }
    });

    //上传文件
    Smart.fn.extend({
        "upload": function(url, fileNode, listener){
            var formData = Smart.formData(fileNode);
            listener = listener || uploadListener;
            if($.isFunction(listener)){
                listener = {
                    onProgress: listener
                };
            }
            listener.setTarget && listener.setTarget(fileNode);
            listener.onBegin && listener.onBegin();
            return this.post(url, formData, null, null, {
                xhr: function(){
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.addEventListener("progress", function(e){
                        if (e.lengthComputable) {
                            var percentComplete = e.loaded * 100 / e.total;
                            listener.onProgress(parseInt(percentComplete), e.total, e.loaded);
                        }
                    }, false);
                    return xhr;
                }
            }).always(function(){
                listener.onDone && listener.onDone();
            });

        }
    });

})();;/**
 * Created by nana on 2015/8/31.
 */
(function($){

    Smart.extend({
        "checkDataSubmit": function(options){
            options = $.extend({
                "confirmMsg": "确认进行此操作吗？",
                "errorMsg": "请选择你要操作的数据？",
                confirm: true,
                dataKey: 'ids',
                dataFilter: "id",
                method: 'post',
                url: null,
                smart: null,
                done: Smart.noop,
                fail: Smart.noop
            }, options || {});

            var smart = options.smart;
            var deferred = $.Deferred();
            if(!smart){
                alert("请配置Smart");
                return deferred.reject();
            }
            if(Smart.isEmpty(options.url)){
                alert("请配置url");
                return deferred.reject();
            }
            var checkedData;
            if($.isFunction(options.dataFilter)){
                checkedData = filter(smart.getChecked());
            } else {
                checkedData = smart.getCheckedData(options.dataFilter);
            }
            if (Smart.isEmpty(checkedData)) {
                smart.notice(options.errorMsg, "warning");
                return deferred.reject();
            }
            function doSubmit(){
                var data = {};
                data[options.dataKey] = checkedData;
                return smart[options.method](options.url, data).done(function(){
                    options.done.apply(smart, $.makeArray(arguments));
                }).fail(function(){
                    options.fail.apply(smart, $.makeArray(arguments));
                });
            }
            if(options.confirm){
                smart.confirm(options.confirmMsg, {sign: "warning"}).done(function(){
                    Smart.deferredChain(deferred, doSubmit());
                });
                return deferred;
            } else {
                return doSubmit();
            }
        }
    })

})(jQuery);;(function($){

    Smart.extend({
        "loading": function(options){

            options = $.extend({
                "node": null,
                "thisRef": null,
                "toggleClass": null,
                "toggleText": null,
                "action": $.noop(),
            }, options || {});

            if(!options.node){
                Smart.error("错误的node设定");
                return;
            }
            var node = $(options.node);
            if(options.toggleClass){
                options.node.addClass(options.toggleClass);
            }
            var _node_text;
            if(options.toggleText){
                if(node.is("input")){
                    _node_text = node.val();
                    node.val(options.toggleText);
                } else {
                    _node_text = node.html();
                    node.html(options.toggleText);
                }
            }
            function reset(){
                if(options.toggleClass){
                    node.removeClass(options.toggleClass);
                }
                if(options.toggleText){
                    if(node.is("input")){
                        node.val(_node_text);
                    } else {
                        node.html(_node_text);
                    }
                }
            }
            var deferred = options.action.call(options.thisRef);
            if(Smart.isDeferred(deferred)){
                deferred.always(function(){
                    reset();
                });
            } else {
                if(options.toggleClass){
                    reset();
                }
            }
            return deferred;
        }
    })

})(jQuery);