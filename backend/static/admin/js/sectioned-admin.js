(function () {
  function initSectionedAdmin(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-section-target]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-section-panel]"));
    if (!tabs.length || !panels.length) {
      return;
    }

    var model = root.getAttribute("data-model") || "unknown-model";
    var storageKey = "sectioned-admin:" + model;

    function setActive(targetId) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-section-target") === targetId;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      panels.forEach(function (panel) {
        var active = panel.id === targetId;
        if (active) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "hidden");
        }
      });

      try {
        window.localStorage.setItem(storageKey, targetId);
      } catch (error) {
        // Ignore storage write issues (privacy mode, etc.).
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setActive(tab.getAttribute("data-section-target"));
      });
    });

    var errorPanel = panels.find(function (panel) {
      return panel.querySelector(".errors, .errorlist");
    });

    var preferredTarget = null;
    try {
      preferredTarget = window.localStorage.getItem(storageKey);
    } catch (error) {
      preferredTarget = null;
    }

    var defaultTarget =
      (errorPanel && errorPanel.id) ||
      preferredTarget ||
      tabs[0].getAttribute("data-section-target");

    setActive(defaultTarget);
  }

  function onReady() {
    var roots = document.querySelectorAll("[data-sectioned-admin]");
    roots.forEach(initSectionedAdmin);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
