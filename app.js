
const path = require("path");
const fs=require('fs');
const mv = require('mv');

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

function archiveTask(){
    var schedule = require('node-schedule');
    var rule = new schedule.RecurrenceRule();  
    rule.minute = 42;
    var j = schedule.scheduleJob(settings.cron_archive, function(){  
        console.log('----archive check---');
        archive(function(){
            console.log('----archive check end---');           
        })
    });
}

//检查是否存在昨天目录,如果没有，生成昨天的目录，并将upload/p /n 移动到该目录下
function archive(func){
    let dt = new Date(); // Today!
    dt.setDate(dt.getDate() - 1); // Yesterday!
    let path_yesterday = path.join(settings.pic_root,
        settings.pic_archive,
        dt.getFullYear().toString(),
        (dt.getMonth()+1).toString(),
        dt.getDate().toString());
    //console.log(path_yesterday);
    fs.stat(path_yesterday, function(err, stat) {
        //目录已经存在
        if(stat&&stat.isDirectory()){
            console.log('archive folder:'+ path_yesterday+' exists.');
            return func();
        } 
        //移动upload/p upload/n
        let path_src = path.join(
            settings.pic_root,
            settings.pic_upload);
        //根据是否检查,归档不同目录
        if(settings.bCheck)
            path_src=path.join(path_src,'p');
        //检查源路径是否存在,
        fs.access(path_src, fs.F_OK, function(err) {
            if (err) {
                console.log('folder to be archived:'+ path_src+' missed.');
                return func();
            } 
            //没有图片,不需要归档
            let l = fs.readdirSync(path_src).filter(function(file) {
                return fs.statSync(path.join(path_src, file)).isFile();
            });
            if(l.length==0){
                console.log('folder to be archived:'+ path_yesterday+' is empty.');
                return func();
            }
            mv(path_src,path_yesterday, {mkdirp: true}, function(err) {
                if(!err){ 
                    console.log('move pics from:'+path_src+' to:'+path_yesterday);
                }
                func();
                //如果直接移走upload目录，需要建立一个upload
               if(!settings.bCheck){
                   if (!fs.existsSync(path_src)){
                        fs.mkdirSync(path_src);
                    }
                }
            });            
        });
    });
}

function cacheFile(fpath,func) {
  //击中缓存，无需延时
  let data =  fsCache.get(fpath);
  if(data){
    if(func){
      func(data);
    }
    return;
  }
  if(settings.cacheSpan){
    setTimeout(function(){
      cachef(fpath,func);
    },settings.cacheSpan);
  }else{
    cachef(fpath,func);
  }
}
//cache原始图或抽点图,tbn_len=0:原始图, tbn_len>0 抽点图 
function cachef(fpath,func) {
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
            //console.log('pic size:'+fpath+'\n w:'+size.width +'  h:'+size.height);
        }else{
            console.log('gm err:'+err);
        }
    }).resize(tbn_len).toBuffer(
      path.extname(fpath_src),
      function(err, buf) {
        if (err){
          console.log('gm err:'+err);
          if(func){
            func(null);
          }
          return next(err);
        } 
        //cache thumbnail
        fsCache.set(fpath,buf);
        if(func)
          func();
    });
  }
}

//缓存目录下所有图片,预先生成抽点
function cachePath(fpath,cb){
    //目录是否存在
 try {
    fs.accessSync(fpath, fs.F_OK);
    // Do something
 } catch (e) {
    // It isn't accessible
    console.log('cache path fail:'+fpath);
    if(cb){
        cb();
    }
    return;
 }
  //列出目录下所有文件
  let ls = fs.readdirSync(fpath).filter(function(file) {
      let en = path.extname(file);
      if((en ==='.jpg' || en==='.png') && 
        fs.statSync(path.join(fpath, file)).isFile())
        return true;
      else
        return false;
  });
  //改用异步方式,避免开始大量图片抽点造成机器僵死
  let pos =0;
  let len = ls.length;
  console.log('cache '+ls.length+' pics from:'+ fpath);
  if(len==0)
    return;

  //let fn = fpath+ path.sep + path_tbn + ls[pos];
  let func = function(pos){
    pos++;
    if(pos>=ls.length){
      console.log('path cached:'+fpath);
      if(cb){
        cb();
      }
      return;
    }
     let fn = fpath+ path.sep + path_tbn + ls[pos];
     console.log('cache file '+(pos+1)+'/'+len+':'+fn);
     cacheFile(fn,function(){
       func(pos);
     });
  }
  func(-1);
  //cacheFile(fn,func(0));
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
        var cfg = {
            ignored: /[\/\\]\./,
            cwd:settings.pic_root,
            ignoreInitial: true
        };
        if(settings.stabilityThreshold){
            cfg.awaitWriteFinish={
                stabilityThreshold: settings.stabilityThreshold,
                pollInterval: 100
            }
        }
        //for mac
        if(path.sep=='/'){
            cfg.usePolling=true;
        }
        
        var watcher = chokidar.watch(['**/*.jpg','**/*.png'],cfg);   
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
            //推送cfg
            client.on('cfg', function() {
                client.emit('cfg',settings);
            });
            //接受订阅消息,发送初始图片集合
            client.on('join', function(sps) {
                var fs = this.server.fs;
                var result=[];
                for(var i=0; i<sps.length; i++){
                    var sp = sps[i];
                    //for win replace with path.sep
                    var startPath=settings.pic_root+sp.replace(/\//g,path.sep);                                   
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

        //对以前的工作归档处理,归档完成再进行缓存
        console.log('---archive check-----');
        archive(function(){
            //cache pic files
            console.log('---cache path-----');
            cachePath(settings.pic_root+ path.sep + settings.pic_upload + path.sep +'p',function(){
                cachePath(settings.pic_root+ path.sep + settings.pic_wallpaper);
            });
            archiveTask();
        });
        //启动周期性归档任务


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








