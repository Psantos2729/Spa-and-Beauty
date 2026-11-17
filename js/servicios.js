/* ==========================================================================
   Servicios (servicios.html): la carta que se pliega en lomos.
   En escritorio, con movimiento permitido, la sección #carta se queda fija
   2,5 pantallas y cada paso desliza la siguiente tarjeta sobre la anterior,
   que queda como un lomo de libro a la izquierda. Tocar un lomo (o una fila
   del índice) abre esa tarjeta. Solo se mueve transform y opacity.
   Sin JavaScript, con movimiento reducido, en tableta o en el teléfono la
   sección es una pila de tarjetas normal (.is-rest) y los enlaces del índice
   saltan a cada tarjeta con su ancla.
   ========================================================================== */
(function () {
  'use strict';
  var d = document;
  var raiz = d.getElementById('carta');
  if (!raiz) return;
  var mazo = raiz.querySelector('.lomos__mazo');
  var tarjetas = Array.prototype.slice.call(raiz.querySelectorAll('.tarjeta'));
  if (!mazo || tarjetas.length < 2) return;

  var N = tarjetas.length;
  var HOLD = 2.5; /* pantallas que el escenario se queda fijo */
  /* las dos partes de cada cuerpo: el texto (izquierda) y la lámina (derecha) */
  var partes = tarjetas.map(function (t) {
    return [t.querySelector('.tarjeta__texto'), t.querySelector('.tarjeta__lamina')].filter(Boolean);
  });
  var bordes = []; /* borde derecho de cada parte, medido desde el borde izquierdo de su tarjeta */
  var nombres = tarjetas.map(function (t) { var h = t.querySelector('h3'); return h ? h.textContent : ''; });
  var cuenta = raiz.querySelector('[data-lomos-cuenta]');
  var cuentaOriginal = cuenta ? cuenta.textContent : '';
  var mq = window.matchMedia('(min-width: 70em) and (min-height: 43.75em) and (prefers-reduced-motion: no-preference)');
  var vivo = false, lomo = 0, abierta = 0, pedido = 0, ultimaCuenta = -1;

  var limitar = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var suave = function (t) { return t * t * (3 - 2 * t); };
  /* llegada de la tarjeta j (0 = esperando a la derecha, 1 = abierta). Cada paso
     deja un 30 % de recorrido quieto para leer la tarjeta abierta. */
  var llegada = function (p, j) {
    if (j === 0) return 1;
    return suave(limitar((p - (j - 1) - 0.15) / 0.7, 0, 1));
  };

  /* botones sobre cada lomo (solo existen en la escena viva) */
  var botones = tarjetas.map(function (t, j) {
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'lomos__boton';
    b.setAttribute('aria-label', 'Abrir ' + nombres[j]);
    b.addEventListener('click', function (e) { irA(j, e.detail === 0); });
    t.insertBefore(b, t.firstChild);
    return b;
  });

  function recorrido() { return Math.max(1, raiz.offsetHeight - window.innerHeight); }
  function inicio() { return raiz.getBoundingClientRect().top + window.pageYOffset; }

  function medir() {
    var ancho = mazo.clientWidth;
    var l = tarjetas[0].querySelector('.tarjeta__lomo');
    lomo = l ? l.offsetWidth : 96;
    abierta = Math.round(ancho - (N - 1) * lomo);
    tarjetas.forEach(function (t, j) {
      t.style.width = abierta + 'px';
      t.style.zIndex = String(j + 1);
    });
    bordes = partes.map(function (lista) {
      return lista.map(function (el) { return el.offsetLeft + el.offsetWidth + 8; });
    });
  }

  function pintar() {
    pedido = 0;
    if (!vivo) return;
    var P = limitar(-raiz.getBoundingClientRect().top / recorrido(), 0, 1);
    var p = P * (N - 1);
    var s = tarjetas.map(function (t, j) { return llegada(p, j); });
    var xs = tarjetas.map(function (t, j) { return j * lomo + (abierta - lomo) * (1 - s[j]); });
    tarjetas.forEach(function (t, j) {
      t.style.transform = 'translate3d(' + xs[j].toFixed(1) + 'px,0,0)';
      /* cuánto de esta tarjeta queda a la vista: hasta donde empieza la siguiente.
         Cada parte (texto, lámina) se ve solo mientras nada la tapa, con un
         fundido en los últimos 16px: nunca hay texto debajo de otra tarjeta. */
      var libre = j < N - 1 ? xs[j + 1] - xs[j] : Infinity;
      var abierta_ = false;
      partes[j].forEach(function (el, i) {
        var op = limitar((libre - bordes[j][i]) / 16, 0, 1);
        el.style.opacity = op.toFixed(3);
        el.style.visibility = op <= 0.001 ? 'hidden' : '';
        if (i === 0 && op > 0.5) abierta_ = true;
      });
      botones[j].setAttribute('aria-pressed', abierta_ ? 'true' : 'false');
    });
    var k = Math.round(p);
    if (cuenta && k !== ultimaCuenta) {
      ultimaCuenta = k;
      cuenta.textContent = nombres[k] + ', ' + (k + 1) + ' de ' + N + '. Toca un lomo para abrir otro servicio.';
    }
  }
  function pedir() { if (!pedido) pedido = window.requestAnimationFrame(pintar); }

  function irA(j, inmediato) {
    if (!vivo) return;
    var y = inicio() + (j / (N - 1)) * recorrido();
    window.scrollTo({ top: Math.round(y), behavior: inmediato ? 'auto' : 'smooth' });
    setTimeout(function () { tarjetas[j].focus({ preventScroll: true }); }, inmediato ? 0 : 700);
  }

  function encender() {
    vivo = true;
    raiz.classList.remove('is-rest');
    raiz.classList.add('is-live');
    raiz.style.setProperty('--hold', String(HOLD));
    tarjetas.forEach(function (t) { t.setAttribute('tabindex', '-1'); });
    medir();
    pintar();
  }
  function apagar() {
    vivo = false;
    raiz.classList.remove('is-live');
    raiz.classList.add('is-rest');
    raiz.style.removeProperty('--hold');
    tarjetas.forEach(function (t, j) {
      t.style.transform = ''; t.style.width = ''; t.style.zIndex = '';
      t.removeAttribute('tabindex');
      partes[j].forEach(function (el) { el.style.opacity = ''; el.style.visibility = ''; });
    });
    if (cuenta) cuenta.textContent = cuentaOriginal;
    ultimaCuenta = -1;
  }
  function decidir() { if (mq.matches) encender(); else if (vivo || !raiz.classList.contains('is-rest')) apagar(); }

  decidir();
  if (mq.addEventListener) mq.addEventListener('change', decidir); else if (mq.addListener) mq.addListener(decidir);
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', function () { if (vivo) { medir(); pedir(); } });
  window.addEventListener('load', function () { if (vivo) { medir(); pintar(); } });

  /* el índice de la portada abre la tarjeta en la escena viva; sin ella, el ancla basta */
  Array.prototype.slice.call(d.querySelectorAll('[data-ir]')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!vivo) return;
      e.preventDefault();
      var j = +a.getAttribute('data-ir');
      irA(j, e.detail === 0);
      if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
    });
  });

  /* llegar con #masaje (u otra) en la dirección */
  if (vivo && location.hash) {
    var j = tarjetas.map(function (t) { return '#' + t.id; }).indexOf(location.hash);
    if (j >= 0) window.addEventListener('load', function () { irA(j, true); });
  }
})();
