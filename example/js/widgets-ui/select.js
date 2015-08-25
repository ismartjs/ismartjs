/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    Smart.widgetExtend({
        id: "select",
        options: "form,ctx:title,ctx:value,ctx:build-done,ctx:build-data",
        defaultOptions: {
            form: "id:name,title"
        }
    }, {
        onPrepare: function () {
            var originalOptions = this.S.node.children();
            this.cache.originalOptions = originalOptions;
            this.options.form = this.options.form.split(":");
            this.options.form[1] = this.options.form[1].split(",");
            this.cache.dataMap = {};
            if(this.options['build-data']){
                this.S.build(this.options['build-data']);
            }
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                Smart.error("构建select选项所需的数据必须是数组");
                return;
            }
            this.widget.select.cache.dataMap = {};
            this.node.empty();
            this.node.append(this.widget.select.cache.originalOptions);
            for (var i in datas) {
                this.node.append(this._createOption(datas[i]));
            }
            this.widget.select.options['build-done'] && this.widget.select.options['build-done'].call(this);
        },
        _createOption: function (data) {

            var value = this.widget.select.options.value ?
                this.widget.select.options.value(data) : data[this.widget.select.options.form[0]];
            var title = this.widget.select.options.title ?
                this.widget.select.options.title(data) : data[this.widget.select.options.form[1][0]];
            this.widget.select.cache.dataMap[value] = data;
            if (!title && this.widget.select.options.form[1].length == 2) {
                title = data[this.widget.select.options.form[1][1]];
            }
            var option = $('<option value="' + value + '">' + title + '</option>');
            return option;
        },
        getSelectData: function(){
            var val = this.node.val();
            return this.widget.select.cache.dataMap[val];
        }
    });
})(jQuery);