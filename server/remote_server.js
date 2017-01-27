// to access to the file system to read folder content
var filesystem = require("fs");
var mime = require('mime');

var json = "";

var projectFolder = "Projects/";

function _getAllFilesFromProjectByExtention(name, ext) {
    var result = [];
    try {
        filesystem.readdirSync(projectFolder + name).forEach(function (file) {
            file = projectFolder + name + '/' + file;
            var lookup = mime.lookup(file).split("/");
            if (lookup[1] === ext) {
                result.push([file, mime.lookup(file)]);
            }
        });
    } catch (e) {
        return e;
    }
    return result;
}

function _getProjectJson(project){
    var projectJson = require('../' + projectFolder + project + '/medias.json');
    return projectJson;
}

function _getNbFilesFromProject(name) {
    try {
        return filesystem.readdirSync(projectFolder + name).length;
    } catch (e) {
        return e;
    }
}

function _createProject(name, projectJson) {
    try {
        filesystem.mkdirSync(projectFolder + name);
        console.log(projectJson);
        filesystem.writeFile(projectFolder + name + '/medias.json', projectJson, function(err){
           if(err) console.log(err);
           else console.log('file created');
        });
    } catch (e) {
        return e;
    }
    return true;
}

function _getAllProjectsName() {
    var result = [];
    var objProjectAndFiles;
    var listProject = filesystem.readdirSync('Projects');
    for (var i = 0; i < listProject.length; i++) {
        objProjectAndFiles = [listProject[i], _getNbFilesFromProject(listProject[i])];
        result.push(objProjectAndFiles);
        console.log(objProjectAndFiles[0]);
    }
    return result;
}

function _getAllProjectsJson(){
    var result = [];
    var listProject = filesystem.readdirSync('Projects');
    for(var i = 0; i < listProject.length; i++){
        var json = require('../'+ projectFolder + listProject[i] + '/medias.json');
        result.push(json);
        console.log(json);
    }
    return result;
}

function _getTabFromTag(tag) {
    var parsedJSON = require('./../medias.json');

    for (var i = 0; i < parsedJSON.medias.length; i++) {
        if (!parsedJSON.medias[i].tags.includes(tag)) {
            // console.log("j'ai supprime : " + parsedJSON.medias[i].url);
            parsedJSON.medias.splice(i, 1);
        }
    }
    return parsedJSON;
}

module.exports = {
    getAllProjectsName: function () {
        return _getAllProjectsName();
    },
    createProject: function (name, projectJson, projectDirectories) {
        return _createProject(name, projectJson, projectDirectories);
    },
    getAllFilesFromProjectByExtention: function (name, ext) {
        return _getAllFilesFromProjectByExtention(name, ext);
    },
    getTabFromTag: function (tag) {
        return _getTabFromTag(tag);
    },
    getProjectTags: function(project){
        return _getProjectTags(project);
    },
    getProjectJson: function(project) {
        return _getProjectJson(project);
    },
    getAllProjectsJson: function(){
        return _getAllProjectsJson();
    }
};