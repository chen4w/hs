var path = require("path");
//var crypto = require('crypto');

class Setting {
  constructor() {
/**-------必须修改的配置---------------------**/
  //是否采用后台检查模式,
  //如果采用,大屏展示和归档处理目标是：upload/p目录,否则直接处理upload目录
  this.bCheck = true; 
    //图片根目录
   if(path.sep=='/')
      this.pic_root = "/Users/c4w/git/pics";
    else
      this.pic_root = "d:\\bhere\\pics";
    
/**-------可以默认的配置---------------------**/
    this.version='2016.12.13';
    //必须是唯一的名称,将其hash值作为云端唯一标识
    this.sn = '杭州工艺美术博物馆';
    
    this.thumbnails_size=450; //抽点宽度
    this.thumbnails_uri ='tbnails'; //抽点目录标志
    this.uri_pics ='/pics';   //图片uri起始
    this.pic_upload = 'upload';   //上传目录
    this.pic_archive = 'archive';   //归档目录
    this.pic_wallpaper = 'wallpaper'; //墙纸目录
    this.cron_archive = '0 1 * * *'; //归档检查周期,每天凌晨1点,服务启动时会立即检查
    this.stabilityThreshold=1000; //文件监测延时,ms
    this.cacheSpan = 200;//缓存延时,避免cpu阻塞
    //calc md5 of sn
    //this.sn_md5 = '81949faebfe3c5ff42bcbd5c06a06511';
    //this.sn_md5 = crypto.createHash('md5').update(this.sn).digest("hex");
    //console.log('sn:'+this.sn+' md5:'+this.sn_md5);
  }
}

module.exports =  (new Setting);