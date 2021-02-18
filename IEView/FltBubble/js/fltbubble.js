/* FltBubble / 2021 Dmitry Chigiryov (Dm1) */

var shell = {
    SHELL_TOOL: 'tools/shellopen.cmd',
    DEFAULT_FILES_LOCATION: '%mydocuments%\\Принятые файлы\\%userid%',
    base_path: null,

    init: function() {
        shell.base_path = shell.addBS(base_url.replace('file://', '').replace(/\//g, '\\'));
    },
    getDB: function(module, key) {
        return external.db_get(0, module, key);
    },
    setDB: function(module, key, value) {
        return external.db_set(0, module, key, value);
    },
    openFile: function(e) {
        var path = shell.getPathAttr(e);
        if (/%[^%]+%/.test(path)) {
            return external.win32_ShellExecute('open', shell.base_path + shell.SHELL_TOOL, 'file "' + path + '"', 0, 1);
        } else {
            return external.win32_ShellExecute('open', 'explorer.exe', path, 0, 1);
        }
    },
    openDir: function(e) {
        var path = shell.getPathAttr(e);
        if (/%[^%]+%/.test(path)) {
            return external.win32_ShellExecute('open', shell.base_path + shell.SHELL_TOOL, 'dir "' + path + '"', 0, 1);
        } else {
            return external.win32_ShellExecute('open', 'explorer.exe', '/select,"' + path + '"', 0, 1);
        }
    },
    getPathAttr: function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        return (e.target || e.srcElement).getAttribute('data-path');
    },
    getFilename: function(path) {
        return path.replace(/^.*[\\\/]/, '');
    },
    addBS: function(path) {
        return path.substring(path.length - 1) === '\\' ? path : path + '\\';
    }
}

var ui = {
    THEME_CSS_LIST: [
        'css/fltbubble_light.css',
        'css/fltbubble_dark.css'
    ],
    DB: {
        MODULE: 'IEVIEW',
        KEY_FONT_SIZE: 'FltBubble.FontSize',
        KEY_THEME: 'FltBubble.CSS',
    },
    FONT_SIZE: {
        DEFAULT: 16,
        MAX: 48,
        MIN: 8,
    },
    _timeout_hadle: false,

    init: function() {
        ui.setScale(parseInt(shell.getDB(ui.DB.MODULE, ui.DB.KEY_FONT_SIZE), 10));
        ui.setTheme(shell.getDB(ui.DB.MODULE, ui.DB.KEY_THEME));
        ui.jumpDown();
        ui.reloadGIFs();
    },
    scrollDown: function() {
        clearTimeout(ui._timeout_hadle);
        var current_position = document.documentElement.scrollTop;
        var delta_position = (document.documentElement.scrollHeight - (current_position + document.documentElement.clientHeight)) / 3;
        if (delta_position < 1) delta_position = 1;
        document.documentElement.scrollTop = current_position + delta_position;
        if (current_position !== document.documentElement.scrollTop) {
            ui._timeout_hadle = setTimeout(function() {
                ui.scrollDown();
            }, 1);
        }
        current_position = null;
        delta_position = null;
    },
    jumpDown: function() {
        clearTimeout(ui._timeout_hadle);
        document.documentElement.scrollTop = document.documentElement.scrollHeight;
    },
    createImgPreview: function(url) {
        var el_img = document.createElement('img');
        el_img.setAttribute('src', url);
        el_img.setAttribute('title', url);
        el_img.setAttribute('class', 'img');
        var el_link = document.createElement('a');
        el_link.setAttribute('href', url);
        el_link.setAttribute('class', 'img-container');
        el_link.appendChild(el_img);
        return el_link;
    },
    reloadGIFs: function() {
        /* Prevent animated GIFs from freezing */
        var query_no_cache = '?nocache=' + Date.now(),
            images = document.querySelectorAll('img'),
            image_src;
        for (var i = 0, n = images.length; i < n; i++) {
            if (images[i].className !== 'img') continue;
            if (images[i].src.substring(0, 5) !== 'file:') continue;
            image_src = images[i].src.replace(/\?.*$/, '');
            if (image_src.length === 0 || image_src.substring(image_src.length - 4) !== '.gif') continue;
            images[i].src = image_src + query_no_cache;
        }
        query_no_cache = null;
        images = null;
        image_src = null;
    },
    setScale: function(value) {
        if (isNaN(value)) return;
        document.body.style.fontSize = Math.min(Math.max(ui.FONT_SIZE.MIN, value), ui.FONT_SIZE.MAX) + 'px';
        shell.setDB(ui.DB.MODULE, ui.DB.KEY_FONT_SIZE, parseInt(document.body.style.fontSize, 10));
    },
    changeScale: function(value) {
        ui.setScale(parseInt((document.body.style.fontSize || ui.FONT_SIZE.DEFAULT), 10) + value);
    },
    setTheme: function(path) {
        if (!path) return;
        if (ui.THEME_CSS_LIST.length === 0) return;
        var stylesheet = document.querySelector('#theme-css');
        if (!stylesheet) return;
        stylesheet.setAttribute('href', path);
        stylesheet = null;
        shell.setDB(ui.DB.MODULE, ui.DB.KEY_THEME, path);
    },
    getTheme: function() {
        return document.querySelector('#theme-css').getAttribute('href');
    },
    toggleTheme: function() {
        var current = ui.getTheme();
        for (var i = 0, n = ui.THEME_CSS_LIST.length; i < n; i++) {
            if (ui.THEME_CSS_LIST[i] === current) {
                ui.setTheme(i < ui.THEME_CSS_LIST.length - 1 ? ui.THEME_CSS_LIST[i + 1] : ui.THEME_CSS_LIST[0]);
                return;
            }
        }
        ui.setTheme(ui.THEME_CSS_LIST[0]);
    },
    setLink: function(el, href, action) {
        el.setAttribute('href', 'file:///' + href);
        el.setAttribute('data-path', href);
        el.onclick = action;
    }
};

var msg = {
    _timeout_hadle: false,

    init: function() {
        shell.init();
        ui.init();
    },
    show: function() {
        ui.reloadGIFs();
        clearTimeout(msg._timeout_hadle);
        msg._timeout_hadle = setTimeout(function() {
            var messages = document.querySelectorAll('.message-new');
            for (var i = 0, n = messages.length; i < n; i++) {
                messages[i].className = messages[i].className.replace('message-new', '');
            }
            messages = null;
            ui.scrollDown();
        }, 25);
    },
    parse: function() {
        var message = document.querySelectorAll('.message-body');
        if (message.length === 0) return;
        message = message[message.length - 1];
        switch (message.getAttribute('data-type')) {
            case 'message-in':
            case 'message-out':
                msg.image(message);
                break;
            case 'file-in':
            case 'file-out':
                msg.file(message);
                break;
        }
        message = null;
    },
    image: function(message) {
        var message_text = message.innerText.replace(/^\*?\s+|\s+$/, '');
        if (/^(https?|file):\/\/[^ ]+(jpg|jpeg|png|gif|bmp|svg)$/i.test(message_text)) {
            message.appendChild(ui.createImgPreview(message_text));
        }
        message_text = null;
    },
    file: function(message) {
        if (!message) return;
        var file_link = message.querySelector('.message-file');
        var message_text = file_link.innerText.replace(/^\s+|\s+$/, '');
        var file_path;
        switch (message.getAttribute('data-type')) {
            case 'file-in':
                var file_save_path = shell.getDB('SRFile', 'RecvFilesDirAdv') || shell.DEFAULT_FILES_LOCATION;
                if (file_save_path.length > 0) {
                    file_save_path = shell.addBS(file_save_path);
                    /* Try to find %userid% or %nick% in recent locations */
                    var search_for;
                    if (/%userid%/i.test(file_save_path)) {
                        search_for = message.getAttribute('data-uin');
                    } else if (/%nick%/i.test(file_save_path)) {
                        search_for = message.getAttribute('data-name');
                    }
                    if (search_for && search_for.length > 0) {
                        for (var i = 0; i < 5; i++) {
                            file_path = shell.getDB('SRFile', 'MruDir' + i);
                            if (file_path && file_path.indexOf(search_for) !== -1) break;
                            file_path = null;
                        }
                    }
                    search_for = null;
                    /* -------------------------------------------------- */
                    if (!file_path) file_path = file_save_path.replace(
                        /%userid%/gi, message.getAttribute('data-uin')
                    ).replace(
                        /%nick%/gi, message.getAttribute('data-name')
                    );
                    if (file_path && file_path.length > 0) file_path = file_path + message_text;
                }
                file_save_path = null;
                if (!file_path) file_path = message_text;
                break;
            case 'file-out':
                file_path = message_text;
                break;
        }
        message_text = null;
        if (file_path) {
            ui.setLink(file_link, file_path, shell.openFile);
            file_link.innerText = shell.getFilename(file_path);
            ui.setLink(message.querySelector('.icon-file'), file_path, shell.openFile);
            ui.setLink(message.querySelector('.icon-folder'), file_path, shell.openDir);
        }
        file_link = null;
        file_path = null;
    }
};

if (window.addEventListener) {
    window.addEventListener('load', msg.init);
} else {
    setTimeout(msg.init, 25);
}