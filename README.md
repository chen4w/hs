# HS
BHere的现场大屏展示,采用gaze监视文件目录，采用express作为静态文件服务

Running the app
-----------------------------------
* [Win下单独安装GraphicsMagick] (http://www.graphicsmagick.org/)
* [Mac下单独安装GraphicsMagick] (https://www.npmjs.com/package/gm)

目前的文件目录没有对windows做兼容处理，因此在Mac或ubuntu下：
* 1. 运行 app.js
* 2. 浏览器访问：
	http://localhost:4200/sp/ 
	http://localhost:4200/ne/

就可以看到效果了，原型具备以下功能：
-----------------------------------
* chokidar监视文件目录文件变更事件
* 提供WebSocket服务，向浏览器推送文件变更事件
* 通过express提供web静态文件服务
* 对图片提供抽点、缓存服务、缓存图片文件、抽点文件、图标宽高信息