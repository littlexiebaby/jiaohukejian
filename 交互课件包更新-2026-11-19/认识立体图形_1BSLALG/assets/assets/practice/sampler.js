(function(root){
  'use strict';
  var types=['cuboid','cube','cylinder','sphere'];
  var distribution={cuboid:30,cube:20,cylinder:30,sphere:20};
  function create(questions,random){
    random=random||Math.random;
    var groups=[],cycle=[],cursor=0,lastId=null,seen={};
    types.forEach(function(type){
      var items=questions.filter(function(q){
        if(q.type!==type||seen[q.id])return false;
        seen[q.id]=true;return true;
      });
      if(!items.length)return;
      var variants=[];
      items.forEach(function(q){var v=q.variant||'default';if(variants.indexOf(v)<0)variants.push(v);});
      variants.forEach(function(variant){
        groups.push({items:items.filter(function(q){return (q.variant||'default')===variant;}),quota:distribution[type]/5/variants.length});
      });
    });
    if(!groups.length)throw new Error('没有可用的练习图片。');
    function shuffle(list){
      for(var i=list.length-1;i>0;i--){var j=Math.floor(random()*(i+1)),t=list[i];list[i]=list[j];list[j]=t;}
      return list;
    }
    function refill(){
      // Weighted permutations favor familiar objects while using each exactly once.
      var decks=groups.map(function(group){
        return group.items.map(function(q){return {item:q,key:-Math.log(Math.max(1e-12,random()))/(q.weight||1)};})
          .sort(function(a,b){return a.key-b.key;}).map(function(entry){return entry.item;});
      });
      cycle=[];cursor=0;
      while(decks.some(function(deck){return deck.length;})){
        var block=[];
        groups.forEach(function(group,i){block=block.concat(decks[i].splice(0,Math.max(1,Math.round(group.quota))));});
        // A full block is 6 cuboids, 4 cubes, 6 cylinders, 4 spheres.
        // Each cuboid/cylinder variant receives three slots within that block.
        cycle=cycle.concat(shuffle(block));
      }
      if(cycle.length>1&&cycle[0].id===lastId){var first=cycle[0];cycle[0]=cycle[1];cycle[1]=first;}
    }
    function next(){
      if(cursor===cycle.length)refill();
      var chosen=cycle[cursor++];lastId=chosen.id;return chosen;
    }
    return {next:next};
  }
  var api={create:create,distribution:distribution};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ShapePracticeSampling=api;
})(typeof window==='object'?window:this);
