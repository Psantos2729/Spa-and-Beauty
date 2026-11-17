/* Ubicación: el armador de citas ("Arma tu cita") y el día de hoy en el horario.
   Nada se envía desde aquí: al final se abre WhatsApp con el mensaje escrito y la visitante decide si lo manda.
   Sin JavaScript el formulario queda oculto y se ve el enlace de WhatsApp y el teléfono. */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* Horario real (0 = domingo, null = cerrado). Se toma de script.js si está; si no, la copia de aquí. */
  var HORARIO = (window.Labella && window.Labella.horario) || {
    0: null, 1: ['6:30', '17:00'], 2: ['6:30', '17:00'], 3: ['6:30', '17:00'],
    4: ['6:30', '17:00'], 5: ['6:30', '17:00'], 6: ['7:00', '16:00']
  };
  var ULTIMA_ANTES = 60;  /* la última cita empieza una hora antes de cerrar */
  var AVISO_HOY = 60;     /* para hoy, al menos una hora desde ahora */
  var PASO = 30;          /* citas cada media hora */
  var SEMANAS = 3;

  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function min(h) { var p = h.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function hora(m) { return Math.floor(m / 60) + ':' + (m % 60 < 10 ? '0' : '') + (m % 60); }
  /* Guatemala: UTC-6 todo el año. Se trabaja con fechas UTC desplazadas para no depender de la zona del navegador. */
  function ahoraGT() { return new Date(Date.now() - 6 * 3600000); }

  /* ---- Horario: marca la fila de hoy ---- */
  var hoyDow = ahoraGT().getUTCDay();
  $('[data-horario] tr[data-dia]').forEach(function (tr) {
    if (tr.getAttribute('data-dia').split(' ').indexOf(String(hoyDow)) > -1) tr.classList.add('es-hoy');
  });

  /* ---- El armador ---- */
  var form = d.getElementById('armador');
  var rejilla = form && form.querySelector('[data-dias]');
  var selHora = form && form.querySelector('#cita-hora');
  if (!form || !rejilla || !selHora) return;

  var estado = form.querySelector('[data-estado]');
  var nombre = form.querySelector('#cita-nombre');
  var tarjeta = {};
  $('[data-cita]').forEach(function (dd) { tarjeta[dd.getAttribute('data-cita')] = dd; });

  /* Horas posibles de un día: de la apertura a una hora antes del cierre, cada 30 minutos. */
  function horas(dow, esHoy, ahoraMin) {
    var h = HORARIO[dow]; if (!h) return [];
    var out = [];
    for (var m = min(h[0]); m <= min(h[1]) - ULTIMA_ANTES; m += PASO) {
      if (esHoy && m < ahoraMin + AVISO_HOY) continue;
      out.push(hora(m));
    }
    return out;
  }

  /* Calendario de tres semanas, de lunes a domingo, empezando en la semana de hoy. */
  var dias = {};
  (function pintaCalendario() {
    var t = ahoraGT();
    var ahoraMin = t.getUTCHours() * 60 + t.getUTCMinutes();
    var desde = (t.getUTCDay() + 6) % 7; /* días desde el lunes */
    var base = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - desde);
    var frag = d.createDocumentFragment();
    for (var i = 0; i < SEMANAS * 7; i++) {
      var f = new Date(base + i * 86400000);
      var dow = f.getUTCDay(), num = f.getUTCDate(), mes = f.getUTCMonth();
      var esHoy = i === desde;
      var lista = i < desde ? [] : horas(dow, esHoy, ahoraMin);
      var clave = f.toISOString().slice(0, 10);
      var texto = DIAS[dow] + ' ' + num + ' de ' + MESES[mes];
      var motivo = i < desde ? 'ya pasó' : !HORARIO[dow] ? 'cerrado' : !lista.length ? 'sin horas libres hoy' : '';

      var label = d.createElement('label');
      label.className = 'dia' + (motivo ? ' dia--cerrado' : '');
      var input = d.createElement('input');
      input.type = 'radio'; input.name = 'dia'; input.value = clave;
      if (motivo) input.disabled = true;
      var n = d.createElement('span'); n.className = 'dia__num'; n.textContent = num; n.setAttribute('aria-hidden', 'true');
      var m = d.createElement('span'); m.className = 'dia__mes'; m.textContent = esHoy ? 'hoy' : MESES[mes].slice(0, 3); m.setAttribute('aria-hidden', 'true');
      var sr = d.createElement('span'); sr.className = 'sr-only';
      sr.textContent = (esHoy ? 'Hoy, ' : '') + texto + (motivo ? ', ' + motivo : '');
      label.appendChild(input); label.appendChild(n); label.appendChild(m); label.appendChild(sr);
      frag.appendChild(label);
      dias[clave] = { texto: texto, horas: lista, hoy: esHoy };
    }
    rejilla.appendChild(frag);
  })();

  function elegidos() { return $('input[name="servicio"]:checked', form).map(function (c) { return c.value; }); }
  function diaElegido() { var r = form.querySelector('input[name="dia"]:checked'); return r ? dias[r.value] : null; }
  function junta(lista) {
    if (lista.length < 2) return lista.join('');
    return lista.slice(0, -1).join(', ') + ' y ' + lista[lista.length - 1];
  }

  function llenaHoras() {
    var dia = diaElegido(), antes = selHora.value;
    selHora.innerHTML = '';
    if (!dia) {
      selHora.disabled = true;
      selHora.appendChild(new Option('Elige primero el día', ''));
      return;
    }
    selHora.disabled = false;
    selHora.appendChild(new Option('Elige la hora', ''));
    dia.horas.forEach(function (h) { selHora.appendChild(new Option(h, h)); });
    if (antes && dia.horas.indexOf(antes) > -1) selHora.value = antes;
  }

  /* La tarjeta de la izquierda se va llenando, con un pequeño sello en cada cambio. */
  function pon(clave, valor, vacio) {
    var dd = tarjeta[clave]; if (!dd) return;
    var texto = valor || vacio;
    if (dd.textContent === texto) return;
    dd.textContent = texto;
    dd.classList.toggle('vacio', !valor);
    dd.classList.remove('is-nuevo'); void dd.offsetWidth; dd.classList.add('is-nuevo');
  }
  function pintaTarjeta() {
    var s = elegidos(), dia = diaElegido();
    pon('servicios', junta(s), 'Por elegir');
    pon('dia', dia ? dia.texto.charAt(0).toUpperCase() + dia.texto.slice(1) : '', 'Por elegir');
    pon('hora', selHora.value, 'Por elegir');
    pon('nombre', nombre.value.trim(), 'Opcional');
  }

  function mensaje() {
    var n = nombre.value.trim(), dia = diaElegido();
    return (n ? 'Hola, soy ' + n + '. Quiero' : 'Hola, quiero') + ' pedir una cita en Labella Salón + Spa:\n' +
      'Servicios: ' + junta(elegidos()) + '\n' +
      'Día: ' + dia.texto + '\n' +
      'Hora: ' + selHora.value + '\n' +
      '¿Me confirman si hay espacio y el precio? Gracias.';
  }
  function waUrl(texto) {
    return window.Labella ? window.Labella.waUrl(texto) : 'https://wa.me/50230181300?text=' + encodeURIComponent(texto);
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'dia') llenaHoras();
    if (estado.textContent) estado.textContent = '';
    pintaTarjeta();
  });
  nombre.addEventListener('input', pintaTarjeta);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var falta = [], foco = null;
    if (!elegidos().length) { falta.push('al menos un servicio'); foco = foco || form.querySelector('input[name="servicio"]'); }
    if (!diaElegido()) { falta.push('el día'); foco = foco || form.querySelector('input[name="dia"]:not(:disabled)'); }
    else if (!selHora.value) { falta.push('la hora'); foco = foco || selHora; }
    if (falta.length) {
      estado.textContent = 'Te falta elegir ' + junta(falta) + '.';
      if (foco) foco.focus();
      return;
    }
    estado.textContent = 'Abrimos WhatsApp con tu mensaje. Envíalo y te confirmamos la cita por ahí.';
    var a = d.createElement('a');
    a.href = waUrl(mensaje()); a.target = '_blank'; a.rel = 'noopener';
    d.body.appendChild(a); a.click(); a.remove();
  });

  /* Todo listo: se muestra el armador y se oculta el respaldo sin JavaScript. */
  $('[data-sinjs]').forEach(function (el) { el.hidden = true; });
  form.hidden = false;
  pintaTarjeta();
})();
