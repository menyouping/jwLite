var $jw = (function () {
    "use strict";

    var that = {};

    var storage = window.localStorage;

    that.highlight = function (text, target, checkSpace) {
        var result = text;
        var reg = new RegExp(target, 'gi');
        var list = [];
        var arr, prev, next;
        var hasSpace = false;
        while ((arr = reg.exec(text)) != null) {
            if (checkSpace) {
                hasSpace = false;
                prev = arr.index - 1;
                if (prev >= 0 && /\w/.test(text.substr(prev, 1))) {
                    hasSpace = true;
                }
                next = arr.index + arr[0].length;
                if (next < text.length && /\w/.test(text.substr(next, 1))) {
                    hasSpace = true;
                }
                if (hasSpace) {
                    continue;
                }
            }
            list.push({ 'index': arr.index, 'word': arr[0] });
        }
        if (list.length > 0) {
            var item;
            for (var i = list.length - 1; i >= 0; i--) {
                item = list[i];
                result = result.insert('</span>', item.index + item.word.length);
                result = result.insert('<span class="hign-light">', item.index);
            }
        }

        return result;;
    }
    /**
     * 写cookies 
     */
    that.setCookie = function (name, value) {
        var Days = 30;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
    }

    /**
     * 读取cookies
     */
    that.getCookie = function (name) {
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");

        if (arr = document.cookie.match(reg)) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    }

    that.saveStorage = function (key, value) {
        if (storage) {
            storage.setItem(key, value);
        } else {
            that.setCookie(key, value);
        }
    }

    that.readStorage = function (key) {
        if (storage.getItem(key) != null) {
            return storage.getItem(key);
        } else if (that.getCookie(key) != null) {
            return that.getCookie(key);
        }
    }

    return that;
}());


String.prototype.insert = function (text, at) {
    if (at == null || at > this.length) {
        at = this.length;
    } else if (at < 0) {
        at = 0;
    }

    return this.substring(0, at) + text + this.substring(at);
}

String.prototype.left = function (count) {
    return this.length > count ? this.substring(0, count) : this;
}

String.prototype.right = function (count) {
    return this.length > count ? this.substring(this.length - count) : this;
}

String.prototype.removeLineEnd = function () {
    return this.replace(/(<.+?\s+?)(?:\n\s*?(.+?=".*?"))/g, '$1 $2')
}

String.prototype.endWith = function (s) {
    if (s == null || s == "" || this.length == 0 || s.length > this.length) {
        return false;
    }

    return this.substring(this.length - s.length) == s;
}

String.prototype.startWith = function (s) {
    if (s == null || s == "" || this.length == 0 || s.length > this.length) {
        return false;
    }

    return this.substring(0, s.length);
}

String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
}

/**
 * 首字母大写
 * @returns 
 */
String.prototype.upperFirst = function () {
    return this.slice(0, 1).toUpperCase() + this.slice(1)
}

/**
 * 首字母小写
 * @returns 
 */
String.prototype.lowerFirst = function () {
    return this.slice(0, 1).toLowerCase() + this.slice(1)
}

/**
 * 下划线转驼峰
 * @returns 
 */
String.prototype.toCamelCase = function () {
    return this.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
}

/**
 * 驼峰转下划线
 * @returns 
 */
String.prototype.toLineCase = function () {
    return this.lowerFirst().replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * 每个单词的首字母都大写
 * @returns 
 */
String.prototype.toLetterCase = function () {
    return this.toLowerCase().replace(/\b([\w|']+)\b/g, function (word) {
        return word.replace(word.charAt(0), word.charAt(0).toUpperCase());
    });
}

/**
 * 驼峰转空格，DistrictOfColumbia -> District Of Columbia
 * @returns 
 */
String.prototype.toSpaceCase = function () {
    return this.slice(0, 1) + this.slice(1).replace(/([A-Z])/g, " $1");
}

/**
 * 转int
 * @returns int
 */
String.prototype.toInt = function () {
    return parseInt(this.trim());
}

/**
 * 转float
 * @returns float
 */
String.prototype.toFloat = function () {
    return parseFloat(this.trim());
}

/**
 * 字符串模板，${line},${args[0]},${i}
 * @param  context 上下文
 * @returns 
 */
String.prototype.render = function (context) {
    var tokenReg = /\$(\\)?\{([^\{\}\\]+)(\\)?\}/g;

    return this.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) {
            // $\{variable\} 转义，不做解析，变成${variable}
            return word.replace(/\\/g, '');
        }

        var args = context.args;
        var line = context.line;
        var i = context.i;
        return eval(token);
    });
};
