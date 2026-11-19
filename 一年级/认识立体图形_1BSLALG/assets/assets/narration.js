(function(){
  'use strict';
  var stories={
    cuboid:{title:'长方体的小本领',lines:['有的长长的，有的扁扁的。','六个面平平的，放稳后不爱滚。','有些长方体，两头还是正方形呢！']},
    cube:{title:'正方体的小本领',lines:['方方正正，像一块小积木。','六个面都是一样大的正方形。','放得稳，还能一块一块往上搭。']},
    cylinder:{title:'圆柱的小本领',lines:['两头圆圆的，肚子弯弯的。','可以立起来，躺下来还能滚！','扁扁的、细长的，也都是圆柱。']},
    sphere:{title:'球的小本领',lines:['圆溜溜，没有平平的面。','轻轻一推，向四面八方滚！','想把它叠稳，可没那么容易。']}
  };
  var audio=new Audio(),current=null;
  audio.preload='none';
  function update(playing){
    var button=document.querySelector('.story-listen');
    if(button){button.classList.toggle('playing',playing);button.setAttribute('aria-pressed',String(playing));button.querySelector('span').textContent=playing?'正在说话…':'听介绍';}
  }
  function stop(){audio.pause();audio.currentTime=0;current=null;update(false);}
  function play(type){
    if(!stories[type])return;
    stop();current=type;audio.src='assets/audio/shape-'+type+'.mp3?v='+(type==='cylinder'?'20261108-cylinder-v2':'20261108-characters');audio.volume=.9;
    var promise=audio.play();update(true);
    if(promise)promise.catch(function(){update(false);});
  }
  audio.addEventListener('ended',function(){update(false);});
  audio.addEventListener('error',function(){update(false);});
  document.addEventListener('click',function(e){var button=e.target.closest('.story-listen');if(button)play(button.dataset.story);});
  window.LessonNarration={
    open:play,stop:stop,
    markup:function(type){var story=stories[type];if(!story)return '';var playing=current===type&&!audio.paused;return '<section class="shape-story"><h3>'+story.title+'</h3><ul>'+story.lines.map(function(line){return '<li>'+line+'</li>';}).join('')+'</ul><button class="story-listen'+(playing?' playing':'')+'" data-story="'+type+'" aria-pressed="'+playing+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></svg><span>'+(playing?'正在说话…':'听介绍')+'</span></button></section>';}
  };
})();
