const GraphRenderer = (() => {
  const NODE_W = 208;
  const NODE_H = 84;
  const COL_GAP = 96;
  const ROW_GAP = 28;
  const PAD = 40;

  function render(container, steps, doneSet, onSelect, selectedId) {
    const tiers = {};
    steps.forEach((s) => {
      (tiers[s.tier] = tiers[s.tier] || []).push(s);
    });
    const tierKeys = Object.keys(tiers).map(Number).sort((a, b) => a - b);

    const positions = {};
    tierKeys.forEach((tier) => {
      tiers[tier].forEach((step, row) => {
        positions[step.id] = {
          x: PAD + tier * (NODE_W + COL_GAP),
          y: PAD + row * (NODE_H + ROW_GAP),
        };
      });
    });

    const maxRows = Math.max(...tierKeys.map((t) => tiers[t].length));
    const width = PAD * 2 + tierKeys.length * NODE_W + (tierKeys.length - 1) * COL_GAP;
    const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;

    const edges = [];
    steps.forEach((step) => {
      (step.dependsOn || []).forEach((depId) => {
        if (positions[depId]) edges.push([depId, step.id]);
      });
    });

    const edgeSvg = edges
      .map(([fromId, toId]) => {
        const from = positions[fromId];
        const to = positions[toId];
        const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
        const x2 = to.x, y2 = to.y + NODE_H / 2;
        const midX = (x1 + x2) / 2;
        const bothDone = doneSet.has(fromId) && doneSet.has(toId);
        return `<path d="M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}"
          class="edge ${bothDone ? "edge-done" : ""}" fill="none" />`;
      })
      .join("");

    const nodeSvg = steps
      .map((step) => {
        const pos = positions[step.id];
        const done = doneSet.has(step.id);
        const unlocked = ProgressTracker.isUnlocked(step, doneSet);
        const state = done ? "done" : unlocked ? "unlocked" : "locked";
        const selected = step.id === selectedId ? "selected" : "";
        const title = escapeHtml(step.title);
        const office = escapeHtml(step.office);
        return `
          <g class="node node-${state} ${selected}" data-step-id="${step.id}"
             transform="translate(${pos.x}, ${pos.y})" tabindex="0" role="button"
             aria-label="${title}">
            <rect width="${NODE_W}" height="${NODE_H}" rx="3"></rect>
            <circle class="status-dot" cx="18" cy="18" r="6"></circle>
            <text class="node-title" x="34" y="23">${wrapText(title, 22)}</text>
            <text class="node-office" x="18" y="${NODE_H - 14}">${truncate(office, 28)}</text>
          </g>`;
      })
      .join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${Math.max(height, NODE_H + PAD * 2)}"
           width="100%" preserveAspectRatio="xMinYMin meet" class="graph-svg">
        <g class="edges">${edgeSvg}</g>
        <g class="nodes">${nodeSvg}</g>
      </svg>`;

    container.querySelectorAll(".node").forEach((el) => {
      el.addEventListener("click", () => onSelect(el.dataset.stepId));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(el.dataset.stepId);
      });
    });
  }

  function truncate(str, n) {
    return str.length > n ? escapeHtml(str.slice(0, n - 1)) + "…" : escapeHtml(str);
  }

  // Simple word-wrap into <tspan> lines for the SVG title text.
  function wrapText(str, charsPerLine) {
    const words = str.split(" ");
    const lines = [];
    let current = "";
    words.forEach((w) => {
      if ((current + " " + w).trim().length > charsPerLine) {
        lines.push(current.trim());
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    });
    if (current) lines.push(current);
    return lines
      .slice(0, 2)
      .map((line, i) => `<tspan x="34" dy="${i === 0 ? 0 : 16}">${line}</tspan>`)
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { render };
})();
