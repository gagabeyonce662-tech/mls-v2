(function () {
  function debugLog(hypothesisId, location, message, data) {
    // #region agent log
    fetch("http://127.0.0.1:7349/ingest/3f08206e-1a73-4004-abc2-35f0c9af591f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "e55290",
      },
      body: JSON.stringify({
        sessionId: "e55290",
        runId: "pre-fix-caret",
        hypothesisId: hypothesisId,
        location: location,
        message: message,
        data: data,
        timestamp: Date.now(),
      }),
    }).catch(function () {});
    // #endregion
  }

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

    // #region agent log
    debugLog("C1", "sectioned-admin.js:onReady", "Caret debug bootstrap", {
      roots: roots.length,
      path: window.location.pathname,
    });
    // #endregion

    document.addEventListener("focusin", function (event) {
      var target = event.target;
      if (!target) {
        return;
      }
      var isInput =
        target.matches &&
        target.matches(".wp-admin-editor input:not([type='checkbox']):not([type='radio']):not([type='hidden']), .wp-admin-editor textarea, .wp-admin-editor select");
      if (!isInput) {
        return;
      }
      var style = window.getComputedStyle(target);
      var rect = target.getBoundingClientRect();
      // #region agent log
      debugLog("C2", "sectioned-admin.js:focusin", "Focused field computed styles", {
        tagName: target.tagName,
        className: target.className,
        color: style.color,
        caretColor: style.caretColor,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        paddingLeft: style.paddingLeft,
        textIndent: style.textIndent,
        overflowX: style.overflowX,
        selectionStart: typeof target.selectionStart === "number" ? target.selectionStart : null,
        valueLength: typeof target.value === "string" ? target.value.length : null,
        clientWidth: target.clientWidth,
        left: rect.left,
        right: rect.right,
      });
      // #endregion
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
