/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Handling the getting and setting of code
 ------------------------------------------------------------------
**/
(function(){

  function init() {
    // Configuration
    Espruino.Core.Config.add("AUTO_SAVE_CODE", {
      section : "Communications",
      name : "Auto Save",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
      description : "Save code to Chrome's cloud storage when clicking 'Send to Espruino'?",
      type : "boolean",
      defaultValue : true,
    });

    // Setup 'Add new JavaScript file' button
    Espruino.Core.App.addIcon({
      id: "codeAdd",
      icon: "code", // FIXME change icon
      title: "Add new JavaScript file",
      order: 100,
      area: {
        name: "code",
        position: "bottom"
      },
      click: function () {
        var newFile = {identifier:"", name: "untitled", extension: "js", content: "", location: ""};
        addNewFilePopup(newFile);
      }
    });
  
    // Setup 'Add new Blocky file' button
    Espruino.Core.App.addIcon({
      id: "blockyAdd",
      icon: "block", // FIXME change icon
      title: "Add new Blocky file",
      order: 200,
      area: {
        name: "code",
        position: "bottom"
      },
      click: function () {
        var newFile = {identifier:"", name: "untitled", extension: "xml", content: "<xml xmlns=\"http://www.w3.org/1999/xhtml\"></xml>", location: ""};
        addNewFilePopup(newFile);
      }
    });

    // TODO check if this still is used in multi-tab
    // get code from our config area at bootup
    Espruino.addProcessor("initialised", function(data,callback) {
      var code;
      if (Espruino.Config.CODE) {
        code = Espruino.Config.CODE;
        console.log("Loaded code from storage.");
      } else {
        code = Espruino.Core.Code.DEFAULT_CODE;
        console.log("No code in storage.");
      }
      Espruino.Core.EditorJavaScript.setCode(code);
      callback(data);
    });

    Espruino.addProcessor("sending", function(data, callback) {
      if(Espruino.Config.AUTO_SAVE_CODE)
        Espruino.Config.set("CODE", Espruino.Core.EditorJavaScript.getCode()); // save the code
      callback(data);
    });

    // try and save code when window closes //TODO Check if this still works
    function saveCode(e) { 
      if(Espruino.Config.AUTO_SAVE_CODE)
        Espruino.Config.set("CODE", Espruino.Core.EditorJavaScript.getCode());
    }
    window.addEventListener("close", saveCode);
    if (!Espruino.Core.Utils.isChromeWebApp()) // chrome complains if we use this
      window.addEventListener("beforeunload", saveCode);
  }

  // FIXME popup doesn't close immediatly
  // FIXME split in differnt functions
  // Open popup to name and create a new file
  function addNewFilePopup(newFile) {
    var fileType;

    switch(newFile.extension){
      case 'js':
        fileType = "JavaScript"
        break
      case 'xml':
        fileType = "Blocky"
        break
    }

    html =
        '<div class="addNewFilePopUp">' +
        '<input id="name' + fileType + 'File" type="text" placeholder="File name" autofocus/>' +
        '<button id="add' + fileType + 'File" class="popupBtn">Add ' + fileType + ' file</button>' +
        '<p id="errMsg"></p>' +
        '</div>';

    // Initializing popup
    popup = Espruino.Core.App.openPopup({
      title: "Create new " + fileType + " file",
      contents: html,
      position: "center"
    });

    // Add onClick logic to add file and close popup
    document.getElementById("add" + fileType + "File").addEventListener('click', function() {
      // Get input
      var newName = document.getElementById("name" + fileType + "File").value.trim();
      var errMsgHolder = document.getElementById("errMsg");

      // Validate input
      if (newName == "" || newName.length == 0) {
        errMsgHolder.innerHTML = "Name is required";
        return false;
      } else if (!(/^\S{2,}$/.test(newName))) {
        errMsgHolder.innerHTML = 'Name cannot contain whitespace';
        return false;
      } else if(!(/^[a-zA-Z]+$/.test(newName))){
        errMsgHolder.innerHTML = 'Only alphabets allowed';
        return false;
      } else {
        errMsgHolder.innerHTML = '';
      }

      // Set file name
      newFile.name = newName;

      // file.js function
      Espruino.Core.File.setFilesArray(newFile);

      // Close the popup
      popup.close();  
    });
  }

  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    return $("#divblockly").is(":visible");
  };

  function switchToBlockly() {
    $("#divcode").hide();
    $("#divblockly").show();
    // Hack around issues Blockly have if we initialise when the window isn't visible
    Espruino.Core.EditorBlockly.setVisible();
  }

  function switchToCode() {
    $("#divblockly").hide();
    $("#divcode").show();

    Espruino.Core.EditorJavaScript.madeVisible(); // FIXME "TypeError: Cannot read property 'madeVisible' of undefined"
  }

  function getEspruinoCode(callback) {
    Espruino.callProcessor("transformForEspruino", getCurrentCode(), callback);
  }

  function getCurrentCode() {
    if (isInBlockly()) {
      return Espruino.Core.EditorBlockly.getCode();
    } else {
      return Espruino.Core.EditorJavaScript.getCode();
    }
  }

  function focus() {
    if (isInBlockly()) {
      document.querySelector("#divblockly").focus();
    } else {
      Espruino.Core.EditorJavaScript.getCodeMirror().focus()
    }
  }

  Espruino.Core.Code = {
    init : init,
    getEspruinoCode : getEspruinoCode, // get the currently selected bit of code ready to send to Espruino (including Modules)
    getCurrentCode : getCurrentCode, // get the currently selected bit of code (either blockly or javascript editor)
    isInBlockly: isInBlockly,
    switchToCode: switchToCode,
    switchToBlockly: switchToBlockly,
    focus : focus, // give focus to the current code editor
    DEFAULT_CODE : "var  on = false;\nsetInterval(function() {\n  on = !on;\n  LED1.write(on);\n}, 500);"
  };
}());
