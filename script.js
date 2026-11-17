/* ==========================================================================
   Labella Salón + Spa — script compartido (se carga en TODAS las páginas)
   Cada función comprueba que sus elementos existen antes de actuar.
   Si este archivo no carga, todo el contenido sigue visible y todos los
   enlaces funcionan (los de WhatsApp llevan la URL completa en el HTML).
   ========================================================================== */

/* Fuente única del número y del mensaje de WhatsApp.
   Si cambia el número, cámbialo aquí y busca "wa.me/50230181300" en los HTML
   (es el enlace de respaldo para quien no tiene JavaScript). */
var WHATSAPP = {
  numero: '50230181300',
  mensaje: 'Hola, quiero reservar en Labella Salón + Spa'
};

/* Horario (hora de Guatemala). 0 = domingo. null = cerrado. */
var HORARIO = {
  0: null,
  1: ['6:30', '17:00'], 2: ['6:30', '17:00'], 3: ['6:30', '17:00'],
  4: ['6:30', '17:00'], 5: ['6:30', '17:00'],
  6: ['7:00', '16:00']
};

(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. WhatsApp: todos los [data-wa] toman la URL de la constante ----
     data-wa-texto="…" cambia el mensaje de ese enlace en concreto. */
  function waUrl(texto) {
    return 'https://wa.me/' + WHATSAPP.numero + '?text=' + encodeURIComponent(texto || WHATSAPP.mensaje);
  }
  function enlazarWa(scope) {
    $('[data-wa]', scope).forEach(function (a) {
      a.href = waUrl(a.getAttribute('data-wa-texto'));
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }
  enlazarWa();
  /* Para otras páginas (p. ej. el armador de citas): Labella.waUrl('texto') */
  window.Labella = { waUrl: waUrl, enlazarWa: enlazarWa, horario: HORARIO };

  /* ---- 2. Navegación: marca la página actual si el HTML no lo hizo ---- */
  (function () {
    var navs = $('.nav, .pie__nav');
    if (!navs.length) return;
    var actual = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    navs.forEach(function (nav) {
      if (nav.querySelector('[aria-current="page"]')) return;
      $('a[href]', nav).forEach(function (a) {
        if ((a.getAttribute('href') || '').toLowerCase() === actual) a.setAttribute('aria-current', 'page');
      });
    });
  })();

  /* ---- 3. Horario de hoy: [data-hoy] muestra si está abierto ahora ---- */
  (function () {
    var els = $('[data-hoy]');
    if (!els.length) return;
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    function min(h) { var p = h.split(':'); return (+p[0]) * 60 + (+p[1]); }
    function ahoraGT() {
      /* Guatemala: UTC-6 todo el año */
      var n = new Date(); var u = n.getTime() + n.getTimezoneOffset() * 60000;
      return new Date(u - 6 * 3600000);
    }
    function texto() {
      var t = ahoraGT(), dia = t.getDay(), m = t.getHours() * 60 + t.getMinutes();
      var hoy = HORARIO[dia];
      if (hoy && m < min(hoy[0])) return 'Hoy abrimos a las ' + hoy[0];
      if (hoy && m < min(hoy[1])) return 'Abierto ahora, hasta las ' + hoy[1];
      for (var k = 1; k <= 7; k++) {
        var dd = (dia + k) % 7, h = HORARIO[dd];
        if (!h) continue;
        return (k === 1 ? 'Mañana ' + dias[dd] : 'El ' + dias[dd]) + ' abrimos a las ' + h[0];
      }
      return '';
    }
    function pinta() { var s = texto(); if (s) els.forEach(function (e) { e.textContent = s; }); }
    pinta();
    setInterval(pinta, 60000);
  })();

  /* ---- 4. Entradas al hacer scroll ---- */
  (function () {
    /* numerar los hijos de cada [data-reveal-group] para escalonarlos */
    $('[data-reveal-group]').forEach(function (g) {
      $('[data-reveal]', g).forEach(function (el, i) {
        if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i);
      });
    });
    var targets = $('[data-reveal]');
    root.classList.add('rv'); /* desde aquí el script se encarga; se apaga la red de seguridad CSS */
    function mostrar(el) { el.classList.add('is-in'); }
    if (!targets.length) return;
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach(mostrar); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        mostrar(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
    /* red de seguridad: lo que ya esté en pantalla tras cargar se muestra sí o sí */
    window.addEventListener('load', function () {
      setTimeout(function () {
        targets.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) mostrar(el);
        });
      }, 2000);
    });
  })();

  /* ---- 5. Fundido lento entre fotos: [data-fundido] ----
     Cambia de foto cada 5,5 s con un fundido de 1,6 s. Se pausa con la pestaña
     oculta o fuera de pantalla. Con movimiento reducido no avanza sola.
     Opcional: [data-fundido-pie] (texto que acompaña) y [data-fundido-elegir]
     (botones para elegir la foto), enlazados con data-para="id-del-fundido". */
  $('[data-fundido]').forEach(function (caja) {
    var imgs = $('img', caja);
    if (imgs.length < 2) return;
    var id = caja.id;
    var pie = id ? d.querySelector('[data-fundido-pie][data-para="' + id + '"]') : null;
    var elegir = id ? d.querySelector('[data-fundido-elegir][data-para="' + id + '"]') : null;
    var botones = elegir ? $('button', elegir) : [];
    var i = 0, timer = 0, visible = true;

    caja.classList.add('is-live');
    function ir(n) {
      imgs[i].classList.remove('is-on');
      i = (n + imgs.length) % imgs.length;
      imgs[i].classList.add('is-on');
      if (pie && imgs[i].getAttribute('data-pie')) pie.textContent = imgs[i].getAttribute('data-pie');
      botones.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    }
    function para() { clearInterval(timer); timer = 0; }
    function sigue() {
      para();
      if (reduce || d.hidden || !visible) return;
      timer = setInterval(function () { ir(i + 1); }, 5500);
    }
    ir(0);
    if (elegir) {
      elegir.hidden = false;
      botones.forEach(function (b, k) {
        b.addEventListener('click', function () { ir(k); sigue(); });
      });
    }
    d.addEventListener('visibilitychange', sigue);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting; sigue();
      }).observe(caja);
    }
    sigue();
  });
})();
