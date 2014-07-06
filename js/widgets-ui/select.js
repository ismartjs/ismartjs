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
            var originalOptions = this.node.children();
            this.dataTable("select", "originalOptions", originalOptions);
            this.options.select.form = this.options.select.form.split(":");
            this.options.select.form[1] = this.options.select.form[1].split(",");
        }
    }, {
        build: function (datas) {
            if (!$.isArray(datas)) {
                Smart.error("构建select选项所需的数据必须是数组");
                return;
            }
            this.node.empty();
            this.node.append(this.dataTable("select", "originalOptions"));
            for (var i in datas) {
                this.node.append(this._createOption(datas[i]));
            }
        },
        _createOption: function (data) {

            var value = data[this.options.select.form[0]];
            var title = data[this.options.select.form[1][0]];
            if (!title && this.options.select.form[1].length == 2) {
                title = data[this.options.select.form[1][1]];
            }
            var option = $('<option value="' + value + '">' + title + '</option>');
            return option;
        }
    });
})(jQuery);