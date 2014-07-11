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
        options: "ctx:cs,ck,dk,c-msg,e-msg,r",//
        defaultOptions: {
            "c-msg": "确认进行此操作吗？",
            "e-msg": "请选择你要操作的数据？",
            r: "true",
            ck: "id"//获取选择数据的key
        }
    }, {
        onPrepare: function () {
            var that = this;
            this.on("submit-done", function(e){
                if(that.options.cds['r'] == "true"){
                    that.options.cds['cs'].refresh();
                }
            });
        }
    }, {
        getSubmitData: function (deferred) {
            if (this.options.cds.dk) {
                var data = this.options.cds.cs.getCheckedData(this.options.cds.ck);
                if (Smart.isEmpty(data)) {
                    if (this.options.cds['e-msg']) {
                        this.alert(this.options.cds['e-msg']);
                    }
                    return;
                }
                var that = this;
                function resolve() {
                    var obj = {};
                    obj[that.options.cds.dk] = data;
                    deferred.resolve(obj);
                }
                if(this.options.cds['c-msg']){
                    this.confirm(this.options.cds['c-msg'], {sign:"warning"}).done(function(){
                        resolve();
                    });
                }

            } else {
                this.alert("没有配置dk参数");
                deferred.reject();
            }
        }
    });
})();