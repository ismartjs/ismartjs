(function () {
    Smart.fn.extend({
        cascade: function () {
            for (var i = 0; i < arguments.length; i++) {
                var $S = arguments[i];
                if(i < arguments.length - 1){
                    var $next = arguments[i + 1];
                    (function($next){
                        $S.on("s-data, change", function(e){
                            $next.refresh().done(function(){
                                $next.node.change();
                            })
                        })
                    })($next)
                }
            }
            var firstS = arguments[0];
            this.on("s-ready", function(){
                firstS.node.change();
            });
        }
    });
})()