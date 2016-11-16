
var path = require("path");
var async = require('async');
var settings = require('./settings.js');
const uri_pics ='/pics';
const port = 4200;
const root_len= settings.pic_root.length;

async.auto({  
    config: function(cb){
        console.log('pics root:'+settings.pic_root);
        cb(null,{
            watchPath:'**/'
        });
    },
    file:['config','network', function (scope,cb) {  
        var filePath = scope.config.watchPath;
        var io = scope.network.io;

        var chokidar = require('chokidar');
        var watcher = chokidar.watch(['**/*.jpg','**/*.png'],{
            ignored: /[\/\\]\./,
            cwd:settings.pic_root,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: settings.stabilityThreshold,
                pollInterval: 100
            }
        });   
        watcher
        .on('add', fp => {
            if(path.sep=='\\')
                fp = fp.replace(/\\/g,'/');            
            io.emit('added',[uri_pics+'/'+fp]);
        })
        .on('change', fp => {
            if(path.sep=='\\')
                fp = fp.replace(/\\/g,'/');            
            io.emit('added',[uri_pics+'/'+fp]);
        })
        .on('unlink', fp => {
            if(path.sep=='\\')
                fp = fp.replace(/\\/g,'/');            
            io.emit('deleted',[uri_pics+'/'+fp]);
        });
     
    }],  
  
    network: function (cb) {  
        var express = require('express');  
        var app = express();  
        var server = require('http').createServer(app);  
        var io = require('socket.io')(server);
        var fs=require('fs');
        io.fs = fs;
        
        io.on('connection', function(client) {  
            console.log('Client ['+client.handshake.address+'] connected.');
            //接受订阅消息,发送初始图片集合
            client.on('join', function(sps) {
                var fs = this.server.fs;
                var result=[];
                for(var i=0; i<sps.length; i++){
                    var sp = sps[i];
                    var startPath=settings.pic_root+sp;                    
                    if (!fs.existsSync(startPath)){
                        console.log("no dir ",startPath);
                        return;
                    }
                    var files=fs.readdirSync(startPath);
                
                    for(var i=0;i<files.length;i++){
                        var f=files[i];
                        var fext = path.extname(f);
                        if(fext=== ".jpg" || fext === ".png"  || fext === ".jpeg") {
                            result.push(uri_pics+sp+'/'+f);
                        }
                    }
                }
                if(result.length>0){
                    client.emit('added',result);
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








