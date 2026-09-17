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

  /* --- 2. contact form ---------------------------------------------------
     Posts JSON to the API Gateway endpoint in front of the SES Lambda.
     See infra/README.md for how that is deployed.

     Until ENDPOINT is filled in, the form tells people to use the mailto
     link instead. A form that looks like it sent but did not is worse than
     no form, so the failure is always visible.
  */

  var ENDPOINT = ""; // <- paste your API Gateway invoke URL here

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
