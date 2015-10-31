/**
 * Created by Administrator on 2014/7/9.
 */
/**
 * Created by Administrator on 2014/3/29.
 */
var

// [[Class]] -> type pairs
    class2type = {},

// List of deleted data cache ids, so we can reuse them
    core_deletedIds = [],

    core_version = "",

// Save a reference to some core methods
    core_concat = core_deletedIds.concat,
    core_push = core_deletedIds.push,
    core_slice = core_deletedIds.slice,
    core_indexOf = core_deletedIds.indexOf,
    core_toString = class2type.toString,
    core_hasOwn = class2type.hasOwnProperty,
    core_trim = core_version.trim;

var Q = require("q");

function isArraylike( obj ) {
    var length = obj.length,
        type = Utils.type( obj );

    if ( obj.nodeType === 1 && length ) {
        return true;
    }

    return type === "array" || type !== "function" &&
        ( length === 0 ||
        typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

var utils = {
    slice: function () {
        if (arguments.length > 2) {
            return Array.prototype.slice.apply(arguments[0], arguments[1]);
        }
        return Array.prototype.slice.apply(arguments[0]);
    },
    extend: function (obj1, obj2, igNull) {
        for (var key in obj2) {
            if (igNull && (obj2[key] === null || obj2[key] === undefined)) continue;
            obj1[key] = obj2[key];
        }
        return obj1;
    },
    realPath: (function () {
        var DOT_RE = /\/\.\//g;
        var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
        return function (path) {
            if (/^(http|https|ftp|):.*$/.test(path)) {
                return path;
            }
            // /a/b/./c/./d ==> /a/b/c/d
            path = path.replace(DOT_RE, "/")

            // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
            while (path.match(DOUBLE_DOT_RE)) {
                path = path.replace(DOUBLE_DOT_RE, "/")
            }

            return path
        }
    })(),
    map: function (datas, key) {
        var _datas = [];
        for (var i = 0; i < datas.length; i++) {
            var d = datas[i];
            if (this.isFunction(key)) {
                _datas.push(key(d));
            } else if (Object.toString.call(key) == '[object String]') {
                _datas.push(d[key]);
            }
        }
        return _datas;
    },
    trim: (function () {
        var core_trim = "".trim();
        return core_trim && !core_trim.call("\uFEFF\xA0") ?
            function (text) {
                return text == null ?
                    "" :
                    core_trim.call(text);
            } :

            // Otherwise use our own trimming functionality
            function (text) {
                return text == null ?
                    "" :
                    ( text + "" ).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
            }
    })(),
    isEmpty: function (val) {
        if (val == null) {
            return true;
        }
        if (this.type(val) == "string") {
            return this.trim(val).length == 0;
        }
        if (this.isArray(val)) {
            return val.length == 0;
        }
        return true;
    },
    isNull: function (val) {
        if (val === null || val === undefined) return true;
        return false;
    },
    each: function (val, fn) {
        for (var i in val) {
            if (fn.call(val[i], i, val[i]) === false) return;
        }
    },
    type: function (obj) {
        if (obj == null) {
            return String(obj);
        }
        return typeof obj === "object" || typeof obj === "function" ?
        class2type[core_toString.call(obj)] || "object" :
            typeof obj;
    },
    isArray: Array.isArray || function( obj ) {
        return Utils.type(obj) === "array";
    },
    isFunction: function( obj ) {
        return Utils.type(obj) === "function";
    },
    makeArray: function( arr, results ) {
        var ret = results || [];

        if ( arr != null ) {
            if ( isArraylike( Object(arr) ) ) {
                jQuery.merge( ret,
                    typeof arr === "string" ?
                        [ arr ] : arr
                );
            } else {
                core_push.call( ret, arr );
            }
        }

        return ret;
    },
    queue: function (fns) {
        var deferred = Q.defer();
        var fnArgs = Array.prototype.slice.call(arguments, 1);

        function callFn(i) {
            if (i == fns.length) {
                deferred.resolve.apply(deferred, fnArgs);
                return;
            }
            var fn = fns[i];
            if (!utils.isFunction(fn)) {
                callFn(i + 1);
                return;
            }
            var fnDefer = fn.apply(null, fnArgs);
            if (!fnDefer) {
                callFn(i + 1);
                return;
            }
            fnDefer.done(function () {
                callFn(i + 1);
            }).fail(function () {
                deferred.reject.apply(null, fnArgs);
            });
        }

        callFn(0);
        return deferred.promise();
    }
};

utils.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
});
global.Utils = utils;
module.exports = utils;