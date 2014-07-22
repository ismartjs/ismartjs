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
    var STOP_PROPAGATION_EVENT = ["smart-made", "load", "loading",
        "close", "smart-refresh", "smart-data", "smart-reset"];

    var NODE_ATTR_PREFIX = "s";

    var Smart = window.Smart = function (node) {
        this.node = node || $();
        this.node.data(SMART_NODE_CACHE_KEY, this);
        this.widgets = [];
        this.widget = {};
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

    //ui-utils
    Smart.extend({
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
        }
    });
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
            return node && node.attr(SMART_ATTR_KEY) !== undefined;
        },
        isDeferred: function (obj) {
            return obj && "done" in obj && $.isFunction(obj.done);
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
        deferredListen:function(defer, listenDefer){
            listenDefer.done(function(){
                defer.resolve.apply(defer, $.makeArray(arguments));
            }).fail(function(){
                defer.reject.apply(defer, $.makeArray(arguments));
            })
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
                    return;
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
                if(path[0] == "/") return path;
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
        closest: function(wId){
            function check(smart){
                if(smart.isWindow()) return null;
                if(smart.isWidget(wId)) return smart;
                return check(smart.parent());
            }
            return check(this);
        },
        isWidget: function(wId){
            var s = this.node.attr(SMART_ATTR_KEY);
            if(!s) return false;
            var wIds = s.split(",");
            for(var i = 0; i < wIds.length; i++){
                if($.trim(wIds[i]) == wId) return true;
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
        _setContextSmart: function (smart) {
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
                if (parent.isWindow()) {
                    return parent;
                }
                return getContextSmart(parent);
            };
            return function () {
                var smart;
                if ("_context_smart_" in this) {
                    smart = this._context_smart_;
                } else {
                    smart = getContextSmart(this);
                    this._setContextSmart(smart);
                }
                if (smart.isWindow()) {
                    return null;
                }
                return smart._context.apply(this, $.makeArray(arguments));
            };
        })(),
    });

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

    //控件
    (function () {

        function SmartWidget(smart, meta) {
            this.options = {};
            this.S = smart;
            this.meta = meta;
            this.cache = {};//缓存的数据
        }

        SmartWidget.prototype = {
            onPrepare: Smart.noop,//控件准备
            onDestroy: Smart.noop,//刷新控件
            onRender: Smart.noop,
            onReady: Smart.noop,
            onReset: Smart.noop,//重置控件
            onRefresh: Smart.noop
        };

        Smart.extend(SmartWidget.prototype, {
            optionName: function (key) {
                return Smart.optionAttrName(this.meta.id, key);
            },
            optionValue: function (node, key) {
                return node.attr(this.optionName(key));
            },
            processOptions: function () {
                if (this.meta.options && this.meta.options.length) {
                    //组装 widget定义时的options属性，根据options属性从node上读取属性值
                    var options = this.meta.options;
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
                        var value = this.optionValue(this.S.node, key);
                        if (/^ctx:.*$/.test(value)) {
                            value = value.substring(4);
                            valueCtx = true;
                        }
                        if (keyCtx || valueCtx) {
                            //这里的context不能从自身去查找，要从自身的parent去查找，因为自身所处的环境就是在parent中的
                            optionValues[key] = this.S.parent().context(value);
                        } else {
                            optionValues[key] = value;
                        }

                    }
                    if (optionDefault && TO_STRING.call(optionDefault) === '[object Object]') {
                        optionValues = $.extend(optionDefault, optionValues);
                    }
                    //mixin options与widget.defaultOptions
                    var tmpOptions = {};
                    if (this.meta.defaultOptions) {
                        $.extend(tmpOptions, this.meta.defaultOptions); //复制widget.defaultOptions
                    }
                    $.extend(tmpOptions, optionValues);
                    this.options = tmpOptions;
                }
            }
        });

        var SMART_WIDGET_MAPPING = {};

        Smart.widgetExtend = function (meta, Widget, api) {
            if (TO_STRING.call(meta) == "[object String]") {
                meta = {id: meta}
            }

            var _Widget = Smart.Class(SmartWidget, Widget);
            _Widget.meta = meta;
            _Widget.api = api;
            SMART_WIDGET_MAPPING[meta.id] = _Widget;
        };

        //扩展widget meta的defaultOptions
        Smart.widgetOptionsExtend = function (id, options) {
            var Widget = SMART_WIDGET_MAPPING[id];
            if (Widget) {
                Widget.meta.defaultOptions = $.extend(Widget.meta.defaultOptions || {}, options);
            }
        };

        //最基本的控件。
        Smart.widgetExtend({
            id: "smart",
            options: "key, data, null"
        }, {
            onRender: function () {
                if(this.options.data != undefined){
                    this.S.data(this.options.data)
                }
            }
        }, {
            //控件的获取dataGetter的方法，只有主要控件才需要实现该方法。
            dataGetter: function () {
                if ("_smart_data_" in this) return this._smart_data_;
                return this.widget.smart.options.data;
            },
            dataSetter: function (data) {
                var dataType = $.type(data);
                if (dataType == "boolean" || dataType == "number" || dataType == "string") {
                    //如果没有子元素
                    if (this.node.is("input[type='text'],input[type='hidden'],select,textarea," +
                        "input[type='password'],input[type='email'],input[type='number']")) {
                        this.node.val(data);
                        return;
                    } else if (this.node.is("input[type='radio']")) {
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
                        }else{
                            return false;
                        }
                    }
                    return false;
                }
            },
            data: function () {
                if (arguments.length == 0) {
                    return this.dataGetter ? this.dataGetter.apply(this, SLICE.call(arguments)) : undefined;
                }
                if(!this.isMade()){
                    var that = this;
                    var args = arguments;
                    this.onMade(function(){
                        that.data.apply(that, $.makeArray(args));
                    });
                    return;
                }
                this._smart_data_ = arguments.length == 1 && arguments[0];
                var args = SLICE.call(arguments);
                var dataKey = this.widget.smart.options['key'];
                var value = args;
                if (dataKey) {
                    var data = args[0];
                    var fn_flag = /^.+\(.*\).*$/.test(dataKey) ? true : false;
                    value = [data == undefined ? null : fn_flag ? eval("data." + dataKey) : data[dataKey]];
                }
                value = (value == null ? [this.widget.smart.options['null']] : value);
                if(this.dataSetter.apply(this, value) !== false){
                    this.trigger("smart-data");
                }
            },
            /**
             * build的时候，需要初始化赋值。
             * */
            build: function(){
                this.buildSetter.apply(this, $.makeArray(arguments));
                this.trigger("smart-change");
            },
            buildSetter: Smart.noop,
            refresh: function () {
                var deferreds = []
                var args = $.makeArray(arguments);
                $.each(this.widgets, function (i, widget) {
                    deferreds.push(function(){
                        return widget.onRefresh.apply(widget, args);
                    })
                });
                var that = this;
                return Smart.deferredQueue(deferreds).done(function(){
                    that.trigger("smart-refresh", args);
                });
            },
            destroy: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onDestroy();
                });
            },
            //重置控件
            reset: function () {
                $.each(this.widgets, function (i, widget) {
                    widget.onReset();
                });
                this.trigger("smart-reset");
            }
        });

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

            var deferred = $.Deferred();

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

            var widgetApis = [];

            $.each(wIds, function (i, wId) {
                var Widget = SMART_WIDGET_MAPPING[wId];
                if (!Widget) return;
                widgetApis.push(Widget.api);
                smart._addWidget(new Widget(smart, Widget.meta))
            });

            //merge api
            processApis(smart, widgetApis);

            var deferreds = [];

            $.each(smart.widgets, function (i, widget) {
                deferreds.push(function () {
                    widget.processOptions();
                    widget.onPrepare();
                    return widget.onRender();
                })
            });

            //构建完成后，开始make子元素
            deferreds.push(function () {
                return smart.makeChildren();
            });

            //子元素made成功后，开始运行控件
            $.each(smart.widgets, function (i, widget) {
                deferreds.push(function () {
                    return widget.onReady();
                });
            });

            Smart.deferredQueue(deferreds).always(function () {
                smart.lifeStage = LIFE_STAGE.made;
                smart.trigger("smart-made");
                deferred.resolve();
            });

            return deferred.promise();
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
        Smart.prototype._addWidget = function (widget) {
            this.widgets.push(widget);
            this.widget[widget.meta.id] = widget;
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
                throw e;
//                Smart.error("make Smart error: " + e);
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
        trigger: function (type, data) {
            this.node.trigger(type, data);
            return this;
        }
    });

    //生命周期事件接口,这些事件都不是冒泡事件
    (function () {
        Smart.extend(Smart.prototype, {
            isMade: function(){
                return this.lifeStage == LIFE_STAGE.made
            },
            onMade: function (fn) {
                var that = this;
                if (this.lifeStage == LIFE_STAGE.made) {
                    fn.call(that);
                }
                this.on("smart-made", function () {
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
                    this.trigger("smart-ajaxStart", [cfg.startTip]);
                }
                var _this = this;
                //处理url
                var thisData = this.data();
                url = url.replace(URL_PLACEHOLDER_REGEX, function ($1, $2) {
                    return (thisData && $2 in thisData) ? thisData[$2] : _this.context($2);
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
                        _this.trigger("smart-ajaxSuccess", [cfg.successTip]);
                    }
                }).fail(function (xhr) {
                    deferred.reject.apply(deferred, SLICE.call(arguments));
                    if (!cfg.silent) {
                        _this.trigger("smart-ajaxError", [cfg.errorTip, ajaxCfg.getErrorMsg(xhr, url)]);
                    }
                }).always(function () {
                    deferred.always.apply(deferred, SLICE.call(arguments));
                    if (!cfg.silent) {
                        _this.trigger("smart-ajaxComplete");
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
                    var file = files.shift();
                    if(file.indexOf('?') != -1){
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
})(jQuery);