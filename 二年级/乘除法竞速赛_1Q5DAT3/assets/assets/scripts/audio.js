(function(root){
  'use strict';
  var prefix='assets/audio/',sound=.8,music=.28,players={},pool=[],effectPools={},effectCursors={},previewTimers=[],musicWanted=false;
  function read(key,fallback){try{var s=localStorage.getItem(key);return s===null?fallback:Math.max(0,Math.min(1,Number(s)));}catch(e){return fallback;}}
  sound=read('kart-sound',.8);music=read('kart-music',.28);
  function audio(name,file,loop){var a=new Audio(prefix+file);a.preload='auto';a.loop=!!loop;a.setAttribute('playsinline','');players[name]=a;return a;}
  var bgm=audio('bgm','race-bgm.wav',true);
  audio('3','countdown-three.mp3');audio('2','countdown-two.mp3');audio('1','countdown-one.mp3');audio('GO','countdown-go.mp3');
  var files={correct:'correct.wav',wrong:'wrong.wav',boost:'boost.wav',superBoost:'super-boost.wav',finish:'finish.wav'};
  function removeEffect(a){var i=pool.indexOf(a);if(i>=0)pool.splice(i,1);}
  Object.keys(files).forEach(function(name){
    var voices=[],count=name==='finish'?1:4;effectCursors[name]=0;
    for(var i=0;i<count;i++){
      var a=new Audio(prefix+files[name]);a.preload='auto';a.setAttribute('playsinline','');
      a.onended=a.onerror=(function(voice){return function(){removeEffect(voice);};})(a);
      voices.push(a);try{a.load();}catch(e){}
    }
    effectPools[name]=voices;
  });
  function playElement(a){try{var p=a.play();if(p&&p.catch)p.catch(function(){a.setAttribute('data-playback-blocked','true');});}catch(e){a.setAttribute('data-playback-blocked','true');}}
  function effect(name){
    if(sound<=0||!files[name])return;
    var voices=effectPools[name],a=voices[effectCursors[name]];effectCursors[name]=(effectCursors[name]+1)%voices.length;
    removeEffect(a);a.pause();if(a.error)try{a.load();}catch(e){}try{a.currentTime=0;}catch(e){}
    while(pool.length>=16){var old=pool.shift();old.pause();}
    a.volume=sound*(name==='boost'?.64:name==='superBoost'?.72:.58);a.removeAttribute('data-playback-blocked');pool.push(a);playElement(a);
  }
  function countdown(value){stopVoice();var a=players[String(value)];if(!a||sound<=0)return;a.volume=sound;try{a.currentTime=0;}catch(e){}playElement(a);}
  function stopVoice(){['3','2','1','GO'].forEach(function(k){players[k].pause();try{players[k].currentTime=0;}catch(e){}});}
  function startMusic(){musicWanted=true;bgm.volume=music;if(music>0)playElement(bgm);}
  function stopMusic(){musicWanted=false;bgm.pause();}
  function stopPreview(){previewTimers.forEach(clearTimeout);previewTimers=[];stopVoice();}
  function preview(){stopPreview();['3','2','1','GO'].forEach(function(v,i){previewTimers.push(setTimeout(function(){countdown(v);},i*850));});}
  root.KartAudio={effect:effect,countdown:countdown,stopVoice:stopVoice,startMusic:startMusic,stopMusic:stopMusic,preview:preview,stopPreview:stopPreview,
    values:function(){return{sound:sound,music:music};},
    set:function(which,value){value=Math.max(0,Math.min(1,value));if(which==='sound')sound=value;else music=value;bgm.volume=music;if(music<=0)bgm.pause();else if(musicWanted)playElement(bgm);try{localStorage.setItem('kart-'+which,String(value));}catch(e){}},
    unlock:function(){if(musicWanted&&music>0&&bgm.paused)playElement(bgm);},
    stopAll:function(){stopMusic();stopPreview();pool.forEach(function(a){a.pause();});pool=[];}
  };
})(window);
