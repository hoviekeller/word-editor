var config = {
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "download": {
    "id": '',
    "type": '',
    "content": '',
    "filename": ''
  },
  "menubar": "custom edit view insert format tools table help",
  "plugins": `
    advlist anchor autolink autoresize autosave bbcode charmap code codesample directionality emoticons fullpage 
    fullscreen help hr image imagetools importcss insertdatetime legacyoutput link lists media nonbreaking noneditable 
    pagebreak paste preview print save searchreplace tabfocus table template textpattern toc visualblocks visualchars wordcount   
  `,
  "menu": {
    "custom": {
      "title": "File",
      "items": "newdocument openfile separator save saveas reset separator print preview darkmode"
    }
  },
  "toolbar": `
    styleselect |
    sizeselect |
    fontselect |
    fontsizeselect |
    bold italic underline |
    forecolor backcolor |
    bullist numlist |
    alignleft aligncenter alignright alignjustify |
    outdent indent |
    ltr rtl |
    fullpage
  `,
  "resize": {
    "timeout": null,
    "method": function () {
      var context = document.documentElement.getAttribute("context");
      if (context === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(function () {
          config.storage.write("interface.size", {
            "width": window.innerWidth || window.outerWidth,
            "height": window.innerHeight || window.outerHeight
          });
        }, 300);
      }
    }
  },
  "load": function () {
    config.storage.load(function () {
      var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default";
      var skin = window.matchMedia("(prefers-color-scheme: dark)").matches ? "oxide-dark" : "oxide";
      /*  */
      config.interface.skin = config.storage.read("skin") !== undefined ? config.storage.read("skin") : skin;
      config.interface.theme = config.storage.read("theme") !== undefined ? config.storage.read("theme") : theme;
      /*  */
      config.download.id = config.storage.read("id") !== undefined ? config.storage.read("id") : '';
      config.download.content = config.storage.read("content") !== undefined ? config.storage.read("content") : '';
      config.download.type = config.storage.read("type") !== undefined ? config.storage.read("type") : "text/html";
      config.download.filename = config.storage.read("filename") !== undefined ? config.storage.read("filename") : "result.html";
      /*  */
      config.app.start();
    });
    /*  */
    window.removeEventListener("load", config.load, false);
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "app": {
    "start": function () {
      var dark = document.getElementById("dark");
      var reload = document.getElementById("reload");
      var support = document.getElementById("support");
      /*  */
      reload.addEventListener("click", function () {
        document.location.reload();
      }, false);
      /*  */
      support.addEventListener("click", function () {
        var url = config.addon.homepage();
        chrome.tabs.create({"url": url, "active": true});
      }, false);
      /*  */
      dark.addEventListener("click", function () {
        config.interface.theme = config.interface.theme === "default" ? "dark" : "default";
        config.interface.skin = config.interface.skin === "oxide" ? "oxide-dark" : "oxide";
        /*  */
        config.storage.write("skin", config.interface.skin);
        config.storage.write("theme", config.interface.theme);
        /*  */
        config.interface.update();
      }, false);
      /*  */
      config.interface.load();
      config.listener.download();
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === '') config.port.name = "form";
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "750px";
              document.documentElement.style.height = "550px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "interface": {
    "id": '',
    "skin": '',
    "theme": '',
    "initialize": function () {
      document.documentElement.setAttribute("theme", config.interface.theme);
    },
    "setup": function (editor) {
      editor.on("init", config.interface.on.init);
      editor.on("change", config.interface.on.change);
      editor.on("execcommand", config.interface.on.execcommand);
    },
    "update": function () {
      if (config.interface.id) {
        var settings = tinyMCE.activeEditor.settings;
        /*  */
        settings.skin = config.interface.skin;
        settings.content_css = config.interface.theme;
        /*  */
        config.interface.initialize();
        tinyMCE.init(settings);
        /*  */
        tinyMCE.execCommand("mceRemoveEditor", false, config.interface.id);
        tinyMCE.execCommand("mceAddEditor", false, config.interface.id);
      }
    },
    "load": function () {
      config.interface.initialize();
      /*  */
      tinyMCE.baseURL = chrome.runtime.getURL("/data/interface/vendor/");
      tinyMCE.init({
        "theme": "silver",
        "branding": false,
        "image_advtab": true,
        "relative_urls" : true,
        "selector": "textarea",
        "directionality": "auto",
        "plugins": config.plugins,
        "toolbar": config.toolbar,
        "menubar": config.menubar,
        "width": "calc(100vw - 2px)",
        "save_enablewhendirty": true,
        "skin": config.interface.skin,
        "setup": config.interface.setup,
        "content_css": config.interface.theme,
        "menu": {"custom": config.menu.custom},
        "save_onsavecallback": config.listener.fileio.save,
        "images_upload_handler": config.listener.fileio.image
      });
    },
    "on": {
      "change": function () {    
        config.listener.change(3);
      },
      "execcommand": function (e) {
        if (e.command === "mceNewDocument") {
          config.download.id = '';
          config.download.type = '';
          config.download.content = '';
          config.download.filename = '';
          /*  */
          config.listener.change(4);
        }
      },
      "init": function (e) {
        config.editor = e.target;
        config.interface.id = config.editor.id;
        /*  */
        config.listener.fileio.drag();
        config.editor.shortcuts.add("Ctrl+O", '', config.listener.fileio.open);
        config.editor.shortcuts.add("Ctrl+S", '', config.listener.fileio.save);
        config.editor.setContent(config.download.content, {"format": "raw"});
        /*  */
        config.editor.ui.registry.addIcon("reset", `
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path d="M 9.8212753,13.365952 H 34.12766 V 20.455317 L 44.25532,10.327657 34.12766,0.199997 V 7.2893585 H 3.744681 V 22.987232 H 9.8212753 Z"/>
            <path d="M 38.178723,34.634044 13.872338,34.634037 13.872339,27.544678 3.744681,37.672337 13.872339,47.8 13.87234,40.710639 44.255317,40.710637 44.255318,25.012763 38.178724,25.012764 Z"/>
          </svg>
        `);
        /*  */
        config.editor.ui.registry.addIcon("darkmode", `
          <svg width="16" height="16" viewBox="0 0 122.8799 122.8799">
            <path d="M 63.550085,1.4875858 A 60.101027,60.101027 0 0 0 3.45,61.587666 60.101027,60.101027 0 0 0 63.550085,121.6899 60.101027,60.101027 0 0 0 119.56373,83.196612 50.463617,50.463617 0 0 1 102.0998,86.352622 50.463617,50.463617 0 0 1 51.637166,35.887862 50.463617,50.463617 0 0 1 65.189815,1.5691534 60.101027,60.101027 0 0 0 63.550085,1.4875858 Z"/>
          </svg>
        `);
        /*  */
        config.editor.ui.registry.addIcon("disk", `
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path d="M14,0 L2,0 C0.9,0 0,0.9 0,2 L0,16 C0,17.1 0.9,18 2,18 L16,18 C17.1,18 18,17.1 18,16 L18,4 L14,0 L14,0 Z M9,16 C7.3,16 6,14.7 6,13 C6,11.3 7.3,10 9,10 C10.7,10 12,11.3 12,13 C12,14.7 10.7,16 9,16 L9,16 Z M12,6 L2,6 L2,2 L12,2 L12,6 L12,6 Z"/>
          </svg>
        `);
        /*  */
        config.editor.ui.registry.addMenuItem("saveas", {
          "icon": "save",
          "text": "SaveAs",
          "onAction": config.listener.fileio.saveas
        });
        /*  */
        config.editor.ui.registry.addMenuItem("reset", {
          "text": "Reset",
          "icon": "reset",
          "onAction": config.listener.reset
        });
        /*  */
        config.editor.ui.registry.addMenuItem("save", {
          "text": "Save",
          "icon": "disk",
          "shortcut": "Ctrl+S",
          "onAction": config.listener.save
        });      
        /*  */
        config.editor.ui.registry.addMenuItem("openfile", {
          "icon": "plus",
          "shortcut": "Ctrl+O",
          "text": "Open file (.html)",
          "onAction": config.listener.fileio.open
        });        
        /*  */
        config.editor.ui.registry.addMenuItem("darkmode", {
          "icon": "darkmode",
          "text": "Dark Mode",
          "onAction": function () {
            var dark = document.getElementById("dark");
            if (dark) {
              dark.click();
            }
          }
        });
      }
    }
  },
  "listener": {
    "save": function () {
      tinyMCE.activeEditor.execCommand("mceSave");
    },
    "reset": function () {
      var flag = window.confirm("Are you sure you want to reset the editor content (to the last saved point)?");
      if (flag) {
        tinyMCE.activeEditor.execCommand("mceCancel");
      }
    },
    "change": function () {      
      var content = tinyMCE.activeEditor.getContent({"format": "raw"});
      if (content) {
        config.download.content = content;
        /*  */
        config.storage.write("id", config.download.id);
        config.storage.write("type", config.download.type);
        config.storage.write("content", config.download.content);
        config.storage.write("filename", config.download.filename);
      }
    },
    "download": function () {
      chrome.downloads.onChanged.addListener(function (e) {
        if (e.id === config.download.id) {
          if (e.state) {
            if (e.state.current === "complete")  {
              chrome.downloads.search({"id": e.id}, function (items) {
                if (items && items.length) {
                  var item = items[0];
                  if (item) {
                    if (item.mime) {
                      if (item.mime.startsWith("text/")) {
                        config.download.type = item.mime;
                        config.download.filename = item.filename;
                      }
                    }
                    /*  */
                    chrome.downloads.erase({});
                    URL.revokeObjectURL(config.download.url);
                  }
                }
              });
            }
          }
        }
      });
    },
    "fileio": {
      "url": function () {
        config.download.content = tinyMCE.activeEditor.getContent({"format": "raw"});
        config.download.type = config.download.type ? config.download.type : "text/html";
        /*  */
        return URL.createObjectURL((new Blob([config.download.content], {"type": config.download.type})));
      },
      "image": function (blobInfo, success, failure) {
        if (blobInfo) {
          var base64 = blobInfo.base64();
          if (base64) {
            success("data:image/png;base64," + base64);
          } else {
            failure('');
          }
        } else {
          failure('');
        }
      },
      "name": function () {
        var path = config.download.filename;
        /*  */
        var a = path.lastIndexOf('/');
        var b = path.lastIndexOf('\\');
        var filename = path.substring(b >= 0 ? b : a);
        var remove = filename.indexOf('\\') === 0 || filename.indexOf('/') === 0;
        /*  */
        config.download.filename = remove ? filename.substring(1) : filename;
        return config.download.filename;
      },
      "saveas": function () {
        var option = {};
        option["saveAs"] = true;
        option["url"] = config.listener.fileio.url();
        /*  */
        chrome.downloads.download(option, function (id) {
          config.download.id = id;
          config.listener.change(0);
        });
      },
      "save": function () {
        if (config.download.filename) {
          var option = {};
          option["conflictAction"] = "overwrite";
          option["url"] = config.listener.fileio.url();
          option["filename"] = config.listener.fileio.name();
          /*  */
          chrome.downloads.download(option, function (id) {
            config.download.id = id;
            config.listener.change(1);
          });
        }
      },
      "process": function (file) {
        if (file) {
          config.download.type = file.type;
          config.download.filename = file.name;
          /*  */
          var reader = new FileReader();
          reader.readAsText(file);
          reader.onload = function (e) {
            var content = e.target.result;
            if (content) {
              tinyMCE.activeEditor.setContent(content, {"format": "raw"});
              config.listener.change(2);
            }
          };
        }
      },
      "open": function () {
        var input = document.createElement("input");
        input.setAttribute("accept", "text/*");
        input.setAttribute("type", "file");
        input.click();
        /*  */
        input.addEventListener("change", function (e) {
          if (e.target) {
            if (e.target.files) {
              if (e.target.files.length) {
                config.listener.fileio.process(e.target.files[0]);
              }
            }
          }
        });
      },
      "drag": function () {
        document.body.style.background = "none";
        document.documentElement.addEventListener("drop", function (e) {e.preventDefault()});
        document.documentElement.addEventListener("dragover", function (e) {e.preventDefault()});
        /*  */
        var container = config.editor.contentDocument;
        container.addEventListener("dragover", function (e) {e.preventDefault()});
        container.addEventListener("drop", function (e) {
          e.preventDefault();
          /*  */
          if (e.dataTransfer) {
            if (e.dataTransfer.items) {
              if (e.dataTransfer.items.length) {
                for (var i = 0; i < e.dataTransfer.items.length; i++) {
                  var item = e.dataTransfer.items[i];
                  if (item) {
                    if (item.webkitGetAsEntry !== undefined) {
                      var entry = item.webkitGetAsEntry();
                      if (entry) {
                        if (entry.isFile) {
                          entry.file(function (file) {
                            if (file) {
                              config.listener.fileio.process(file);
                            }
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
window.addEventListener("beforeunload", config.resize.method, false);
