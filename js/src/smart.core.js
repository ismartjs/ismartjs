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
                    } else if (this.node.is("input[type='checkbox']")) {
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
(jQuery);