(function(){
'use strict';
/* mini layout builder: a taste of the future full explorer */
var TYPES=[
  {n:'bool',   size:1, align:1},
  {n:'int32',  size:4, align:4},
  {n:'int64',  size:8, align:8},
  {n:'*T',     size:8, align:8},
  {n:'string', size:16, align:8}
];
var COLORS=['f0','f1','f2'];
var fields=[];
var pal=document.getElementById('lab-palette');
var strip=document.getElementById('lab-strip');
var sizeEl=document.getElementById('lab-size');
var wasteEl=document.getElementById('lab-waste');
var cap=document.getElementById('lab-cap');

TYPES.forEach(function(t){
  var b=document.createElement('button');
  b.className='w-btn'; b.textContent='+ '+t.n;
  b.addEventListener('click', function(){
    if(fields.length>=8){ cap.textContent='хватит: 8 полей — уже показательно'; return; }
    fields.push(t); render(true);
  });
  pal.appendChild(b);
});
document.getElementById('lab-opt').addEventListener('click', function(){
  fields.sort(function(a,b){ return b.align-a.align || b.size-a.size; });
  render(true);
  cap.textContent='тяжёлое вперёд — воздух тает. так же работает перестановка полей в коде';
});
document.getElementById('lab-clear').addEventListener('click', function(){
  fields=[]; render(false);
  cap.textContent='добавь поля кнопками сверху — соберём struct';
});

function layout(){
  var off=0, segs=[], maxA=1;
  fields.forEach(function(f,i){
    if(f.align>maxA) maxA=f.align;
    var pad=(f.align-(off%f.align))%f.align;
    if(pad) segs.push({pad:true, n:pad, at:off});
    off+=pad;
    segs.push({f:f, i:i, at:off});
    off+=f.size;
  });
  var tail=(maxA-(off%maxA))%maxA;
  if(tail && fields.length) segs.push({pad:true, n:tail, at:off, tail:true});
  return {segs:segs, size:off+tail};
}
function render(tick){
  var L=layout();
  strip.innerHTML='';
  var waste=0;
  L.segs.forEach(function(s){
    var seg=document.createElement('div'); seg.className='byte-seg';
    var cells=document.createElement('div'); cells.className='cells';
    var n=s.pad?s.n:s.f.size;
    for(var k=0;k<n;k++){
      var b=document.createElement('div');
      if(s.pad){ b.className='byte-box pad'; b.setAttribute('data-tip','padding · '+s.n+' Б '+(s.tail?'— добивка структуры':'— выравнивание следующего поля')); waste+= (k===0?0:0); }
      else{ b.className='byte-box '+COLORS[s.i%3]; b.setAttribute('data-tip','f'+s.i+' · '+s.f.n+' · '+s.f.size+' Б · смещение '+s.at); }
      b.textContent=s.at+k;
      cells.appendChild(b);
    }
    if(s.pad) waste+=s.n;
    var tag=document.createElement('div');
    tag.className='seg-tag'+(s.pad?' padtag':'');
    tag.textContent=s.pad?('↳ pad '+s.n):('f'+s.i+' ('+s.f.n+')');
    seg.appendChild(cells); seg.appendChild(tag);
    strip.appendChild(seg);
  });
  sizeEl.textContent=L.size; wasteEl.textContent=waste;
  if(tick){ [sizeEl,wasteEl].forEach(function(el){ el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }); }
  if(fields.length) cap.textContent='порядок полей = порядок объявления. попробуй «оптимизировать»';
}
render(false);
})();
