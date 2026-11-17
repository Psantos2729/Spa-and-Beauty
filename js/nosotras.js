/* Nosotras: las dos fotos sueltas junto a la carta derivan un poco con el scroll.
   Solo transform (vía --deriva). Sin JavaScript o con movimiento reducido, quedan quietas. */
(function () {
  'use strict';
  var laminas = Array.prototype.slice.call(document.querySelectorAll('.misiva__lamina'));
  if (!laminas.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 60em)').matches) return; /* en el teléfono van en fila, quietas */

  var pedido = false;
  var fuerza = [-0.06, 0.08]; /* izquierda sube, derecha baja: se separan al pasar */

  function pinta() {
    pedido = false;
    var vh = window.innerHeight;
    laminas.forEach(function (el, i) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var centro = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--deriva', (centro * (fuerza[i] || 0)).toFixed(1) + 'px');
    });
  }
  function pide() { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } }
  window.addEventListener('scroll', pide, { passive: true });
  window.addEventListener('resize', pide);
  pinta();
})();
