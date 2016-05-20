var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var path = require("path");
var fs=require('fs');
var outer = this;

io.on('connection', function(client) {  
    console.log('Client connected...');
    var fs =outer.fs;
    //接受订阅消息,发送初始图片集合
    client.on('join', function(startPath) {
        if (!fs.existsSync(startPath)){
            console.log("no dir ",startPath);
            return;
        }
        var files=fs.readdirSync(startPath);
        var fs=[];
        for(var i=0;i<files.length;i++){
            var f=files[i];
            var fext = path.extname(f);
            if(fext=== ".jpg" || fext === ".png") {
                fs.push(f);
            }
        }
        if(fs.length>0){
            client.emit('pic_add', fs);
        }
    });

    client.on('messages', function(data) {
         client.emit('broad', data);
         client.broadcast.emit('broad',data);
    });

});



//var filePath = "/Users/chen4w/Documents/hs_pics/";
var filePath = "**/";
var gaze = require('gaze');

// Watch all .js files/dirs in process.cwd()
gaze([filePath+'*.png',filePath+'*.jpg'], function(err, watcher) {
  // Files have all started watching
  // watcher === this
  this.gio = io;
  // Get all watched files
  var watched = this.watched();

  // On file changed
  this.on('changed', function(filepath) {
    console.log(filepath + ' was changed');
  });

  // On file added
  this.on('added', function(filepath) {
    console.log(filepath + ' was added');
  });

  // On file deleted
  this.on('deleted', function(filepath) {
    console.log(filepath + ' was deleted');
  });

  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    var inf = filepath + ' was ' + event;
    console.log(inf);
    this.gio.emit('broad',inf)
  });

  // Get watched files with relative paths
  var files = this.relative();
});



app.use(express.static(__dirname + '/bower_components'));  
app.use(express.static(__dirname + '/pics'));
app.use(express.static(__dirname + '/tpl'));
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(4200);  