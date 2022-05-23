var storageKey = 'compare.mode', storageKey1 = 'compare.left', storageKey2 = 'compare.right';

var value = "", orig1 = "", orig2 = "", dv, panes = 2, highlight = true, connect = null, collapse = false;
var targetMode = "text/plain";
function initUI() {
    if (value == null) return;
    var target = document.getElementById("view");
    target.innerHTML = "";
    dv = CodeMirror.MergeView(target, {
        value: value || $jw.readStorage(storageKey1) || '',
        origLeft: panes == 3 ? orig1 : null,
        orig: orig2  || $jw.readStorage(storageKey2) || '',
        lineNumbers: true,
        mode: targetMode,
        highlightDifferences: highlight,
        connect: connect,
        collapseIdentical: collapse,
        allowEditingOriginals: true
    });
    resize(dv);
}

function toggleDifferences() {
    dv.setShowDifferences(highlight = !highlight);
}

function mergeViewHeight(mergeView) {
    function editorHeight(editor) {
        if (!editor) return document.body.clientHeight - 150;
        return editor.getScrollInfo().height;
    }
    return Math.max(editorHeight(mergeView.leftOriginal()),
        editorHeight(mergeView.editor()),
        editorHeight(mergeView.rightOriginal()));
}

function resize(mergeView) {
    var height = mergeViewHeight(mergeView);
    height = Math.max(height, 450);
    for (; ;) {
        if (mergeView.leftOriginal()) {
            mergeView.leftOriginal().setSize(null, height);
        }
        mergeView.editor().setSize(null, height);
        if (mergeView.rightOriginal()) {
            mergeView.rightOriginal().setSize(null, height);
        }

        var newHeight = mergeViewHeight(mergeView);
        if (newHeight >= height) {
            break;
        } else { height = newHeight };
    }
    mergeView.wrap.style.height = height + "px";
}

$(function () {
    $("#menuCompare").addClass("active");
    var selected = $jw.readStorage(storageKey);
    if (selected) {
        $('#' + selected).attr("checked", "checked");
        targetMode = $('#' + selected).val();
        changeMode();
    } else {
        $('#rdoMode0').attr("checked", "checked");
        initUI();
    }
    $('input[type=radio]').click(function (e) {
        var $that = $(this);
        targetMode = $that.val();
        changeMode();
        var selectedId = $that.attr("id");
        $jw.saveStorage(storageKey, selectedId);
    });
    $('#btnGo').click(function (e) {
        changeMode();
    })
});

function beautify(content) {
    if (!content) {
        return content;
    }
    var selection = $('[name=gpMode]:checked').val();
    if (selection == 'javascript') {
        return beautifyJSON(content);
    }
    if (selection == 'application/xml') {
        return $.format(content, { method: 'xml' });
    }
    return content;
}

function beautifyJSON(content) {
    try {
        if (content.length > 1 && content.indexOf("\"") == 0 && content.lastIndexOf("\"") == content.length - 1) {
            content = content.substring(1, content.length - 1);
        }
        var index0 = content.indexOf("[");
        var index1 = content.indexOf("{");
        if(index0 != 0 && index1 != 0) {
            if(index0 > -1 || index1 > -1) {
                content = content.substring(Math.max(index0, index1));
            }
        }
        if (content.indexOf("[") == 0 && content.indexOf("}") == content.length - 1 && content.indexOf("]") < content.length - 1) {
            content = content.substring(content.indexOf("]") + 1);
        }
        jsl.parser.parse(content);
        if ($('#chkIgnore:checked').val() == 'on') {
            var jsonObj = JSON.parse(content);
            if (Array.isArray(jsonObj)) {
                var arr = jsonObj;
                for (var item in arr) {
                    ignoreFields(arr[item]);
                }
            } else {
                ignoreFields(jsonObj);
            }
            content = JSON.stringify(jsonObj);
        }
        content = jsl.format.formatJson(content);
    } catch (exp) {
        var msg = exp.toString().replace(/\n/g, "<br>");
        $('#divMsg').removeClass('alert-success')
            .addClass('alert-danger')
            .html(msg)
            .show();
    }
    return content;
}

function ignoreFields(jsonObj) {
    if (!jsonObj) {
        return;
    }
    var fields = ["creator", "gmtCreate", "modifier", "gmtModified","isDeleted"];
    for (var key in jsonObj) {
        if (fields.indexOf(key) > -1) {
            delete jsonObj[key];
        } else if (Array.isArray(jsonObj[key])) {
            var arr = jsonObj[key];
            for (var item in arr) {
                ignoreFields(arr[item]);
            }
        }
    }
}

function changeMode() {
    if (dv && dv.right && dv.right.diff) {
        var diff = dv.right.diff;
        var leftArr = [], rightArr = [];
        var len = diff.length;
        var line, type, content;

        var ignoreWhiteSpace = $('#chkIgnoreWhiteSpace:checked').val() == 'on';
        for (var i = 0; i < len; i++) {
            line = diff[i];
            type = line[0];
            content = line[1];
            if (type == 0) {//EQUAL
                leftArr.push(content);
                rightArr.push(content);
            } else if (type == -1) {//DELETE
                if(ignoreWhiteSpace) {
                    rightArr.push(content.trim());
                } else {
                    rightArr.push(content);
                }
            } else if (type == 1) {//INSERT
                if(ignoreWhiteSpace) {
                    leftArr.push(content.trim());
                } else {
                    leftArr.push(content);
                }
            }
        }
        if (content && $('[name=gpMode]:checked').val() == 'javascript') {
            $('#divMsg').removeClass('alert-danger')
            .addClass('alert-success')
            .html('')
        }
        value = beautify(leftArr.join(''));
        $jw.saveStorage(storageKey1, value);
        orig2 = beautify(rightArr.join(''));
        $jw.saveStorage(storageKey2, orig2);

    }
    initUI();
}
