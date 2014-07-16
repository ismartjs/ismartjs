/**
 * Created by Administrator on 2014/6/21.
 */
(function () {

    var STAGE = {
        build: {
            id: "build",
            resourceKey: "__original_build_resource_key__"
        },
        data: {
            id: "data",
            resourceKey: "__original_data_resource_key__"
        }
    };

    Smart.widgetExtend({
        id: "resource",
        options: "data-res,ctx:data-form,ctx:data-adapter,ctx:data-cascade,data-cascade-key," +
            "build-res,ctx:build-form,ctx:build-adapter,ctx:build-cascade,build-cascade-key,data-switch,ignore",
        defaultOptions: {
            'data-switch': "on"
        }
    }, {
        onPrepare: function () {
            //级联
            if (this.options['data-cascade']) {
                this.options[STAGE.data.resourceKey] = this.options['data-res'];
                var that = this;
                this.options['data-cascade'].on("change refresh data.set", function () {
                    that.S.refresh();
                });
            }
            if (this.options['build-cascade']) {
                this.options[STAGE.build.resourceKey] = this.options['build-res'];
                var that = this;
                this.options['build-cascade'].on("change refresh data.set", function () {
                    that.S.refresh();
                });
            }
            var that = this;
            this.S.on("request.params", function(e, params){
                that.cache.params = params;
                that.S.refresh(false);
            });
        },
        onClean: function(flag){
            if(flag == undefined || flag == true){
                this.cache.params = {};
            }
        },
        onBuild: function () {
            return this._build();
        },
        onReady: function () {
            if(this.options['data-switch'] == "off"){
                this.options['data-switch'] = "on";
                return $.Deferred().resolve();
            }
//            if (this.options['data-cascade']) return $.Deferred().resolve();
            return this._ready();
        },
        _cascadeLoad: function (stage) {
            var cascade = this.options[stage + '-cascade'];
            var val = cascade.val();
            if(val == this.options.ignore) {
                return $.Deferred().resolve();
            }
            var resKey = stage + '-res';
            var originalRes = this.options[STAGE[stage].resourceKey];
            var cascadeKey = stage + '-cascade-key';
            this.options[resKey] = originalRes.replace("{val}", val);
            if (this.options[cascadeKey]) {
                var params = {};
                params[this.options[cascadeKey]] = val;
            }
            return this._load(this.options[resKey], params, stage);
        },
        _load: function (resource, params, stage) {
            var deferred = $.Deferred();
            if (resource == undefined) {
                return deferred.resolve();
            }
            var type = "json";
            if (/^.+:.+$/.test(resource)) {
                var idx = resource.indexOf(":");
                type = resource.substring(idx);
                resource = resource.substring(idx + 1);
            }
            var that = this;
            var form = this.options[stage + "-form"];
            var adapter = this.options[stage + "-adapter"];
            params = params || {};
            if (form) {
                var formParam = Smart.serializeToObject(form);
                $.extend(formParam, params);
                params = formParam;
            }
            $.extend(params, this.cache.params);
            this.S.get(resource, params, type).done(function (rs) {
                if ($.isFunction(adapter)) {
                    rs = adapter(rs);
                }
                if (stage == STAGE.build.id) {
                    that.S.build(rs);
                } else if (stage == STAGE.data.id) {
                    that.S.data(rs);
                }
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
            return deferred.promise();
        },
        _build: function () {
            if (this.options['build-cascade']) {
                return this._cascadeLoad(STAGE.build.id);
            }
            return this._load(this.options['build-res'], {}, STAGE.build.id);
        },
        _ready: function () {
            if (this.options['data-cascade']) {
                if (Smart.isWidgetNode(this.options['data-cascade'])) {
                    var deferred = $.Deferred();
                    var that = this;
                    Smart.of(this.options['data-cascade']).onMade(function () {
                        that._cascadeLoad(STAGE.data.id);
                        deferred.resolve();
                    });
                    return deferred.promise();
                }
                return this._cascadeLoad(STAGE.data.id);
            }
            return this._load(this.options['data-res'], {}, STAGE.data.id);
        }
    }, {

    });
})();