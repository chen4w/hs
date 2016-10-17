目前的文件目录没有对windows做兼容处理，因此在Mac或ubuntu下：
1. 运行 app.js
2. 浏览器访问：
	http://localhost:4200/sp/ 
	http://localhost:4200/ne/

就可以看到效果了，原型具备以下功能：
1.监视文件目录文件变更事件
2.提供WebSocket服务，向浏览器推送文件变更事件
3. 通过express提供web静态文件服务
4. 两种留言墙效果