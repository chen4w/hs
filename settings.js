var path = require("path");

class Setting {
  constructor() {
    this.thumbnails_size=450; //抽点宽度
    this.thumbnails_uri ='tbnails'; //抽点目录标志
    this.uri_pics ='/pics';   //图片uri起始
    this.pic_upload = 'upload';   //上传目录
    this.pic_archive = 'archive';   //归档目录
    this.pic_wallpaper = 'wallpaper'; //墙纸目录
    this.cron_archive = '0 1 * * *'; //归档检查周期,每天凌晨1点,服务启动时会立即检查
    this.stabilityThreshold=2000; //文件监测延时,ms
    //图片根目录
      if(path.sep=='/')
        this.pic_root = "/Users/c4w/git/pics";
      else
        this.pic_root = "c:\\pics";
  }
}
module.exports =  (new Setting);