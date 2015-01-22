/**
 * User: Administrator
 * Date: 13-10-19
 * Time: 下午3:32
 */
/**
 * 模板处理
 * */

(function ($) {

    var OUT_SCRIPT = " var out = {\n" +
        "     output : [],\n" +
        "     print : function(str){\n" +
        "          this.output.push(str);\n" +
        "     },\n" +
        "     println : function(str){\n" +
        "          this.print(str == null ? '' : str + '\\n');\n" +
        "     }\n" +
        " };\n";
    var token = 1;
    var compile = function (body) {
        var scripts = [];
        scripts.push(OUT_SCRIPT);
        var line = [];
        var inScriptFlag = false;
        var writeLine = function (type) {
            var lineStr = line.join("");
            if (type == "script") {
                //TODO FIX LATTER 对于 out.print("xxx lt xxx");这样的脚本，则也会替换成 out.print("xxx < xxx");这样
                //lineStr = lineStr.replace(/\slt\s/gi,"<").replace(/\sgt\s/gi, ">");
                //lineStr = lineStr.replace(/\slte\s/gi,"<=").replace(/\sgte\s/gi, ">=");
                lineStr = lineStr.replace(/&amp;/gi,"&");
				lineStr = lineStr.replace(/&gt;/gi,">");
				lineStr = lineStr.replace(/&lt;/gi,"<");
                scripts.push(lineStr);
                line = [];
            } else {
                if ($.trim(lineStr) == "") {
                    line = [];
                    return;
                }
                lineStr = lineStr.replace(/'/gi, "\\'");
                scripts.push("out.print('" + lineStr + "');");
                line = [];
            }
        };
        var scriptOutputFlag = false;
        var skipFlag = false;
        for (var i = 0; i < body.length; i++) {
            var char = body.charAt(i);
            if(char == "\n"){
                if (!inScriptFlag) {
                    writeLine("output");
                    line.push("\\n");
                    writeLine("output");
                } else {
                    line.push(char);
                }
                continue;
            }
            if(char == "\r"){
                continue;
            }
            if(char == "#"){
                if (body.charAt(i+1) == "}" && skipFlag) {
                    writeLine("output");
                    i++;
                    skipFlag = false;
                    continue;
                }
            }
            if(skipFlag){
                line.push(char);
                continue;
            }
            switch (char) {
                case "{" :
                    if (body.charAt(i+1) == "#") {
                        //则表示skip，不做任何处理
                        skipFlag = true;
                        i++;
                        writeLine(inScriptFlag ? "script" : "output");
                        break;
                    }
                    if (body.charAt(i+1) == "%" && !inScriptFlag) {//则说明脚本开始
                        writeLine("output");
                        i++;
                        inScriptFlag = true;
                        break;
                    }
                    line.push(char);
                    break;
                case "%" :
                    if (body.charAt(i+1) == "}" && inScriptFlag) {//则说明脚本结束
                        if (scriptOutputFlag) {
                            line.push(");");
                            scriptOutputFlag = false;
                        }
                        i++;
                        inScriptFlag = false;
                        writeLine("script");
                        break;
                    }
                    line.push(char);
                    break;
                case "=" :
                    if (inScriptFlag && i - 2 >= 0 && body.charAt(i - 2)== "{" && body.charAt(i-1) == "%") {//则表示是输出
                        line.push("out.print(");
                        scriptOutputFlag = true;
                    } else {
                        line.push(char);
                    }
                    break;
                default :
                    line.push(char);
                    break;
            }
        }
        writeLine("output");
        scripts.push("return out.output.join('');");
        return scripts.join("\n");
    }

    $.template = {
        compile: compile
    };
})(jQuery);
