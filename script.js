/* TODO confirmar WhatsApp: número y mensaje centralizados aquí */
var WHATSAPP = {
  numero: '50230181300',
  mensaje: 'Hola, quiero reservar en Labella Salón + Spa'
};

(function(){
  var d=document, root=d.documentElement;
  root.classList.add('js');
  var $=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var movil=window.matchMedia('(max-width:759px)').matches;
  var hasIO='IntersectionObserver' in window;

  /* ---- enlaces de WhatsApp ---- */
  var waUrl='https://wa.me/'+WHATSAPP.numero+'?text='+encodeURIComponent(WHATSAPP.mensaje);
  $('[data-wa]').forEach(function(a){
    a.href=waUrl;a.target='_blank';a.rel='noopener';
  });

  /* ---- revelados al entrar en pantalla (una sola vez) ---- */
  var revs=$('.rev');
  if(reduce||!hasIO){revs.forEach(function(e){e.classList.add('in','listo')})}
  else{
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(!x.isIntersecting)return;
        var t=x.target;t.classList.add('in');io.unobserve(t);
        if(t.classList.contains('tile'))setTimeout(function(){t.classList.add('listo')},1400);
        if(t.querySelector('#ba'))pista();
      });
    },{threshold:.15,rootMargin:'0px 0px -40px 0px'});
    revs.forEach(function(e){io.observe(e)});
  }

  /* ---- fondos vivos: solo corren cuando su seccion esta visible ---- */
  var hero=d.querySelector('.hero'), heroOn=true;
  var ambs=$('[data-amb]');
  if(!hasIO){ambs.forEach(function(e){e.classList.add('vivo')})}
  else{
    var ao=new IntersectionObserver(function(en){
      en.forEach(function(x){
        x.target.classList.toggle('vivo',x.isIntersecting);
        if(x.target===hero){heroOn=x.isIntersecting;if(heroOn)arranca()}
      });
    },{rootMargin:'80px 0px'});
    ambs.forEach(function(e){ao.observe(e)});
  }
  d.addEventListener('visibilitychange',function(){
    root.classList.toggle('oculta',d.hidden);
    if(!d.hidden)arranca();
  });

  /* ---- cinta: boton de pausa (accesible por teclado) ---- */
  var cinta=d.querySelector('.cinta'), pausa=d.querySelector('.cinta__pausa');
  pausa.addEventListener('click',function(){
    var p=cinta.classList.toggle('pausada');
    pausa.setAttribute('aria-pressed',p);
    pausa.setAttribute('aria-label',p?'Reanudar la cinta de servicios':'Pausar la cinta de servicios');
  });

  /* ---- antes / despues: un range nativo mueve dos capas con transform ---- */
  var ba=d.getElementById('ba'), rango=ba.querySelector('.ba__rango');
  var clip=ba.querySelector('.ba__clip'), contra=ba.querySelector('.ba__contra'), asa=ba.querySelector('.ba__asa');
  function pinta(v){
    var o=4+v*.92-100;
    clip.style.transform='translateX('+o+'%)';
    contra.style.transform='translateX('+(-o)+'%)';
    asa.style.transform='translateX('+o+'%)';
  }
  rango.addEventListener('input',function(){ba.classList.remove('suave');pinta(+rango.value)});
  function pista(){ /* gesto de invitacion, una sola vez */
    pinta(82);
    setTimeout(function(){ba.classList.add('suave');pinta(50);
      setTimeout(function(){ba.classList.remove('suave')},950);},700);
  }

  /* ---- bucle rAF unico; se detiene en reposo, fuera del hero o con la pestaña oculta ---- */
  var corriendo=false;
  function arranca(){if(!reduce&&!corriendo&&!d.hidden){corriendo=true;requestAnimationFrame(paso)}}

  if(reduce)return; /* a partir de aqui todo es movimiento decorativo */

  /* ---- polvo de luz (22 en escritorio, 10 en movil) ---- */
  function r(a,b){return a+Math.random()*(b-a)}
  var capas={lejos:{s:[2,3],o:[.35,.55],t:[20,30],y:[-50,-90]},medio:{s:[3,4.5],o:[.55,.85],t:[15,22],y:[-80,-140]},cerca:{s:[7,11],o:[.3,.45],t:[11,16],y:[-120,-200]}};
  $('.polvo').forEach(function(c){
    var k=capas[c.getAttribute('data-capa')], n=+c.getAttribute(movil?'data-nm':'data-n');
    var lento=c.hasAttribute('data-lento')?1.5:1;
    for(var i=0;i<n;i++){
      var m=d.createElement('i'), s=r(k.s[0],k.s[1]), t=r(k.t[0],k.t[1])*lento;
      m.className='mota';
      m.style.cssText='left:'+r(4,96).toFixed(1)+'%;top:'+r(30,100).toFixed(1)+'%;width:'+s.toFixed(1)+'px;height:'+s.toFixed(1)+'px;--o:'+r(k.o[0],k.o[1]).toFixed(2)+';--t:'+t.toFixed(1)+'s;--r:-'+r(0,t).toFixed(1)+'s;--dx:'+r(-50,50).toFixed(0)+'px;--dy:'+(r(k.y[0],k.y[1])/lento).toFixed(0)+'px';
      c.appendChild(m);
    }
  });

  var profs=$('.hero [data-prof]').map(function(e){return {el:e,p:+e.getAttribute('data-prof')}});
  var foto=d.querySelector('.arco__zoom img'), marco=d.querySelector('.arco__marco'), glow=d.querySelector('.resplandor');
  var S={sy:0,tsy:window.pageYOffset,px:0,py:0,tpx:0,tpy:0,gx:0,gy:0,tgx:0,tgy:0};
  var imanes=[];
  function paso(){
    var vivo=false,i,m;
    function lerp(k,t,f){var dlt=S[t]-S[k];if(Math.abs(dlt)>.04){S[k]+=dlt*f;vivo=true}else S[k]=S[t]}
    lerp('sy','tsy',.14);lerp('px','tpx',.07);lerp('py','tpy',.07);lerp('gx','tgx',.16);lerp('gy','tgy',.16);
    if(heroOn){
      for(i=0;i<profs.length;i++)profs[i].el.style.transform='translate3d('+(S.px*profs[i].p*-.9).toFixed(2)+'px,'+(S.sy*profs[i].p+S.py*profs[i].p*-.9).toFixed(2)+'px,0)';
      var fy=Math.max(-26,Math.min(26,S.sy*-.05));
      foto.style.transform='translate3d('+(S.px*-.12).toFixed(2)+'px,'+(fy+S.py*-.1).toFixed(2)+'px,0) scale(1.12)';
      marco.style.transform='translate3d('+(S.px*.09).toFixed(2)+'px,'+(S.sy*.03+S.py*.07).toFixed(2)+'px,0)';
    }
    if(fine)glow.style.transform='translate3d('+S.gx.toFixed(1)+'px,'+S.gy.toFixed(1)+'px,0)';
    for(i=0;i<imanes.length;i++){
      m=imanes[i];
      var dx=m.tx-m.x, dy=m.ty-m.y;
      if(Math.abs(dx)>.04||Math.abs(dy)>.04){m.x+=dx*.18;m.y+=dy*.18;vivo=true;m.el.style.transform='translate3d('+m.x.toFixed(2)+'px,'+m.y.toFixed(2)+'px,0)'}
      else if(m.x!==m.tx||m.y!==m.ty){m.x=m.tx;m.y=m.ty;m.el.style.transform=m.tx||m.ty?'translate3d('+m.x+'px,'+m.y+'px,0)':''}
    }
    if(vivo&&!d.hidden)requestAnimationFrame(paso);else corriendo=false;
  }

  /* parallax al scroll: solo mientras el hero esta en pantalla */
  window.addEventListener('scroll',function(){if(heroOn){S.tsy=window.pageYOffset;arranca()}},{passive:true});
  arranca();

  if(!fine)return; /* lo que sigue es solo para raton */

  /* cursor: mueve la foto del arco y el resplandor dorado */
  window.addEventListener('pointermove',function(e){
    if(e.pointerType&&e.pointerType!=='mouse')return;
    S.tpx=(e.clientX/window.innerWidth-.5)*100;
    S.tpy=(e.clientY/window.innerHeight-.5)*100;
    S.tgx=e.clientX;S.tgy=e.clientY;
    if(!glow.classList.contains('on')){S.gx=S.tgx;S.gy=S.tgy;glow.classList.add('on')}
    arranca();
  },{passive:true});
  root.addEventListener('mouseleave',function(){glow.classList.remove('on')});

  /* boton magnetico */
  $('.iman').forEach(function(el){
    var m={el:el,x:0,y:0,tx:0,ty:0};imanes.push(m);
    el.addEventListener('pointermove',function(e){
      var b=el.getBoundingClientRect();
      m.tx=Math.max(-8,Math.min(8,(e.clientX-(b.left+b.width/2)+m.x)*.09));
      m.ty=Math.max(-6,Math.min(6,(e.clientY-(b.top+b.height/2)+m.y)*.25));
      arranca();
    });
    el.addEventListener('pointerleave',function(){m.tx=0;m.ty=0;arranca()});
  });

  /* inclinacion 3D leve en tarjetas (max 2.5 grados) */
  $('[data-tilt]').forEach(function(card){
    var inn=card.querySelector('.card__in'), raf=0, ev=null;
    card.addEventListener('pointermove',function(e){
      ev=e;if(raf)return;
      raf=requestAnimationFrame(function(){
        raf=0;var b=card.getBoundingClientRect();
        var x=(ev.clientX-b.left)/b.width-.5, y=(ev.clientY-b.top)/b.height-.5;
        inn.style.transitionDuration='200ms';
        inn.style.transform='translateY(-5px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*5).toFixed(2)+'deg)';
      });
    });
    card.addEventListener('pointerleave',function(){
      if(raf){cancelAnimationFrame(raf);raf=0}
      inn.style.transitionDuration='';inn.style.transform='';
    });
  });
})();
