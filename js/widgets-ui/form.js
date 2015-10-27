/**
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
})(jQuery);