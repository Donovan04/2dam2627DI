/* proceso.js · Copiar prompts y visor de capturas de la web del proceso.
   Sin dependencias; funciona también abriendo los archivos directamente. */
(function () {
  'use strict';

  /* ---------- Copiar prompts ---------- */
  function copyWithSelection(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.btn-copy');
    if (!button) return;
    var source = document.getElementById(button.getAttribute('data-copy'));
    var text = source ? source.content.textContent : '';
    var status = button.parentElement.querySelector('.copy-status');

    function report(ok) {
      if (ok === false) ok = copyWithSelection(text);
      button.focus();
      if (status) {
        status.textContent = ok
          ? 'Prompt copiado al portapapeles.'
          : 'No se ha podido copiar. Abre el texto completo y cópialo a mano.';
        clearTimeout(button._timer);
        button._timer = setTimeout(function () { status.textContent = ''; }, 5000);
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { report(true); }, function () { report(false); });
    } else {
      report(false);
    }
  });

  /* ---------- Visor de capturas ---------- */
  var dialog = document.getElementById('lightbox');
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot__zoom'));
  if (!dialog || !shots.length) return;

  // La imagen del visor se crea aquí para no dejar en el HTML una <img> sin origen
  var image = document.createElement('img');
  image.className = 'lightbox__img';
  image.alt = '';
  dialog.querySelector('.lightbox__stage').appendChild(image);
  var caption = dialog.querySelector('.lightbox__caption');
  var openLink = dialog.querySelector('[data-lb="open"]');
  var closeButton = dialog.querySelector('[data-lb="close"]');
  var prevButton = dialog.querySelector('[data-lb="prev"]');
  var nextButton = dialog.querySelector('[data-lb="next"]');
  var current = 0;
  var opener = null;

  if (shots.length < 2) {
    prevButton.hidden = true;
    nextButton.hidden = true;
  }

  function show(index) {
    current = (index + shots.length) % shots.length;
    var button = shots[current];
    var thumb = button.querySelector('img');
    var figcaption = button.parentElement.querySelector('figcaption');
    image.src = button.getAttribute('data-full');
    image.alt = thumb ? thumb.alt : '';
    caption.textContent = figcaption ? figcaption.textContent : image.alt;
    openLink.href = button.getAttribute('data-full');
  }

  function restoreFocus() {
    if (opener) {
      var target = opener;
      opener = null;
      target.focus();
    }
  }

  function open(index, from) {
    opener = from;
    show(index);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    closeButton.focus();
  }

  function close() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    restoreFocus();
  }

  shots.forEach(function (button, index) {
    button.addEventListener('click', function () { open(index, button); });
  });

  dialog.addEventListener('close', restoreFocus);
  dialog.addEventListener('cancel', function (event) {
    // Escape: se cierra igual, pero devolviendo el foco de forma explícita
    event.preventDefault();
    close();
  });

  dialog.addEventListener('click', function (event) {
    var action = event.target.closest('[data-lb]');
    if (action) {
      var kind = action.getAttribute('data-lb');
      if (kind === 'close') close();
      else if (kind === 'prev') show(current - 1);
      else if (kind === 'next') show(current + 1);
      return;
    }
    // Clic fuera de la imagen (fondo oscuro o zona vacía): cerrar
    if (event.target === dialog || event.target.classList.contains('lightbox__stage')) close();
  });

  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' && shots.length > 1) { event.preventDefault(); show(current - 1); }
    else if (event.key === 'ArrowRight' && shots.length > 1) { event.preventDefault(); show(current + 1); }
    else if (event.key === 'Escape' && typeof dialog.showModal !== 'function') { close(); }
  });
})();
