// We need to use the express framework: have a real web servler that knows how to send mime types etc.
var express = require('express');
var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var remote_server = require('./server/remote_server');

var project_name;

// Init globals variables for each module required
var app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);

// launch the http server on given port
server.listen(8080);

// Indicate where static files are located. Without this, no external js file, no css...  
app.use(express.static(__dirname + '/'));

// routing
// if somebody try to access to the root
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Vous avez trouvé le point d\'origine du web !');
});

// route for the 'SurfaceService' namespace
app.get('/SurfaceService', function (req, res) {
    res.sendFile(__dirname + '/client/surface_client.html');
});

// route for the 'DeviceService' namespace
app.get('/DeviceService', function (req, res) {
    res.sendFile(__dirname + '/client/device_client.html');
});

app.post('/DeviceService', function (req, res) {
    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.imgUploadDir = path.join(__dirname, '/Projects/'+project_name);


    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        fs.rename(file.path, path.join(form.imgUploadDir, file.name));
    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);

});

// route for the "RemoteControl" namespace
app.get('/RemoteControl', function (req, res) {
    res.sendFile(__dirname + '/client/remote_control_client.html');
});

// route for the 'BoardService' namespace
app.get('/BoardService', function (req, res) {
    res.sendFile(__dirname + '/client/board_client.html');
});

// namespace
// manage the event on the namespace 'SurfaceService'
var surface_nsp = io.of('/SurfaceService');
surface_nsp.on('connection', function (socket) {
    var surface_server = require('./server/surface_server');
    console.log("un client connecté sur le SurfaceService");

    // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
        var result = surface_server.getAllFilesFromFolder("uploads");
        // send the json to the client
        // hack : remove the 2 last characters to remove the last ",}" and replace by "}}"
        socket.emit('folder', "{" + result.substring(0, result.length - 2) + "}}");
    });
});

// manage the event on the namespace 'DeviceService'
var device_nsp = io.of('/DeviceService');
device_nsp.on('connection', function (socket) {
    console.log("un client connecté sur le DeviceService");
    socket.on('addToJson', function(message, project){
        var imgData = require('./Projects/' + project + '/medias.json');
        imgData['medias'].push(JSON.parse(message));
        var jsonString = JSON.stringify(imgData);
        project_name = project;
        fs.writeFile("./Projects/" +project + '/medias.json', jsonString);
    });

    socket.on('projectName', function(projectName){
        project_name = projectName;
    });

    // Quand le serveur reçoit un signal de type "message" du client
    // Start manage the projects
    socket.on('getAllProjects', function () {
        var names = remote_server.getAllProjectsName();
        var jsonList = remote_server.getAllProjectsJson();
        socket.emit('returnGetAll', names, jsonList);
    })
    socket.on('createProject', function (name, projectJson) {
        console.log(projectJson);
        var json = String(projectJson);
        var isCreated = remote_server.createProject(name, projectJson);
        socket.emit('returnCreated', isCreated);
    })

    socket.on('getProjectJson', function(project){
        var projectJson = remote_server.getProjectJson(project);
        console.log(projectJson);
        socket.emit('returnProjectJson', projectJson, project);
    })
    socket.on('getViewProjectJson', function(project){
        var projectJson = remote_server.getProjectJson(project);
        console.log(projectJson);
        socket.emit('returnViewProjectJson', projectJson, project);
    })
});


// manage the event on the namespace 'RemoteControl'
var remote_control_nsp = io.of('/RemoteControl');
remote_control_nsp.on('connection', function (socket) {
    console.log("un client connecté sur le RemoteControl");

    // Quand le serveur reçoit un signal de type "message" du client
    // Start manage the projects
    socket.on('getAllProjects', function () {
        var answer = remote_server.getAllProjectsName();
        socket.emit('returnGetAll', answer);
    })
    socket.on('createProject', function (name) {
        var isCreated = remote_server.createProject(name);
        socket.emit('returnCreated', isCreated);
    })
    // End manage the projects

    // Start listen filter
    socket.on('displayAll', function (name) {
        var answer = remote_server.getAllFilesFromProject(name);
        console.log(answer);
        socket.emit('filterResult', answer);
        board_nsp.emit('displayAll', "../images/star_wars.jpg");
    });
    socket.on('displayGif', function (name, ext) {
        var answer = remote_server.getAllFilesFromProjectByExtention(name, ext);
        console.log(answer);
        socket.emit('filterResult', answer);
        board_nsp.emit('displayGif', "../images/star_wars.jpg");
    });
    socket.on('displayJpg', function (name, ext) {
        var answer = remote_server.getAllFilesFromProjectByExtention(name, ext);
        console.log(answer);
        socket.emit('filterResult', answer);
        board_nsp.emit('displayJpg', "../images/star_wars.jpg");
    });
    socket.on('displayNothing', function () {
        board_nsp.emit('hideAll', "../images/star_wars.jpg");
    });
    // End listen filter

    socket.on('tag', function (message) {
        var tab = remote_server.getTabFromTag(message);
        board_nsp.emit('tag', tab);
    });

    // Start remote control
    socket.on('goRight', function () {
        board_nsp.emit('goRight');
    });
    socket.on('goLeft', function () {
        board_nsp.emit('goLeft');
    });
});

// manage the event on the namespace 'BoardService'
var board_nsp = io.of('/BoardService');
board_nsp.on('connection', function (socket) {
    console.log("un client connecté sur le BoardService");
});