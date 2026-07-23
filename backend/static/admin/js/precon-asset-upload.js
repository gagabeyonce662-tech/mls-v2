(() => {
  const selector = "input.precon-asset-upload[type=file]";

  function decorate(input) {
    if (input.dataset.preconDropReady) return;
    input.dataset.preconDropReady = "true";
    const target = input.closest("td, .form-row, .fieldBox") || input.parentElement;
    if (!target) return;
    target.classList.add("precon-asset-drop-target");

    const setDroppedFile = (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    ["dragenter", "dragover"].forEach((name) => target.addEventListener(name, (event) => {
      event.preventDefault();
      target.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((name) => target.addEventListener(name, (event) => {
      event.preventDefault();
      target.classList.remove("is-dragging");
    }));
    target.addEventListener("drop", setDroppedFile);
  }

  function initialize() {
    document.querySelectorAll(selector).forEach(decorate);
  }

  document.addEventListener("DOMContentLoaded", initialize);
  new MutationObserver(initialize).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
