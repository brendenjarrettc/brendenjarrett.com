// Sends the contact form in the background and shows the result inline.
// Without JavaScript the form still posts normally to Formspree.
(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      status.textContent = 'The contact form is not connected yet.';
      return;
    }
    status.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        status.textContent = 'Thanks! Your message was sent.';
      })
      .catch(function () {
        status.textContent = 'Sorry, something went wrong. Please try again.';
      });
  });
})();
