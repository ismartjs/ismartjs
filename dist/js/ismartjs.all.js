/**
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
        DEFAULT_STOPPED_EVENT: ["s-ready", "s-prepared", "s-rendered", "s-loaded", 's-loading', 's-data', 's-build'],
        CACHE_ATTR: "__CACHE__",
        CACHE_DEFERREDS_ATTR: "_CACHE_DEFERREDS__"
    };


    window.Smart = function (node) {
        this.node = node || $();
        this.node.data(CONST.SMART_NODE_CACHE_KEY, this);
        this.widgets = [];
        this.widget = {};
        this[CONST.CACHE_ATTR] = {};
        this[CONST.CACHE_DEFERREDS_ATTR] = {};
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
                } else if (this instanceof File) {
                    formData.append(name, this);
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
        valIfThen: function (val, ifVal, thenVal) {
            if (val == ifVal) {
                return thenVal;
            }
            return val;
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
                    deferred.reject.apply(deferred, $.makeArray(arguments));
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
                        if (val['$ref'] == '@') {
                            obj[key] = obj;
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
            if (this._PARENT) {
                return this._PARENT;
            }
            var p = this.node.parent().closest("[" + CONST.SMART_ATTR_KEY + "]");
            if (p.size() == 0)
                p = Smart.of($(window));
            this._PARENT = Smart.of(p);
            return this._PARENT;
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
        },
        val: function () {
            return this.node.val();
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
                return this.parent()._getContext();
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

    //cache扩展
    Smart.extend(Smart.prototype, {
        cache: (function () {
            return function (key, val) {
                if (key in this[CONST.CACHE_ATTR]) {
                    return this[CONST.CACHE_ATTR][key];
                }
                if (key in this[CONST.CACHE_DEFERREDS_ATTR]) {
                    var deferred = $.Deferred();
                    this[CONST.CACHE_DEFERREDS_ATTR][key].push(deferred);
                    return deferred;
                }
                if ($.isFunction(val)) {
                    val = val();
                }
                if (Smart.isDeferred(val)) {
                    var deferred = $.Deferred();
                    this[CONST.CACHE_DEFERREDS_ATTR][key] = [deferred];
                    var that = this;
                    val.done(function () {
                        var args = arguments;
                        that[CONST.CACHE_ATTR][key] = args[0];
                        $.each(that[CONST.CACHE_DEFERREDS_ATTR][key], function () {
                            this.resolve.apply(this, Smart.SLICE.call(args));
                        })
                    }).fail(function () {
                        var args = arguments;
                        $.each(that[CONST.CACHE_DEFERREDS_ATTR][key], function () {
                            this.reject.apply(this, Smart.SLICE.call(args));
                        })
                    }).always(function () {
                        delete that[CONST.CACHE_DEFERREDS_ATTR][key];
                    })
                    return deferred;
                } else {
                    this[CONST.CACHE_ATTR][key] = val;
                    return val;
                }
            }
        })(),
        clearCache: function () {
            this[CONST.CACHE_ATTR] = {};
            this[CONST.CACHE_DEFERREDS_ATTR] = {};
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
            Smart.prototype[method] = function (url, data, cfg, ajaxSetting) {

                cfg = $.extend($.extend({}, ajaxCfg), cfg || {});

                if (method == 'remove') {
                    method = 'delete';
                }
                var urlSegs = url.split(":");
                var type;//默认json请求
                if (urlSegs.length > 1) {
                    type = urlSegs[0];
                    url = url.substring(type.length + 1);
                } else {
                    type = "json";
                }
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
                        deferred.resolve.apply(deferred, Smart.SLICE.call(arguments));
                        if (!cfg.silent) {
                            _this.trigger("smart-ajaxSuccess", [cfg.successTip, result]);
                        }
                    }).fail(function (xhr) {
                        if (!cfg.silent) {
                            var event = $.Event('smart-ajaxError', {
                                retryRequest: doRequest
                            });
                            var args = Smart.SLICE.call(arguments);
                            args.unshift(event);
                            deferred.reject.apply(deferred, args);
                            if (!event.isPropagationStopped()) {
                                _this.trigger(event, [cfg.errorTip, ajaxCfg.getErrorMsg(xhr, url), xhr]);
                                return;
                            }
                        } else {
                            deferred.reject.apply(deferred, Smart.SLICE.call(arguments));
                        }


                    }).always(function () {
                        if (!cfg.silent) {
                            _this.trigger("smart-ajaxComplete");
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
            ready: function (fn) {
                var deferred = $.Deferred();
                if (this._state != 'ready') {
                    this.on("s-ready", function () {
                        /**
                         * 如果是控件还没有渲染完成，则直接resolve，并不需要等待。
                         * */
                        fn();
                    });
                    deferred.resolve();
                } else {
                    Smart.deferredChain(deferred, Smart.deferDelegate(fn()));
                }
                return deferred;
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
            },
            dataSetter: function (data) {
                var dataType = $.type(data);
                if (dataType == "boolean" || dataType == "number" || dataType == "string" || data == undefined) {
                    //如果没有子元素
                    if (this.node.is("select")) {
                        data = data == undefined ? '' : data + "";
                        if ($("option[value='" + data.replace(/\\/gi, "\\\\") + "']", this.node).size() > 0) {
                            this.node.val(data + "");
                        }
                        return;
                    } else if (this.node.is("input[type='text'],input[type='hidden'],textarea," +
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
                        try {
                            value = [data == undefined ? null : fn_flag ? eval("data." + dataFilter) : data[dataFilter]];
                        } catch (e) {

                        }
                    } else {
                        value = [dataFilter.apply(null, value)];
                    }
                }
                if (arguments.length == 1) {
                    this.__SMART__DATA__ = args[0];
                } else {
                    this.__SMART__DATA__ = args;
                }
                var that = this;
                return Smart.deferDelegate(this.dataSetter.apply(this, value)).done(function () {
                    that.trigger("s-data", value);
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
                    that.trigger("s-build", value);
                });
            },
            buildGetter: function () {
                return this.__SMART_BUILD_DATA__;
            },
            buildSetter: function () {

            },
            _executeBuild: function () {
                this._state = "build"
                var buildAttrStr = this.node.attr("s-build");
                if (buildAttrStr == undefined) {
                    return;
                }
                var buildSwitch = this.node.attr("s-build-switch");
                if (buildSwitch != undefined) {
                    buildSwitch = this.context(buildSwitch);
                    if ($.isFunction(buildSwitch)) {
                        buildSwitch = buildSwitch();
                    }
                    switch (buildSwitch) {
                        case 'off-on':
                            this.node.attr("s-build-switch", "'on'");
                            return;
                        case 'on':
                            break;
                        default :
                            return;
                    }
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
            },
            dataSwitch: function (type) {
                this.node.attr("s-data-switch", type);
            },
            _executeData: function () {
                this._state = "data";
                var dataSwitch = this.node.attr("s-data-switch");
                if (dataSwitch != undefined) {
                    dataSwitch = this.context(dataSwitch);
                    if ($.isFunction(dataSwitch)) {
                        dataSwitch = dataSwitch();
                    }
                    switch (dataSwitch) {
                        case 'off-on':
                            this.node.attr("s-data-switch", "'on'");
                            return;
                        case 'on':
                            break;
                        default :
                            return;
                    }
                }
                var dataAttrStr = this.node.attr("s-data");
                if (dataAttrStr == undefined) {
                    return;
                }
                var dataValue = this.context(dataAttrStr);
                if ($.isFunction(dataValue)) {
                    dataValue = dataValue.call(this);
                }
                var deferred = $.Deferred();
                if ($.isPlainObject(dataValue) && Smart.isDeferred(dataValue)) {
                    var that = this;
                    dataValue.done(function (data) {
                        Smart.deferDelegate(that.data(data)).done(function () {
                            deferred.resolve();
                        }).fail(function () {
                            deferred.reject().apply(deferred, $.makeArray(arguments));
                        })
                    }).fail(function () {
                        deferred.reject.apply(deferred, $.makeArray(arguments));
                    })
                } else {
                    Smart.deferDelegate(this.data(dataValue)).done(function () {
                        deferred.resolve();
                    }).fail(function () {
                        deferred.reject();
                    })
                }
                return deferred;
            },
            _executeReady: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onReady();
                });
                this.trigger("s-ready");
                this._state = 'ready';
            },
            destroy: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onDestroy();
                });
                this.widgets = {};
                this.node.remove();
            },
            refresh: function () {
                this._state = "refresh";
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
            },
            clean: function () {
                //清空缓存
                this.clearCache();
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
        body = body.replace(/&#10;/g,"")
        var scripts = [];
        scripts.push(OUT_SCRIPT);
        var line = [];
        var inScriptFlag = false;
        var writeLine = function (type) {
            var lineStr = line.join("");
            if (type == "script") {
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
;(function(){
    var DEFAULT_OPTION = {title : "提示", btnName: "确定"};
    Smart.extend(Smart.prototype, {
        alert: function(msg, level, option){
            if(level && $.type(level) !== 'string'){
                option = level;
                level = null;
            }
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("alert");
            var levelSign = (level || 'info').split(":");
            level = levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-alert-sign-default";
            var alertLevel = "s-alert-" + level;
            option = option || DEFAULT_OPTION;
            if($.type(option) == "string"){
                option = $.extend($.extend({}, DEFAULT_OPTION), {title: option});
            }
            dialog.addClass(alertLevel);
            $("*[s-alert-role='title']", dialog).html(option.title);
            $("*[s-alert-role='message']", dialog).html(msg);
            $("*[s-alert-role='sign']", dialog).addClass(sign);
            var btn = $("*[s-alert-role='btn']", dialog);
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
})();;(function () {
    Smart.fn.extend({
        cascade: function () {
            var args = arguments;
            for (var i = 0; i < args.length - 1; i++) {
                var $S = args[i];
                if (i < args.length - 1) {
                    var $next = args[i + 1];
                    (function ($S, $next) {
                        $S.on("change s-data", function (e) {
                            $next.refresh().done(function () {
                                //$next.node.change();
                            })
                        })
                    })($S, $next)
                }
            }
            args[0].node.change();
        }
    });
})();/**
 * Created by Administrator on 2014/6/26.
 */
(function ($) {

    Smart.fn.extend({
        confirm: function (msg, level, option) {
            if (level && $.type(level) !== 'string') {
                option = level;
                level = null;
            }
            var deferred = $.Deferred();
            var dialog = Smart.UI.template("confirm");
            var DEFAULT_OPTION = {title: "提示", sureBtnName: "确定", cancelBtnName: "取消"};
            option = $.extend(DEFAULT_OPTION, option || {});
            if ($.type(option) == "string") {
                option = $.extend($.extend({}, DEFAULT_OPTION), {sign: option});
            }
            var levelSign = (level || 'info').split(":");
            level = "s-confirm-" + levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-confirm-sign-default";
            dialog.addClass(level);
            $("*[s-confirm-role='title']", dialog).html(option.title);
            $("*[s-confirm-role='message']", dialog).html(msg);
            $("*[s-confirm-role='sign']", dialog).addClass(sign);
            var sureBtn = $("*[s-confirm-role='sureBtn']", dialog).html(option.sureBtnName);
            var cancelBtn = $("*[s-confirm-role='cancelBtn']", dialog).html(option.cancelBtnName);
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
            }).on("shown.bs.modal", function () {
                sureBtn.focus();
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
        btn.id && button.attr("s-dialog-btn-id", btn.id);
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

            $("*[s-confirm-role='title']", dialog).html(option.title);
            $("*[s-confirm-role='message']", dialog).html(msg);
            $("*[s-confirm-role='sign']", dialog).addClass(confirmLevel.color).addClass(confirmLevel.sign);
            var sureBtn = $("*[s-confirm-role='sureBtn']", dialog).html(confirmLevel.sureBtnName);
            var cancelBtn = $("*[s-confirm-role='cancelBtn']", dialog).html(confirmLevel.cancelBtnName);
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

    var createBtn = function (btn) {
        var button = $('<button class="btn" type="button"></button>');
        btn.id && button.attr("s-dialog-btn-id", btn.id);
        var text = (btn.icon ? "<i class='" + btn.icon + "'></i> " : "") + btn.name;
        button.html(text);
        btn.style && button.addClass(btn.style || "btn-default");
        button.click(function () {
            button.prop("disabled", true);
            var rs = btn.click.call(this);
            if (Smart.isDeferred(rs)) {
                rs.always(function () {
                    button.prop("disabled", false);
                })
            } else {
                button.prop("disabled", false);
            }
        });
        btn.hidden && button.hide();
        return button;
    };

    var showDialog = function (dialog, zIndex) {
        dialog.on('shown.bs.modal', function (e) {

        }).on("hide.bs.modal", function (e) {
            if (this == e.target)
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
        var bodyNode = $("*[s-dialog-role='body']", dialog);
        var bodySmart = Smart.of(bodyNode);
        var titleNode = $("*[s-dialog-role='title']", dialog);
        var footerNode = $("*[s-dialog-role='footer']", dialog);
        var closeBtn = $("*[s-dialog-role='close']", dialog);
        var dialogMain = $("*[s-dialog-role='dialog']", dialog);

        bodySmart.setNode(node);

        closeBtn.click(function () {
            nodeSmart.close();
        });
        Smart.UI.backdrop();
        var zIndex = Smart.UI.zIndex();
        nodeSmart.on("close", function (e) {
            var eDeferred = e.deferred;
            var args = Smart.SLICE.call(arguments, 1);
            dialog.on("hidden.bs.modal", function () {
                eDeferred.resolve();
                dialog.remove();
                deferred.resolve.apply(deferred, args);
            });
            dialog.modal('hide');
            e.deferred = eDeferred.promise();
        }).on("meta", function (e, key, value) {
            if (key == "title") {
                titleNode.html(value);
            }
        }).on("s-loaded", function () {
            titleNode.html(nodeSmart.meta.title || DIALOG_DEFAULT_TITLE);
            var focusBtn;
            if (nodeSmart.meta.btns) {
                $.each(nodeSmart.meta.btns, function (i, btn) {
                    var btnNode = createBtn(btn);
                    if (btn.focus) {
                        focusBtn = btnNode;
                    }
                    footerNode.append(btnNode);
                });
            } else {
                //如果底部没有按钮，则进行隐藏
                footerNode.hide();
            }

            nodeSmart.meta.height && node.height(nodeSmart.meta.height);
            nodeSmart.meta.width && node.width(nodeSmart.meta.width);
            //这里主要处理内容的高度
            dialogMain.css({"position": "absolute", "width": "auto"});
            bodyNode.css("padding", 0).css("position", "relative");
            dialog.appendTo("body");
            dialog.show();
            dialogMain.width(dialogMain.innerWidth()).css("position", "relative");
            footerNode.css("marginTop", "0");
            dialog.on('shown.bs.modal', function (e) {
                focusBtn && focusBtn.focus();
            })
            showDialog(dialog, zIndex);
        }).on("dialog.btn.disable", function (e, id) {
            getButtonById(id).prop("disabled", true);
        }).on("dialog.btn.enable", function (e, id) {
            getButtonById(id).prop("disabled", false);
        });

        function getButtonById(id) {
            return $("button[s-dialog-btn-id='" + id + "']", footerNode);
        }

        nodeSmart.getButtonById = getButtonById;
        nodeSmart.load.apply(nodeSmart, $.makeArray(arguments)).fail(function (e, xhr) {
            var msg;
            if (xhr.status == 0) {
                msg = "网络异常，请重试";
                Smart.UI.backdrop(false);
                nodeSmart.toast(msg, "danger");
                e.stopPropagation();
            }
        });

        return $.extend(deferred, {
            close: function () {
                nodeSmart.close();
            }
        });
    };

    Smart.fn.extend({
        popupOpen: popupOpen,
        /**
         * @duplicate
         * */
        dialogOpen: function () {
            Smart.warn("dialogOpen 已经过时，请使用popupOpen代替。");
            return popupOpen.apply(this, Smart.SLICE.call(arguments));
        }
    });
})(jQuery);
;(function () {
    Smart.fn.extend({
        /**
         * 延时触发方法，如果在延时时间内再次出发的话，将重新进行计时
         * */
        timeout: function (key, fn, time) {
            if ($.isFunction(key)) {
                time = fn;
                fn = key;
                key = "";
            }
            time = time || 300;
            var that = this;
            var key = "_PLUGIN_TIMEOUT_" + key;
            var timeout = this.node.data(key);
            if (timeout) {
                window.clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                fn();
                that.node.removeData(key);
            }, time);
            this.node.data(key, timeout);
            return timeout;
        }
    });
})();(function ($) {

    var DEFAULT_LEVEL = "primary";

    var HOLDTIME = 3000;

    var toastContainer = null;

    var TOAST_STACK = [];

    var CURRENT_TOAST;

    function pushToast(toast, holdTime){
        TOAST_STACK.push([toast, holdTime]);
        if(TOAST_STACK.length > 1){
            return;
        }
        holdToast();
    }

    function removeToast(toast) {
        toast.css("margin-bottom", "-" + toast.outerHeight() + "px");
        toast.addClass("out");
        setTimeout(function () {
            toast.remove();
        }, 300);
        TOAST_STACK.shift();
        if(TOAST_STACK.length){
            holdToast();
        }
    }

    function holdToast(){
        var toastInfo = TOAST_STACK[0];
        var toast = CURRENT_TOAST = toastInfo[0];
        if(toast.attr("_TOAST_STATUS_") == "DELETED"){
            TOAST_STACK.shift();
            holdToast();
            return;
        }
        var holdTime = toastInfo[1];
        var closeTimeout = setTimeout(function(){
            removeToast(toast);
        }, holdTime);
        toast.mouseover(function () {
            toast.css({
                opacity: 1,
                "transition": "all .2s ease-out"
            });
            window.clearTimeout(closeTimeout);
        }).mouseleave(function () {
            closeTimeout = setTimeout(function(){
                removeToast(toast);
            }, holdTime);
        });
    }

    Smart.fn.extend({
        notice: function (msg, level, config) {
            Smart.warn("S.toast已经过时，请使用S.toast替代");
            this.toast(msg, level, config);
        },
        toast: function (msg, level, holdTime) {
            if(level && $.type(level) !== 'string'){
                option = level;
                level = null;
            }
            if (!toastContainer) {
                toastContainer = $("<div />").addClass("s-toast-container").appendTo("body");
            }
            toastContainer.css("zIndex", Smart.UI.zIndex());
            holdTime = holdTime || HOLDTIME;
            var toastTpl = Smart.UI.template("toast");
            var levelSign = (level || DEFAULT_LEVEL).split(":");
            level = levelSign[0];
            var sign = levelSign.length == 2 ? levelSign[1] : "s-toast-sign-default";
            var toastLevel = "s-toast-" + (level || DEFAULT_LEVEL);
            $("*[s-toast-role='message']", toastTpl).html(msg);
            if(sign){
                $(".s-toast-sign", toastTpl).addClass(sign);
            }
            toastTpl.addClass(toastLevel).prependTo(toastContainer);
            setTimeout(function () {
                toastTpl.addClass("in");
            }, 1);
            $(".s-toast-close", toastTpl).click(function () {
                if(CURRENT_TOAST == toastTpl){
                    removeToast(toastTpl);
                }
                toastTpl.remove();
                toastTpl.attr("_TOAST_STATUS_", "DELETED");
            });
            pushToast(toastTpl, holdTime);
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/7/2.
 */
(function(){
    var uploadListener = function(){};
    uploadListener.prototype = {

        setTarget: function(node){
            this.node = node;
        },
        onBegin: function(){
            this.progress = Smart.UI.template("progress")
                .css({
                    "position": "absolute",
                    zIndex: Smart.UI.zIndex()
                }).addClass("s-upload-progressbar");
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
            var formData ;
            if(fileNode instanceof FormData){
                formData = fileNode
            } else {
                formData = Smart.formData(fileNode)
            }
            listener = listener || new uploadListener();
            if($.isFunction(listener)){
                listener = {
                    onProgress: listener
                };
            }
            listener.setTarget && listener.setTarget(fileNode);
            listener.onBegin && listener.onBegin();
            var CURRENT_XHR = $.ajaxSettings.xhr();
            CURRENT_XHR.upload.addEventListener("progress", function(e){
                if (e.lengthComputable) {
                    var percentComplete = e.loaded * 100 / e.total;
                    listener.onProgress(parseInt(percentComplete), e.total, e.loaded);
                }
            }, false);
            var deferred = this.post(url, formData, null, {
                xhr: function(){
                    return CURRENT_XHR;
                }
            }).always(function(){
                listener.onDone && listener.onDone();
            });
            $.extend(deferred, {
                abort: function(){
                    CURRENT_XHR.abort();
                }
            });
            return deferred;

        }
    });

})();;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var CHECK_ITEM_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='i']";
    var CHECK_ITEM_HANDLER_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='h']";
    var CHECK_PATH_ATTR = Smart.optionAttrName('check', 'path');
    var CHECKED_ATTR = "s_check_checked";
    var CHECKED_CLASS = "s-check-checked";
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
            this.S.node.delegate(CHECK_ITEM_SELECTOR, "click", function (e) {
                if (that.options.turn != "on") {
                    return;
                }
                var row = $(e.currentTarget);
                if(!row.is(".s-check-h") && $(CHECK_ITEM_HANDLER_SELECTOR, row).size() > 0){
                    return;
                }
                that.S._toggleCheck($(this), e);
            });
            this.S.node.delegate(CHECK_ITEM_SELECTOR, "change", function (e) {
                if (that.options.turn != "on") {
                    return;
                }
                var el = $(e.target);
                if(!el.is(CHECK_ITEM_HANDLER_SELECTOR)){
                    return;
                }
                that.S._toggleCheck($(this), e);
                e.stopPropagation();
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
            if (!node.is(".s-check-h") && e && $(CHECK_ITEM_HANDLER_SELECTOR, node).size() > 0) {
                var target = $(e.target);
                if (!target.is(CHECK_ITEM_HANDLER_SELECTOR)) {
                    //return;
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
        id: "databind",
        defaultOptions: {
            targets: []
        }
    },null, {
        dataSetter: function(){
            var args = Smart.SLICE.call(arguments);
            var deferreds = [];
            var fnAttr = this.widget.databind.optionName("fn");
            function dataDo(){
                var that = this;
                deferreds.push(function(){
                    var fn = that.node.attr(fnAttr) || "data";
                    return that[fn].apply(that, args);
                })
            }
            $.each(this.widget.databind.targets, dataDo);
            return Smart.deferredQueue(deferreds);
        }
    });
})();;/**
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
            function dataDo(){
                var that = this;
                deferreds.push(function(){
                    var ig = that.node.attr(igAttr);
                    if(ig == "true" || ig == ""){
                        return;
                    }
                    return that.ready(function(){
                        var fn = that.node.attr(fnAttr) || "data";
                        return that[fn].apply(that, args);
                    })
                })
            }
            this.children().each(dataDo);
            this.widget.datac.options.targets && $.each(this.widget.datac.options.targets, dataDo);
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
        return $("> *[" + roleAttr + "='" + val + "']", node);
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
            var row = this._getRow();
            if (!igCheckAssistRow) {
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
            var deferreds = [];
            row.each(function(){
                var _row = $(this);
                var $row = Smart.of(_row);
                that.node[mode || 'append']($row.node);
                deferreds.push(function(){
                    return $row.render()
                });
                deferreds.push(function(){
                    return $row.data(data);
                })
            });
            deferreds.push(function(){
                that.trigger("row-add", [row, data, mode, indentNum]);
            })
            return Smart.deferredQueue(deferreds);
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
        getRows: function(){
            var rows = [];
            getRoleNode("row", this.node).each(function(){
                rows.push(Smart.of($(this)));
            })
            return rows;
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
        id: "tpl",
        options: "tplText"
    }, {
        onPrepare: function(){
            this.cache = {};
            var tplText;
            if(this.options.tplText){
                tplText = this.options.tplText;
            } else {
                var plainTextNode = this.S.node.find(" > script[type='text/template']");
                if(plainTextNode.size() > 0){
                    tplText = plainTextNode.html();
                } else {
                    tplText = this.S.node.html();
                }
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
            if(this.S.node.hasClass('s-tpl-text')){
                this.S.node.removeClass("s-tpl-text");
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
        var that = this;
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
        //替换$TID-xxx$预定义变量为处理完成的id；
        html = html.replace(/\$TID:(.+?)\$/g, function ($0, $1) {
            return that.trueId($1);
        });

        this._WNODE = $("<div class='s-window' />").html(html);
        //替换掉id,为id加上当前窗口的窗口id TODO 正则表达式无法匹配，采用jQuery的方法替换
        this._WNODE.find("*[id]").add(this._WNODE.filter("*[id]")).each(function () {
            var id = $(this).attr("id");
            $(this).attr("id", that.trueId(id)).attr("_id_", id);
            /**
             * 为所有的id元素生成预定义变量$id
             * */
            scripts.push("  var $" + id + " = S.S('#" + id + "');");
        });
        this.meta = {};
        this.node.empty().append(this._WNODE);
        this.trigger("s-window-loaded");
        undelegateEvent(this);
        var deferreds = [];
        if (meta.ctrl) {
            deferreds.push(function () {
                return that.get("text:" + meta.ctrl).done(function (rs) {
                    scriptTexts.push(rs);
                })
            })
        }
        deferreds.push(function () {
            scripts.push(scriptTexts.join("\n"));
            scripts.push("			return function(key){");
            scripts.push("				try{");
            scripts.push("					return eval(key);");
            scripts.push("				}catch(e){ \nSmart.error(e);\n}");
            scripts.push("			};");
            scripts.push("		};");
            scripts.push("})();//@ sourceURL=" + href + ".js");
            var scriptFn = that.context(scripts.join("\n"));
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
                        scriptArgs[tmps[0]] = window.decodeURIComponent(tmps[1]);
                    }
                });
            }
            $.extend(scriptArgs, loadArgs || {});
            var context = scriptFn.call(that, scriptArgs);
            that.CONTEXT = context;
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
            /**
             *处理{$method(args)}用于
             * */
                //绑定浏览器事件，click等
            delegateEvent(that);
            //处理自动焦点的元素
            setTimeout(function () {
                that.node.find("*[s-window-role='focus']:first").focus();
            }, 100);

            that.on("s-ready", function () {
                //处理锚点滚动
                if (href.indexOf("#") != -1) {
                    var anchor = href.substring(href.indexOf("#"));
                    that.scrollTo(anchor);
                }
            });
        })
        return Smart.deferredQueue(deferreds);
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
        "s-mouseleave": "mouseleave",
        "s-enter": "keyup:13",
        "s-keyup": "keyup",
        "s-keypress": "keypress",
        "s-keydown": "keydown",
        "s-key-left": "keyup:37",
        "s-key-up": "keyup:38",
        "s-key-right": "keyup:39",
        "s-key-down": "keyup:40"
    };

    function undelegateEvent(smart) {
        smart.node.undelegate();
    }

    function delegateEvent(smart) {
        $.each(EVENT_MAP, function (key, val) {
            var evts = val.split(":");
            val = evts[0];
            var keyCode = null;
            if (evts.length > 1) {
                keyCode = evts[1];
            }
            smart.node.delegate("*[" + key + "]", val, function (e) {
                if (e.keyCode == 229) {
                    //如果是中文输入法输入，则返回
                    return;
                }
                if (keyCode && e.keyCode != keyCode) {
                    return;
                }
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
                    action = smart.action(evtScript, "e");
                    node.data(evtKey, action);
                }
                var result = action.call(Smart.of(node), e);
                if (result == null)
                    return;
                if (Smart.isDeferred(result)) {//说明这个是deferred对象
                    Smart.disableNode(node);
                    node.addClass("s-loading");
                    result.always(function () {
                        node.removeClass("s-loading");
                        Smart.disableNode(node, false);
                    });
                }
                return result;
            });
        });

        /**
         * 监听href的click时间，如果href是以javascript:开头的，则不处理，如果是#号开头的目前不处理
         * */
        smart.node.delegate("a[href]", "click", function (e) {
            var a = $(this);
            if (a[0].hasAttribute('external')) {
                return;
            }
            var href = a.attr("href");
            if (href && !/^javascript:.+|#.*$/.test(href)) {
                if (/^popup:.+$/.test(href)) {
                    smart.popupOpen(href.substring(6));
                } else {
                    smart.open(href);
                }
                //事件需要继续向上冒泡
                smart.node.parent().click();
                return false;
            }
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
            this.cache[ON_BEFORE_CLOSE_FN_KEY] = [];
            this.cache[EVENT_ON_CACHE] = [];
            this.location = {
                href: this.options.href,
                args: this.options.args
            };
        },
        onBuild: function () {
            this.S._WINDOW_ID = "_w_" + (CURRENT_WINDOW_ID++);
            this.S.node.attr("id", this.S._WINDOW_ID);
            var deferred = $.Deferred();
            var that = this;
            if (this.location.href) {
                this.S._load.apply(this.S, [this.location.href].concat(this.location.args || [])).done(function () {
                    deferred.resolve();
                }).fail(function () {
                    deferred.reject.apply(deferred, $.makeArray(arguments));
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
            delete this.CONTEXT;
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
            this._WINDOW_ID = "_w_" + (CURRENT_WINDOW_ID++);
            this.node.attr("id", this._WINDOW_ID);
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
            this.get("text:" + href).done(function (html) {
                var result = parseHtml(html);
                var scriptSrcs = result.scriptSrcs;
                Smart.loadFiles(scriptSrcs, href).done(function () {

                }).fail(function () {
                    Smart.error(href + "的依赖处理失败");
                }).always(function () {
                    process.apply(that, [result].concat(args)).done(function () {
                        that.trigger("s-loaded");
                        //当页面存在锚点的时候，页面滚动的时候，监听锚点的位置，并触发事件。
                        that._listenAnchorPos();
                        deferred.resolve();
                    });
                });

            }).fail(function () {
                deferred.reject.apply(deferred, $.makeArray(arguments));
            });
            return deferred;
        },
        setMeta: function (key, value) {
            this.meta[key] = value;
            this.trigger("meta", [key, value]);
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
                }, 400, function () {
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

        _doClose: function () {
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
        close: function () {
            var that = this;
            var args = arguments;
            return this.preClose().done(function () {
                that._doClose.apply(that, Smart.SLICE.call(args));
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
        action: function (script, args) {
            var script_body = [];
            script_body.push("(function(){");
            script_body.push("      return function(" + (args || "") + "){");
            script_body.push("          " + script);
            script_body.push("      }")
            script_body.push("})()");
            return this.context(script_body.join("\n"));
        }
    });

})(jQuery);;/**
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
            affixClass: 's-affix-bar'
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.addClass('s-affix').smartAffix({
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
 * Created by Administrator on 2014/6/21.
 */
(function(){
    Smart.UI.contextmenu = {
        target: null
    };

    var DISABLED_CLASS = "disabled";

    var CURRENT_SHOWN_CONTEXTMENU;

    Smart.widgetExtend({
        id: "contextmenu"
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
                var menuNodes = this.node.find("li");
                var that = this;
                if(menuNodes.size()){
                    menuNodes.each(function(){
                        //如果filter的返回值是false，则说明该菜单不可用。
                        var node = $(this);
                        if(that.widget.contextmenu.options.filter(node, $(e.target)) == false){
                            that.disableMenu(node);
                        } else {
                            that.enableMenu(node);
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
        disableMenu: function(menu){
            menu.addClass(DISABLED_CLASS);
            $("i, span", menu).click(function(e){
                e.stopPropagation();
            });
        },
        enableMenu: function(menu){
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
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    //表单提交插件，作用于submit按钮，可以实现表单回车提交
    Smart.widgetExtend({
        id: "form",
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
            if (!this.widget.form.options.action) {
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
                            deferred.reject.apply(deferred, $.makeArray(arguments));
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
                    deferred.reject.apply(deferred, $.makeArray(arguments));
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

    //分页控件
    Smart.widgetExtend({
        id: "pager",
        options: "pagekey,pageSizeKey,totalKey,disabledClass",
        defaultOptions: {
            action: $.noop(),
            'pagekey': "page",
            'pageSizeKey': "pageSize",
            'totalKey': "total",
            "disabledClass": "disabled"
        }
    }, {
        onPrepare: function(){
            var that = this;
            this.S.node.delegate(".s-pager-prev, .s-pager-next", "click", function(e){
                var node = $(this);
                if(node.hasClass(that.options.disabledClass)){
                    return;
                }
                that.options.action.call(node.attr("_s-pager-page"), node.attr("_s-pager-page"), that.S);
            });
        }
    }, {
        dataSetter: function (data) {
            var page = parseInt(data[this.widget.pager.options['pagekey']]);
            var total = parseInt(data[this.widget.pager.options['totalKey']]);
            var pageSize = parseInt(data[this.widget.pager.options['pageSizeKey']]);
            var totalPage = Math.ceil(total / pageSize);
            var preBtn = this.node.find(".s-pager-prev");
            var netxtBtn = this.node.find(".s-pager-next");
            if(page <= 1){
                preBtn.addClass(this.widget.pager.options.disabledClass).prop("disabled", true);
            } else {
                preBtn.removeClass(this.widget.pager.options.disabledClass).attr("_s-pager-page", page - 1).prop("disabled", false);
            }
            if(page >= totalPage){
                netxtBtn.addClass(this.widget.pager.options.disabledClass).prop("disabled", true);
            } else {
                netxtBtn.removeClass(this.widget.pager.options.disabledClass).attr("_s-pager-page", page + 1).prop("disabled", false);
            }
        }
    });
})(jQuery);
;/**
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
                this.widget.pagination.options['action'].call(page, page, this);
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
    var SELECT_LIST_CLASS = ".s-select-list";
    var SELECT_LIST_ITEM_CLASS = ".s-select-list-item";
    var SELECT_MIRROR_CLASS = ".s-select-mirror";
    var SELECT_PANEL_CLASS = ".s-select-panel";

    function showSelectPanel(selectNode, selectPanel) {
        //selectPanel.show();
        selectNode.css("overflow", "visible");
    }

    function hideSelectPanel(selectNode, selectPanel) {
        //selectPanel.hide();
        selectNode.css("overflow", "hidden");
    }

    Smart.widgetExtend({
        id: "select",
        defaultOptions: {
            title: "name,title",
            value: "id"
        }
    }, {
        onPrepare: function () {
            this.cache = {};
            this.env = {};
            this.cache.dataMap = {};
            /**
             * 如果判断控件的node不是select元素，而且拥有s-select的class，则说明使用html来渲染下拉列表，而不是使用原生的下来列表
             * */
            if (!this.S.node.is("select") && this.S.node.hasClass("s-select")) {
                this.S.node.click(function (e) {
                    e.stopPropagation();
                });
                this.env.mode = "html";
                this.env.listContainer = $(SELECT_LIST_CLASS, this.S.node);
                this.env.targetNode = $(".s-select-input", this.S.node);
                var filterInput = $("input[type='text'].s-select-filter", this.S.node).attr('autocomplete', 'off');
                this.env.selectMirror = $(SELECT_MIRROR_CLASS, this.S.node);
                this.env.mirrorSpan = $("span", this.env.selectMirror);
                this.env.selectPanel = $(SELECT_PANEL_CLASS, this.S.node);
                if (this.env.listContainer.size() == 0) {
                    this.env.listContainer = $("<ul />").addClass(SELECT_LIST_CLASS.substring(1)).appendTo(this.env.selectPanel);
                }
                if (this.env.listContainer.is("ul")) {
                    this.env.listItemType = "li";
                } else {
                    this.env.listItemType = "div";
                }

                /**
                 * 绑定事件
                 * */
                var that = this;
                if (this.env.selectMirror.size() == 0) {
                    this.env.selectMirror = $("<div />").addClass(SELECT_MIRROR_CLASS.substring(1)).prependTo(this.S.node);
                }
                this.env.selectPanelShow = false;
                this.env.selectMirror.click(function () {
                    if (!that.env.selectPanelShow) {
                        $("body").click();
                        if (that.env.targetNode.prop("disabled") || that.env.targetNode.prop("readonly")) {
                            return;
                        }
                        showSelectPanel(that.S.node, that.env.selectPanel);
                        filterInput.focus();
                        $("body").one("click", function () {
                            hideSelectPanel(that.S.node, that.env.selectPanel);
                            that.env.selectPanelShow = false;
                        });
                        that.env.selectPanelShow = true;
                    } else {
                        hideSelectPanel(that.S.node, that.env.selectPanel);
                        that.env.selectPanelShow = false;
                    }
                });
                this.env.listContainer.delegate(SELECT_LIST_ITEM_CLASS, "click", function (e) {
                    e.stopPropagation();
                    var node = $(e.currentTarget);
                    that.env.targetNode.val(node.attr("value")).change();
                    that.env.mirrorSpan.html(node.html());
                    hideSelectPanel(that.S.node, that.env.selectPanel);
                    that.env.selectPanelShow = false;
                });
                if (filterInput.size() > 0) {
                    var that = this;
                    var filterTimeout;
                    filterInput.keyup(function (e) {
                        if (filterTimeout) {
                            window.clearTimeout(filterTimeout);
                        }
                        var val = this.value;
                        filterTimeout = setTimeout(function () {
                            filterTimeout = 0;
                            if (val == "") {
                                that.env.listContainer.children(":hidden").show();
                                return;
                            }
                            that.env.listContainer.children(":contains('" + val + "'):hidden").show();
                            that.env.listContainer.children("*:not(:contains('" + val + "'))").hide();
                        }, 300);
                        e.stopPropagation();
                    });
                }
                this.cache.originalOptions = this.env.listContainer.children();
                this.S.data(this.env.listContainer.children(":eq(0)").attr("value"));
            } else {
                this.env.listContainer = this.S.node;
                var originalOptions = this.S.node.children();
                this.cache.originalOptions = originalOptions;
            }
        },
        onClean: function () {
            //this.env.targetNode.val("");
            //this.env.selectMirror
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                var _datas = datas;
                datas = [];
                $.each(_datas, function (key, value) {
                    datas.push({title: value, id: key})
                });
            }
            this.widget.select.cache.dataMap = {};
            for (var i in datas) {
                var _data = this._getOptionData(datas[i]);
                this.widget.select.cache.dataMap[_data.value] = _data;
            }
            this.widget.select.cache.buildData = datas;
            this.widget.select.env.listContainer.empty();
            this.widget.select.env.listContainer.append(this.widget.select.cache.originalOptions);
            if(this.widget.select.env.mode == "html"){
                var that = this;
                this.node.one("click", function () {
                    that._createOptions();
                })
            } else {
                this._createOptions();
            }
        },
        _createOptions: function () {
            var datas = this.widget.select.cache.buildData;
            for (var i in datas) {
                this.widget.select.env.listContainer.append(this._createOption(datas[i]));
            }
        },
        _getOptionData: function (data) {
            if ($.type(data) == 'string') {
                data = {
                    name: data,
                    id: data
                };
            }
            var value, title;
            if ($.isFunction(this.widget.select.options.value)) {
                value = this.widget.select.options.value(data);
            } else {
                value = data[this.widget.select.options.value];
            }
            if ($.isFunction(this.widget.select.options.title)) {
                title = this.widget.select.options.title(data);
            } else {
                var tmp = this.widget.select.options.title.split(",");
                title = tmp[0] in data ? data[tmp[0]] : data[tmp[1]];
            }
            return {value: value, title: title};
        },
        _createOption: function (data) {

            var optionData = this._getOptionData(data);

            var option;
            if (this.widget.select.env.mode == "html") {
                option = $('<' + this.widget.select.env.listItemType + ' value="' + optionData.value + '">' + optionData.title + '</' + this.widget.select.env.listItemType + '>');
                option.addClass(SELECT_LIST_ITEM_CLASS.substring(1));
            } else {
                option = $('<option value="' + optionData.value + '">' + optionData.title + '</option>');
            }
            return option;
        },
        getSelectData: function () {
            var val = this.node.val();
            return this.widget.select.cache.dataMap[val];
        },
        dataSetter: function (value) {
            if (this.widget.select.env.mode == "html") {
                var optionData = this.widget.select.cache.dataMap[value];
                if (!optionData) {
                    var firstNode = this.widget.select.env.listContainer.children(":eq(0)");
                    if (firstNode.size() > 0) {
                        optionData = {
                            value: firstNode.attr("value"),
                            title: firstNode.html()
                        }
                    }
                }
                //var optionNode = $("*[value='" + data + "']", this.widget.select.env.listContainer);
                //if (optionNode.size() == 0) {
                //    optionNode = this.widget.select.env.listContainer.children(":eq(0)");
                //    data = optionNode.attr("value");
                //}
                this.widget.select.env.targetNode.val(optionData.value);
                this.widget.select.env.mirrorSpan.html(optionData.title);
                return;
            }
            return this.inherited([value]);
        },
        val: function () {
            if (this.widget.select.env.mode == "html") {
                return this.widget.select.env.targetNode.val();
            } else {
                return this.node.val();
            }
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
            'errorFocus': false,
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
                    //this.toast(msg);
                    setTimeout(function () {
                        node.tooltip('show');
                        clearTo();
                    }, 1);
                    node.on("shown.bs.tooltip", destroyTooltip);
                    if (level.key == 'error' && this.widget.valid.options.errorFocus) {
                        node.focus();
                    }
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
                    /**
                     * 有些控件的赋值与blur事件同时进行，但是blur事件会优先触发，所以需要延迟100ms，
                     * 以使得赋值动作优先进行。
                     * */
                    var node = $(this);
                    setTimeout(function () {
                        that.S.validateNode(node);
                    }, 100);
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
            if (nodeMsgAttrStr) {
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
            var $node = Smart.of(node);
            var validateItem = {
                id: id,
                label: label ? label : "",
                node: node,
                value: $node.val(),
                $node: $node
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
                var msg = $.extend($.extend({}, validator.msg), nodeMsg[method + "#" + count] || nodeMsg[method] || {});

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
})(jQuery);