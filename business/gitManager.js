var nodegit = require("nodegit");
var fs = require("fs");
var promise = require("promise");
var spath = require("path");
var pathConfig = require("../routes/setupConfig.js");
var logger = require("../helper/loghelper.js");
var fse = require("fs-extra");
var exec = require('child_process').exec;
var common = require("../helper/common.js");

module.exports.io = {
    exist: exist,
    copy : copy
};
module.exports.git = {
    git_position: pathConfig.git.git_xw,
    git_user: pathConfig.git.git_userName,
    git_email: pathConfig.git.git_userEmail,
    git_tempConfig: pathConfig.git.git_tempConfig,
    wx_downloadurl: pathConfig.git.wx_downloadurl,
    createRepository: createRepository,
    openRepository: openRepository,
    uploadFile: uploadFile,
    deleteFile: deleteFile,
    getFileByName: getFileByName,
    getFiles: getFiles,
    structure: structure,
    saveData: saveData,
    commitFiles: commitFiles,
    renameFile: renameFile,
    getLogForFile: getLogForFile
};
function exist(filePath, callback) {
    var ab_Path = spath.join(module.exports.git.git_position , filePath);
    fs.exists(ab_Path, function (isExist) {
        callback && callback(isExist, ab_Path);
    })
}
function copy(src, dst) {
    fs.readdir(src, function (err, paths) {
        if (err) {
            throw err;
        }
        paths.forEach(function (path) {
            var _src = spath.join(src , path),
                _dst = spath.join(dst , path),
                readable, writable;
            fs.stat(_src, function (err, st) {
                if (err) {
                    throw err;
                }
                if (st.isFile()) {
                    readable = fs.createReadStream(_src);
                    writable = fs.createWriteStream(_dst);
                    readable.pipe(writable);
                }
                else if (st.isDirectory()) {
                    fs.exists(_dst, function (isExist) {
                        if (exists) {
                            copy(_src, _dst);
                        }
                    });
                }
            });
        });
    });
}
function createRepository(rpPath, callback) {
    try {
        var abPath = spath.join(module.exports.git.git_position , rpPath);
        nodegit.Repository.open(abPath)
        .then(function (rep) {
            callback && callback(true, rep);
        }, function (err) {
            nodegit.Repository.init(abPath, 0).then(function (rep) {
                fs.exists(module.exports.git.git_tempConfig, function (isExist) {
                    if (!isExist) {
                        var msg = "模板文件不存在！";
                        logger.error(msg);
                        callback && callback(false, msg);
                    } else {
                        var src = spath.join(rep.workdir() , ".git");
                        copy(module.exports.git.git_tempConfig, src);
                        callback && callback(true, rep);
                    }
                })
            });
        }).done();
    } catch (e) {
        callback && callback(false, e);
        logger.error(e);
    }
}
function openRepository(rpPath, callback) {
    var abPath = spath.join(module.exports.git.git_position , rpPath);
    nodegit.Repository.open(abPath)
    .then(function (rep) {
        //nodegit.Stash.save(rep, rep.defaultSignature(), "更新数据", 0);
        return { s: 1, p: rep };
    }, function (err) {
        createRepository(rpPath, function (flag, rep) {
            var rlt;
            if (flag) {
                rlt = { s: 1, p: rep };
            } else {
                rlt = { s: 0, desc: rep };
            }
            callback && callback(rlt);
        });
    })
    .done(function (rlt) {
        callback && callback(rlt);
    });
}
function uploadFile(files, midPath, rpname, callback) {
    try {
        var upfiles = files.files;
        if (!upfiles) return;
        handleUpload(upfiles, 0, midPath, rpname, function (info) {
            if (info.s == 1) {
                callback && callback(false, info.desc);
                return;
            }
            commitFiles(rpname, function (index) {
                var lth = upfiles.length;
                for (var i = 0; i < lth; i++) {
                    index.addByPath(spath.join(midPath, (upfiles[i].name || upfiles[i])));
                }
            }, callback);
        });
    } catch (e) {
        callback && callback(false, e);
        logger.error(e);
    }
}

function handleUpload(files, index , midPath, rpname, callback) {
    var name = files[index].name;
    var tempPath = files[index].path;
    var abPath = spath.join(module.exports.git.git_position, rpname, midPath, name);
    
    if (tempPath) {
        var ensureFile = promise.denodeify(fse.ensureFile);
        ensureFile(abPath)
        .then(function () {
            var rename = promise.denodeify(fs.rename);
            rename(tempPath, abPath)
            .then(function () {
                var unlink = promise.denodeify(fs.unlink);
                unlink(tempPath);
            }).then(function () {
                var nIndex = index + 1;
                if (nIndex < files.length) {
                    handleUpload(files, nIndex, midPath, rpname, callback);
                } else {
                    callback && callback({ s: 0, desc: "success" });
                }
            });
        });
    }
}
function deleteHandle(names, index , rpname, callback){
    var lth = names.length;
    if (index >= lth) {
        callback && callback();
        return;
    }
    var filePath = spath.join(module.exports.git.git_position ,rpname, names[index]);
    var exists = promise.denodeify(fs.exists);
    exists(filePath)
    .then(function () {}, function (flg) {
        if (flg) {
            fs.unlink(filePath, function () { });
        }
    })
    .done(function () {
        index = index + 1;
        deleteHandle(names, index, rpname, callback); 
    });
}
function deleteFile(fnames, rpname, callback) {
    try {
        commitFiles(rpname, function (index) {
            for (var i = 0; i < fnames.length; i++) {
                index.removeByPath(fnames[i]);
            }
        }, function (flag, desc) {
            deleteHandle(fnames, 0, rpname);
            callback && callback(flag, desc);
        });
    }catch (e) {
        callback && callback(false, e);
        logger.error(e);
    }
}
//处理图片请
function getFileByName(name, rpname, callback){
    try {
        var filePath = spath.join(module.exports.git.git_position , rpname, name);
        var exists = promise.denodeify(fs.exists);
        exists(filePath)
        .then(function (err) {
            logger.error(err);
            callback && callback({ status: 1, desc: err });
        }, function (flag) {
            if (flag) {
                var readFile = promise.denodeify(fs.readFile);
                readFile(filePath)
                .then(function (content) {
                    callback && callback({ status: 0, data: content });
                }, function (err) {
                    callback && callback({ status: 1, desc: err });
                })
                .done();
            } else {
                callback && callback({ status: 1, desc: "异常" });
            }
        });
    } catch (e) {
        callback && callback({ status: 1, desc: e });
        logger.error(e);
    }
}
//获取文件名字
function getFiles(rpname, midPath, callback) {
    var names = [];
    try {
        openRepository(rpname, function (rlt) {
            if (rlt.s == 1) {
                var repo = rlt.p;
                fse.ensureDirSync(spath.join(repo.workdir() , midPath));
                if (midPath != "") {
                    repo.getMasterCommit()
                    .then(function (firstCommitOnMaster) {
                        return firstCommitOnMaster.getEntry(midPath);
                    }, function (err) {
                        callback && callback(true, names);
                    })
                    .then(function (entry) {
                        return entry.getTree();
                    }, function (err) {
                        callback && callback(true, names);
                    })
                    .then(function (tree) {
                        if (!tree || !tree.walk) return;
                        var walker = tree.walk();
                        walker.on("entry", function (entry) {
                            names.push(entry.path());
                        });
                        walker.start();
                    }, function (err) {
                        callback && callback(false, names);
                    })
                    .done(function () {
                        callback && callback(true, names);
                    })
                } else {
                    repo.getMasterCommit()
                    .then(function (firstCommitOnMaster) {
                        return firstCommitOnMaster.getTree();
                    }, function (err) {
                        callback && callback(true, names);
                    })
                    .then(function (tree) {
                        if (!tree || !tree.walk) return;
                        var walker = tree.walk();
                        walker.on("entry", function (entry) {
                            names.push(entry.path());
                        });
                        walker.start();
                    }, function (err) {
                        callback && callback(false, names);
                    })
                    .done(function () {
                        callback && callback(true, names);
                    })
                }
            } else {
                callback && callback(false, names);
                logger.error(rlt.desc);
            }
        });
    } catch (e) {
        callback && callback(false, names);
        logger.error(e);
    }
}
function structure(src, callback) {
    var jsonObj = { files: [], dir: [] }
    fs.exists(src, function (isExist) {
        if (isExist) {
            fs.readdir(src, function (err, paths) {
                if (err) {
                    throw err;
                }
                var count = 0;
                paths.forEach(function (path, i) {
                    var _src = spath.join(src , path);
                    fs.stat(_src, function (err, st) {
                        if (err) {
                            throw err;
                        }
                        if (st.isFile()) {
                            jsonObj.files.push(path);
                        }
                        else if (st.isDirectory()) {
                            jsonObj.dir.push(path);
                        }
                        count++;
                        if (count == paths.length)
                            callback && callback(JSON.stringify(jsonObj));
                    });
                });
            });
        } else {
            callback && callback({});
        }
    });
}
function saveData(data, callback) {
    if (data) {
        var isUpdate = false;
        var savePath;
        if (data.newname && data.newname !== data.name) {
            isUpdate = true;
            savePath = spath.join(module.exports.git.git_position, data.repname, data.midpath, data.newname);
        } else {
            savePath = spath.join(module.exports.git.git_position, data.repname, data.midpath, data.name);
        }
        var ensureFile = promise.denodeify(fse.ensureFile);
        ensureFile(savePath)
        .then(function (err) {
            if (err) {
                callback && callback(false, err);
                return;
            }
            fs.writeFile(savePath, data.ct, function (err) {
                if (err) {
                    callback && callback(false, err);
                    return;
                }
                if (isUpdate) {
                    commitFiles(data.repname, function (index) {
                        index.removeByPath(spath.join(data.midpath, data.name));
                        index.addByPath(spath.join(data.midpath, data.newname));
                    }, function (flag, desc) {
                        deleteHandle([spath.join(data.midpath, data.name)], 0, data.repname);
                        callback && callback(flag, desc);
                    })
                } else {
                    commitFiles(data.repname, function (index) {
                        index.addByPath(spath.join(data.midpath, data.name));
                    }, callback)
                }
            });
        }, function (err) {
            callback && callback(false, err);
        });
    } else {
        callback && callback(false,"参数无效！");
    }
}
function renameFile(rpname, name, newName, callback) {
    var disPath = spath.join(module.exports.git.git_position, rpname);
    
    fs.exists(disPath, function (status) {
        if (status) {
            var cmd = '';
            if (process.platform === "win32")
                cmd += 'D: && ';
            cmd = 'cd ' + disPath + ' && ';
            cmd += 'git mv \'' + name + '\' \'' + newName + '\' && ';
            cmd += 'git commit -m \'重命名\'';
            
            var child = exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    callback && callback(false, err);
                } else {
                    callback && callback(true, name);
                }
            });
        } else
            callback && callback(false, err);
    });
    
}
function getLogForFile(rpname, name, callback) {
    var disPath = spath.join(module.exports.git.git_position, rpname);
    
    fs.exists(disPath, function (status) {
        if (status) {
            var cmd = '';
            if (process.platform === "win32")
                cmd += 'D: && ';
            cmd = 'cd ' + disPath + ' && ';
            if(name)
                cmd += 'git log ' + name;
            else
                cmd += 'git log';

            var child = exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    callback && callback(false, err);
                } else {
                    callback && callback(true, common.formatLog(stdout) );
                }
            });
        } else
            callback && callback(false, err);
    });
    
}
function commitFiles(rpname, act_callback, callback) {
    openRepository(rpname, function (rlt) {
        if (rlt.s == 1) {
            var index, oid;
            var repo = rlt.p;
            repo.openIndex()
            .then(function (indexResult) {
                index = indexResult;
                return index.read(1);
            }, function (err) {
                logger.error(err);
            })
            .then(function () {
                act_callback && act_callback(index);
                return index.write();
            }, function (err) {
                logger.error(err);
            })
            .then(function () {
                return index.writeTree();
            }, function (err) {
                logger.error(err);
            })
            .then(function (oidResult) {
                oid = oidResult;
                return nodegit.Reference.nameToId(repo, "HEAD");
            }, function (err) {
                logger.error(err);
            })
            .then(function (head) {
                return repo.getCommit(head);
            }, function (err) {
                var author = nodegit.Signature.create(module.exports.git.git_user, module.exports.git.git_email, 123456789, 60);
                var committer = nodegit.Signature.create(module.exports.git.git_user, module.exports.git.git_email, 987654321, 90);
                return repo.createCommit("HEAD", author, committer, "system", oid, []);
            })
            .then(function (parent) {
                var author = nodegit.Signature.create(module.exports.git.git_user, module.exports.git.git_email, 123456789, 60);
                var committer = nodegit.Signature.create(module.exports.git.git_user, module.exports.git.git_email, 987654321, 90);
                return repo.createCommit("HEAD", author, committer, "system", oid, [parent]);
            }, function (err) { })
            .done(function (commitId) {
                callback && callback(true, "success");
            });
                    
        } else {
            callback && callback(false, rlt.desc);
            logger.error(rlt.desc);
        }
    });
}
