/**
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
})(jQuery);