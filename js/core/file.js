/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var loadFileCallback;

  const MIMETYPE_JS = ".js,.txt,application/javascript,text/plain";
  const MIMETYPE_XML = ".xml,text/xml";

  var tabHtml, fileHtml, code, files = [], currentFile;
  
  // Getting files from Storage
  getFileStorage();

  function init() {
    // Configuration

    // Add stuff we need
    Espruino.Core.App.addIcon({
      id: "openFile",
      icon: "folder-open",
      title : "Open File",
      order: 100,
      area: {
        name: "code",
        position: "top"
      },
      click: function() {
        if (Espruino.Core.Code.isInBlockly())
          loadFile(Espruino.Core.EditorBlockly.setXML, currentFile.name, MIMETYPE_XML);
        else
          loadFile(Espruino.Core.EditorJavaScript.setCode, currentFile.name, MIMETYPE_JS);
      }
    });

    Espruino.Core.App.addIcon({
      id: "saveFile",
      icon: "save",
      title : "Save File",
      order: 200,
      area: {
        name: "code",
        position: "top"
      },
      click: function() {
        if (Espruino.Core.Code.isInBlockly())
          Espruino.Core.Utils.fileSaveDialog(convertToOS(Espruino.Core.EditorBlockly.getXML()), currentFile.name + '.' + currentFile.extension, setCurrentFileName);
        else
          Espruino.Core.Utils.fileSaveDialog(convertToOS(Espruino.Core.EditorJavaScript.getCode()),  currentFile.name + '.' + currentFile.extension, setCurrentFileName);
      }
    });

    addTabsOnInit();
    addHandlers();
  }

  // Change name of current opened file
  function setCurrentFileName(filename) {
    var currentIndex = findItemInArray(files, currentFile);
    var splittedName = filename.split(".", 2);
    currentFile.name = splittedName[0];
    files[currentIndex].name = splittedName[0];

    // Save changes
    saveCurrentFile();
  }

  // Register tab actions
  function addHandlers() {
    $('.tab-link').on('click',function(){
      var file = getFileByIdentifier($(this).data('id'));
      if(file){
        openCode(file);
      } else if (files.length !== 0) {
        openCode(files[0]);
      }
    });
    $('.file-link').on('click',function(){
      var file = getFileByIdentifier($(this).data('id'));
      openCode(file);
    });
    $('.close').on('click',function(){
      var file = getFileByIdentifier($(this).data('id'));
      removeFile(file);
      if(files.length === 0){
        createEmptyFile();
      }
    });
  }

  // Add tabs and project files on start
  function addTabsOnInit(){
    if(files.length !== 0){
      currentFile = files[0];
    }

    var parent = $(".editor--code .editor__canvas");
    
    // Add the tabs layout and loop through Tabs array
    var tTabs = $('<div id="tabs" class="tabs-container">\n').appendTo(parent);
    // populate tabs row
    for (var i = 0; i < files.length; i++)
    {
        tabHtml = createTabHTML(files[i]);
        $(tabHtml).appendTo(".tabs-container");
    }

    // Add the files layout and loop through Files array
    var pf = $('<div class="files-dropdown">\n').html('<span class="icon-down sml"></span>').prependTo(tTabs);
    var file = $('<div id="files" class="files-container">\n').appendTo(pf);
    // populate files menu
    for (var j = 0; j < files.length; j++)
    {
        fileHtml = createFileHTML(files[j]);
        $(fileHtml).appendTo(".files-container");
    }
    $('</div>\n').appendTo(file);
    $('</div></div>').appendTo(parent);
  }

  // Save current file in files array and in chrome storage
  function saveCurrentFile(){
    if(currentFile && currentFile !== null){
      // Check if the file exist inthe files array
      if(isItemInArray(files, currentFile)){
        var currentIndex = findItemInArray(files, currentFile);
        // Check if the current file was js or xml file and return code
        if (currentFile.extension === 'js') {
          code = Espruino.Core.EditorJavaScript.getCodeMirror().getValue();
        } else {
          code = Espruino.Core.EditorBlockly.getXML();
        }
        currentFile.content = code;

        files[currentIndex] = currentFile;
        setFileStorage();
      }else{
        currentFile = null;
      }
    }
  }

  // Create a new empty JS file
  function createEmptyFile(){
    var newFile = {identifier: "", name: "HelloWorld", extension: "js", content: Espruino.Core.Code.DEFAULT_CODE}
    setFilesArray(newFile);
  }

  // Get File by identifier
  function getFileByIdentifier(id){
    return files.find(x => x.identifier === id);
  }

  // Remove file from files array
  function removeFile(item){
    if(isItemInArray(files, item)){
      //Find array index of file
      var index = findItemInArray(files, item);
      if (files[index] === item) {
        // Remove item from array
        files.splice(index, 1);
        // Remove file from file dropdown
        $('#files').children('#fullFile' + item.identifier).remove();
        // Remove file from the tabbar
        $('#tabs').children('#fullTab' + item.identifier).remove();
      }
    }
  }

  // Check if a item is already in a array
  function isItemInArray(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            return true;
        }
    }
    return false;
  }

  // Check what the index is of a item in a array
  function findItemInArray(array, item) {
    for (var index = 0; index < array.length; index++) {
      if (array[index] === item) {
        return index;
      }
    }
    return false;
  }

  // Open code in editor
  function openCode(file){
    // Save current file
    saveCurrentFile();

    // Check if file exists
    if(isItemInArray(files, file)){
      // Check if tab is inactive
      if (!isActive(file)){
        // Find in array
        var newIndex = findItemInArray(files, file);
        // Check which tab to set code
        if (files[newIndex] === file) {
          if (file.extension === 'xml') {
            Espruino.Core.Code.switchToBlockly();
            Espruino.Core.EditorBlockly.setXML(files[newIndex].content);        
          } else {
            Espruino.Core.Code.switchToCode();
            Espruino.Core.EditorJavaScript.setCode(files[newIndex].content);
          }
        }
      }
      // Set the right tab active
      setActive(file);
      currentFile = file;
    }
  }

  $.fn.exists = function () {
    return this.length !== 0;
  };

  // Tab set active logic
  function setActive(file){
    // Get all elements with class="tablinks" and remove the class "active"
    var previousElement = $('.tab-link.active');
    previousElement.removeClass('active');
    var element = $('#fullTab' + file.identifier);
    // Check if element isn't null
    if (element.exists()) {
      element.addClass("active");
    } else {
      previousElement.parent().addClass("active");
    }
  }

  // Check if tab is already active
  function isActive(file){
    var tablinks = $(".tab-link");

    if (tablinks[findItemInArray(files, file)] !== undefined) {
        if (tablinks[findItemInArray(files, file)].className === "tab-link active") {
            return true;
        }
    } else {
      return false;
    }
  }

  // Adding the new file to the storage and the tabbar
  function setFilesArray(newFile){

    // Check if the file isn't already in the Files array
    if(!isItemInArray(files, newFile)) {
      newFile.identifier = createIdentifier(newFile); 

      files.push(newFile);

      fileHtml = createFileHTML(newFile);
      $(fileHtml).appendTo(".files-container");

      tabHtml = createTabHTML(newFile);
      $(tabHtml).appendTo(".tabs-container");
    }

    addHandlers();
    openCode(newFile);
    setFileStorage();
  }

  // Creating a id for every file that is opend to keep it unique
  function createIdentifier(file){
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;

    result = file.name + "_" + file.extension + "_";
    
    for ( var i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  // Save files in Storage
  function setFileStorage(){
    chrome.storage.sync.set({'files': files}, function() {});
  }

  // Get files from Storage
  function getFileStorage(){
    chrome.storage.sync.get('files', function(data) {
      if(data.files != undefined && data.files.length !== 0){
        files = data.files;
        return files;
      } else {
        console.log(files);
        createEmptyFile();
      }
    });
  }

  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertFromOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n");
  };

  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertToOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };

  // Load a file from the os
  function loadFile(callback, filename, mimeType) {
    if (chrome.fileSystem) {
      // Chrome Web App / NW.js
      chrome.fileSystem.chooseEntry({type: 'openFile', suggestedName:filename}, function(fileEntry) {
        if (!fileEntry) return;
        fileEntry.file(function(file) {
          var reader = new FileReader();

          reader.onload = function(e) {
            // Get the name and code of the file and add it to the files array
            var splittedName = fileEntry.name.split(".", 2);
            var newFile = {identifier: "", name: splittedName[0], extension: splittedName[1], content: e.target.result};
            setFilesArray(newFile);
          };
          reader.onerror = function() {
            Espruino.Core.Notifications.error("Error Loading", true);
          };
          reader.readAsText(file);
        });
      });
    } else {
      Espruino.Core.Utils.fileOpenDialog({id:"code",type:"text",mimeType:mimeType}, function(data, mimeType, fileName) {
        callback(convertFromOS(data));
      });
    }
  }

  // Visualization of files in dropdown view
  function createFileHTML(file){
    var icon = '';
    switch(file.extension){
      case 'js' : 
      icon = 'icon-code';
      break
      case 'xml' : 
      icon = 'icon-block';
      break
      default :
      icon = 'icon-code';
      break
    }
    return  '<div id="fullFile' + file.identifier + '" class="file-link" data-id="' + file.identifier + '">' +
            '<span class="file-icon ' + icon + ' sml"></span>' +
            '<span class="file-title" data-name="' + file.name + '" title="' + file.name + '.' + file.extension + '">' + file.name + '.' + file.extension + '</span>' +
            '<span class="file-close close" data-id="' + file.identifier + '">X</span>' +
            '</div>\n';
  }

  // Visualization of tabs in the tabbar
  function createTabHTML(file){
    var icon = '';
    switch(file.extension){
      case 'js' : 
      icon = 'icon-code';
      break
      case 'xml' : 
      icon = 'icon-block';
      break
      default :
      icon = 'icon-code';
      break
    }
    return  '<div id="fullTab' + file.identifier + '" class="tab-link" data-id="' + file.identifier + '">' +
            '<span class="tab-icon ' + icon + ' sml"></span>' +
            '<span class="tab-title" data-name="' + file.name + '" title="' + file.name + '.' + file.extension + '">' + file.name + '.' + file.extension + '</span>' +
            '<span class="tab-close close" data-id="' + file.identifier + '">X</span>' +
            '</div>\n';
  }

  Espruino.Core.File = {
    init : init,
    setFilesArray : setFilesArray,
    removeFile : removeFile,
    setActive : setActive
  };
}());
