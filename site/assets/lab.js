(function () {
  const tabs = Array.prototype.slice.call(document.querySelectorAll(".lab-tabs [role='tab']"));
  if (!tabs.length) return;

  function selectTab(next) {
    tabs.forEach((tab) => {
      const selected = tab === next;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !selected;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let target = null;
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (!target) return;
      event.preventDefault();
      target.focus();
      selectTab(target);
    });
  });
})();
