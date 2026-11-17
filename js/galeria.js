/* Galería: el antes y el después. Sin este archivo se ve la foto doble entera
   (antes a la izquierda, después a la derecha) y no hay nada que mover. */
(function () {
  'use strict';
  var d = document;
  var ba = d.getElementById('ba');
  if (!ba) return;
  var rango = ba.querySelector('.ba__rango');
  var clip = ba.querySelector('.ba__clip');
  var contra = ba.querySelector('.ba__contra');
  var asa = ba.querySelector('.ba__asa');
  if (!rango || !clip || !contra || !asa) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ba.classList.add('is-live');
  rango.hidden = false;
  var guia = d.querySelector('.vitrina__guia');
  if (guia) guia.hidden = false;

  /* v = cuánto se ve del "antes", de 0 a 100. La línea nunca toca el borde (4 % a 96 %). */
  var actual = 50;
  function texto(v) {
    v = Math.round(v);
    if (v === 50) return 'Mitad antes, mitad después';
    return 'Antes ' + v + ' por ciento, después ' + (100 - v) + ' por ciento';
  }
  function pinta(v) {
    actual = Math.max(0, Math.min(100, v));
    var o = 4 + actual * 0.92 - 100;
    clip.style.transform = 'translateX(' + o + '%)';
    contra.style.transform = 'translateX(' + -o + '%)';
    asa.style.transform = 'translateX(' + o + '%)';
    rango.setAttribute('aria-valuetext', texto(actual));
  }
  function modo(m) {
    ba.classList.remove('suave', 'rapido');
    if (m) ba.classList.add(m);
  }

  /* Teclado (flechas, Inicio, Fin, Re Pág, Av Pág) y lectores de pantalla: el range nativo */
  rango.addEventListener('input', function () { modo('rapido'); pinta(+rango.value); });

  /* Dedo y ratón. touch-action: pan-y deja el scroll vertical al navegador;
     solo un gesto claramente horizontal mueve la línea. */
  var inicio = null, arrastra = false;
  function desdeX(x) {
    var r = ba.getBoundingClientRect();
    var p = (x - r.left) / r.width * 100;
    var v = (p - 4) / 0.92;
    pinta(v);
    rango.value = Math.round(actual / 5) * 5;
  }
  function suelta() {
    inicio = null; arrastra = false;
    ba.classList.remove('is-drag');
  }
  ba.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    inicio = { x: e.clientX, y: e.clientY, id: e.pointerId };
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      arrastra = true;
      ba.classList.add('is-drag');
      try { ba.setPointerCapture(e.pointerId); } catch (err) { /* sin captura, sigue igual */ }
      modo('rapido');
      desdeX(e.clientX);
      rango.focus({ preventScroll: true });
    }
  });
  ba.addEventListener('pointermove', function (e) {
    if (!inicio || e.pointerId !== inicio.id) return;
    if (!arrastra) {
      var dx = Math.abs(e.clientX - inicio.x), dy = Math.abs(e.clientY - inicio.y);
      if (dy > 10 && dy > dx) { suelta(); return; } /* es scroll: no lo tocamos */
      if (dx < 8) return;
      arrastra = true;
      ba.classList.add('is-drag');
      try { ba.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    }
    modo(null);
    desdeX(e.clientX);
  });
  ba.addEventListener('pointerup', function (e) {
    if (inicio && !arrastra && e.pointerType !== 'mouse') { modo('rapido'); desdeX(e.clientX); } /* un toque */
    suelta();
  });
  ba.addEventListener('pointercancel', suelta);
  ba.addEventListener('lostpointercapture', function () { if (arrastra) suelta(); });

  pinta(50);

  /* Gesto de invitación, una sola vez, cuando la foto ya está a la vista */
  if (reduce || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    io.disconnect();
    setTimeout(function () {
      if (inicio || d.activeElement === rango) return;
      modo('suave'); pinta(78);
      setTimeout(function () {
        if (inicio) return;
        pinta(50);
        setTimeout(function () { modo(null); }, 950);
      }, 1000);
    }, 900);
  }, { threshold: 0.6 });
  io.observe(ba);
})();
