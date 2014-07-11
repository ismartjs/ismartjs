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
            "build-res,ctx:build-form,ctx:build-adapter,ctx:build-cascade,build-cascade-key"
    }, {
        onPrepare: function () {
            //级联
            if (this.options.resource['data-cascade']) {
                this.options.resource[STAGE.data.resourceKey] = this.options.resource['data-res'];
                var that = this;
                this.options.resource['data-cascade'].change(function () {
                    that._cascadeLoad(STAGE.data.id);
                });
            }
            if (this.options.resource['build-cascade']) {
                this.options.resource[STAGE.build.resourceKey] = this.options.resource['build-res'];
                var that = this;
                this.options.resource['build-cascade'].change(function () {
                    that._cascadeLoad(STAGE.build.id);
                });
            }
        },
        onBuild: function () {
            return this._onBuild();
        },
        onData: function () {
            return this._onData();
        },
        onRefresh: function (){
            return this._onData();
        }
    }, {
        _cascadeLoad: function (stage) {
            var cascade = this.options.resource[stage + '-cascade'];
            var val = cascade.val();
            var resKey = stage + '-res';
            var originalRes = this.options.resource[STAGE[stage].resourceKey];
            var cascadeKey = stage + '-cascade-key';
            this.options.resource[resKey] = originalRes.replace("{val}", val);
            if (this.options.resource[cascadeKey]) {
                var param = {};
                param[this.options.resource[cascadeKey]] = val;
                this.dataTable("resource", "param", param);
            }
            return this._load(this.options.resource[resKey], param, stage);
        },
        _load: function (resource, param, stage) {
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
            var form = this.options.resource[stage + "-form"];
            var adapter = this.options.resource[stage + "-adapter"];
            var param = this.dataTable("resource", "param") || {};
            if (form) {
                var formParam = Smart.serializeToObject(form);
                $.extend(param, formParam);
            }
            this.get(resource, param, type).done(function (rs) {
                if ($.isFunction(adapter)) {
                    rs = adapter(rs);
                }
                if (stage == STAGE.build.id) {
                    that.build(rs);
                } else if (stage == STAGE.data.id) {
                    that.data(rs);
                }
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
            return deferred.promise();
        },
        _onBuild: function () {
            if (this.options.resource['build-cascade']) {
                if (Smart.isWidgetNode(this.options.resource['build-cascade'])) {
                    var deferred = $.Deferred();
                    var that = this;
                    Smart.of(this.options.resource['build-cascade']).onMade(function () {
                        that._cascadeLoad(STAGE.build.id);
                        deferred.resolve();
                    });
                    return deferred.promise();
                }
                return this._cascadeLoad(STAGE.build.id);
            }
            return this._load(this.options.resource['build-res'], {}, STAGE.build.id);
        },
        _onData: function () {
            if (this.options.resource['data-cascade']) {
                if (Smart.isWidgetNode(this.options.resource['data-cascade'])) {
                    var deferred = $.Deferred();
                    var that = this;
                    Smart.of(this.options.resource['data-cascade']).onMade(function () {
                        that._cascadeLoad(STAGE.data.id);
                        deferred.resolve();
                    });
                    return deferred.promise();
                }
                return this._cascadeLoad(STAGE.data.id);
            }
            return this._load(this.options.resource['data-res'], {}, STAGE.data.id);
        },
        buildRefresh: function () {
            return this._onBuild();
        }
    });
})();