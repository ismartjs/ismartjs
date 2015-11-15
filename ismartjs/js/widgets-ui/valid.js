(function ($) {

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
})(jQuery);