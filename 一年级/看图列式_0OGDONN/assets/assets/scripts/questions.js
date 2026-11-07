/* 图题题库：保留原课件的教学范围，增加加减混合图题。 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuestionBank = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var scopes = [
    {id:'five',name:'5以内加减法',limit:5,phase:1,zero:false},
    {id:'zero',name:'5以内综合（含0）',limit:5,phase:2,zero:true},
    {id:'six',name:'6和7的加减法',limit:7,lower:6,phase:3,zero:true},
    {id:'eight',name:'8和9的加减法',limit:9,lower:8,phase:3,zero:true},
    {id:'ten',name:'10的加减法',limit:10,lower:10,phase:3,zero:true},
    {id:'within10',name:'10以内综合',limit:10,phase:4,zero:true},
    {id:'teen',name:'11～20简单加减法',limit:20,phase:5,zero:true},
    {id:'carry9',name:'9加几（进位）',limit:20,phase:6,first:[9],zero:true},
    {id:'carry876',name:'8、7、6加几（进位）',limit:20,phase:6,first:[8,7,6],zero:true},
    {id:'carry5432',name:'5、4、3、2加几（进位）',limit:20,phase:6,first:[5,4,3,2],zero:true},
    {id:'carry',name:'20以内进位加法',limit:20,phase:6,first:[2,3,4,5,6,7,8,9],zero:true},
    {id:'all',name:'上册综合复习',limit:20,phase:7,zero:true},
    {id:'custom',name:'自定义数字范围',limit:10,phase:4,zero:true}
  ];
  var forms = [
    {id:'add',name:'合并求总数'}, {id:'slash',name:'斜线划去'},
    {id:'frame',name:'虚线框去掉'}, {id:'part',name:'求另一部分'},
    {id:'triple',name:'连加（三部分）'}, {id:'chainSub',name:'连减（划去＋框走）'},
    {id:'mixed',name:'加减混合（来了又走了）'}
  ];
  var mixedScenes = [
    {id:'motion-swan',name:'天鹅',unit:'只',sprite:'swan-poses.png',kind:'pond',arrive:'飞来',leave:'飞走'},
    {id:'motion-duck',name:'小鸭',unit:'只',sprite:'duck-poses.png',kind:'bank',arrive:'下水',leave:'上岸'},
    {id:'motion-car',name:'汽车',unit:'辆',sprite:'car-poses.png',kind:'parking',arrive:'开来',leave:'开走'},
    {id:'motion-bird',name:'小鸟',unit:'只',sprite:'bird-poses.png',kind:'tree',arrive:'飞来',leave:'飞走'},
    {id:'motion-rabbit',name:'小兔',unit:'只',sprite:'rabbit-poses.png',kind:'meadow',arrive:'跑来',leave:'跑走'},
    {id:'motion-fish',name:'小鱼',unit:'条',sprite:'fish-poses.png',kind:'water',arrive:'游来',leave:'游走'},
    {id:'motion-butterfly',name:'蝴蝶',unit:'只',sprite:'butterfly-poses.png',kind:'garden',arrive:'飞来',leave:'飞走'},
    {id:'motion-bee',name:'蜜蜂',unit:'只',sprite:'bee-poses.png',kind:'flowers',arrive:'飞来',leave:'飞走'},
    {id:'motion-chick',name:'小鸡',unit:'只',sprite:'chick-poses.png',kind:'yard',arrive:'跑来',leave:'跑走'},
    {id:'motion-turtle',name:'小乌龟',unit:'只',sprite:'turtle-poses.png',kind:'bank',arrive:'下水',leave:'上岸'},
    {id:'motion-student',name:'学生',unit:'名',sprite:'student-poses.png',kind:'classroom',arrive:'走进',leave:'走出'},
    {id:'motion-bicycle',name:'自行车',unit:'辆',sprite:'bicycle-poses.png',kind:'cycling',arrive:'骑来',leave:'骑走'},
    {id:'motion-bus',name:'公交车',unit:'辆',sprite:'bus-poses.png',kind:'busstop',arrive:'进站',leave:'出站'},
    {id:'motion-cat',name:'小猫',unit:'只',sprite:'cat-poses.png',kind:'yard',arrive:'跑来',leave:'跑走'},
    {id:'motion-dog',name:'小狗',unit:'只',sprite:'dog-poses.png',kind:'meadow',arrive:'跑来',leave:'跑走'},
    {id:'motion-soccer',name:'足球',unit:'个',sprite:'soccer-poses.png',kind:'field',arrive:'滚来',leave:'滚走'},
    {id:'motion-basketball',name:'篮球',unit:'个',sprite:'basketball-poses.png',kind:'court',arrive:'弹来',leave:'弹走'},
    {id:'motion-book',name:'图书',unit:'本',sprite:'book-poses.png',kind:'library',arrive:'放入',leave:'取走'},
    {id:'motion-pencil',name:'铅笔',unit:'支',sprite:'pencil-poses.png',kind:'desk',arrive:'放入',leave:'拿走'},
    {id:'motion-apple',name:'苹果',unit:'个',sprite:'apple-poses.png',kind:'basket',arrive:'放入',leave:'拿走'}
  ];
  var items = [
    ['fruit-apple','苹果','个'],['fruit-pear','梨','个'],['fruit-orange','橘子','个'],
    ['fruit-strawberry','草莓','颗'],['fruit-banana','香蕉','根'],['fruit-watermelon','西瓜','个'],
    ['fruit-peach','桃子','个'],['fruit-pineapple','菠萝','个'],['fruit-lemon','柠檬','个'],
    ['fruit-cherry','樱桃','颗'],['fruit-mango','芒果','个'],['fruit-kiwi','猕猴桃','个'],
    ['fruit-grape','葡萄','串'],['fruit-blueberry','蓝莓','颗'],['fruit-dragonfruit','火龙果','个'],
    ['animal-rabbit','小兔','只'],['animal-cat','小猫','只'],['animal-dog','小狗','只'],
    ['animal-panda','熊猫','只'],['animal-duck','小鸭','只'],['animal-chick','小鸡','只'],
    ['animal-fish','小鱼','条'],['animal-turtle','小龟','只'],['animal-butterfly','蝴蝶','只'],
    ['animal-bird','小鸟','只'],['animal-elephant','小象','只'],['animal-lamb','小羊','只'],
    ['animal-pig','小猪','只'],['animal-cow','小牛','只'],['animal-monkey','小猴','只']
  ].map(function (x) {return {id:x[0],name:x[1],unit:x[2]};});
  function scope(id, customMin, customMax) {
    var s = Object.assign({}, scopes.filter(function (v) {return v.id === id;})[0] || scopes[5]);
    if (id === 'custom') {s.limit = customMax || 10; s.min = customMin || 0;}
    return s;
  }
  function allowed(s) {
    if (s.first) return ['add'];
    if (s.phase < 4 || s.id === 'teen') return ['add','slash','frame','part'];
    return forms.map(function (x) {return x.id;});
  }
  function pairs(s) {
    var out = [], a, b;
    function add(a,b,op) {out.push({a:a,b:b,op:op,answer:op==='+'?a+b:a-b});}
    if (s.id === 'all') {
      var seen = {};
      ['within10','teen','carry'].forEach(function (id) {
        pairs(scope(id)).forEach(function (q) {var k=q.a+q.op+q.b;if(!seen[k]){seen[k]=true;out.push(q);}});
      });
      return out;
    }
    if (s.first) {
      s.first.forEach(function (first) {for(var second=1;second<=9;second++) if(first+second>10) add(first,second,'+');});
      return out;
    }
    if (s.id === 'teen') {
      for(a=10;a<=19;a++) for(b=0;b<=9;b++) {
        if(a+b<=19) {add(a,b,'+');if(a!==b)add(b,a,'+');}
        if(b<=a%10) add(a,b,'-');
      }
      for(b=1;b<=10;b++) add(10+b,10,'-');
      add(10,10,'+'); return out;
    }
    var low = s.zero ? 0 : 1;
    for(a=low;a<=s.limit;a++) for(b=low;b<=s.limit;b++) {
      if(a+b<=s.limit&&(!s.lower||a+b>=s.lower)) add(a,b,'+');
      if(a>=b&&(s.zero||a>b)&&(!s.lower||a>=s.lower)) add(a,b,'-');
    }
    if(s.id==='custom') out=out.filter(function(q){return q.a>=s.min&&q.b>=s.min&&q.answer>=s.min;});
    return out;
  }
  function poolFor(s, form) {
    var out = [], cap = s.id === 'custom' ? s.limit : 10, a,b,c;
    if(form==='mixed') {
      var mixedMin=s.id==='custom'?Math.max(1,s.min):1, resultMin=s.id==='custom'?s.min:0;
      for(a=mixedMin;a<=cap;a++)for(b=mixedMin;b<=cap;b++)for(c=mixedMin;c<=cap;c++) {
        ['+-','-+'].forEach(function(op){
          var middle=op.charAt(0)==='+'?a+b:a-b;
          var result=op.charAt(1)==='+'?middle+c:middle-c;
          if(middle<resultMin||middle>cap||result<resultMin||result>cap)return;
          out.push({a:a,b:b,c:c,op:op,answer:result});
        });
      }
    } else if(form==='triple'||form==='chainSub') {
      var min = s.id==='custom' ? Math.max(1,s.min) : 1;
      for(a=min;a<=cap;a++)for(b=min;b<=cap;b++)for(c=min;c<=cap;c++) {
        var result=form==='triple'?a+b+c:a-b-c;
        if(result<0||result>cap||(s.id==='custom'&&result<s.min))continue;
        out.push({a:a,b:b,c:c,op:form==='triple'?'++':'--',answer:result});
      }
    } else {
      out=pairs(s).filter(function(q){
        // 所有可见部分均为正数；含0阶段允许“全部划去”得到0。
        return q.a>0&&q.b>0&&(form==='add'?q.op==='+':q.op==='-')&&(form!=='part'||q.answer>0);
      });
    }
    return out.map(function(q){return Object.assign({form:form},q);});
  }
  function rng(seed) {
    var state=seed>>>0;
    return function(){state+=0x6d2b79f5;var t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  }
  function shuffle(a,r) {a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function signature(q) {return [q.form,q.a,q.b,q.c].join(':')+(q.form==='mixed'?':'+q.op:'');}
  function makeDeck(config, seed) {
    var s=scope(config.scope,config.customMin,config.customMax), r=rng(seed), pools={}, valid=[];
    (config.forms||forms.map(function(f){return f.id;})).forEach(function(f){
      if(allowed(s).indexOf(f)<0)return;
      var pool=poolFor(s,f);if(pool.length){pools[f]=pool;valid.push(f);}
    });
    if(!valid.length)throw new Error('所选范围没有可用图题，请调整数字范围或题型。');
    var formBag=[],itemBag=[],sceneBag=[],recent=[],lastItem='',lastScene='';
    return {
      forms:valid,
      next:function(){
        if(!formBag.length)formBag=shuffle(valid,r);
        var form=formBag.pop(),p=pools[form],fresh=p.filter(function(q){return recent.indexOf(signature(q))<0;});
        if(!fresh.length)fresh=p;
        var q=Object.assign({},fresh[Math.floor(r()*fresh.length)]);
        recent.push(signature(q));if(recent.length>12)recent.shift();
        if(form==='mixed') {
          if(!sceneBag.length)sceneBag=shuffle(mixedScenes,r);
          if(sceneBag.length>1&&sceneBag[sceneBag.length-1].id===lastScene)sceneBag.unshift(sceneBag.pop());
          q.item=sceneBag.pop();lastScene=q.item.id;
        } else {
          if(!itemBag.length)itemBag=shuffle(items,r);
          if(itemBag.length>1&&itemBag[itemBag.length-1].id===lastItem)itemBag.unshift(itemBag.pop());
          q.item=itemBag.pop();lastItem=q.item.id;
        }
        q.variant=Math.floor(r()*3);
        q.id=signature(q)+':'+q.item.id+':'+Math.floor(r()*1000000);
        return q;
      }
    };
  }
  function expected(q) {return q.c===undefined?[q.a,q.op,q.b,q.answer]:[q.a,q.op.charAt(0),q.b,q.op.charAt(1),q.c,q.answer];}
  function normalized(values) {return values.map(function(v,i){return i===1||i===3&&values.length===6?String(v).replace(/＋/g,'+').replace(/[－−]/g,'-'):String(v);});}
  function validate(q, values) {
    var v=normalized(values),want=expected(q);
    if(v.length!==want.length||v.some(function(x){return x==='';}))return {ok:false,reason:'请把算式填完整'};
    for(var i=0;i<v.length;i++) if(typeof want[i]==='number'&&!/^\d{1,2}$/.test(v[i]))return {ok:false,reason:'请填写正确的数字'};
    if(q.form==='add') {
      if(v[1]!=='+'||Number(v[3])!==q.answer)return {ok:false,reason:'再看看图中的两部分'};
      var same=Number(v[0])===q.a&&Number(v[2])===q.b,swap=Number(v[0])===q.b&&Number(v[2])===q.a;
      return {ok:same||swap,reason:same||swap?'':'再数一数两部分'};
    }
    if(q.form==='triple') {
      var operands=[Number(v[0]),Number(v[2]),Number(v[4])].sort(function(a,b){return a-b;}),target=[q.a,q.b,q.c].sort(function(a,b){return a-b;});
      var correct=v[1]==='+'&&v[3]==='+'&&Number(v[5])===q.answer&&operands.every(function(x,j){return x===target[j];});
      return {ok:correct,reason:correct?'':'再看看图中的三部分'};
    }
    // 连减先划去、再框走，减数次序与题面标记一致。
    var match=want.every(function(x,j){return typeof x==='number'?Number(v[j])===x:v[j]===x;});
    return {ok:match,reason:match?'':q.form==='part'?'用总数减去已知的一部分':q.form==='mixed'?'按先来或先走、再走或再来的顺序列式':'再看看去掉了多少'};
  }
  return {scopes:scopes,forms:forms,items:items,mixedScenes:mixedScenes,scope:scope,allowed:allowed,pairs:pairs,poolFor:poolFor,makeDeck:makeDeck,expected:expected,validate:validate,rng:rng};
}));
