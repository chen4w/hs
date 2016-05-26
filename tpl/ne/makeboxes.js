var sno = 1000;
makeBoxes = function() {
  var boxes = [],
      count = Math.random()*10;
      if (count < 1) count = 1;
  //if there isn't remark, insert one.
  var box_remark = $('#container').find('.box.size22');
  console.log(box_remark);
  if(!box_remark.length){
     var box = document.createElement('div');
     box.className = 'box size22'; 
     box.style="padding:30px;background:none;line-height:30px;";
     var p = document.createElement('p');
     p.innerHTML="<h1>Find your card, share it and browse many more at 'www.moma.com/iwent'</h1>";
     box.appendChild(p);
    var img = document.createElement('img');
     img.src =  '/wifi.png';
     img.style.width="100px";
     box.appendChild(img);
     boxes.push( box );
 }
  
  for (var i=0; i < count; i++ ) {
    var box = document.createElement('div');
    var rs = Math.ceil(Math.random()*8);
    var img = document.createElement('img');
   if(rs==1){
     box.className = 'box size24';    
    }else{
      box.className = 'box size12'; 
    }
     img.src =  '/upload/m'+rs+'.png';
     img.style="width:100%";
     box.appendChild(img);
   // add box DOM node to array of new elements
    sno++;
    //box.innerHTML=sno;
    boxes.push( box );
  }

  return boxes;
};

