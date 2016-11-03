var path = require("path");

class Setting {
  constructor() {
      if(path.sep=='/')
        this.pic_root = "/Users/c4w/git/pics";
      else
        this.pic_root = "c:\\pics";
  }
}
module.exports =  (new Setting);