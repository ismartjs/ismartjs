(function () {
    Smart.fn.extend({
        cascade: function () {
            var args = arguments;
            for (var i = 0; i < args.length - 1; i++) {
                var $S = args[i];
                if (i < args.length - 1) {
                    var $next = args[i + 1];
                    (function ($S, $next) {
                        $S.on("change s-data", function (e) {
                            $next.refresh().done(function () {
                                //$next.node.change();
                            })
                        })
                    })($S, $next)
                }
            }
            args[0].node.change();
        }
    });
})()