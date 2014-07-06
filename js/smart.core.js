/**
 * Created by Administrator on 2014/6/10.
 */

(function ($) {

    var SMART_NODE_CACHE_KEY = "_SMART_";

    var SMART_ATTR_KEY = "s";

    var LIFE_STAGE = {
        initial: "initial",
        prepared: "prepared",
        building: "building",
        build: "build",
        running: "running",
        run: "run",
        made: "made"
    };

    //控件生命周期的事件禁止冒泡
    var STOP_PROPAGATION_EVENT = ["made", "load", "loading", "close"];

    var NODE_ATTR_PREFIX = "s";

    var Smart = window.Smart = function (node) {
        this.node = node || $();
        this.node.data(SMART_NODE_CACHE_KEY, this);
        this._dataTable = {};
        this.lifeStage = LIFE_STAGE.initial;
        var that = this;
        $.each(STOP_PROPAGATION_EVENT, function (i, evt) {
            that.on(evt, function (e) {
                e.stopPropagation();
            });
        });
    };

    Smart.defineKey = SMART_ATTR_KEY;

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
    var SLICE = Array.prototype.slice;
    var TO_STRING = Object.prototype.toString;
    //utils
    Smart.extend({
        SLICE: SLICE,
        TO_STRING: TO_STRING,
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
            if (TO_STRING.call(val) == "[object String]") {
                return $.trim(val).length == 0;
            }
            if (TO_STRING.call(val) == '[object Array]') {
                return val.length == 0;
            }
            return false;
        },
        isSmart: function (smart) {
            if (smart == undefined) {
                return false;
            }
            if (smart.constructor && smart.constructor == Smart) {
                return true;
            }
            return false;
        },
        isWidgetNode: function (node) {
            return node.attr(SMART_ATTR_KEY) !== undefined;
        },
        map: function (datas, key) {
            var _datas = [];
            for (var i = 0; i < datas.length; i++) {
                var d = datas[i];
                if ($.isFunction(key)) {
                    _datas.push(key(d));
                } else if (TO_STRING.call(key) == '[object String]') {
                    _datas.push(d[key]);
                }
            }
            return _datas;
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
        httpSuccess: function (xhr) {
            try {
                return !xhr.status && location.protocol === "file:" ||
                    // Opera returns 0 when status is 304
                    ( xhr.status >= 200 && xhr.status < 300 ) ||
                    xhr.status === 304 || xhr.status === 1223 || xhr.status === 0;
            } catch (e) {
            }

            return false;
        },
        //获取配置的属性名。
        optionAttrName: function (id, name) {
            return NODE_ATTR_PREFIX + "-" + id + "-" + name;
        },
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
                fns = SLICE.call(arguments);
            }

            function callFn(i) {
                if (i == fns.length) {
                    deferred.resolve();
                    return;
                }
                var fn = fns[i];
                if (!$.isFunction(fn)) {
                    callFn(i + 1);
                }
                var fnDefer = fn();
                if (!fnDefer) {
                    callFn(i + 1);
                    return;
                }
                fnDefer.done(function () {
                    callFn(i + 1);
                }).fail(function () {
                    deferred.reject();
                });
            }

            callFn(0);
            return deferred.promise();
        },
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
            var smart = node.data(SMART_NODE_CACHE_KEY);
            if (smart) {
                return smart;
            }
            smart = new Smart(node);
            node.data(SMART_NODE_CACHE_KEY, smart);
            return smart;
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
    //扩展Smart prototype
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
            var p = this.node.parent().closest("[" + SMART_ATTR_KEY + "]");
            if (p.size() == 0)
                p = Smart.of($(window));
            return Smart.of(p);
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
                if (child.attr(SMART_ATTR_KEY) !== undefined) {
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
            try {
                if ($.type(node) == "string") {
                    node = $(node);
                }
                this.node[mode || "append"](node);
                Smart.pick(node).make();
                return this;
            } catch (e) {
                this.node[mode || "append"](node);
                Smart.error(e);
            }
        }
    });

    Smart.extend(Smart.prototype, {
        setContext: function (context) {
            this.hasContext = true;
            this._context = context;
            return this;
        },
        setContextSmart: function (smart) {
            this.node.each(function () {
                Smart.of($(this))._context_smart_ = smart;
            });
            return this;
        },
        context: (function () {
            var getContextSmart = function (smart) {
                if (smart.hasContext) {
                    return smart;
                }
                var parent = smart.parent();
                if (parent == null) {
                    return null;
                }
                return getContextSmart(parent);
            };
            return function () {
                var smart;
                if ("_context_smart_" in this) {
                    smart = this._context_smart_;
                } else {
                    smart = getContextSmart(this);
                    this.setContextSmart(smart);
                }
                if (smart.isWindow()) {
                    return null;
                }
                return smart._context.apply(this, $.makeArray(arguments));
            };
        })(),
        //用于保存控件生命周期过程中产生的数据。dataTable的简称，
        dataTable: function (namespace, key, val) {

            var fullKey = this._getDataTableKey(namespace, key);
            if (val === undefined) {
                return this._dataTable[fullKey];
            }
            this._dataTable[fullKey] = val;
            return this;
        },
        removeDataTable: function (namespace, key) {
            delete this._dataTable[this._getDataTableKey(namespace, key)];
            return this;
        },
        _getDataTableKey: function (namespace, key) {
            if (Smart.isEmpty(namespace)) {
                Smart.error("dataTable必须有命名空间");
                this.alert("dataTable必须有命名空间");
                return;
            }
            if (Smart.isEmpty(key)) {
                Smart.error("dataTable必须有key");
                this.alert("dataTable必须有key");
                return;
            }
            return namespace + "-" + key;
        },
        clearDataTable: function () {
            this._dataTable = {};
            return this;
        }
    });

    //控件
    (function () {
        var WIDGET_API_MAP = {};
        var WIDGET_LISTENER_MAP = {};
        var WIDGET_DEF_ID_MAP = {};

        var DEFAULT_LISTENER = {
            onRun: Smart.noop,
            onPrepare: Smart.noop,//控件准备
            onBuild: Smart.noop,//构造，该方式异步方法
            onDestroy: Smart.noop
        }

        Smart.widgetExtend = function (def, listener, api) {
            if (TO_STRING.call(def) == "[object String]") {
                def = {id: def}
            }
            var id = def.id;
            WIDGET_DEF_ID_MAP[id] = def;
            api && (WIDGET_API_MAP[id] = api);
            listener && (WIDGET_LISTENER_MAP[id] = $.extend($.extend({}, DEFAULT_LISTENER), listener));
        };

        //扩展widget meta的defaultOptions
        Smart.widgetOptionsExtend = function (id, options) {
            var widgetDef = WIDGET_DEF_ID_MAP[id];
            if (widgetDef) {
                widgetDef.defaultOptions = $.extend(widgetDef.defaultOptions || {}, options);
            }
        };

        //根据id获取widget定义
        Smart.getWidgetDef = function (id) {
            return WIDGET_DEF_ID_MAP[id];
        };

        //最基本的控件。
        Smart.widgetExtend({
            id: "smart",
            options: "key, data, null"
        }, {
            onRun: function () {
                var that = this;
                that.options.smart.data && that.data(that.options.smart.data);
                that._preDataArgs && that.data.apply(that, that._preDataArgs);
            }
        }, {
            dataGetter: Smart.noop,
            dataSetter: function (data) {
                var dataType = $.type(data);
                if (dataType == "boolean" || dataType == "number" || dataType == "string") {
                    //如果没有子元素
                    if (this.node.is("input[type='text'],select,textarea,input[type='password'],input[type='email'],input[type='number']")) {
                        this.node.val(data);
                        return;
                    }
                    if (this.node.is("input[type='radio']")) {
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
                        }
                    }
                }
            },
            data: function () {
                if (arguments.length == 0) {
                    return this.dataGetter ? this.dataGetter.apply(this, SLICE.call(arguments)) : undefined;
                }
//                if(this.lifeStage != LIFE_STAGE.made){
//                    this._preDataArgs = SLICE.call(arguments);
//                    return;
//                }
                var args = SLICE.call(arguments);
                var dataKey = this.options.smart['key'];
                var value = args;
                if (dataKey) {
                    var data = args[0];
                    value = [data == undefined ? null : data[dataKey]];
                }
                value == null ? value = this.options.smart['null'] : value;
                this.dataSetter.apply(this, value);
            }
        });

        Smart.extend(Smart.prototype, {
            build: Smart.noop
        });

        var processOptions = function (smart, def) {
            if (def.options && def.options.length) {
                //组装 widget定义时的options属性，根据options属性从node上读取属性值
                var options = def.options;
                var optionsNames;
                var optionDefault = undefined;
                if (TO_STRING.call(options) === "[object Array]") {
                    optionsNames = $.trim(options[0]).split(",");
                    if (options.length > 1) {
                        optionDefault = options[1];
                    }
                } else {
                    optionsNames = $.trim(options).split(",");
                }
                var optionValues = {};
                for (var i in optionsNames) {
                    var key = $.trim(optionsNames[i]);
                    //如果key是以ctx:开头的，则说明key的值是根据该属性值从context中去取
                    var keyCtx = false;
                    if (/^ctx:.*$/.test(key)) {
                        key = key.substring(4);
                        keyCtx = true;
                    }
                    var valueCtx = false;
                    //根据option获取配置的属性，为 data-控件id-option
                    var attrKey = Smart.optionAttrName(def.id, key);
                    var value = smart.node.attr(attrKey);
                    if (/^ctx:.*$/.test(value)) {
                        value = value.substring(4);
                        valueCtx = true;
                    }
                    if (keyCtx || valueCtx) {
                        optionValues[key] = smart.context(value);
                    } else {
                        optionValues[key] = value;
                    }

                }
                if (optionDefault && TO_STRING.call(optionDefault) === '[object Object]') {
                    optionValues = $.extend(optionDefault, optionValues);
                }
                //mixin options与widget.defaultOptions
                var tmpOptions = {};
                if (def.defaultOptions) {
                    $.extend(tmpOptions, def.defaultOptions); //复制widget.defaultOptions
                }
                $.extend(tmpOptions, optionValues);
                smart.options[def.id] = tmpOptions;
            }
        };

        function processApis(smart, apis) {
            smart._inherited_api_map = {};

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
        }

        var makeSmart = function (smart) {

            var node = smart.node;
            var wIds = node.attr(SMART_ATTR_KEY);
            if (wIds == undefined) {
                return smart.makeChildren();
            }
            if (wIds == "") {
                wIds = "smart";
            }
            wIds = wIds.replace(/ /g, "");
            wIds = wIds.split(",");
            if (wIds[0] != "smart") {
                wIds.unshift("smart");
            }

            //控件监听器
            var widgetListeners = [];
            //控件API
            var widgetApis = [];
            //控件定义
            var widgetDefs = [];

            $.each(wIds, function (i, wId) {
                if (wId in WIDGET_API_MAP) {
                    widgetApis.push(WIDGET_API_MAP[wId]);
                }
                if (wId in WIDGET_DEF_ID_MAP) {
                    widgetDefs.push(WIDGET_DEF_ID_MAP[wId]);
                }
                if (wId in WIDGET_LISTENER_MAP) {
                    widgetListeners.push(WIDGET_LISTENER_MAP[wId]);
                }
            });

            //merge api
            processApis(smart, widgetApis);

            // 处理 控件option
            smart.options = {};
            $.each(widgetDefs, function (i, def) {
                processOptions(smart, def);
            });

            /**
             * 有些控件可能会自动设置某些控件的某个配置参数，所以提供这样的事件。
             * */
            smart.on("option", function (e, widgetId, key, value) {
                if ($.inArray(widgetId, wIds) == -1) {
                    return;
                }
                smart.options[widgetId][key] = value;
                e.stopPropagation();
            });

            //准备控件
            $.each(widgetListeners, function (i, listener) {
                if ("onPrepare" in listener) listener.onPrepare.call(smart);//每个api都需要prepare下。
            });

            smart.lifeStage = LIFE_STAGE.prepared;

            var deferreds = [];

            //构建控件，该过程是异步过程。
            $.each(widgetListeners, function (i, listener) {
                if ("onBuild" in listener) {
                    deferreds.push(function () {
                        return listener.onBuild.call(smart)
                    });
                }
            });

            //构建完成后，开始make子元素
            deferreds.push(function () {
                return smart.makeChildren();
            });

            //子元素made成功后，开始运行控件
            $.each(widgetListeners, function (i, listener) {
                if ("onRun" in listener) {
                    deferreds.push(function () {
                        return listener.onRun.call(smart)
                    });
                }
            });

            function resolve() {
                smart.lifeStage = LIFE_STAGE.made;
                smart.trigger("made");
            }

            return Smart.deferredQueue(deferreds).always(function () {
                resolve();
            });
        };
        Smart.prototype.makeChildren = function () {
            var children = this.children();
            if (children.size() == 0) {
                return $.Deferred().resolve();
            }
            var deferredFns = [];
            children.each(function () {
                var that = this;
                deferredFns.push(function () {
                    return that.make();
                });
            });

            return Smart.deferredQueue(deferredFns);
        };
        Smart.prototype.make = function () {
            try {
                if (this.lifeStage == LIFE_STAGE.made) {
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
                            return that.make();
                        });
                    });
                    return Smart.deferredQueue(dFns);
                }
                return makeSmart(Smart.of(this.node));
            } catch (e) {
                Smart.error("make Smart error: " + e);
            } finally {
                return $.Deferred().resolve();
            }
        }
    })();

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
        bind: function (type, data, fn) {
            this.node.bind(type, data, fn);
            return this;
        },
        trigger: function (type, data) {
            this.node.trigger(type, data);
            return this;
        },
        unbind: function (type, data) {
            this.node.unbind(type, data);
            return this;
        }
    });

    //生命周期事件接口,这些事件都不是冒泡事件
    (function () {
        Smart.extend(Smart.prototype, {
            onMade: function (fn) {
                var that = this;
                if (this.lifeStage == LIFE_STAGE.made) {
                    fn.call(that);
                }
                this.on("made", function () {
                    fn.apply(that, SLICE.call(arguments));
                });
                return this;
            }
        })
    })();

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
                if (TO_STRING.call(type) == "[object Object]") {
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
                    this.trigger("ajaxStart", [cfg.startTip]);
                }
                var _this = this;
                //处理url
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
                $.ajax(ajaxOptions).done(function (result) {
                    deferred.resolve.apply(deferred, SLICE.call(arguments));
                    if (!cfg.silent) {
                        _this.trigger("ajaxSuccess", [cfg.successTip]);
                    }
                }).fail(function (xhr) {
                    deferred.reject.apply(deferred, SLICE.call(arguments));
                    if (!cfg.silent) {
                        _this.trigger("ajaxError", [cfg.errorTip, ajaxCfg.getErrorMsg(xhr, url)]);
                    }
                }).always(function () {
                    deferred.always.apply(deferred, SLICE.call(arguments));
                    if (!cfg.silent) {
                        _this.trigger("ajaxComplete");
                    }
                });
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
                    loadFile(files.shift(), baseUrl).done(function () {
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
})(jQuery);