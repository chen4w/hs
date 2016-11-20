var sno = 1000;
var pics_cache=[];
var bShowSize =true;
makeRemarkBox=function(boxes){
  //当前屏幕墙是否存在size22的特殊说明图
  var box_remark = $('#container').find('.box.size22');
  //如果已经有,不动作,否则加入一张说明
  if(!box_remark.length){
     var box = document.createElement('div');
     box.className = 'box size22'; 
     box.style="padding:0px;background:none;line-height:30px;";
     var p = document.createElement('p');
     p.innerHTML="<h1>认领您的作品，<br/>去 www.bhere.cn</h1>";
     box.appendChild(p);
    var img = document.createElement('img');
     img.src =  '/pics/wifi.png';
     img.style.width="100px";
     box.appendChild(img);
     boxes.push(box);
 }
}
//给定宽度、高度、最大size,计算最接近的boxsize
function getBoxSize(w, h, mwh){
  var pi=1;
  var pj=1;
  //最小值
  var mr = mwh;
  for(var i=1; i<=mwh; i++){
    for(var j=1; j<=mwh; j++){
      var r = Math.abs((w*j)/(h*i) - 1);
      //比例相等条件下尽可能取大值
      if(r<=mr){
        mr = r;
        pi = i;
        pj = j;
      }
    }
  }
  //console.log('getBoxSize:'+w+'-'+h+ ':'+pi+'-'+pj);
  return ('box size'+pi) + pj;
}

makeBoxesByData=function(pics){
    var boxes = [];
    makeRemarkBox(boxes);
    //布局策略，已知宽度分为8分,每张图宽高方向最大取4,且不同时取4,否则占据面积过大
    //根据宽高比取最接近的比例 1～4: 1～4
    var blen = $('#container').find('.box.size24,.box.size34,.box.size42,.box.size43').length;
    for(var i=0; i<pics.length; i++){
       var pic = pics[i];
       var s = pic.fsize;
       //console.log(pic.fsize.width + ':'+pic.fsize.height);
       var box = document.createElement('div');
        if(blen<2){
          box.className = getBoxSize(s.width,s.height,4);   
          blen++; 
        }else{
          box.className = getBoxSize(s.width,s.height,2); 
        }
        if(bShowSize){
          var span = document.createElement('span');
          span.setAttribute("style","color:#FF0000; font-size: 30pt; position: absolute; top: 50px; left: 50px;");
          span.textContent = box.className.substring(8);
          box.appendChild(span);
        }     
       var img = document.createElement('img');
       img.src =  pic.furl;
       img.pic = pic;
      img.style="width:100%";
      box.appendChild(img);
      boxes.push(box);
    }
    return boxes;
}
//cout 挤入图片数量
makeBoxes = function(cout) {
  if(!cout)
    cout=1;
  if(pics_cache.length==0)
    return;
  var len = Math.min(cout,pics_cache.length);
  var boxes = [];
  //if there isn't remark, insert one.
  makeRemarkBox(boxes);
  var blen = $('#container').find('.box.size24,.box.size34,.box.size42,.box.size43').length;
  
  for (var i=0; i < len; i++ ) {
    var pic =  pics_cache.shift();
    var s = pic.fsize;
    var box = document.createElement('div');
    var img = document.createElement('img');
    //如果当前屏幕墙少于3张大图,产生一张大图
    if(blen<2){
      box.className = getBoxSize(s.width,s.height,4);   
      blen++; 
    }else{
      box.className = getBoxSize(s.width,s.height,2); 
    }
    if(bShowSize){
      var span = document.createElement('span');
      span.setAttribute("style","color:#FF0000; font-size: 30pt; position: absolute; top: 50px; left: 50px;");
      span.textContent = box.className.substring(8);
      box.appendChild(span);
    }     
    img.src= pic.furl;
    img.pic = pic;
    img.style="width:100%";
    box.appendChild(img);
    boxes.push( box );
  }

  return boxes;
};

