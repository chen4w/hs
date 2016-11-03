
var path = require("path");
var async = require('async');
var settings = require('./settings.js');
const uri_pics ='/pics';
const port = 4200;

async.auto({  
    config: function(cb){
        console.log('pics root:'+settings.pic_root);
        cb(null,{
            watchPath:'**/'
        });
    },
    file:['config','network', function (scope,cb) {  
        var filePath = scope.config.watchPath;
        var gaze = require('gaze');

        var io = scope.network.io;
        // Watch all .js files/dirs in process.cwd()
        gaze([filePath+'*.png',filePath+'*.jpg'], function(err, watcher) {
            // Files have all started watching
            // Get all watched files
            var watched = this.watched();

            // On file changed
            this.on('changed', function(filepath) {
                console.log(filepath + ' was changed');
            });

            // On file added
            this.on('added', function(fp) {
                io.emit('added',[fp.substring(settings.pic_root.length)]);
            });

            // On file deleted
            this.on('deleted', function(filepath) {
                io.emit('deleted',[fp.substring(settings.pic_root.length)])
            });

            // On changed/added/deleted
            this.on('all', function(event, filepath) {
                var inf = filepath + ' was ' + event;
                console.log(inf);
                io.emit('all',inf)
            });
        });        
        cb(null, gaze);  
    }],  
  
    network: function (cb) {  
        var express = require('express');  
        var app = express();  
        var server = require('http').createServer(app);  
        var io = require('socket.io')(server);
        var fs=require('fs');
        io.fs = fs;
        
        io.on('connection', function(client) {  
            console.log('Client connected...');
            //接受订阅消息,发送初始图片集合
            client.on('join', function(sp) {
                var fs = this.server.fs;
                var startPath=settings.pic_root+sp;
                
                if (!fs.existsSync(startPath)){
                    console.log("no dir ",startPath);
                    return;
                }
                var files=fs.readdirSync(startPath);
                var fs=[];
                for(var i=0;i<files.length;i++){
                    var f=files[i];
                    var fext = path.extname(f);
                    if(fext=== ".jpg" || fext === ".png"  || fext === ".jpeg") {
                        fs.push(uri_pics+sp+'/'+f);
                    }
                }
                if(fs.length>0){
                    client.emit('added', fs);
                }
            });

            client.on('messages', function(data) {
                client.emit('broad', data);
                client.broadcast.emit('broad',data);
            });

        });     
        //callback
        cb(null, { 
            io:io,
            express:express,
            app:app,
            server:server
        });  
    },
    ready:['network',function(scope,cb){
        //route url
        var app = scope.network.app;
        var express = scope.network.express;
        app.use(express.static(__dirname + '/bower_components'));  
        //app.use(express.static(__dirname + '/pics'));
        app.use(uri_pics,express.static(settings.pic_root));
        app.use(express.static(__dirname + '/tpl'));
        app.get('/', function(req, res,next) {  
            res.sendFile(__dirname + '/index.html');
        });
        //listen
        scope.network.server.listen(port);     
        console.log('server is ready on port '+port +'.')       
    }] 
    },function (err, result) {
		if (err) {
			logger.fatal(err)
		}
    }
  );  








