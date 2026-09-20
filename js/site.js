(function () {
  var header = document.querySelector('.site-header');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  var email = document.querySelectorAll('[data-email]');
  for (var i = 0; i < email.length; i++) {
    var el = email[i];
    var addr = el.getAttribute('data-email').replace(' at ', '@');
    el.href = 'mailto:' + addr;
    if (el.hasAttribute('data-email-text')) el.textContent = addr;
  }
})();
