var sno = 1000;
var pics_cache=[];
makeRemarkBox=function(boxes){
  var box_remark = $('#container').find('.box.size22');
  //console.log(box_remark);
  if(!box_remark.length){
     var box = document.createElement('div');
     box.className = 'box size22'; 
     box.style="padding:30px;background:none;line-height:30px;";
     var p = document.createElement('p');
     p.innerHTML="<h1>认领您的作品，就在 'www.bhere.cn'</h1>";
     box.appendChild(p);
    var img = document.createElement('img');
     img.src =  '/pics/wifi.png';
     img.style.width="100px";
     box.appendChild(img);
     boxes.push(box);
 }
}
makeBoxesByData=function(pics){
    var boxes = [];
    makeRemarkBox(boxes);
    var blen = $('#container').find('.box.size24').length;
    for(var i=0; i<pics.length; i++){
       var box = document.createElement('div');
        if(blen<3){
          box.className = 'box size24';   
          blen++; 
        }else{
          box.className = 'box size12'; 
        }

       var img = document.createElement('img');
       img.src =  pics[i];
      img.style="width:100%";
      box.appendChild(img);
      boxes.push(box);
    }
    return boxes;
}

makeBoxes = function(cout) {
  if(!cout)
    cout=1;
  if(pics_cache.length==0)
    return;
  var len = Math.min(cout,pics_cache.length);
  var boxes = [];
  //if there isn't remark, insert one.
  makeRemarkBox(boxes);
  var blen = $('#container').find('.box.size24').length;
  
  for (var i=0; i < len; i++ ) {
    var box = document.createElement('div');
    var img = document.createElement('img');
    if(blen<3){
      box.className = 'box size24';   
      blen++; 
    }else{
      box.className = 'box size12'; 
    }
     
    img.src =  pics_cache.shift();
    img.style="width:100%";
    box.appendChild(img);
    boxes.push( box );
  }

  return boxes;
};

