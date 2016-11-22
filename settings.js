var path = require("path");

class Setting {
  constructor() {
    this.thumbnails_size=450;
    this.thumbnails_uri ='tbnails';
    this.uri_pics ='/pics';
    this.pic_upload = 'upload'; 
    this.pic_archive = 'archive'; 
    this.pic_wallpaper = 'wallpaper';
     
    this.stabilityThreshold=2000;

      if(path.sep=='/')
        this.pic_root = "/Users/c4w/git/pics";
      else
        this.pic_root = "c:\\pics";
  }
}
module.exports =  (new Setting);