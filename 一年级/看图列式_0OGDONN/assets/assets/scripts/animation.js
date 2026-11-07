/* 分层图片动画。开合使用16张生图动作帧，位移/摆动/缓动由GSAP在刷新帧驱动。 */
(function () {
  'use strict';
  var names=['bear','bunny','seal','duck','panda','cat','dog','fox','penguin','elephant','lamb','frog','chick','pig','cow','tiger','monkey','lion','giraffe','zebra','horse','squirrel','hedgehog','hamster','deer','mouse','turtle','hippo','parrot','koala'];
  var colors=['red','yellow','blue','purple'];
  function img(src,cls){var e=document.createElement('img');e.src=src;e.className=cls||'';e.alt='';e.draggable=false;return e;}
  function toyPath(id){return 'assets/images/plush/plush-'+id+'.webp';}
  function machinePath(id){return 'assets/images/machine/'+id+'.webp';}
  function fxPath(id){return 'assets/images/effects/'+id+'.webp';}
  function Stage(sound) {this.sound=sound;this.rigs=[];this.toys=[];this.effects=[];this.low=false;this.count=4;this.width=1600;}
  Stage.prototype.setup=function(count,low){
    this.destroy();this.count=count;this.low=low;this.toys=[];this.width=document.getElementById('machine').clientWidth;
    if(!document.getElementById('awardFlight')){var flight=document.createElement('div');flight.id='awardFlight';flight.className='award-flight';document.getElementById('app').appendChild(flight);}
    var back=document.getElementById('toyBack'),front=document.getElementById('toyFront');back.innerHTML='';front.innerHTML='';
    var r=QuestionBank.rng(918293+count),self=this,roster=names.slice();
    for(var k=roster.length-1;k>0;k--){var swap=Math.floor(r()*(k+1)),saved=roster[k];roster[k]=roster[swap];roster[swap]=saved;}
    [back,front].forEach(function(layer,row){
      var total=Math.max(16,Math.ceil(self.width/(row===0?73:80)));
      for(var i=0;i<total;i++){
        var id=roster[(i+row*total)%roster.length],e=img(toyPath(id),'toy'),size=(row===0?92:105)+r()*17;
        var center=(i+.5)*self.width/total+(r()-.5)*21;
        e.style.width=size+'px';e.style.height=size+'px';e.style.left=(center-size/2)+'px';e.style.top=(row===0?36:49)+(r()-.5)*10+'px';
        e.style.transform='rotate('+((r()-.5)*24)+'deg)';layer.appendChild(e);
        self.toys.push({el:e,id:id,x:center,row:row,hidden:false});
      }
    });
    var rigRoot=document.getElementById('rigs'),chutes=document.getElementById('chutes');rigRoot.innerHTML='';chutes.innerHTML='';
    for(var p=0;p<count;p++){
      var baseX=(p+.5)*this.width/count,rig=document.createElement('div');rig.className='rig';rig.style.left=baseX+'px';
      var carriage=img(machinePath('carriage-'+colors[p]),'carriage'),cable=img(machinePath('cable'),'cable');
      var head=document.createElement('div');head.className='claw-head';var frames=[];
      for(var f=0;f<16;f++){var frame=img(machinePath('claw-'+('0'+f).slice(-2)),'claw-frame');head.appendChild(frame);frames.push(frame);}
      var held=img(toyPath(names[p]),'held-toy'),aura=img(fxPath('reward'),'held-aura');rig.appendChild(cable);rig.appendChild(aura);rig.appendChild(held);rig.appendChild(head);rig.appendChild(carriage);rigRoot.appendChild(rig);
      gsap.set(rig,{xPercent:-50,x:0});
      var slot=document.createElement('div');slot.className='chute-slot';
      var chute=img(machinePath('chute-'+colors[p]),'chute-image'),light=img(fxPath('reward'),'chute-light'),pile=document.createElement('div');pile.className='prize-pile';
      slot.appendChild(chute);slot.appendChild(pile);slot.appendChild(light);chutes.appendChild(slot);
      this.rigs.push({index:p,root:rig,head:head,frames:frames,frame:0,carriage:carriage,cable:cable,held:held,aura:aura,chute:chute,light:light,pile:pile,prizes:[],baseX:baseX,queue:[],timeline:null,picked:null});
    }
  };
  Stage.prototype.setFrame=function(rig,f){var sequence=[0,1,2,3,5,6,7,9,10,11,13,14,15];f=sequence[Math.max(0,Math.min(12,Math.round(f*12/15)))];if(f===rig.frame)return;rig.frames[rig.frame].style.visibility='hidden';rig.frames[f].style.visibility='visible';rig.frame=f;};
  Stage.prototype.resize=function(width){var previous=this.width;this.width=width;this.toys.forEach(function(t){t.x*=width/previous;t.el.style.left=(t.x-parseFloat(t.el.style.width)/2)+'px';});this.rigs.forEach(function(r,i){r.baseX=(i+.5)*width/this.count;r.root.style.left=r.baseX+'px';},this);};
  Stage.prototype.enqueue=function(player){var rig=this.rigs[player];if(!rig)return names[0];var near=this.toys.filter(function(t){return t.row===1&&!t.hidden;});near.sort(function(a,b){return Math.abs(a.x-rig.baseX)-Math.abs(b.x-rig.baseX);});var id=near.length?near[Math.floor(Math.random()*Math.min(3,near.length))].id:names[Math.floor(Math.random()*names.length)];rig.queue.push({id:id});if(!rig.timeline)this.next(rig);return id;};
  Stage.prototype.next=function(rig){
    if(!rig.queue.length){rig.timeline=null;return;}var job=rig.queue.shift();
    var self=this,near=this.toys.filter(function(t){return t.row===1&&!t.hidden&&Math.abs(t.x-rig.baseX)<self.width/(2*self.count);});
    if(!near.length)near=this.toys.filter(function(t){return t.row===1&&!t.hidden;});
    near.sort(function(a,b){return Math.abs(a.x-rig.baseX)-Math.abs(b.x-rig.baseX);});
    var matching=near.filter(function(t){return t.id===job.id;}),picked=matching[0]||near[0],id=job.id;
    var target=picked?Math.max(-105,Math.min(105,picked.x-rig.baseX)):0,depth=document.getElementById('machine').clientHeight-320;
    rig.picked=picked;if(picked){picked.hidden=true;if(picked.id!==id){picked.id=id;picked.el.src=toyPath(id);}}
    rig.held.src=toyPath(id);gsap.set(rig.held,{opacity:0,y:67+depth,rotation:0,scale:.96});gsap.set(rig.aura,{opacity:0,y:67+depth,rotation:0,scale:.6});this.setFrame(rig,0);
    var close={frame:0},tl=gsap.timeline({onComplete:function(){rig.timeline=null;rig.picked=null;self.next(rig);}});rig.timeline=tl;
    tl.to(rig.root,{x:target,duration:.25,ease:'power2.inOut'},0)
      .to(rig.head,{y:65+depth,duration:.44,ease:'power2.inOut'},.22)
      .to(rig.cable,{height:120+depth,duration:.44,ease:'power2.inOut'},.22)
      .to(close,{frame:15,duration:.28,ease:'none',onUpdate:function(){self.setFrame(rig,close.frame);}},.65)
      .call(function(){if(picked)picked.el.style.opacity=0;gsap.set(rig.held,{opacity:1});self.capture(rig.baseX+target,218+depth);if(self.sound)self.sound('claw',.35);},null,.83)
      .to(rig.aura,{opacity:self.low ? .42 : .72,scale:1.05,duration:.18,ease:'power2.out'},.83)
      .to(rig.head,{y:-10,duration:.48,ease:'power2.inOut'},.93)
      .to(rig.cable,{height:45,duration:.48,ease:'power2.inOut'},.93)
      .to(rig.held,{y:-8,duration:.48,ease:'power2.inOut'},.93)
      .to(rig.aura,{y:-8,rotation:35,duration:.48,ease:'power2.inOut'},.93)
      .to(rig.held,{rotation:self.low?5:13,duration:.20,ease:'sine.inOut'},1.05)
      .to(rig.held,{rotation:-7,duration:.30,ease:'sine.inOut'},1.25)
      .to(rig.root,{x:0,duration:.34,ease:'power2.inOut'},1.40)
      .to(rig.held,{rotation:0,duration:.22,ease:'sine.out'},1.55)
      .to(close,{frame:0,duration:.20,ease:'none',onUpdate:function(){self.setFrame(rig,close.frame);}},1.75)
      .to(rig.held,{y:157+depth,rotation:11,scale:.82,duration:.43,ease:'power2.in'},1.88)
      .to(rig.aura,{y:157+depth,opacity:0,scale:.45,duration:.43,ease:'power2.in'},1.88)
      .to(rig.held,{opacity:0,duration:.1},2.22)
      .call(function(){
        self.addPrize(rig,id,true);
        gsap.fromTo(rig.chute,{scaleX:1,scaleY:1},{scaleX:1.07,scaleY:.90,duration:.12,yoyo:true,repeat:1,ease:'sine.inOut'});
        gsap.fromTo(rig.light,{opacity:1,scale:.65},{opacity:0,scale:1.6,duration:.75,ease:'power2.out'});
        self.impact(rig.baseX,252+depth);self.flyAward(rig);if(self.sound)self.sound('drop',.5);
        if(picked){picked.id=names[Math.floor(Math.random()*names.length)];picked.el.src=toyPath(picked.id);picked.hidden=false;gsap.to(picked.el,{opacity:1,duration:.28,delay:.15});}
      },null,2.27)
      .to(rig.head,{y:0,duration:.2,ease:'power2.out'},2.30)
      .to(rig.cable,{height:55,duration:.2,ease:'power2.out'},2.30);
  };
  Stage.prototype.layoutPrizes=function(rig,animate){
    var n=rig.prizes.length,cols=Math.min(4,n),rows=Math.ceil(n/Math.max(1,cols)),size=n===1?100:n===2?90:n===3?84:78,step=rows>1?Math.min(23,58/(rows-1)):0;
    rig.prizes.forEach(function(p,i){var row=Math.floor(i/cols),inRow=Math.min(cols,n-row*cols),col=i%cols,spread=inRow>1?(158-size)/(inRow-1):0,dx=(col-(inRow-1)/2)*spread,bottom=(rows-1-row)*step+(col%2?4:0),angle=(i%3-1)*7;p.el.style.width=size+'px';p.el.style.height=size+'px';p.el.style.bottom=bottom+'px';p.el.style.zIndex=String(row+1);gsap.set(p.el,{xPercent:-50});if(animate)gsap.to(p.el,{x:dx,rotation:angle,duration:.28,ease:'power2.out'});else gsap.set(p.el,{x:dx,rotation:angle,scale:1,opacity:1,y:0});});
  };
  Stage.prototype.addPrize=function(rig,id,animate){var e=img(toyPath(id),'prize-collected');e.dataset.plush=id;rig.pile.appendChild(e);rig.prizes.push({id:id,el:e});this.layoutPrizes(rig,animate);if(animate)gsap.fromTo(e,{scale:.25,opacity:0,y:-35},{scale:1,opacity:1,y:0,duration:.5,ease:'back.out(1.8)'});};
  Stage.prototype.restorePrizes=function(index,ids){var r=this.rigs[index];if(!r)return;r.prizes.forEach(function(p){gsap.killTweensOf(p.el);});r.pile.innerHTML='';r.prizes=[];(ids||[]).forEach(function(id){var e=img(toyPath(id),'prize-collected');e.dataset.plush=id;r.pile.appendChild(e);r.prizes.push({id:id,el:e});});this.layoutPrizes(r,false);};
  Stage.prototype.capture=function(x,y){var e=img(fxPath('reward'),'effect-sprite');e.style.width='175px';e.style.height='175px';e.style.left=(x-87)+'px';e.style.top=(y-87)+'px';document.getElementById('effects').appendChild(e);gsap.fromTo(e,{scale:.25,opacity:.85,rotation:-20},{scale:1.25,opacity:0,rotation:25,duration:.55,ease:'power2.out',onComplete:function(){e.remove();}});};
  Stage.prototype.flyAward=function(rig){
    var self=this,card=document.querySelectorAll('.score-card')[rig.index],num=card.querySelector('.score-value'),endX=card.offsetLeft+num.offsetLeft+num.offsetWidth/2-18,endY=document.getElementById('showcase').offsetTop+card.offsetTop+num.offsetTop+num.offsetHeight/2-18,total=this.low?2:5,depth=document.getElementById('machine').clientHeight-320;
    for(var i=0;i<total;i++)(function(index){var e=img(fxPath('star'),'award-star'),size=index===0?39:19;e.style.width=size+'px';e.style.height=size+'px';document.getElementById('awardFlight').appendChild(e);var t={p:0},sx=rig.baseX-size/2,sy=382+depth,controlX=sx+(index%2?-105:105),controlY=235+depth;gsap.set(e,{x:sx,y:sy,opacity:0});gsap.to(t,{p:1,duration:.65+index*.035,delay:index*.055,ease:'power1.inOut',onUpdate:function(){var a=t.p,b=1-a;gsap.set(e,{x:b*b*sx+2*b*a*controlX+a*a*endX,y:b*b*sy+2*b*a*controlY+a*a*endY,opacity:a<.12?a/.12:1-a*.55,rotation:a*150,scale:1-a*.45});},onComplete:function(){e.remove();if(index===0){gsap.fromTo(num,{scale:1.16},{scale:1,duration:.25,ease:'back.out(1.8)'});}}});})(i);
  };
  Stage.prototype.impact=function(x,y){
    var self=this,root=document.getElementById('effects'),e=img(fxPath('spark-0'),'effect-sprite');
    e.style.width='195px';e.style.height='195px';e.style.left=(x-97)+'px';e.style.top=(y-97)+'px';root.appendChild(e);
    var frame={n:0},last=-1;gsap.to(frame,{n:3,duration:.42,ease:'none',onUpdate:function(){var n=Math.round(frame.n);if(n!==last){last=n;e.src=fxPath('spark-'+n);}},onComplete:function(){e.remove();}});
    gsap.fromTo(e,{scale:.4,opacity:1},{scale:1.4,opacity:0,duration:.5,ease:'power2.out'});
    if(this.low)return;
    var ring=img(fxPath('ring-0'),'effect-sprite');ring.style.width='205px';ring.style.height='205px';ring.style.left=(x-102)+'px';ring.style.top=(y-102)+'px';root.appendChild(ring);var ringFrame={n:0},lastRing=-1;
    gsap.to(ringFrame,{n:3,duration:.5,ease:'none',onUpdate:function(){var n=Math.round(ringFrame.n);if(n!==lastRing){lastRing=n;ring.src=fxPath('ring-'+n);}}});
    gsap.fromTo(ring,{scale:.5,opacity:.9},{scale:1.3,opacity:0,duration:.6,ease:'power2.out',onComplete:function(){ring.remove();}});
    for(var i=0;i<12;i++){
      var star=img(fxPath(i%2?'star':'confetti'),'particle');star.style.width=(i%2?23:16)+'px';star.style.height=(i%2?23:16)+'px';star.style.left=x+'px';star.style.top=y+'px';root.appendChild(star);
      var angle=-Math.PI*.95+i*Math.PI*.08;gsap.to(star,{x:Math.cos(angle)*(85+i*5),y:Math.sin(angle)*(100+i*4),rotation:80+i*46,opacity:0,scale:.25,duration:.7+i*.025,ease:'power2.out',onComplete:(function(node){return function(){node.remove();};})(star)});
    }
  };
  Stage.prototype.scorePulse=function(index,color){
    var card=document.querySelectorAll('.score-card')[index];if(!card)return;
    var num=card.querySelector('.score-value'),pop=card.querySelector('.score-pop');pop.style.left=(num.offsetLeft+num.offsetWidth+5)+'px';pop.style.right='auto';gsap.killTweensOf([num,pop]);
    gsap.fromTo(num,{scale:1.35},{scale:1,duration:.36,ease:'back.out(2)'});
    gsap.fromTo(pop,{opacity:1,y:0,scale:.65},{opacity:0,y:-33,scale:1.2,duration:.65,ease:'power2.out'});
    var rig=this.rigs[index];if(rig){var plus=document.createElement('div');plus.className='floating-plus';plus.textContent='+1';plus.style.setProperty('--player',getComputedStyle(card).getPropertyValue('--player'));plus.style.left=(rig.baseX+42)+'px';plus.style.top='95px';document.getElementById('effects').appendChild(plus);gsap.fromTo(plus,{opacity:1,scale:.6,y:0},{opacity:0,scale:1.15,y:-48,duration:.9,ease:'power2.out',onComplete:function(){plus.remove();}});}
  };
  Stage.prototype.pause=function(){this.rigs.forEach(function(r){if(r.timeline)r.timeline.pause();});};
  Stage.prototype.resume=function(){this.rigs.forEach(function(r){if(r.timeline)r.timeline.resume();});};
  Stage.prototype.cancelPlayer=function(index){
    var r=this.rigs[index];if(!r)return;if(r.timeline)r.timeline.kill();r.timeline=null;r.queue=[];
    if(r.picked){r.picked.hidden=false;r.picked.el.style.opacity=1;r.picked=null;}
    gsap.set(r.root,{x:0});gsap.set(r.head,{y:0});gsap.set(r.cable,{height:55});gsap.set(r.held,{opacity:0,y:0});gsap.set(r.aura,{opacity:0,y:0});this.setFrame(r,0);
  };
  Stage.prototype.destroy=function(){
    var self=this;this.rigs.forEach(function(r,i){self.cancelPlayer(i);gsap.killTweensOf([r.chute,r.light,r.aura]);r.prizes.forEach(function(p){gsap.killTweensOf(p.el);});});
    this.rigs=[];
    var effects=document.getElementById('effects');if(effects){Array.prototype.forEach.call(effects.children,function(e){gsap.killTweensOf(e);});effects.innerHTML='';}
    var flight=document.getElementById('awardFlight');if(flight)flight.innerHTML='';
  };
  Stage.prototype.setLow=function(low){this.low=low;document.getElementById('app').classList.toggle('quality-low',low);};
  Stage.toys=names;Stage.colors=colors;window.ClawStage=Stage;
}());
