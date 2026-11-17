/* Comportamiento de las páginas internas. Cada bloque comprueba que sus elementos existen. */
(function () {
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Galería: antes / después (un range nativo mueve dos capas con transform) ---- */
  var ba = d.getElementById('ba');
  if (ba) {
    var rango = ba.querySelector('.ba__rango');
    var clip = ba.querySelector('.ba__clip'), contra = ba.querySelector('.ba__contra'), asa = ba.querySelector('.ba__asa');
    var pinta = function (v) {
      var o = 4 + v * 0.92 - 100;
      clip.style.transform = 'translateX(' + o + '%)';
      contra.style.transform = 'translateX(' + -o + '%)';
      asa.style.transform = 'translateX(' + o + '%)';
    };
    rango.addEventListener('input', function () { ba.classList.remove('suave'); pinta(+rango.value); });
    pinta(50);
    /* gesto de invitación, una sola vez, al entrar en pantalla */
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        pinta(82);
        setTimeout(function () {
          ba.classList.add('suave'); pinta(50);
          setTimeout(function () { ba.classList.remove('suave'); }, 950);
        }, 700);
      }, { threshold: 0.5 });
      io.observe(ba);
    }
  }

  /* ---- Contacto: armador de cita. Sin JavaScript el formulario envía el mensaje genérico. ---- */
  var cita = d.getElementById('cita');
  if (cita) {
    var f = cita.elements, resumen = d.getElementById('cita-resumen');
    /* horas reales: L-V 6:30 a 17:00, sábado 7:00 a 16:00 (última cita una hora antes del cierre) */
    var horas = function (dia) {
      var ini = dia === 'sábado' ? 7 * 60 : 6 * 60 + 30, fin = (dia === 'sábado' ? 16 : 17) * 60 - 60, out = [];
      for (var m = ini; m <= fin; m += 30) out.push(Math.floor(m / 60) + ':' + (m % 60 ? '30' : '00'));
      return out;
    };
    var llenaHoras = function () {
      var antes = f.hora.value;
      f.hora.innerHTML = '';
      horas(f.dia.value).forEach(function (h) {
        var o = d.createElement('option'); o.textContent = h; f.hora.appendChild(o);
      });
      if (antes) f.hora.value = antes;
      if (!f.hora.value) f.hora.selectedIndex = 0;
    };
    var mensaje = function () {
      var n = f.nombre.value.trim();
      return 'Hola' + (n ? ', soy ' + n : '') + '. Quiero reservar ' + f.servicio.value.toLowerCase() +
        ' en Labella el ' + f.dia.value + ' a las ' + f.hora.value + '.';
    };
    var pinta2 = function () {
      resumen.textContent = f.servicio.value + ', ' + f.dia.value + ' a las ' + f.hora.value + '. Te confirmamos por WhatsApp.';
      f.text.value = mensaje();
    };
    f.dia.addEventListener('change', function () { llenaHoras(); pinta2(); });
    cita.addEventListener('input', pinta2);
    cita.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = window.Labella ? window.Labella.waUrl(mensaje()) : cita.action + '?text=' + encodeURIComponent(mensaje());
      window.open(url, '_blank', 'noopener');
    });
    llenaHoras(); pinta2();
  }
})();
