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
                lineStr = lineStr.replace(/\slt\s/gi,"<").replace(/\sgt\s/gi, ">");
                lineStr = lineStr.replace(/\slte\s/gi,"<=").replace(/\sgte\s/gi, ">=");
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
        newFn: function (args, script, namespace) {
            if(namespace){

                    return eval("(function(){" +
                        "   return function(){with(){"+script+"}}" +
                        "})()")
            }
            return new Function(args, script)
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
        deferredListen: function (defer, listenDefer) {
            listenDefer.done(function () {
                defer.resolve.apply(defer, $.makeArray(arguments));
            }).fail(function () {
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
        closest: function (wId) {
            function check(smart) {
                if (smart.isWindow()) return null;
                if (smart.isWidget(wId)) return smart;
                return check(smart.parent());
            }

            return check(this);
        },
        isWidget: function (wId) {
            var s = this.node.attr(SMART_ATTR_KEY);
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
            return function (key, that) {
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
                return smart._context.call(that || this, key);
            };
        })(),
        _action:  function (script) {
            var script_body = [];
            script_body.push("(function(){");
            script_body.push("      return function(){");
            script_body.push("          " + script);
            script_body.push("      }")
            script_body.push("})()");
            return this.context(script_body.join("\n"));
        },
        action: (function () {
            var getActionSmart = function (smart) {
                if (smart._action) {
                    return smart;
                }
                var parent = smart.parent();
                if (parent == null || parent.isWindow()) {
                    return null;
                }
                return getActionSmart(parent);
            };
            return function (script) {
                var actionSmart = getActionSmart(this);
                var script_body = [];
                script_body.push(script);
                if (actionSmart == null) {
                    var window_body = [];
                    window_body.push("(function(){");
                    window_body.push("      return function(){");
                    window_body.push("          "+script_body.join("\n"));
                    window_body.push("      }")
                    window_body.push("})()");
                    return eval(window_body);
                } else {
                    return actionSmart._action(script_body.join("\n"));
                }
            }
        })()
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
                            optionValues[key] = this.S.parent().context(value, this.S);
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
                if (this.options.data != undefined) {
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
                        } else {
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
                if (!this.isMade()) {
                    var that = this;
                    var args = arguments;
                    this.onMade(function () {
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
                if (this.dataSetter.apply(this, value) !== false) {
                    this.trigger("smart-data");
                }
            },
            /**
             * build的时候，需要初始化赋值。
             * */
            build: function () {
                this.buildSetter.apply(this, $.makeArray(arguments));
                this.trigger("smart-change");
            },
            buildSetter: Smart.noop,
            refresh: function () {
                var deferreds = []
                var args = $.makeArray(arguments);
                $.each(this.widgets, function (i, widget) {
                    deferreds.push(function () {
                        return widget.onRefresh.apply(widget, args);
                    })
                });
                var that = this;
                return Smart.deferredQueue(deferreds).done(function () {
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
            isMade: function () {
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
})(jQuery);;/**
 * Created by Administrator on 2014/7/11.
 */
(function () {
    Smart.widgetExtend({
        id: "cds",
        /**
         * s:check控件的smart对象，key:数据的key，c-msg:确认消息，e-msg:错误警告消息，r:是否刷新
         * dk: 将使用该值作为 选取的数据 的 key
         * */
        options: "ctx:cs,ck,dk,c-msg,e-msg,r",
        defaultOptions: {
            "c-msg": "确认进行此操作吗？",
            "e-msg": "请选择你要操作的数据？",
            r: "true",
            ck: "id"//获取选择数据的key
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.on("submit-done", function(e){
                if(that.options['r'] == "true"){
                    that.options['cs'].refresh();
                }
            });
        }
    }, {
        getSubmitData: function (deferred) {
            if (this.widget.cds.options.dk) {
                var data = this.widget.cds.options.cs.getCheckedData(this.widget.cds.options.ck);
                if (Smart.isEmpty(data)) {
                    if (this.widget.cds.options['e-msg']) {
                        this.alert(this.widget.cds.options['e-msg']);
                    }
                    return deferred.reject();
                }
                var that = this;
                function resolve() {
                    var obj = {};
                    obj[that.widget.cds.options.dk] = data;
                    deferred.resolve(obj);
                }
                if(this.widget.cds.options['c-msg']){
                    this.confirm(this.widget.cds.options['c-msg'], {sign:"warning"}).done(function(){
                        resolve();
                    }).fail(function(){
                        deferred.reject();
                    });
                }

            } else {
                this.alert("没有配置dk参数");
                deferred.reject();
            }
        }
    });
})();;/**
 * Created by Administrator on 2014/6/27.
 */
(function ($) {

    var CHECK_ITEM_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='i']";
    var CHECK_ITEM_HANDLER_SELECTOR = "*[" + Smart.optionAttrName('check', 'role') + "='h']";
    var CHECK_PATH_ATTR = Smart.optionAttrName('check', 'path');
    //选中控件
    Smart.widgetExtend({
        id: "check",
        options: "i-checked-class, turn, multiple, ctx:checkall-h, h-checked-class, path",
        defaultOptions: {
            "turn": "on",
            "i-checked-class": "warning",
            multiple: true,
            "h-checked-class": "s-ui-checked",
            "path": "false"
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.S.node.delegate(CHECK_ITEM_SELECTOR, "click", function (e) {
                if (that.options.turn != "on") {
                    return;
                }
                that.S._toggleCheck($(this), e);
            });

            var checkallHandles = [];
            this.cache.checkallHandles = checkallHandles;
            var innerCheckallHandle = $("*[s-check-role='checkall-h']", this.S.node);

            if (innerCheckallHandle.size() > 0) {
                checkallHandles.push(innerCheckallHandle);
                this.S.node.delegate("*[s-check-role='checkall-h']", "click", function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }
            if (this.options['checkall-h']) {
                checkallHandles.push(this.options['checkall-h']);
                this.options['checkall-h'].click(function (e) {
                    that.S._toggleCheckAll($(this));
                    e.stopPropagation();
                });
            }

            this.S.node.delegate(CHECK_ITEM_SELECTOR, "unchecked", function (e) {
                innerCheckallHandle.size() && that.S._uncheckHandle(innerCheckallHandle);
                that.options['checkall-h'] && that.S._uncheckHandle(that.options['checkall-h']);
                that.options['checkall-h'] && that.options['checkall-h'].prop("checked", false);
                e.stopPropagation();
            });
        },
        onRefresh: function () {
            this.S.uncheckAll()
        },
        onReset: function () {
            this.S.uncheckAll()
        }
    }, {
        turn: function (type) {
            this.widget.check.options.turn = type;
            if (type != "on") {
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", true);
            } else {
                $(CHECK_ITEM_HANDLER_SELECTOR, this.node).prop("disabled", false);
            }
        },
        _toggleCheckAll: function (node) {
            var flag;
            if (node.hasClass(this.widget.check.options['h-checked-class'])) {
                flag = false;
                node.removeClass(this.widget.check.options['h-checked-class']);
            } else {
                flag = true;
                node.addClass(this.widget.check.options['h-checked-class']);
            }
            flag ? this.checkAll() : this.uncheckAll();
        },
        checkAll: function () {
            this._checkHandlesByFlag(true);
            var that = this;
            $(CHECK_ITEM_SELECTOR, this.node).each(function () {
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
            var checkallHandles = this.widget.check.cache.checkallHandles;
            var that = this;
            $.each(checkallHandles, function () {
                flag ? that._checkHandle($(this)) : that._uncheckHandle($(this));
            });
        },
        _checkHandle: function (node) {
            node.addClass(this.widget.check.options['h-checked-class']);
            if (node.is(":checkbox")) {
                node.prop("checked", true);
            }
        },
        _uncheckHandle: function (node) {
            node.removeClass(this.widget.check.options['h-checked-class']);
            if (node.is(":checkbox")) {
                node.prop("checked", false);
            }
        },
        getChecked: function () {
            var smarts = [];
            $.each($(CHECK_ITEM_SELECTOR + "." + this.widget.check.options['i-checked-class'], this.node), function () {
                smarts.push(Smart.of($(this)));
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
            var checkedClass = this.widget.check.options['i-checked-class'];
            if (node.hasClass(checkedClass)) {
                this._uncheck(node);
            } else {
                this._check(node);
            }
        },
        _check: function (node) {
            if (node.hasClass(this.widget.check.options['i-checked-class'])) {
                return;
            }
            //如果是单选，则需要把其他的item取消选中
            var that = this;
            if (this.widget.check.options.multiple == false) {
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
            if (!node.hasClass(this.widget.check.options['i-checked-class'])) {
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
            if (node.hasClass(this.widget.check.options['i-checked-class'])) {
                return;
            }
            node.addClass(this.widget.check.options['i-checked-class']).trigger("checked");

            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.addClass(this.widget.check.options['h-checked-class']);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (!handler.prop("checked")) handler.prop("checked", true);
                }, 1);
            }
        },
        _uncheckNode: function (node) {
            if (!node.hasClass(this.widget.check.options['i-checked-class'])) {
                return;
            }
            node.removeClass(this.widget.check.options['i-checked-class']).trigger("unchecked");
            var handler = $(CHECK_ITEM_HANDLER_SELECTOR, node);
            if (handler.size() == 0) return;
            handler.removeClass(this.widget.check.options['h-checked-class']);
            if (handler.is(":checkbox")) {
                setTimeout(function () {
                    if (handler.prop("checked")) handler.prop("checked", false);
                }, 1);
            }
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/7/11.
 */
(function(){
    /**
     * grid数据删除控件
     * */
    Smart.widgetExtend({
        id: "dataSubmit",
        options: "ctx:data,url,type,listener",
        defaultOptions: {
            "type": "post"
        }
    },{
        onPrepare: function(){
            var that = this;
            Smart.clickDeferred(this.S.node, $.proxy(this.S.submit, this.S));
            this.S.on("submit-done", function(e){
                e.stopPropagation();
                that.options.listener && that.options.listener.done
                && that.options.listener.done.apply(null, Smart.SLICE.call(arguments, 1));
            });
            this.S.on("submit-fail", function(e){
                e.stopPropagation();
                that.options.listener && that.options.listener.fail
                && that.options.listener.fail.apply(null, Smart.SLICE.call(arguments, 1));
            });
        }
    },{
        getSubmitData: function(deferred){
            var data = this.widget.dataSubmit.options['data'];
            if(!$.isFunction(data)){
                deferred.resolve(data);
            } else {
                deferred.resolve(data());
            }
        },
        submit: function(){
            var that = this;
            var deferred = $.Deferred();
            this.getSubmitData(deferred);
            var submitDeferred = $.Deferred();
            deferred.done(function(data){
                that[that.widget.dataSubmit.options.type](that.widget.dataSubmit.options.url, data).done(function(){
                    that.trigger.apply(that, ["submit-done"].concat($.makeArray(arguments)))
                    submitDeferred.resolve();
                }).fail(function(){
                    that.trigger.apply(that, ["submit-fail"].concat($.makeArray(arguments)))
                    submitDeferred.reject();
                });
            }).fail(function(){
                submitDeferred.reject();
            });
            return submitDeferred;
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
            this.children().each(function(){
                var ig = this.node.attr(igAttr);
                if(ig == "true" || ig == ""){
                    return;
                }
                this.data.apply(this, args);
            });
        }
    });
})();;/**
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
                var val = node.val();
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
 * Created by Administrator on 2014/6/19.
 */
(function(){
    var bindEvent = function(smart, event, action){
        if(Smart.isEmpty(event) || Smart.isEmpty(action)){
            return;
        }
        action = smart.action("var e = arguments[1];\n" + action);
        smart.node[event](function (e) {
            var result = action.call(smart, e);
            if(result == null) return;
            if(Smart.isDeferred(result)){//说明这个是deferred对象
                var target = $(e.target);
                Smart.disableNode(target);
                result.always(function(){
                    Smart.disableNode(target, false);
                });
            }
            return result;
        });
    };
    Smart.widgetExtend({id:"event",options:"type,action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            var event = this.options["type"];
            bindEvent(this.S, event, action);
        }
    });
    Smart.widgetExtend({id:"click",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "click", action);
        }
    });
    Smart.widgetExtend({id:"change",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "change", action);
        }
    });
    Smart.widgetExtend({id:"focus",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "focus", action);
        }
    });
    Smart.widgetExtend({id:"blur",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "blur", action);
        }
    });
    Smart.widgetExtend({id:"dblclick",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "dblclick", action);
        }
    });
    Smart.widgetExtend({id:"mouseover",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mouseover", action);
        }
    });
    Smart.widgetExtend({id:"mousemove",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mousemove", action);
        }
    });
    Smart.widgetExtend({id:"mouseout",options:"action"}, {
        onPrepare: function(){
            var action = this.options['action'];
            bindEvent(this.S, "mouseout", action);
        }
    });

    //停止冒泡
    Smart.widgetExtend({
        id : "stopPropagation",
        options: "events",
        defaultOptions: {
            events: "click"
        }
    },{
        onPrepare: function(){
            this.S.node.on(this.options.events, function(e){
                e.stopPropagation();
            });
        }
    })
})();;/**
 * Created by Administrator on 2014/7/3.
 */
(function(){
    var checkPathAttr = Smart.optionAttrName("check",'path');
    Smart.widgetExtend({
        id: "loopCheckCombine"
    },{
        onPrepare: function(){

            this.S.on("row-add", function(e, row, data, indentNum){
                var path = [""];
                for(var i = 0; i <= indentNum; i++){
                    path.push(i);
                }
                row.attr(checkPathAttr, path.join("/"));
            });
        }
    });
})();;/**
 * Created by Administrator on 2014/6/26.
 */
(function($){

    var roleAttr = Smart.optionAttrName("loop", "role");

    function getRoleNode(val, node){
        return $("*["+roleAttr+"='"+val+"']", node);
    }

    //loop控件，可以用该控件来构建列表，grid。
    Smart.widgetExtend({
        id: "loop",
        options: "type,tree-c,tree-indent-width,tree-indent-str",
        defaultOptions: {
            'tree-c': "children",
            indent: 20
        }
    }, {
        onPrepare: function(){
            var emptyRow = getRoleNode("empty", this.S.node);
            var loopRow = getRoleNode("row", this.S.node);
            this.S.node.empty();
            this.cache.emptyRow = emptyRow;
            this.cache.loopRow = loopRow;
        }
    },{
        empty: function(){
            this.node.empty();
        },
        addRow: function(data, indentNum, mode){
            var row = this._getRow();
            if(indentNum){
                var indentNode = row.find('*[s-loop-tree-role="indent"]');
                if(this.widget.loop.options['tree-indent-str']){
                    var str = this.widget.loop.options['tree-indent-str'];
                    for(var i = 1; i < indentNum; i++){
                        str += str;
                    }
                    indentNode.prepend(str);
                } else if(indentNode.size() >= 0){
                    indentNode.css("text-indent", this.widget.loop.options.indent * indentNum + "px");
                }

            }
            var rowSmart = Smart.of(row);
            rowSmart.on("smart-made", function(){
                rowSmart.data(data);
            });
            var that = this
            setTimeout(function(){
                that[(mode || "append")+"Node"](row);
                that.trigger("row-add", [row, data, indentNum, mode]);
            },0)
        },
        addRows: function(datas, indentNum, mode){
            indentNum = indentNum == undefined ? 0 : indentNum;
            for(var i = 0; i < datas.length; i++){
                this.addRow(datas[i], indentNum, mode);
                //如果是tree的方式
                if(this.widget.loop.options.type == "tree"){
                    var children = datas[i][this.widget.loop.options['tree-c']];
                    if(children && children.length){
                        this.addRows(children, indentNum + 1, mode);
                    }
                }
            }
        },
        _getRow: function(){
            var row = this.widget.loop.cache.loopRow.clone();
            return row;
        },
        _addEmptyRow: function(){
            var emptyRow = this.widget.loop.cache.emptyRow;
            if(emptyRow){
                this.node.append(emptyRow.clone());
            }
        },
        setRows: function(datas){
            this.empty();
            if(datas.length == 0){
                this._addEmptyRow();
                return;
            }
            this.reset();
            this.addRows(datas);
        },
        dataSetter: function(data){
            if(!$.isArray(data)){
                Smart.error("loop控件接受的赋值参数必须是数组");
            }
            this.setRows(data);
        }
    });
    Smart.widgetExtend({
        id: "row",
        options: "ctx:render"
    }, null, {
        dataSetter: function(data){
            this.widget.row.cache.data = data;
            this.inherited([data]);
            this.widget.row.options.render && this.widget.row.options.render.call(this, this.node);
        },
        dataGetter: function(){
            return this.widget.row.cache.data;
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
                if(!Smart.isWidgetNode(nameNode)){
                    //如果不是控件
                    //则把它声明成为一个基本控件
                    nameNode.attr(Smart.defineKey, "");
                }
                var attrName = Smart.optionAttrName("smart", "key");
                if(Smart.isEmpty(nameNode.attr(attrName))){
                    nameNode.attr(attrName, nameNode.attr("name"));
                }
            });
        }
    });
})();;/**
 * Created by Administrator on 2014/6/21.
 */
(function () {

    Smart.widgetExtend({
        id: "resource",
        options: "src,ctx:form,ctx:adapter,ctx:cascade,cascade-key,switch,cascade-data,ignore,fn",
        defaultOptions: {
            'switch': "on",
            'fn': "data"
        }
    }, {
        onPrepare: function () {
            var that = this;
            that.cache.params = {}
        },
        onRender: function () {
            if (this.options.switch == "off") return $.Deferred().resolve();
            if (this.options['cascade']) {
                var that = this;
                this.options['cascade'].on('smart-change change', function () {
                    that._cascadeLoad();
                });
                if ('cascade-data' in this.options) {
                    //如果cascade-data存在，则进行初始化调用
                    return this._cascadeLoad(this.options['cascade-data']);
                }
                return $.Deferred().resolve();
            }
            return this._commonLoad();
        },
        onRefresh: function (params, flag) {
            if(flag){
                $.extend(this.cache.params, params|| {})
            } else {
                this.cache.params = params || {}
            }
            return this._load(this.cache.currentSrc || this.options.src);
        },
        _cascadeLoad: function (cascadeData) {
            var cascade = this.options.cascade;
            var val = cascadeData != undefined ? cascadeData : cascade.val()
            if (val == this.options.ignore) {
                this.S[this.options.fn]();
                return $.Deferred().resolve();
            }
            var src = this.options['src'].replace("{val}", val);
            if (this.options['cascade-key']) {
                var params = {};
                params[this.options['cascade-key']] = val;
            }
            return this._load(src, params);
        },
        _commonLoad: function () {
            return this._load(this.options['src'], {});
        },
        _load: function (src, params) {
            this.cache.currentSrc = src;
            var deferred = $.Deferred();
            if (src == undefined) {
                return deferred.resolve();
            }
            var type = "json";
            if (/^.+:.+$/.test(src)) {
                var idx = src.indexOf(":");
                type = src.substring(0, idx);
                src = src.substring(idx + 1);
            }
            var that = this;
            var form = this.options["form"];
            var adapter = this.options["adapter"];
            params = params || {};
            if (form) {
                var formParam = Smart.serializeToObject(form);
                $.extend(formParam, params);
                params = formParam;
            }
            $.extend(params, this.cache.params);
            this.S.get(src, params, type).done(function (rs) {
                if ($.isFunction(adapter)) {
                    rs = adapter(rs);
                }
                that.S[that.options.fn](rs)
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
            return deferred.promise();
        }
    }, {

    });
})();;/**
 * Created by Administrator on 2014/6/21.
 */
//模板控件。
(function(){
    var token = 0;
    var TABLE_FN_KEY = "_TPL_FN_";
    Smart.widgetExtend("tpl", {
        onPrepare: function(){
            var tplText = this.S.node.html();
            this.S.node.empty();
            //处理脚本定义中的 lt,gt lt 处理成 <, gt处理成 >。
            //tplText = tplText.replace(/\slt\s/gi,"<").replace(/\sgt\s/gi, ">");
            var compiledText = $.template.compile(tplText);
            var scripts = [];
            scripts.push("(function(){");
            scripts.push("      return function(){");
            scripts.push(compiledText);
            scripts.push("      }");
            scripts.push("})();//@ sourceURL=" + (token++) + "_template.js");
            var script = scripts.join("\n");
            var fn = eval(script);
            this.cache[TABLE_FN_KEY] = fn;
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

    var process = function (result, href, loadArgs) {
        var html = result.html;
        loadArgs = loadArgs || {};
        var scriptTexts = result.scriptTexts;
//        var applyArgs = Smart.SLICE.call(arguments, 2);
        var scripts = [];
        //处理模板
        var meta = result.meta;
        var argsScripts = [];
        var metaScripts = [];
        scripts.push("(function(){");
        scripts.push("    return function(){");
        if (meta.args) { //如果有参数定义，那么参数的值是
            var windowOpenArgsVar = "__WINDOW_OPEN_ARGS_VAR__";
            //传递进来的加载参数对象是第二个参数。
            $.each(meta.args, function (i, arg) {
                var argSeg = arg.split(":");
                var argStr = "var " + argSeg[0] + " = arguments[0]['" + argSeg[0] + "'];\n";
                metaScripts.push("var " + argSeg[0] + " = arguments[1]['" + argSeg[0] + "'];");
                if(argSeg.length == 2){
                    var tmpStr =  argSeg[0] + " = " +argSeg[0] + " !==undefined ? " + argSeg[0] + " : " + argSeg[1] + ";";
                    argStr += tmpStr + "\n";
                    metaScripts.push(tmpStr);
                }
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
        this.meta = meta;
        var metaScript = metaScripts.join("\n");
        metaScript += "\n  try{\n return eval(arguments[0]);\n}catch(e){\nreturn null}";
        var metaScript = new Function(metaScript);
        $.each(meta, function (key, val) {
            if (key == 'args') {
                return;
            }
            meta[key] = val.replace(META_VALUE_RE, function ($0, $1) {
                return metaScript.apply(this, [$1, loadArgs]);
            });
        });

        this.node.empty().append(this._WNODE);
        var scriptFn = eval(scripts.join("\n"));
        var context = scriptFn.call(this, loadArgs);
        this.setContext(context);

        var that = this;
        this.on("window.document.ready", function(e){e.stopPropagation()});
        this.makeChildren().done(function(){
            that.trigger("window.document.ready");
            //处理自动焦点的元素
            that.node.find("*[s-window-role='focus']:first").focus();
        });

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
        options: "href,args"
    }, {
        onPrepare: function () {
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
        onReady: function () {
            var deferred = $.Deferred();
            if (this.location.href) {
                this.S.load.apply(this.S, [this.location.href].concat(this.location.args || [])).always(function () {
                    deferred.resolve()
                });
                return deferred.promise();
            } else {
                return deferred.resolve();
            }
        },
        onRefresh: function(){
            this._clean();
            this.S.node.html("正在刷新");
            this.onReady();
        },
        _clean: function(){
            this.cache[ON_BEFORE_CLOSE_FN_KEY] = [];
            this.S._offEvent();
            this.S.node.empty();
        },
        onDestroy: function(){
            this.onReset()
        },
        onReset: function(){
            this._clean();
            this.S.node.empty();
        }
    }, {
        _offEvent: function(){
            var that = this;
            $.each(this.widget.window.cache[EVENT_ON_CACHE], function (i, paramAry) {
                that.off.apply(that, paramAry);
            });
            this.widget.window.cache[EVENT_ON_CACHE] = [];
        },
        load: function (href, loadArgs) {
            this.widget.window.cache["loadState"] = true;//是否已经加载
            this._offEvent();
            this.trigger("loading");
            var deferred = $.Deferred();
            var args = $.makeArray(arguments);
            this.widget.window.location.args = args;
            var that = this;
            this.widget.window.location.href = href;
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
            }).fail(function () {
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
            that.widget.window.cache = {};
            var deferred = $.Deferred();
            deferred.done(function () {
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
                        backdrop.hide();
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
        options: "ctx:target,ctx:filter"
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
                e.stopPropagation();
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
        bindTarget: function(node){
            var that = this;
            node.bind("contextmenu", function(e){
                that.show(e, $(this));
                return false;
            });
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
        options: "pagekey,pskey,totalkey,showsize,start-p,end-n,disabled-c,active-c,pre,next,action",
        defaultOptions: {
            'pagekey': "page",
            'pskey': "pageSize",
            'totalkey': "total",
            "showsize": 11,
            "start-p": "&laquo;",
            "end-n": "&raquo;",
            "pre": "‹",
            "next": "›",
            "disabled-c": "disabled",
            "active-c": "active"
        }
    }, {
        onPrepare: function(){
            if(this.options['action']){
                if(!$.isFunction(this.options['action'])){
                    var script = this.options['action'];
                    var action = this.S.action(script);
                    this.options['action'] = action;
                }
            }
        }

    }, {
        dataSetter: function (data) {
            var pi = paging(data[this.widget.pagination.options['pagekey']],
                data[this.widget.pagination.options['pskey']],
                data[this.widget.pagination.options['totalkey']],
                data[this.widget.pagination.options['showsize']]);
            this.node.empty();
            var startPreLi = this._createLi(this.widget.pagination.options['start-p']);
            if (pi.startPrePage <= 0) {
                startPreLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                startPreLi.click(function () {
                    that._triggerPage(pi.startPrePage);
                });
            }
            this.node.append(startPreLi);
            var preLi = this._createLi(this.widget.pagination.options.pre);
            if (pi.prePage <= 0) {
                preLi.addClass(this.widget.pagination.options['disabled-c']);
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
                        pageLi.addClass(that.widget.pagination.options['active-c']);
                    } else {
                        pageLi.click(function () {
                            that._triggerPage(i);
                        });
                    }
                    that.node.append(pageLi);
                })(i);
            }
            var nextLi = this._createLi(this.widget.pagination.options.next);
            if (pi.nextPage <= 0) {
                nextLi.addClass(this.widget.pagination.options['disabled-c']);
            } else {
                nextLi.click(function () {
                    that._triggerPage(pi.nextPage);
                });
            }
            this.node.append(nextLi);
            var endNextLi = this._createLi(this.widget.pagination.options['end-n']);
            if (pi.endNextPage <= pi.endPage) {
                endNextLi.addClass(this.widget.pagination.options['disabled-c']);
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
            var li = $("<li />");
            var a = $("<a href='javascript:;'>" + txt + "</a>");
            li.append(a);
            return li;
        }
    });
})(jQuery);
;/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    Smart.widgetExtend({
        id: "select",
        options: "form",
        defaultOptions: {
            form: "id:name,title"
        }
    }, {
        onPrepare: function () {
            var originalOptions = this.S.node.children();
            this.cache.originalOptions = originalOptions;
            this.options.form = this.options.form.split(":");
            this.options.form[1] = this.options.form[1].split(",");
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                Smart.error("构建select选项所需的数据必须是数组");
                return;
            }
            this.node.empty();
            this.node.append(this.widget.select.cache.originalOptions);
            for (var i in datas) {
                this.node.append(this._createOption(datas[i]));
            }
        },
        _createOption: function (data) {

            var value = data[this.widget.select.options.form[0]];
            var title = data[this.widget.select.options.form[1][0]];
            if (!title && this.widget.select.options.form[1].length == 2) {
                title = data[this.widget.select.options.form[1][1]];
            }
            var option = $('<option value="' + value + '">' + title + '</option>');
            return option;
        }
    });
})(jQuery);;/**
 * Created by Administrator on 2014/6/28.
 */
(function($){
    //表单提交插件，作用于submit按钮，可以实现表单回车提交
    Smart.widgetExtend({
        id:"submit",
        options: "ctx:action,ctx:done,ctx:fail,ctx:always,reset",
        defaultOptions:{reset:"false"}
    }, {
        onPrepare: function(){
            var that = this;
            this.cache.action = this.S.node.attr("action");
            this.cache.method = this.S.node.attr("method") || "post";
            this.cache.enctype = this.S.node.attr("enctype") || "application/x-www-form-urlencoded";
            var submtBtn = this.S.node.find(":submit")
            this.S.node[0].onsubmit = function(e){
                e.stopPropagation();
                try{
                    Smart.disableNode(submtBtn);
                    that.S.submit().always(function(){
                        Smart.disableNode(submtBtn, false);
                    });
                } catch(e){
                    Smart.error(e);
                }
                return false;
            };
        },
        onReset: function(){
            this.S.node[0].reset();
        }
    },{
        submit: function(){
            var deferred = $.Deferred();
            if(!('action' in this.widget.submit.options) && Smart.isEmpty(this.widget.submit.cache.action)) {
                return deferred.resolve();
            }
            var that = this;
            if(this.widget.submit.options.action){//如果定义了submit action，则直接执行该action
                var actionSubmit = function(){
                    var result = that.widget.submit.options.action.call(that);
                    if(Smart.isDeferred(result)){//说明是deferred对象
                        result.always(function(){
                            deferred.resolve();
                        });
                    } else {
                        deferred.resolve();
                    }
                };
                if("validate" in this){
                    this.validate().done(actionSubmit).fail(function(){
                        deferred.reject();
                    });
                } else {
                    actionSubmit();
                }

                return deferred;
            }
            var data;
            switch(this.widget.submit.cache.enctype){
                case "multipart/form-data" : data = Smart.formData(this.node); break;
                case "application/x-www-form-urlencoded" :
                    data = Smart.serializeToObject(this.node); break;
            }

            var submit = function(){
                that[that.widget.submit.cache.method](that.widget.submit.cache.action, data)
                    .done(function(rs){
                        that.widget.submit.options.done && that.widget.submit.options.done.call(that, rs);
                        if(that.widget.submit.options.reset == 'true'){
                            that.reset();
                        }
                        deferred.resolve(rs);
                }).fail(function(){
                        deferred.reject.apply(deferred, $.makeArray(arguments));
                    that.widget.submit.options.done && that.widget.submit.options.done.apply(that, $.makeArray(arguments));
                }).always(function(){
                    that.widget.submit.options.always && that.widget.submit.options.always.call(that);
                });
            };

            //证明该form是需要验证的
            if("validate" in this){
                this.validate().done(function(){
                    submit();
                }).fail(function(){
                    deferred.reject();
                });
            } else {
                submit();
            }
            return deferred;
        }
    });
})(jQuery);;(function ($) {

    var DEFAULT_MSG = {};

    var VALID_NODE_ERROR_ATTR = Smart.optionAttrName("valid", "error");
    var VALID_NODE_LABEL_ATTR = Smart.optionAttrName("valid", "label");
    var VALID_NODE_WARNING_ATTR = Smart.optionAttrName("valid", "warning");
    var VALID_NODE_SELECTOR = "*[" + VALID_NODE_ERROR_ATTR + "]:not('disabled'),*["+VALID_NODE_WARNING_ATTR+"]:not('disabled')";
    var VALID_NODE_ID_ATTR = Smart.optionAttrName("valid", 'id');
    var VALID_NODE_SHOW_ATTR = Smart.optionAttrName("valid",'show');
    var VALID_NODE_RESET_SHOW_ATTR = Smart.optionAttrName("valid",'resetShow');
    var VALID_NODE_BLUR_IG_ATTR = Smart.optionAttrName("valid", "blur-ig");

    var ITEM_ROLE_SELECTOR = "*["+Smart.optionAttrName("valid", "role")+"='item']";
    var MSG_ROLE_SELECTOR = "*["+Smart.optionAttrName("valid", "role")+"='msg']";

    var NODE_ORIGINAL_VALID_MSG_KEY = "s-valid-original-msg";

    var LEVELS = {
        success: {
            style: "s-class",
            key: "success"
        },
        warning: {
            style: "w-class",
            key: "warning"
        },
        error: {
            style: "e-class",
            key: "error"
        }
    };

    //验证控件
    Smart.widgetExtend({
        id: "valid",
        options: "ctx:msg,ctx:show,ctx:resetShow,s-class,e-class,w-class,blur,ctx:validators",
        defaultOptions: {
            msg: DEFAULT_MSG,
            blur: "true",
            's-class': "has-success",
            'e-class': "has-error",
            'w-class': "has-warning",
            'show': function(node, msg, level){
                level = level || LEVELS.error;
                var item = node.closest(ITEM_ROLE_SELECTOR);
                var msgNode = $(MSG_ROLE_SELECTOR,item);
                if(node.data(NODE_ORIGINAL_VALID_MSG_KEY) == undefined){
                    node.data(NODE_ORIGINAL_VALID_MSG_KEY, msgNode.html());
                }
                item.removeClass(this.widget.valid.options['s-class']+" "+this.widget.valid.options['e-class']+" "+this.widget.valid.options['w-class']);
                item.addClass(this.widget.valid.options[level.style]);
                var msgNode = $(MSG_ROLE_SELECTOR,item);
                if(msgNode.size() > 0){
                    $(MSG_ROLE_SELECTOR,item).html(msg || node.data(NODE_ORIGINAL_VALID_MSG_KEY) || "");
                } else {
                    if(level.style == "s-class"){
                        node.tooltip('destroy');
                        return;
                    }
                    node.tooltip({
                        container: node.parent(),
                        title: msg,
                        trigger:"focus",
                        delay: { "show": 200, "hide": 300 }
                    });
                    setTimeout(function(){
                        node.tooltip('show');
                    },1);
                    var tooltipHideTimeout = node.data("tooltip_hide_timeout");
                    if(tooltipHideTimeout){
                        clearTimeout(tooltipHideTimeout);
                        node.removeData("tooltip_hide_timeout")
                    }
                    node.on("shown.bs.tooltip", function(){
                        var hideTimeout = setTimeout(function(){
                            node.tooltip('destroy');
                        }, 3000);
                        node.data("tooltip_hide_timeout", hideTimeout);
                    });
                }
            },
            'resetShow': function(node){
                var item = node.closest(ITEM_ROLE_SELECTOR);
                node.tooltip('destroy');
                $(MSG_ROLE_SELECTOR,item).html(node.data(NODE_ORIGINAL_VALID_MSG_KEY) || "");
                item.removeClass(this.widget.valid.options['s-class']+" "+this.widget.valid.options['e-class']+" "+this.widget.valid.options['w-class']);
            }
        },
        addValidators: addValidators,//添加新的验证器
        setValidatorMsg: setValidatorMsg//修改验证器的msg提示

    }, {
        onPrepare: function () {
            if(this.options.blur === "true"){
                var that = this;
                this.S.node.delegate(VALID_NODE_SELECTOR, "blur", function(){
                    if($(this).attr(VALID_NODE_BLUR_IG_ATTR) == "true"){
                        return;
                    }
                    that.S.validateNode($(this));
                });
            }
            if(this.options.validators){
                var map = {};
                for(var i = 0; i < this.options.validators.length; i++){
                    var v = this.options.validators[i];
                    map[v.id] = v;
                }
                this.cache.validatorMap = map;
            }
            this.cache.validateItemMap = {};
            this.cache.validedNodes = [];
        },
        onReset: function(){
            var validedNodes = this.cache.validedNodes;
            var that = this;
            $.each(validedNodes, function(i, node){
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
            validNodes.each(function(){
                var node = $(this);
                deferreds.push(function(){
                    return that.validateNode(node);
                });
            });
            return Smart.deferredQueue(deferreds);
        },
        resetValidate: function(){
            var validNodes = this.node.find(VALID_NODE_SELECTOR);
            var that = this;
            validNodes.each(function(){
                var node = $(this);
                that.resetValidateNode(node);
            });
        },
        resetValidateNode: function(node){
            var resetShow = node.attr(VALID_NODE_RESET_SHOW_ATTR);
            if(resetShow){
                resetShow = this.context(resetShow);//resetShow是一个context闭包参数。
            }
            (resetShow || this.widget.valid.options.resetShow).call(this, node);
        },
        validateNode: function (node) {
            var id = node.attr(VALID_NODE_ID_ATTR);
            this.widget.valid.cache.validedNodes.push(node);
            var defMsg = this.widget.valid.options.msg[id] || {};
            var errorExp = node.attr(VALID_NODE_ERROR_ATTR);
            var label = node.attr(VALID_NODE_LABEL_ATTR);
            var deferreds = [];
            var that = this;
            var show = node.attr(VALID_NODE_SHOW_ATTR);
            if(show){
                show = this.context(show);//shown是一个context闭包参数。
            }
            var validateItem = {
                id: id,
                label: label ? label : "",
                node: node,
                value: node.val()
            };
            var validateItemMap = this.widget.valid.cache.validateItemMap;
            if(id != undefined){
                validateItemMap[id] = validateItem;
            }

            var msg = "";
            var level;

            if(errorExp){
                deferreds.push(function(){
                    var deferred = $.Deferred();
                    var errorDefMsg = defMsg['error'] || {};
                    executeExp(that, errorExp, errorDefMsg, validateItem, validateItemMap)
                        .done(function(result, _level){
                            msg = result;
                            level = _level || LEVELS.success;
                            deferred.resolve();
                        }).fail(function(result, _level){
                            level = _level || LEVELS.error;
                            (show || that.widget.valid.options.show).call(that, node,  result || defMsg[level.key+"Msg"] || "", level);
                            deferred.reject();
                        });
                    return deferred;
                });
            }

            var warningExp = node.attr(VALID_NODE_WARNING_ATTR);
            if(warningExp){
                deferreds.push(function(){
                    var deferred = $.Deferred();
                    var warningMsg = defMsg['warning'] || {};
                    executeExp(that, warningExp, warningMsg, validateItem, validateItemMap).always(function(result, level){
                        msg = result;
                        deferred.resolve();
                    }).done(function(result, _level){
                        //warning级别的验证通过
                        level = _level || LEVELS.success;
                    }).fail(function(result, _level){
                        //warning级别的验证不通过
                        level = _level || LEVELS.warning;
                    });

                    return deferred;
                });
            }
            deferreds.push(function(){
                (show || that.widget.valid.options.show).call(that, node, defMsg[level.key+"Msg"] || msg || "", level);
            });
            return Smart.deferredQueue(deferreds);
        }
    });

    /**
     * valid
     * */

    function Validation(smart, value, item ,itemMap) {
        this.varMap = {};
        this.item = item;
        this.value = value;
        this.smart = smart;
        this._interrupt = false;
        this._validateItemMap = itemMap;
    }

    Validation.prototype = {
        putVar: function (key, val) {
            this.varMap[key] = val;
        },
        getItemById: function(id){
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
        interrupt: function(){//中断验证
            this._interrupt = true;
        },
        interrupted: function(){//是否中断
            return this._interrupt;
        }
    }

    //require:true,len(6,12),eq(ctx:S.N('#aaaaa').val())

    function executeExp(smart, exp, nodeMsg, item, validateItemMap) {
        var validSegs = getValidSegs(exp);
        var deferred = $.Deferred();
        var validMsg = "";
        var msgLevel = LEVELS.error
        function processMsg(validation, msg) {
            if (msg == null) {
                return ""
            }
            if(msg.indexOf('success:') == 0){//说明验证成功
                msgLevel = LEVELS['success'];
                msg = msg.substring(8);
            } else if(msg.indexOf('error:') == 0){//说明验证失败
                msgLevel = LEVELS.error;
                msg = msg.substring(6);
            } else if(msg.indexOf('warning:') == 0){
                msgLevel = LEVELS.warning;
                msg = msg.substring(8);
            } else {
                msgLevel = msgLevel || LEVELS.error;
            }
            validMsg = validation.processMsg(msg);
        }

        var optionValidatorMap = smart.widget.valid.cache.validatorMap || {};

        var methodCount = {};

        function resolve(){
            return deferred.resolve(validMsg, msgLevel);
        }

        function reject(){
            return deferred.reject(validMsg, msgLevel);
        }

        function validate(i){
            if(i == validSegs.length){
                resolve();
                return;
            }
            var vs = validSegs[i];
            var s = /^(\w+)\((.*)\)$/g.exec(vs);
            var method = s[1];
            var validation = new Validation(smart, item.value, item ,validateItemMap);
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
                if(count == undefined){
                    count = 0;
                } else {
                    count++;
                }
                methodCount[method] = count;//method计数
                var methodCountMsg = nodeMsg[method+"#"+count] || {};
                var methodMsg = nodeMsg[method] || {};
                var msg = methodCountMsg.msg || methodMsg.msg || "";

                //默认的success code 是 1
                var successCode = methodCountMsg.successCode || methodMsg.successCode || "1";

                msg = $.extend($.extend({}, validator.msg), msg);

                function processSuccess(msgStr){
                    msgLevel = LEVELS.success;
                    processMsg(validation, msgStr || msg[successCode]);
                    //如果验证成功，并且不继续往下验证，则中断验证。
                    if(validation.interrupted()){
                        resolve();
                        return;
                    }
                    validate(i+1);
                }

                if (rs == successCode) {
                    processSuccess();
                    return;
                } else if ($.type(rs) == "object" && 'done' in rs) {
                    rs.done(function (code, _msg) {
                        if (code == successCode) {
                            processSuccess(_msg);
                        } else {
                            processMsg(validation,  _msg || msg[code]);//这里只显示错误提示
                            //处理msg消息
                            reject();
                        }
                    });
                } else {
                    msgLevel = LEVELS.error;
                    processMsg(validation,  msg[rs]);
                    return reject();
                }
            } else {
                msgLevel = LEVELS.error;
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

    function setValidatorMsg(defs){
        if(!$.isArray(defs)){
            defs = [defs];
        }
        $.each(defs, function(i, def){
            var validator = validatorMap[def.id];
            if(!validator) return;
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
            valid: function (flag) {
                flag = flag == undefined ? true : flag;
                if (flag && Smart.isEmpty(this.value)) {
                    return 0;
                }
                if(!flag && Smart.isEmpty(this.value)){
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
                this.smart.get(url, null, null, {silent:true}).done(function(rs){
                    var code,msgStr;
                    if($.type(rs) == "object"){
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
            valid: function(){
                if(this.item.node.prop("checked")){
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
                if(item == undefined){
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
            sign: "glyphicon glyphicon-exclamation-sign",
            color: "text-warning"
        },
        info: {
            sign: "glyphicon glyphicon-info-sign",
            color: "text-info"
        },
        success: {
            sign: "glyphicon glyphicon-ok-sign",
            color: "text-success"
        },
        danger: {
            sign: "glyphicon glyphicon-remove-sign",
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
            sign: "glyphicon glyphicon-exclamation-sign",
            color: "text-warning"
        },
        info: {
            sign: "glyphicon glyphicon-info-sign",
            color: "text-info"
        },
        success: {
            sign: "glyphicon glyphicon-ok-sign",
            color: "text-success"
        },
        danger: {
            sign: "glyphicon glyphicon-remove-sign",
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
        var text = (btn.icon ? "<i style='"+btn.icon+"'></i>" : "") + btn.name;
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
        return button;
    };

    var showDialog = function(dialog){
        Smart.UI.backdrop();
        dialog.on("hide.bs.modal", function(){
            Smart.UI.backdrop(false);
        }).css('zIndex', Smart.UI.zIndex()).modal({
            keyboard: false,
            backdrop: false
        });
    };

    Smart.fn.extend({
        dialogOpen: function () {
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
            }).on("load", function(){
                titleNode.html(nodeSmart.meta.title || DIALOG_DEFAULT_TITLE);
                if(nodeSmart.meta.btns){
                    $.each(nodeSmart.meta.btns, function(i, btn){
                        footerNode.append(createBtn(btn));
                    });
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
                showDialog(dialog);
            }).on("dialog.btn.disable", function(e, id){
                getButtonById(id).prop("disabled", true);
            }).on("dialog.btn.enable", function(e, id){
                getButtonById(id).prop("disabled", false);
            });

            function getButtonById(id){
                return $("button[s-ui-dialog-btn-id='"+id+"']", footerNode);
            }

            nodeSmart.load.apply(nodeSmart, $.makeArray(arguments));

            return deferred;
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
                            listener.onProgress(percentComplete, e.total, e.loaded);
                        }
                    }, false);
                    return xhr;
                }
            }).always(function(){
                listener.onDone && listener.onDone();
            });

        }
    });

})();