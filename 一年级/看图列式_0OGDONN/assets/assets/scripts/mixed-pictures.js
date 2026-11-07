/* 来去情境图：每个动作组都是可数的对象，不使用划线或复制后的残影。 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MotionPictures = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function xml(s) {return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c];});}
  function stages(q) {
    // 动作中的对象与停留的对象互不重复；第一幅总数可反推原有数量。
    // 先加后减：a 在水里、b 飞来 → a+b-c 留下、c 飞走。
    // 先减后加：a-b 留下、b 飞走 → a-b 留下、c 飞来。
    var addFirst=q.op==='+-';
    return [
      {kept:addFirst?q.a:q.a-q.b,moving:q.b,action:addFirst?'arrive':'leave'},
      {kept:addFirst?q.answer:q.a-q.b,moving:q.c,action:addFirst?'leave':'arrive'}
    ];
  }
  function sprite(scene,pose,x,y,size,index) {
    var cell=pose==='rest'?[0,0]:pose==='arrive'?[500,0]:[0,500];
    var src='assets/images/questions/motion/'+scene.sprite;
    return '<svg x="'+x+'" y="'+y+'" width="'+size+'" height="'+size+'" style="width:'+size+'px;height:'+size+'px;overflow:hidden" viewBox="'+cell[0]+' '+cell[1]+' '+(pose==='leave'?520:500)+' 500" data-object="'+index+'" data-state="'+(pose==='rest'?'kept':pose==='arrive'?'arriving':'leaving')+'"><image href="'+src+'" xlink:href="'+src+'" width="1000" height="1000" preserveAspectRatio="none"/></svg>';
  }
  function group(scene,n,pose,box,index) {
    var out='<g data-picture-role="'+(pose==='rest'?'staying':pose)+'" data-picture-count="'+n+'">';
    if(n) {
      var best={size:0,cols:1,rows:1};
      for(var cols=1;cols<=n;cols++) {
        var rows=Math.ceil(n/cols),size=Math.min(43,(box.w-(cols-1)*2)/cols,(box.h-(rows-1)*1)/rows);
        if(size>best.size)best={size:size,cols:cols,rows:rows};
      }
      for(var i=0;i<n;i++) {
        var row=Math.floor(i/best.cols),inRow=Math.min(best.cols,n-row*best.cols);
        var x=box.x+(box.w-inRow*best.size-(inRow-1)*2)/2+(i%best.cols)*(best.size+2);
        var y=box.y+(box.h-best.rows*best.size-(best.rows-1))/2+row*(best.size+1);
        out+=sprite(scene,pose,x,y,best.size,index+i);
      }
    }
    return out+'</g>';
  }
  function backdrop(scene,w,h) {
    var kind=scene.kind;
    if(kind==='classroom') {
      return '<rect width="'+w+'" height="'+h+'" rx="8" fill="#e9f3f0"/><path d="M0 46H'+w+'V'+h+'H0Z" fill="#eadfc4"/><path d="M3 43V8h19v35" stroke="#bf9d73" stroke-width="3" fill="#cfe7e7"/><path d="M27 43H'+(w-6)+'" stroke="#cad5c7" stroke-width="2"/>';
    }
    if(kind==='cycling'||kind==='busstop') {
      var out='<rect width="'+w+'" height="'+h+'" rx="8" fill="#e8f2e1"/><path d="M0 41H'+w+'V'+h+'H0Z" fill="'+(kind==='cycling'?'#dfc69f':'#d9e3e7')+'"/><path d="M4 45H'+(w-4)+'" stroke="#fff" stroke-width="2" stroke-dasharray="8 6"/>';
      if(kind==='busstop')out+='<path d="M9 40V13h13" stroke="#92a3af" stroke-width="2" fill="none"/><rect x="6" y="7" width="16" height="10" rx="2" fill="#9bbed1"/>';
      return out;
    }
    if(kind==='field'||kind==='court') {
      var out='<rect width="'+w+'" height="'+h+'" rx="8" fill="'+(kind==='field'?'#e1efd2':'#f1e8d7')+'"/><path d="M0 43H'+w+'V'+h+'H0Z" fill="'+(kind==='field'?'#a9cc91':'#dfbc94')+'"/><path d="M5 '+(h-5)+'V48H'+(w-5)+'V'+(h-5)+'H5M'+(w/2)+' 48V'+(h-5)+'" stroke="#fff" stroke-width="1.2" fill="none"/>';
      return out;
    }
    if(kind==='library'||kind==='desk'||kind==='basket') {
      var out='<rect width="'+w+'" height="'+h+'" rx="8" fill="'+(kind==='basket'?'#f3efd9':'#e8f2f4')+'"/><path d="M0 45H'+w+'V'+h+'H0Z" fill="'+(kind==='basket'?'#ebd5ad':'#e3ceb0')+'"/>';
      if(kind==='library')out+='<path d="M2 48H'+(w-2)+'M2 '+(h-3)+'H'+(w-2)+'" stroke="#ba956d" stroke-width="2"/>';
      if(kind==='desk')out+='<path d="M3 '+(h-3)+'H'+(w-3)+'" stroke="#c4a17d" stroke-width="2"/>';
      if(kind==='basket')out+='<path d="M2 58v24q0 4 5 4H'+(w-7)+'q5 0 5-4V58M2 60H'+(w-2)+'" stroke="#bd9866" stroke-width="2" fill="none"/>';
      return out;
    }
    if(kind==='tree') {
      return '<rect width="'+w+'" height="'+h+'" rx="8" fill="#e2f1f5"/><path d="M0 80H'+w+'M0 61H'+w+'" stroke="#ab8058" stroke-width="3"/><path d="M4 62V22" stroke="#a8805c" stroke-width="5"/><path d="M1 23Q19 6 27 22Q38 35 13 36H1Z" fill="#91ba78"/>';
    }
    if(kind==='water') {
      return '<rect width="'+w+'" height="'+h+'" rx="8" fill="#b5e5ef"/><path d="M0 46H'+w+'V'+h+'H0Z" fill="#8cd3e9"/><path d="M0 '+(h-5)+'Q'+(w/2)+' '+(h-14)+' '+w+' '+(h-5)+'V'+h+'H0Z" fill="#e7d9b5"/><path d="M7 '+h+'q-8-20 0-29m2 28q13-19 6-27" stroke="#62a67b" stroke-width="2" fill="none"/>';
    }
    if(kind==='meadow'||kind==='garden'||kind==='flowers'||kind==='yard') {
      var out='<rect width="'+w+'" height="'+h+'" rx="8" fill="'+(kind==='flowers'?'#f8f0df':'#eaf3e1')+'"/><path d="M0 47Q'+(w/2)+' 39 '+w+' 48V'+h+'H0Z" fill="'+(kind==='yard'?'#efe0b9':'#b6d79c')+'"/>';
      if(kind==='yard')out+='<path d="M0 35h'+w+'M0 43h'+w+'" stroke="#ceb18b" stroke-width="2"/>';
      if(kind==='meadow')out+='<path d="M3 78q2-9 7-1m-2 5q8-10 12-2" fill="none" stroke="#74a05e" stroke-width="2"/>';
      if(kind==='garden'||kind==='flowers')out+='<path d="M8 87V65" stroke="#78a76a" stroke-width="2"/><path d="M8 60c-10-10-13 3-7 5-6 8 4 13 7 7 6 7 14-2 8-7 6-5-2-13-8-5" fill="'+(kind==='flowers'?'#e7bb61':'#ec9baf')+'"/><circle cx="8" cy="66" r="3" fill="#fff3bc"/>';
      return out;
    }
    if(scene.kind==='parking') {
      var out='<rect width="'+w+'" height="'+h+'" rx="8" fill="#f4ead4"/><path d="M0 39H'+w+'V'+h+'H0Z" fill="#d4e1e6"/><path d="M5 32H'+(w-5)+'" stroke="#fff" stroke-width="2" stroke-dasharray="9 7"/>';
      for(var i=1;i<5;i++)out+='<path d="M'+(w*i/5)+' 50v'+(h-53)+'" stroke="#fff" stroke-width="1.5"/>';
      return out;
    }
    var bank=scene.kind==='bank',out='<rect width="'+w+'" height="'+h+'" rx="8" fill="'+(bank?'#dcebc8':'#dbf1fa')+'"/><path d="M0 48Q'+(w*.45)+' 34 '+w+' 46V'+h+'H0Z" fill="#87d4ee"/>';
    out+='<path d="M8 47Q8 29 3 26M8 47Q15 27 22 26M8 47Q4 34 0 35M8 47Q17 35 23 36" stroke="#69a46b" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return out;
  }
  function arrow(action,w) {
    var incoming=action==='arrive',color=incoming?'#1686ab':'#d27b39';
    var path=incoming?'M'+(w-26)+' 24q15 8 15 26':'M12 55Q10 24 31 18';
    var head=incoming?'M'+(w-17)+' 43l6 7 5-8':'M23 16l8 2-4 7';
    return '<g class="scene-direction" data-direction="'+action+'" fill="none" stroke="'+color+'" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/><path d="'+head+'"/></g>';
  }
  function markup(q,width) {
    var scene=q.item,frames=stages(q),gap=28,w=(width-gap)/2,h=88,out='';
    frames.forEach(function(frame,i) {
      var x=i*(w+gap),incoming=frame.action==='arrive',verb=incoming?scene.arrive:scene.leave;
      var label=(i===0?'① 先':'② 再')+verb;
      out+='<g data-picture-stage="'+i+'" data-action="'+frame.action+'">';
      out+='<text x="'+(x+w/2)+'" y="17" font-size="18" text-anchor="middle" style="fill:'+(incoming?'#167f9e':'#b36b30')+'">'+xml(label)+'</text>';
      out+='<svg x="'+x+'" y="23" width="'+w+'" height="'+h+'" style="width:'+w+'px;height:'+h+'px;overflow:hidden" viewBox="0 0 '+w+' '+h+'">';
      out+=backdrop(scene,w,h);
      out+=group(scene,frame.moving,frame.action,{x:incoming?3:28,y:0,w:w-32,h:45},0);
      out+=group(scene,frame.kept,'rest',{x:4,y:44,w:w-8,h:42},frame.moving);
      out+=arrow(frame.action,w)+'</svg>';
      out+='</g>';
    });
    out+='<path d="M'+(w+6)+' 67h16m-6-6 6 6-6 6" stroke="#62bace" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var label=scene.name+'，先'+(frames[0].action==='arrive'?scene.arrive:scene.leave)+'，再'+(frames[1].action==='arrive'?scene.arrive:scene.leave)+'，看图列式';
    return '<svg class="motion-picture" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 '+width+' 134" role="img" aria-label="'+xml(label)+'">'+out+'</svg>';
  }
  return {stages:stages,markup:markup};
}));
