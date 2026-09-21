(function () {
  var header = document.querySelector('.site-header');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Front page: the menu marker follows the section in view. Links carry
     data-section naming a section id; sections with an id but no link clear
     the marker. The static aria-current in the HTML covers the other pages. */
  var spyLinks = document.querySelectorAll('.site-header a[data-section]');
  var sections = document.querySelectorAll('main section[id]');
  if (spyLinks.length && sections.length) {
    var current = null;
    function setCurrent(id) {
      if (id === current) return;
      current = id;
      for (var k = 0; k < spyLinks.length; k++) {
        var link = spyLinks[k];
        if (link.getAttribute('data-section') === id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    }
    function spy() {
      var line = window.innerHeight * 0.35;
      var active = null;
      for (var k = 0; k < sections.length; k++) {
        if (sections[k].getBoundingClientRect().top <= line) active = sections[k].id;
      }
      setCurrent(active);
    }
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
  }

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
