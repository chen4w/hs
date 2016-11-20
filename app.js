
const path = require("path");
const fs=require('fs');

const async = require('async');
const settings = require('./settings.js');
const uri_pics =settings.uri_pics;
const port = 4200;
const root_len= settings.pic_root.length;

const gm = require('gm');
const NodeCache = require( "node-cache" );
//缓存失效时间设置为1天, 每小时检查一次,不使用clone
const fsCache = new NodeCache({ stdTTL: 24*3600, checkperiod: 3600, useClones:false });
const path_tbn = settings.thumbnails_uri + settings.thumbnails_size+path.sep;
const prefixWH = 'PWH-';

//cache原始图或抽点图,tbn_len=0:原始图, tbn_len>0 抽点图 
function cacheFile(fpath,func) {
  //非抽点图
  if(fs.existsSync(fpath)) {
    let data = fs.readFileSync(fpath);
    if(settings.fs_cache){
      fsCache.set(fpath,data);
    }
    if(func){
      func(data);
    }
  }else{
      //处理抽点规则
      let p1 = fpath.lastIndexOf(path.sep);
      let p0 = fpath.lastIndexOf(path.sep,p1-1);
      let tbn_len = 0;
      if(p0!=-1 && p1!=-1){
        let fsize = fpath.substring(p0+1,p1);
        if(fsize.indexOf(settings.thumbnails_uri)==0){
          let tbn = fsize.substring(settings.thumbnails_uri.length);
          tbn_len = parseInt(tbn);
        }
      }
      let fpath_src = fpath.substring(0,p0)+fpath.substring(p1);
      //文件不存在
      if(tbn_len<=0 || !fs.existsSync(fpath_src)){
        console.log(fpath_src+' not found.')
        if(func){
          func(null);
        }
        return;
      }
      //抽点值>0 且源文件存在,返回抽点文件
      //优化性能,如果cache中有，直接从cache中读取
    let buf_src = fsCache.get(fpath_src);
    if(!buf_src){
      buf_src = fs.readFileSync(fpath_src);
      fsCache.set(fpath_src,buf_src);
    }
    gm(buf_src).size(function (err, size) {
        if (!err){
            //缓存图片的宽高,推送前端用
            fsCache.set(prefixWH+fpath_src,size);
            console.log('pic size:'+fpath+'\n w:'+size.width +'  h:'+size.height);
        }
    }).resize(tbn_len).toBuffer(
      path.extname(fpath_src),
      function(err, buf) {
        if (err){
          console.log(err);
          if(func){
            func(null);
          }
          return next(err);
        } 
        //cache thumbnail
        fsCache.set(fpath,buf);
        if(func)
          func(buf);
    });
  }
}

//缓存目录下所有图片,预先生成抽点
function cachePath(fpath){
  //列出目录下所有文件
  let ls = fs.readdirSync(fpath).filter(function(file) {
      let en = path.extname(file);
      if((en ==='.jpg' || en==='.png') && 
        fs.statSync(path.join(fpath, file)).isFile())
        return true;
      else
        return false;
  });
  console.log('caching '+ls.length+' pics from:'+ fpath);
  ls.forEach(function (item, index, array) {
    let fn = fpath+ path.sep + path_tbn + item;
    cacheFile(fn);
  });
}

function getTbPath(fp){
    let p0 = fp.lastIndexOf(path.sep);
    if(p0!=-1){
        return settings.pic_root + path.sep+ fp.substring(0,p0+1)+path_tbn+fp.substring(p0+1);
    }else{
        return settings.pic_root + path.sep + path_tbn + fp;
    }
}

function onEvent(fp,io,bAdd){
    let fpath = getTbPath(fp);
    let furi = uri_pics+fpath.substring(root_len);
    if(path.sep=='\\')
        furi = furi.replace(/\\/g,'/');   
    if(bAdd){
        //先缓存再推送消息
        cacheFile(fpath,function(data){
            console.log(furi);
            let s = fsCache.get(prefixWH+settings.pic_root+path.sep+fp);
            io.emit('added',[{
                furl:furi,
                fsize:s
            }]);
        });
    }else{
         io.emit('deleted',[furi]);
    }      
}

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
            onEvent(fp,io,true);
        })
        .on('change', fp => {
             onEvent(fp,io,true);
        })
        .on('unlink', fp => {
            onEvent(fp,io,false);
        });
     
    }],  
  
    network: function (cb) {  
        var express = require('express');  
        var app = express();  
        var server = require('http').createServer(app);  
        var io = require('socket.io')(server);
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
                            //发送抽点图
                            let whp =prefixWH+ startPath + path.sep + f;
                            let s = fsCache.get(whp);
                            result.push({
                                furl:uri_pics+sp+'/'+path_tbn+ f,
                                fsize:s
                            });
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

        app.use(express.static(__dirname + '/tpl'));
        app.get('/', function(req, res,next) {  
            res.sendFile(__dirname + '/index.html');
        });

        //cache pic files
        cachePath(settings.pic_root+ path.sep + settings.pic_upload + path.sep +'n');
        cachePath(settings.pic_root+ path.sep + settings.pic_wallpaper);
        //app.use(uri_pics,express.static(settings.pic_root));
        app.use(uri_pics,(req, res) => {
            let fp =  settings.pic_root + req.url.replace(/\//g,path.sep);
            let fpath = decodeURIComponent(fp);
            //先尝试读取缓存
            let data = fsCache.get(fpath);
            if(data){
                res.writeHead(200, {'Content-Type': 'image'});
                res.write(data);
                res.end();
                //console.log('hit cache:'+ fpath)
                return;      
            }
            cacheFile(fpath,function(data){
            if(!data){
                res.writeHead(404);
                res.end(fpath+" not found");
            }else{
                res.writeHead(200, {'Content-Type': 'image'});
                res.write(data);
                res.end();
            }
            });
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








