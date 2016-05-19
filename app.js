var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
io.on('connection', function(client) {  
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
    });

    client.on('messages', function(data) {
         client.emit('broad', data);
         client.broadcast.emit('broad',data);
    });

});

var fs = require('fs');
var path = require("path");

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

/*
    fs.readdir(filePath,function(err,files){
    if(err){
        console.log(err);
        return;
    }
    files.forEach(function(filename){
        //filePath+"/"+filename不能用/直接连接，Unix系统是”/“，Windows系统是”\“
        var fpath = path.join(filePath,filename);
        fs.stat(fpath,function(err, stats){
            if (err) throw err;
            //文件
            if(stats.isDirectory()){
                fs.watch(fpath, {encoding: 'utf8'},function(event, filename) {
                    var fn = Buffer(filename, 'binary').toString('utf8');
                    var fp=path.join(fpath,fn);
                    if (fs.existsSync(fp)) {
                        console.log(fp+' add.'+event);
                    }else{
                        console.log(fp+' remove.');
                    }
                });
                console.log(filename+' watched.');
            }
        });        
    });
});
*/

app.use(express.static(__dirname + '/bower_components'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(4200);  