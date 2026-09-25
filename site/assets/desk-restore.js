/**
 * Typed spend and one saved sales target on the restored SAMPLE desk.
 * Sales ÷ typed spend stays blank until a row is inside the window.
 * A goal says nothing until it is saved.
 */
(function () {
  "use strict";

  var desk = document.getElementById("dd-desk");
  if (!desk) return;

  var rows = [];
  var nextId = 1;
  var goal = null;

  function money(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function formatRatio(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    var digits = n >= 100 ? 0 : 2;
    return (
      n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }) + "×"
    );
  }

  function bounds() {
    return {
      start: desk.getAttribute("data-start") || "",
      end: desk.getAttribute("data-end") || "",
      sales: desk.getAttribute("data-sales"),
    };
  }

  function inWindow(row, box) {
    if (!box.start || !box.end) return false;
    return row.day >= box.start && row.day <= box.end;
  }

  function paintSpend() {
    var list = document.getElementById("dd-typed-rows");
    var result = document.getElementById("dd-typed-roas");
    var detail = document.getElementById("dd-typed-detail");
    if (!list || !result || !detail) return;
    var box = bounds();
    list.replaceChildren();
    if (!rows.length) {
      var empty = document.createElement("li");
      empty.textContent = "No spend entered.";
      list.appendChild(empty);
    } else {
      rows.forEach(function (row) {
        var item = document.createElement("li");
        var inside = inWindow(row, box);
        item.textContent =
          row.channel +
          " · " +
          money(row.amount) +
          " · " +
          row.day +
          (inside ? "" : " · outside this window");
        var remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.setAttribute("data-remove-typed", String(row.id));
        item.appendChild(remove);
        list.appendChild(item);
      });
    }
    var spent = rows.reduce(function (total, row) {
      return total + (inWindow(row, box) ? row.amount : 0);
    }, 0);
    var sales = box.sales === "" ? null : Number(box.sales);
    if (!(spent > 0) || sales == null || !Number.isFinite(sales)) {
      result.textContent = "—";
      detail.textContent =
        sales == null
          ? "Sales for this window are not stored, so sales ÷ spend stays blank."
          : "Sales ÷ spend stays blank until spend is entered in this window.";
      return;
    }
    var ratio = sales / spent;
    result.textContent = formatRatio(ratio);
    detail.textContent = money(sales) + " ÷ " + money(spent) + " = " + formatRatio(ratio);
  }

  function paintGoal() {
    var status = document.getElementById("dd-user-goal-status");
    if (!status) return;
    var box = bounds();
    var sales = box.sales === "" ? null : Number(box.sales);
    if (goal == null) {
      status.textContent = "Nothing saved.";
      return;
    }
    if (sales == null) {
      status.textContent = "Saved target " + money(goal) + ". This window has no sales to compare.";
      return;
    }
    var delta = sales - goal;
    if (delta === 0) {
      status.textContent = "Saved target " + money(goal) + ". Sales match that target.";
      return;
    }
    if (delta > 0) {
      status.textContent =
        "Saved target " + money(goal) + ". Sales are " + money(delta) + " above that target.";
      return;
    }
    status.textContent =
      "Saved target " + money(goal) + ". Sales are " + money(Math.abs(delta)) + " short of that target.";
  }

  var form = document.getElementById("dd-typed-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var amount = Number(form.elements.amount.value);
      var day = form.elements.day.value;
      var error = document.getElementById("dd-typed-error");
      if (!day || !Number.isFinite(amount) || amount <= 0) {
        if (error) error.textContent = "Enter a channel, an amount above zero, and a day.";
        return;
      }
      if (error) error.textContent = "";
      rows.push({
        id: nextId,
        channel: form.elements.channel.value,
        amount: Math.round(amount),
        day: day,
      });
      nextId += 1;
      form.elements.amount.value = "";
      paintSpend();
    });
  }

  var list = document.getElementById("dd-typed-rows");
  if (list) {
    list.addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-typed]");
      if (!button) return;
      var id = Number(button.getAttribute("data-remove-typed"));
      rows = rows.filter(function (row) {
        return row.id !== id;
      });
      paintSpend();
    });
  }

  var goalForm = document.getElementById("dd-user-goal");
  if (goalForm) {
    goalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var amount = Number(goalForm.elements.target.value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      goal = Math.round(amount);
      paintGoal();
    });
  }
  var clear = document.getElementById("dd-user-goal-clear");
  if (clear) {
    clear.addEventListener("click", function () {
      goal = null;
      if (goalForm) goalForm.elements.target.value = "";
      paintGoal();
    });
  }

  document.addEventListener("dd-rendered", function () {
    paintSpend();
    paintGoal();
  });

  paintSpend();
  paintGoal();
})();
