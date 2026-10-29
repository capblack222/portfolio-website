/* ==========================================================================
   Nishtha Gupta — portfolio
   Plain JavaScript. No framework, no build step, no dependencies.

   Two jobs only:
     1. Highlight the nav link for the section you are looking at.
     2. Submit the contact form without leaving the page.

   Everything else on this site is HTML and CSS. If a feature can be done in
   CSS, it is done in CSS — that is why this file is short.
   ========================================================================== */

(function () {
  "use strict";

  /* --- 0. theme toggle ---------------------------------------------------
     The saved theme is applied by an inline script in <head>, before first
     paint — that is what stops a dark-mode visitor seeing a white flash.
     This only handles the button.

     With no saved choice the site follows the OS setting, so the button
     reports what the page currently looks like rather than what is stored.
  */

  var toggle = document.getElementById("theme-toggle");
  var themeLabel = document.getElementById("theme-label");

  function currentTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function paintToggle() {
    if (!toggle || !themeLabel) return;
    var isDark = currentTheme() === "dark";
    // The label names the mode you would switch *to*.
    themeLabel.textContent = isDark ? "light" : "dark";
    toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    toggle.setAttribute("aria-label", isDark ? "Light mode" : "Dark mode");
  }

  if (toggle) {
    paintToggle();

    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        // Preference just won't persist. Not worth surfacing.
      }
      paintToggle();
    });

    // Follow the OS if the visitor has never chosen explicitly.
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (!document.documentElement.getAttribute("data-theme")) paintToggle();
      });
  }

  /* --- 1. active nav link ------------------------------------------------
     IntersectionObserver rather than a scroll listener: the browser tells us
     when a section crosses the threshold instead of us asking on every frame.
  */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav__links a")
  );

  if (navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    var sections = [];

    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) {
        byId[id] = link;
        sections.push(section);
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });

        if (!visible.length) return;

        navLinks.forEach(function (link) {
          link.removeAttribute("aria-current");
        });

        var current = byId[visible[0].target.id];
        if (current) current.setAttribute("aria-current", "true");
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* --- 2. scroll progress rail -------------------------------------------
     Fills the hairline in the left gutter as you move down the page.

     Scroll fires far more often than the screen refreshes, so the handler
     only flags that something changed and requestAnimationFrame does the
     actual style write — one write per frame instead of one per event.

     CSS already hides the rail under prefers-reduced-motion, but we also
     skip wiring the listener at all in that case: no point running on every
     scroll to update something nobody can see.
  */

  /* The rail ends level with the last piece of content — the submit button in
     the contact form — not at the footer, which left it running on through
     the empty space below the form.

     Anchored to the button rather than to the section, because an empty
     .form__status paragraph sits below the button and still occupies a line
     box: the section's own bottom edge is ~50px lower than the last thing you
     can actually see. */
  var RAIL_END_GAP = 60;
  var RAIL_END_ANCHORS = [
    "#contact button[type='submit']",
    "#contact .section__body",
    ".footer",
  ];

  function railEndAnchor() {
    for (var i = 0; i < RAIL_END_ANCHORS.length; i++) {
      var el = document.querySelector(RAIL_END_ANCHORS[i]);
      if (el) return el;
    }
    return null;
  }

  var railFill = document.getElementById("rail-fill");
  var railDot = document.getElementById("rail-dot");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (railFill && railDot && !reduceMotion.matches) {
    var queued = false;

    function paintRail() {
      queued = false;

      var rail = railFill.parentNode;

      // The rail is fixed to the viewport, so near the bottom of the page its
      // lower end would hang below where the content stops. Shorten it to end
      // level with the last content element instead.
      var anchor = railEndAnchor();

      rail.style.height = "";
      var railTop = rail.getBoundingClientRect().top;
      var full = rail.clientHeight;

      if (anchor) {
        var allowed = anchor.getBoundingClientRect().bottom - railTop - RAIL_END_GAP;
        if (allowed < full) rail.style.height = Math.max(0, allowed) + "px";
      }

      var track = rail.clientHeight;
      // clientHeight is 0 while the rail is display:none (narrow screens).
      if (!track) return;

      // Progress is measured against the end of the *content*, not the end of
      // the document. The footer is chrome, so counting it would mean the rail
      // never fills until you had scrolled past everything worth reading.
      //
      // Target: the moment the bottom of the viewport meets the top of the
      // footer. That happens at scrollY === footerTop - innerHeight.
      var footer = document.querySelector(".footer");
      var end = footer
        ? footer.getBoundingClientRect().top + window.scrollY - window.innerHeight
        : document.body.scrollHeight - window.innerHeight;

      var progress =
        end > 0 ? Math.min(1, Math.max(0, window.scrollY / end)) : 1;

      var filled = progress * track;
      railFill.style.height = filled + "px";
      railDot.style.top = filled + "px";
    }

    function requestRail() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(paintRail);
    }

    window.addEventListener("scroll", requestRail, { passive: true });
    window.addEventListener("resize", requestRail);
    paintRail();
  }

  /* --- 3. contact form ---------------------------------------------------
     Posts JSON to the API Gateway endpoint in front of the SES Lambda.
     See infra/README.md for how that is deployed.

     Until ENDPOINT is filled in, the form tells people to use the mailto
     link instead. A form that looks like it sent but did not is worse than
     no form, so the failure is always visible.
  */

  var ENDPOINT = "https://dy7tc7pcse.execute-api.us-east-1.amazonaws.com/contact";

  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");

  if (!form || !statusEl) return;

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = "form__status" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      company: form.company.value, // honeypot — bots fill it, people do not
    };

    if (!data.name || !data.email || !data.message) {
      setStatus("All fields are required.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setStatus("That email looks off.", "error");
      return;
    }

    if (!ENDPOINT) {
      setStatus(
        "The form is not wired up yet — please use the email link instead.",
        "error"
      );
      return;
    }

    setStatus("Sending…");

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        form.reset();
        setStatus("Sent. I will get back to you.", "ok");
      })
      .catch(function () {
        setStatus(
          "Could not send that — please use the email link instead.",
          "error"
        );
      });
  });
})();
