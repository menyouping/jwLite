var storageKey = 'compare.mode';

var value = "", orig1 = "", orig2 = "", dv, panes = 2, highlight = true, connect = null, collapse = false;
var targetMode = "text/plain";
function initUI() {
    if (value == null) return;
    var target = document.getElementById("view");
    target.innerHTML = "";
    dv = CodeMirror.MergeView(target, {
        value: value,
        origLeft: panes == 3 ? orig1 : null,
        orig: orig2,
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
        if (!editor) return document.body.clientHeight - 100;
        return editor.getScrollInfo().height;
    }
    return Math.max(editorHeight(mergeView.leftOriginal()),
        editorHeight(mergeView.editor()),
        editorHeight(mergeView.rightOriginal()));
}

function resize(mergeView) {
    var height = mergeViewHeight(mergeView);
    height = Math.max(height, 500);
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
}

function beautifyJSON(content) {
    try {
        if (content && content.length > 1 && content.indexOf("\"") == 0 && content.lastIndexOf("\"") == content.length - 1) {
            content = content.substring(1, content.length - 1);
        }
        jsl.parser.parse(content);
        content = jsl.format.formatJson(content);
        $('#divMsg').removeClass('alert-danger')
            .addClass('alert-success')
            .html('JSON is valid.')
            .show();
        return content;
    } catch (exp) {
        var msg = exp.toString().replace(/\n/g, "<br>");
        $('#divMsg').removeClass('alert-success')
            .addClass('alert-danger')
            .html(msg)
            .show();
    }
}

function changeMode() {
    if (dv && dv.right && dv.right.diff) {
        var diff = dv.right.diff;
        var leftArr = [], rightArr = [];
        var len = diff.length;
        var line, type, content;
        for (var i = 0; i < len; i++) {
            line = diff[i];
            type = line[0];
            content = line[1];
            if (type == 0) {//EQUAL
                leftArr.push(content);
                rightArr.push(content);
            } else if (type == -1) {//DELETE
                rightArr.push(content);
            } else if (type == 1) {//INSERT
                leftArr.push(content);
            }
        }
        value = beautify(leftArr.join(''));
        orig2 = beautify(rightArr.join(''));
    }
    initUI();
}