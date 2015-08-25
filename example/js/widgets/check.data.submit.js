/**
 * Created by Administrator on 2014/7/11.
 */
(function () {
    Smart.widgetExtend({
        id: "cds",
        /**
         * s:check控件的smart对象，key:数据的key，c-msg:确认消息，e-msg:错误警告消息，r:是否刷新
         * dk: 将使用该值作为 选取的数据 的 key
         * */
        options: "ctx:cs,ck,dk,c-msg,e-msg,r,confirm",
        defaultOptions: {
            "c-msg": "确认进行此操作吗？",
            "e-msg": "请选择你要操作的数据？",
            confirm: true,
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
                if(this.widget.cds.options["confirm"]){
                    this.confirm(this.widget.cds.options['c-msg'], {sign:"warning"}).done(function(){
                        resolve();
                    }).fail(function(){
                        deferred.reject();
                    });
                } else {
                    resolve();
                }

            } else {
                this.alert("没有配置dk参数");
                deferred.reject();
            }
        }
    });
})();