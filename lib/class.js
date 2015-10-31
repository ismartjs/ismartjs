/**
 * Created by Administrator on 2014/7/11.
 */

module.exports = function(constructor, superClass, prototype, staticMethod){
    var SUPER;
    if(!Utils.isFunction(superClass)){
        staticMethod = prototype;
        prototype = superClass;
        superClass = constructor;
        constructor = superClass;
    } else {
        SUPER = function(){
            superClass.apply(this, Array.prototype.slice.call(arguments));
        };
    }

    var obj = function(){
        SUPER && (this.SUPER = SUPER);
        constructor.apply(this, Array.prototype.slice.call(arguments));
    };

    var inheritedFnMap = {};

    obj.prototype = {
        inherited: function(){
            var caller = arguments.callee.caller;
            if(!caller in inheritedFnMap){
                console.error("该方法没有super方法");
                throw "该方法没有super方法";
            }
            var superFn = inheritedFnMap[caller];
            return superFn.apply(this, Array.prototype.slice.call(arguments));
        }
    };

    //设置prototype
    Utils.extend(obj.prototype, superClass.prototype);
    for(var key in prototype){
        var fn = prototype[key];
        if(key in obj.prototype){
            inheritedFnMap[fn] = obj.prototype[key];
        }
        obj.prototype[key] = fn;
    }

    //处理静态方法
    Utils.extend(obj, superClass);
    Utils.extend(obj, staticMethod);

    return obj;

}