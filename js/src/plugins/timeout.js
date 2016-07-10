(function () {
    Smart.fn.extend({
        /**
         * 延时触发方法，如果在延时时间内再次出发的话，将重新进行计时
         * */
        timeout: function (key, fn, time) {
            if ($.isFunction(key)) {
                time = fn;
                fn = key;
                key = "";
            }
            time = time || 300;
            var that = this;
            var key = "_PLUGIN_TIMEOUT_" + key;
            var timeout = this.node.data(key);
            if (timeout) {
                window.clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                fn();
                that.node.removeData(key);
            }, time);
            this.node.data(key, timeout);
            return timeout;
        }
    });
})()