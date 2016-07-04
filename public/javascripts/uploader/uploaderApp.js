window.uploaderApp = {};

/**
 * the simple jquery
 */
(function (app) {
    function App$(id) {
        return new App$.fn.init(id);
    }

    App$.fn = App$.prototype = {
        init: function (id) {
            if (typeof id === 'string') {
                this[0] = document.getElementById(id);
                this.length = 1;
                return this;
            }
            this[0] = id;
            this.length = 1;
            return this;
        }, bind: function (eventType, eventListener) {
            for (var index = 0; index < this.length; index++) {
                this[index].addEventListener(eventType, function (e) {
                    e.preventDefault();
                    eventListener(e);
                }, false);
            }
            return this;
        }
    }

    App$.eval = function (fn, args) {
        if (typeof fn === 'function') {
            return fn(args);
        }
    }

    App$.fn.init.prototype = App$.fn;

    app.$ = App$;
})(window.uploaderApp);

/**
 *  the upload area options
 */
(function (app) {

    var _self = null;
    var uploadImages = {};

    function uploaderArea(id) {
        this._id = id;

        this.dragenter = {};
        this.dragover = {};
        this.dragleave = {};
        this.drop = {};

        this.cancelItem = {};

        _self = this;
    }

    uploaderArea.prototype = {
        init: function () {
            this._bindEvents();
            $("#existedItems .cancle_upload").click(function () {
                _self._delete($(this));
            });
        },
        changeItemProgress: function (key, progress) {
            var status = $('#' + key).find('.file_upload_status');
            status.html(progress + '%');
            this._changeItemMask(key, progress);
        },
        completeItem: function (key) {
            var status = $('#' + key).find('.file_upload_status');
            status.html('上传完成');
        },
        hideItemCancel: function (key) {
            $('#' + key).find('.cancle_upload').hide();
        },
        showItemCancel: function (key) {
            $('#' + key).find('.cancle_upload').show();
        },
        _bindEvents: function () {
            _self = this;
            app.$(this._id).bind('dragenter', function (e) {
                app.$.eval(_self.dragenter, e);
            }).bind('dragover', function (e) {
                app.$.eval(_self.dragover, e);
            }).bind('dragleave', function (e) {
                app.$.eval(_self.dragleave);
            }).bind('drop', function (e) {
                var files = e.dataTransfer.files,lth = files.length;
                for (var i = 0; i < lth; i++) {
                    var name = files[i].name;
                    if (typeof uploadImages[name] == "undefined" || uploadImages[name] == null) {
                        var key = app.$.eval(_self.drop, e);
                        _self._addItem(key, { fileName: name, fileSize: files[i].size });
                        _self._showImage(files[i], key);
                        uploadImages[name] = key;
                    }
                }
            });
        },
        _addItem: function (key, obj) {
            var html = '';
            html += ' <div class="upload_item" id="' + key + '">';
            html += ' <div class="imagewraper"></div><div class="imageinfo">';
            html += '<div class="inline_mask" style=""></div>' +
                '<div class="file_name" data-name="' + obj.fileName + '" data-key="' + key + '">' + obj.fileName + '</div>';
            html += '<a class="cancle_upload" href="javascript:;" key=' + key + ' title="取消"></a>';
            html += '</div>';
            html += '</div>';
            $('#' + this._id +" #uploadItems").append(html);
            this._bindItemCancel(key);
        },
        _bindItemCancel: function (key) {
            $('#' + key).find('.cancle_upload').click(function () {
                this._delete($(this));
            });
        },
        _delete: function (target){
            var key = target.attr('key');
            if (typeof _self.cancelItem === 'function') {
                var params = { names: [], repname: "" };
                var fname = $("#" + key + " .file_name").data("name");
                params.names.push(fname);
                params.repname = $("#productid").val();
                $.post("/api/delete", params, function (a, b) {
                    var isDelete = _self.cancelItem(key);
                    _self._removeItem(key);
                    $.each(params.names, function (i, item) {
                        uploadImages[item] = null;
                    });
                });
            }
        },
        _showImage: function (file,key){
            if (!file) return;
            
            if (file.type.indexOf('image') == 0) {
                var fileReader = new FileReader();
                fileReader.onload = (function () {
                    return function (e) {
                        var image = new Image();
                        image.src = e.target.result;
                        image.className = "viewimage";
                        $(image).appendTo($('#'+key+" .imagewraper"));
                    }
                })();
                fileReader.readAsDataURL(file);
            }
        },
        _removeItem: function (key) {
            $('#' + key).replaceWith('');
        },
        _changeItemMask: function (key, progress) {
            var width = $('#' + key).width() - 1;
            $('#' + key).find('.inline_mask').width(width * (Math.floor(progress) / 100));
        },
        _calcuFileSize: function (size) {
            var kSize = size / 1024;
            if (kSize < 1024) {
                return kSize.toFixed(2) + 'K';
            } else {
                var mSize = kSize / 1024;
                if (mSize < 1024) {
                    return mSize.toFixed(2) + 'M';
                } else {
                    var gSize = mSize / 1024;
                    return gSize.toFixed(2) + 'G';
                }
            }
        },
        _getFileNamesAndSize: function (files,key) {
            var filename = '';
            var size = 0;
            for (var i = 0; i < files.length; i++) {
                filename += files[i].name;
                size += files[i].size;
                _self._showImage(files[i], key);
            }
            return {name: filename, size: size};
        }
    };
    app.area = uploaderArea;
})(window.uploaderApp);

(function (app) {
    var _self;

    function uploaderMain(id, pid) {
        this._id = id;
        this._productID = pid;
        this._area = null;
        this.uploaders = [];

        this._URL = '/api/upload';
    }

    uploaderMain.prototype = {
        init: function () {
            _self = this;
            this._initArea();
            this._initQueueEng();
        },
        _initQueueEng: function () {
            uploaderQueue.Engine.setUrl(this._URL, this._productID);
            uploaderQueue.Engine.uploadStatusChanged = function (key, status) {
                if (status === uploaderQueue.UploadStatus.Uploading) {
                    _self._area.hideItemCancel(key);
                } else if (status === uploaderQueue.UploadStatus.Complete) {
                    _self._area.completeItem(key);
                    _self._area.showItemCancel(key);
                }
            }
            uploaderQueue.Engine.uploadItemProgress = function (key, e) {
                var progress = e.loaded / e.total;
                _self._area.changeItemProgress(key, Math.round(progress * 100));
            }
        },
        _initArea: function () {
            this._area = new app.area(this._id);
            this._area.init();
            this._area.drop = function (e) {
                var key = uploaderQueue.Queue.add({files: e.dataTransfer.files});
                uploaderQueue.Engine.run();
                return key;
            }
            this._area.cancelItem = function (key) {
                uploaderQueue.Queue.remove(key);
            }
        }
    };


    app.main = uploaderMain;
})(window.uploaderApp);