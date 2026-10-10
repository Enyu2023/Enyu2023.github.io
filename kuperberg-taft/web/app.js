(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const DEFAULT_VIEWBOX = [0, 0, 900, 560];
  const COMBING_KEYS = ["alpha", "beta", "nu", "mu"];
  const COMBING_LABELS = { alpha: "α", beta: "β", nu: "ν", mu: "μ" };
  const CROSSING_MATCH_RADIUS = 52;

  const dom = {};
  let state = createBlankState();
  let activeTool = "select";
  let draft = null;
  let draftPointer = null;
  let drag = null;
  let crossingSerial = 1;
  let toastTimer = null;
  let renderFrame = 0;

  function createBlankState() {
    return {
      name: "Untitled Heegaard diagram",
      genus: 1,
      ell: 3,
      rootPower: 1,
      combing: {
        kind: "difference_to_reference",
        reference: "diagram framing",
        alpha: [0],
        beta: [0],
        nu: [0],
        mu: [0]
      },
      lower: [],
      upper: [],
      crossings: [],
      certified: false,
      selected: null,
      explicitOrderMode: false,
      viewBox: DEFAULT_VIEWBOX.slice(),
      surface: null,
      templateId: "",
      templateStatus: "draft",
      lastResult: null
    };
  }

  function init() {
    cacheDom();
    bindControls();
    populateTemplates();
    renderCombingTable();
    syncFormFromState();
    setTool("select");
    renderAll();
    updateValidation(false);
  }

  function cacheDom() {
    const ids = [
      "template-select", "new-diagram", "diagram-canvas", "surface-layer", "curve-layer",
      "crossing-layer", "vertex-layer", "draft-layer", "canvas-empty", "canvas-toast",
      "lower-count", "upper-count", "crossing-count", "tool-select", "tool-lower",
      "tool-upper", "undo-point", "finish-curve", "delete-selection", "diagram-name",
      "ell-input", "root-power-input", "genus-input", "reference-input", "combing-head",
      "combing-body", "combing-count", "model-status", "selection-badge", "inspector-empty",
      "curve-inspector", "crossing-inspector", "curve-chip", "curve-id-label", "curve-theta2",
      "curve-order", "crossing-id-label", "incident-curves", "antipode-power", "tilt-power",
      "certified-input", "validate-button", "validation-box", "compute-button", "result-card",
      "exact-result", "root-description", "approx-result", "states-result", "work-result",
      "coefficient-result", "copy-result", "import-button", "export-button", "file-input",
      "io-note", "live-region", "drawing-help", "lens-n", "lens-k", "lens-framing",
      "generate-lens"
    ];
    ids.forEach((id) => {
      dom[toCamel(id)] = document.getElementById(id);
    });
  }

  function toCamel(value) {
    return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  function bindControls() {
    [dom.toolSelect, dom.toolLower, dom.toolUpper].forEach((button) => {
      button.addEventListener("click", () => setTool(button.dataset.tool));
    });

    dom.undoPoint.addEventListener("click", undoDraftPoint);
    dom.finishCurve.addEventListener("click", finishCurve);
    dom.deleteSelection.addEventListener("click", deleteSelection);
    dom.newDiagram.addEventListener("click", () => {
      if (hasWork() && !window.confirm("Start a blank diagram? Unsaved drawing changes will be discarded.")) {
        return;
      }
      resetBlank();
    });

    dom.diagramCanvas.addEventListener("pointerdown", onCanvasPointerDown);
    dom.diagramCanvas.addEventListener("pointermove", onCanvasPointerMove);
    dom.diagramCanvas.addEventListener("pointerup", endDrag);
    dom.diagramCanvas.addEventListener("pointercancel", endDrag);
    dom.diagramCanvas.addEventListener("dblclick", (event) => {
      if (draft) {
        event.preventDefault();
        finishCurve();
      }
    });

    document.addEventListener("keydown", onKeyDown);

    dom.diagramName.addEventListener("input", () => {
      state.name = dom.diagramName.value;
      markDirty();
    });
    dom.ellInput.addEventListener("input", () => {
      state.ell = integerOrNaN(dom.ellInput.value);
      markDirty();
      updateValidation(false);
    });
    dom.rootPowerInput.addEventListener("input", () => {
      state.rootPower = integerOrNaN(dom.rootPowerInput.value);
      markDirty();
      updateValidation(false);
    });
    dom.referenceInput.addEventListener("input", () => {
      state.combing.reference = dom.referenceInput.value;
      markDirty(true);
    });
    dom.genusInput.addEventListener("change", onGenusChange);
    dom.certifiedInput.addEventListener("change", () => {
      state.certified = dom.certifiedInput.checked;
      markDirty();
      updateValidation(false);
    });

    dom.curveTheta2.addEventListener("input", () => {
      const curve = selectedCurve();
      if (!curve) return;
      curve.theta2 = integerOrNaN(dom.curveTheta2.value);
      markDirty(true);
      updateValidation(false);
    });
    dom.antipodePower.addEventListener("input", () => {
      const crossing = selectedCrossing();
      if (!crossing) return;
      crossing.antipode_power = integerOrNaN(dom.antipodePower.value);
      markDirty(true);
      updateValidation(false);
    });
    dom.tiltPower.addEventListener("input", () => {
      const crossing = selectedCrossing();
      if (!crossing) return;
      crossing.tilt_power = integerOrNaN(dom.tiltPower.value);
      markDirty(true);
      updateValidation(false);
    });

    dom.validateButton.addEventListener("click", () => updateValidation(true));
    dom.computeButton.addEventListener("click", computeInvariant);
    dom.copyResult.addEventListener("click", copyExactResult);
    dom.importButton.addEventListener("click", () => dom.fileInput.click());
    dom.fileInput.addEventListener("change", importJsonFile);
    dom.exportButton.addEventListener("click", exportCompiledJson);
    dom.templateSelect.addEventListener("change", onTemplateChange);
    dom.generateLens.addEventListener("click", generateLensTemplate);
  }

  function resetBlank() {
    state = createBlankState();
    draft = null;
    drag = null;
    crossingSerial = 1;
    dom.templateSelect.value = "";
    syncFormFromState();
    renderCombingTable();
    setTool("select");
    renderAll();
    updateValidation(false);
    notify("Blank genus-one diagram ready.");
  }

  function hasWork() {
    return state.lower.length > 0 || state.upper.length > 0 || Boolean(draft);
  }

  function setTool(tool) {
    if (tool !== "select" && state.explicitOrderMode) {
      setToolButtons("select");
      activeTool = "select";
      notify("This imported contraction is an order schematic. Choose New before drawing editable curves.", true);
      return;
    }
    if (draft && tool !== draft.type) {
      cancelDraft(false);
    }
    activeTool = tool;
    setToolButtons(tool);
    dom.diagramCanvas.dataset.tool = tool;
    if (tool === "lower" || tool === "upper") {
      state.selected = null;
      renderInspector();
      notify(`Click to place the ${tool} curve. Press Enter or click its first point to close.`);
    }
    renderDraft();
  }

  function setToolButtons(tool) {
    [dom.toolSelect, dom.toolLower, dom.toolUpper].forEach((button) => {
      const active = button.dataset.tool === tool;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function onCanvasPointerDown(event) {
    if (event.button !== 0) return;
    if (activeTool === "lower" || activeTool === "upper") {
      event.preventDefault();
      addDraftPoint(svgPoint(event));
      return;
    }
    if (event.target === dom.diagramCanvas || event.target.classList.contains("canvas-grid")) {
      state.selected = null;
      renderAll();
    }
  }

  function onCanvasPointerMove(event) {
    if (drag) {
      event.preventDefault();
      const point = clampPoint(svgPoint(event));
      const curve = findCurve(drag.type, drag.id);
      if (!curve) return;
      curve.points[drag.index] = point;
      markDirty(true);
      scheduleGeometryRender();
      return;
    }
    if (draft) {
      draftPointer = clampPoint(svgPoint(event));
      renderDraft();
    }
  }

  function beginVertexDrag(event, curve, index) {
    if (state.explicitOrderMode || activeTool !== "select") return;
    event.preventDefault();
    event.stopPropagation();
    drag = { type: curve.type, id: curve.id, index, pointerId: event.pointerId };
    dom.diagramCanvas.setPointerCapture(event.pointerId);
  }

  function endDrag(event) {
    if (!drag) return;
    if (dom.diagramCanvas.hasPointerCapture(event.pointerId)) {
      dom.diagramCanvas.releasePointerCapture(event.pointerId);
    }
    drag = null;
    recomputeCrossings();
    renderAll();
    updateValidation(false);
  }

  function scheduleGeometryRender() {
    if (renderFrame) return;
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      recomputeCrossings();
      renderDiagram();
      renderInspector();
      renderCounts();
    });
  }

  function addDraftPoint(point) {
    const clamped = clampPoint(point);
    if (!draft) {
      draft = { type: activeTool, points: [clamped] };
    } else if (draft.points.length >= 3 && distance(clamped, draft.points[0]) < 16) {
      finishCurve();
      return;
    } else if (distance(clamped, draft.points[draft.points.length - 1]) > 3) {
      draft.points.push(clamped);
    }
    draftPointer = clamped;
    renderDraft();
    updateDraftButtons();
  }

  function undoDraftPoint() {
    if (!draft) return;
    draft.points.pop();
    if (!draft.points.length) draft = null;
    renderDraft();
    updateDraftButtons();
  }

  function finishCurve() {
    if (!draft) return;
    const points = removeAdjacentDuplicates(draft.points);
    if (points.length < 3) {
      notify("A closed curve needs at least three distinct points.", true);
      return;
    }
    const type = draft.type;
    const curve = {
      id: nextCurveId(type),
      type,
      theta2: type === "lower" ? 1 : -1,
      points,
      closed: true,
      crossings: []
    };
    state[type].push(curve);
    draft = null;
    draftPointer = null;
    const curveCount = Math.max(state.lower.length, state.upper.length);
    if (curveCount > state.genus) setGenus(curveCount);
    state.selected = { kind: "curve", type, id: curve.id };
    recomputeCrossings();
    markDirty(true);
    setTool("select");
    renderCombingTable();
    syncFormFromState();
    renderAll();
    updateValidation(false);
    notify(`${curve.id} closed. Drag a vertex to adjust its intersections.`);
  }

  function cancelDraft(announce) {
    draft = null;
    draftPointer = null;
    renderDraft();
    updateDraftButtons();
    if (announce) notify("Curve draft cancelled.");
  }

  function deleteSelection() {
    const curve = selectedCurve();
    if (!curve || state.explicitOrderMode) return;
    const collection = state[curve.type];
    const index = collection.findIndex((item) => item.id === curve.id);
    if (index >= 0) collection.splice(index, 1);
    state.selected = null;
    recomputeCrossings();
    markDirty(true);
    renderAll();
    updateValidation(false);
    notify(`${curve.id} deleted.`);
  }

  function onKeyDown(event) {
    const editable = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement;
    if (editable) return;
    if (event.key === "v" || event.key === "V") setTool("select");
    if (event.key === "l" || event.key === "L") setTool("lower");
    if (event.key === "u" || event.key === "U") setTool("upper");
    if (event.key === "Enter" && draft) {
      event.preventDefault();
      finishCurve();
    }
    if (event.key === "Escape" && draft) {
      event.preventDefault();
      cancelDraft(true);
      setTool("select");
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedCurve()) {
      event.preventDefault();
      deleteSelection();
    }
  }

  function renderAll() {
    renderDiagram();
    renderInspector();
    renderCounts();
    updateDraftButtons();
    dom.canvasEmpty.hidden = state.lower.length + state.upper.length > 0 || Boolean(draft);
    dom.deleteSelection.disabled = !selectedCurve() || state.explicitOrderMode;
    dom.drawingHelp.textContent = state.explicitOrderMode
      ? "Compiled-order schematic: labels and based orders are preserved from JSON; choose New for editable geometry."
      : "Drag vertices to edit. Crossing order starts at each square basepoint and follows its arrow.";
  }

  function renderDiagram() {
    dom.diagramCanvas.setAttribute("viewBox", state.viewBox.join(" "));
    renderSurface();
    dom.curveLayer.replaceChildren();
    allCurves().forEach(renderCurve);
    renderCrossings();
    renderVertices();
    renderDraft();
  }

  function renderSurface() {
    dom.surfaceLayer.replaceChildren();
    const [, , width, height] = state.viewBox;
    const marginX = Math.max(24, width * 0.035);
    const marginY = Math.max(24, height * 0.055);
    if (state.surface && typeof state.surface.path === "string") {
      dom.surfaceLayer.appendChild(svgElement("path", {
        d: state.surface.path,
        class: "surface-boundary"
      }));
    } else {
      dom.surfaceLayer.appendChild(svgElement("rect", {
        x: marginX,
        y: marginY,
        width: width - 2 * marginX,
        height: height - 2 * marginY,
        rx: Math.min(72, height * 0.12),
        class: "surface-boundary"
      }));
    }
    const label = svgElement("text", {
      x: marginX + 12,
      y: marginY + 22,
      fill: "#7c8587",
      "font-size": "13",
      "font-family": "Georgia, serif",
      "font-style": "italic"
    });
    label.textContent = `Σ${state.genus}`;
    dom.surfaceLayer.appendChild(label);
  }

  function renderCurve(curve) {
    if (!curve.points || curve.points.length < 2) return;
    const selected = state.selected && state.selected.kind === "curve" && state.selected.type === curve.type && state.selected.id === curve.id;
    const group = svgElement("g", {
      class: `curve-group${selected ? " is-selected" : ""}`,
      "data-curve-id": curve.id,
      tabindex: "0",
      role: "button",
      "aria-label": `${curve.type} curve ${curve.id}, theta two ${curve.theta2}`
    });
    const pathData = curvePath(curve.points, curve.closed !== false);
    group.appendChild(svgElement("path", { d: pathData, class: "curve-hit" }));
    group.appendChild(svgElement("path", { d: pathData, class: `curve-line ${curve.type}` }));

    const p0 = curve.points[0];
    const p1 = curve.points[1];
    const arrowStart = interpolate(p0, p1, 0.24);
    const arrowEnd = interpolate(p0, p1, 0.67);
    group.appendChild(svgElement("line", {
      x1: arrowStart.x,
      y1: arrowStart.y,
      x2: arrowEnd.x,
      y2: arrowEnd.y,
      class: `direction-arrow ${curve.type}`
    }));

    group.appendChild(svgElement("rect", {
      x: p0.x - 7,
      y: p0.y - 7,
      width: 14,
      height: 14,
      rx: 2,
      class: `basepoint ${curve.type}`
    }));
    const baseLabel = svgElement("text", {
      x: p0.x,
      y: p0.y + 3,
      class: "basepoint-label"
    });
    baseLabel.textContent = "B";
    group.appendChild(baseLabel);

    const labelPoint = offsetLabelPoint(p0, p1);
    const label = svgElement("text", {
      x: labelPoint.x,
      y: labelPoint.y,
      class: `curve-label ${curve.type}`
    });
    label.textContent = curve.id;
    group.appendChild(label);

    group.addEventListener("pointerdown", (event) => {
      if (activeTool !== "select") return;
      event.stopPropagation();
      selectCurve(curve);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCurve(curve);
      }
    });
    dom.curveLayer.appendChild(group);
  }

  function renderVertices() {
    dom.vertexLayer.replaceChildren();
    const curve = selectedCurve();
    if (!curve || state.explicitOrderMode || activeTool !== "select") return;
    curve.points.forEach((point, index) => {
      const vertex = svgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: index === 0 ? 6.2 : 5,
        class: `vertex ${curve.type}`,
        role: "button",
        tabindex: "0",
        "aria-label": `${curve.id} vertex ${index + 1}; drag to move`
      });
      vertex.addEventListener("pointerdown", (event) => beginVertexDrag(event, curve, index));
      dom.vertexLayer.appendChild(vertex);
    });
  }

  function renderCrossings() {
    dom.crossingLayer.replaceChildren();
    state.crossings.forEach((crossing) => {
      if (!Number.isFinite(crossing.x) || !Number.isFinite(crossing.y)) return;
      const selected = state.selected && state.selected.kind === "crossing" && state.selected.id === crossing.id;
      const group = svgElement("g", {
        class: `crossing-target${selected ? " is-selected" : ""}`,
        transform: `translate(${crossing.x} ${crossing.y})`,
        tabindex: "0",
        role: "button",
        "aria-label": `Crossing ${crossing.id}, ${crossing.lower} with ${crossing.upper}, antipode power ${crossing.antipode_power}`
      });
      group.appendChild(svgElement("circle", { r: 9, class: "crossing-halo" }));
      group.appendChild(svgElement("circle", { r: 4.1, class: "crossing-core" }));
      const label = svgElement("text", { x: 9, y: -9, class: "crossing-label" });
      label.textContent = crossing.id;
      group.appendChild(label);
      group.addEventListener("pointerdown", (event) => {
        if (activeTool !== "select") return;
        event.preventDefault();
        event.stopPropagation();
        selectCrossing(crossing);
      });
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectCrossing(crossing);
        }
      });
      dom.crossingLayer.appendChild(group);
    });
  }

  function renderDraft() {
    if (!dom.draftLayer) return;
    dom.draftLayer.replaceChildren();
    if (!draft || !draft.points.length) return;
    const points = draft.points.slice();
    if (draftPointer) points.push(draftPointer);
    dom.draftLayer.appendChild(svgElement("path", {
      d: curvePath(points, false),
      class: `draft-line ${draft.type}`
    }));
    draft.points.forEach((point, index) => {
      dom.draftLayer.appendChild(svgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: index === 0 ? 7 : 4.5,
        class: `draft-point ${draft.type}`
      }));
    });
    if (draftPointer && draft.points.length >= 3) {
      dom.draftLayer.appendChild(svgElement("circle", {
        cx: draft.points[0].x,
        cy: draft.points[0].y,
        r: 14,
        class: `draft-cursor ${draft.type}`
      }));
    }
  }

  function renderCounts() {
    dom.lowerCount.textContent = String(state.lower.length);
    dom.upperCount.textContent = String(state.upper.length);
    dom.crossingCount.textContent = String(state.crossings.length);
  }

  function updateDraftButtons() {
    dom.undoPoint.disabled = !draft || draft.points.length === 0;
    dom.finishCurve.disabled = !draft || draft.points.length < 3;
  }

  function selectCurve(curve) {
    state.selected = { kind: "curve", type: curve.type, id: curve.id };
    renderAll();
  }

  function selectCrossing(crossing) {
    state.selected = { kind: "crossing", id: crossing.id };
    renderAll();
  }

  function renderInspector() {
    const curve = selectedCurve();
    const crossing = selectedCrossing();
    dom.inspectorEmpty.hidden = Boolean(curve || crossing);
    dom.curveInspector.hidden = !curve;
    dom.crossingInspector.hidden = !crossing;
    if (curve) {
      dom.selectionBadge.textContent = `${curve.type} curve`;
      dom.curveChip.className = `curve-chip ${curve.type}`;
      dom.curveIdLabel.textContent = curve.id;
      dom.curveTheta2.value = finiteInputValue(curve.theta2);
      dom.curveOrder.textContent = curveOrder(curve).join(" → ") || "no crossings";
    } else if (crossing) {
      dom.selectionBadge.textContent = "crossing";
      dom.crossingIdLabel.textContent = crossing.id;
      dom.incidentCurves.textContent = `${crossing.lower} ∩ ${crossing.upper}`;
      dom.antipodePower.value = finiteInputValue(crossing.antipode_power);
      dom.tiltPower.value = finiteInputValue(crossing.tilt_power);
    } else {
      dom.selectionBadge.textContent = "Nothing selected";
    }
    dom.deleteSelection.disabled = !curve || state.explicitOrderMode;
  }

  function selectedCurve() {
    if (!state.selected || state.selected.kind !== "curve") return null;
    return findCurve(state.selected.type, state.selected.id);
  }

  function selectedCrossing() {
    if (!state.selected || state.selected.kind !== "crossing") return null;
    return state.crossings.find((item) => item.id === state.selected.id) || null;
  }

  function findCurve(type, id) {
    return state[type].find((curve) => curve.id === id) || null;
  }

  function allCurves() {
    return state.lower.concat(state.upper);
  }

  function curveOrder(curve) {
    if (state.explicitOrderMode && Array.isArray(curve.crossings)) return curve.crossings.slice();
    return state.crossings
      .filter((crossing) => crossing.lower === curve.id || crossing.upper === curve.id)
      .sort((a, b) => {
        const key = curve.type === "lower" ? "lowerPosition" : "upperPosition";
        return (a[key] ?? 0) - (b[key] ?? 0);
      })
      .map((crossing) => crossing.id);
  }

  function renderCombingTable() {
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "curve";
    headRow.appendChild(corner);
    for (let index = 0; index < state.genus; index += 1) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = `h${index + 1}`;
      headRow.appendChild(th);
    }
    dom.combingHead.replaceChildren(headRow);

    const rows = COMBING_KEYS.map((key) => {
      const row = document.createElement("tr");
      const label = document.createElement("th");
      label.scope = "row";
      label.textContent = COMBING_LABELS[key];
      row.appendChild(label);
      for (let index = 0; index < state.genus; index += 1) {
        const cell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.step = "1";
        input.inputMode = "numeric";
        input.value = finiteInputValue(state.combing[key][index]);
        input.setAttribute("aria-label", `${key} combing coordinate for handle ${index + 1}`);
        input.addEventListener("input", () => {
          state.combing[key][index] = integerOrNaN(input.value);
          markDirty(true);
          updateValidation(false);
        });
        cell.appendChild(input);
        row.appendChild(cell);
      }
      return row;
    });
    dom.combingBody.replaceChildren(...rows);
    dom.combingCount.textContent = `${4 * state.genus} numbers`;
  }

  function onGenusChange() {
    const next = integerOrNaN(dom.genusInput.value);
    if (!Number.isSafeInteger(next) || next < 1 || next > 12) {
      updateValidation(true);
      return;
    }
    setGenus(next);
    renderCombingTable();
    markDirty(true);
    renderAll();
    updateValidation(false);
  }

  function setGenus(genus) {
    state.genus = genus;
    COMBING_KEYS.forEach((key) => {
      const current = Array.isArray(state.combing[key]) ? state.combing[key] : [];
      state.combing[key] = Array.from({ length: genus }, (_, index) => Number.isSafeInteger(current[index]) ? current[index] : 0);
    });
    if (dom.genusInput) dom.genusInput.value = String(genus);
  }

  function syncFormFromState() {
    dom.diagramName.value = state.name;
    dom.ellInput.value = finiteInputValue(state.ell);
    dom.rootPowerInput.value = finiteInputValue(state.rootPower);
    dom.genusInput.value = finiteInputValue(state.genus);
    dom.referenceInput.value = state.combing.reference;
    dom.certifiedInput.checked = state.certified === true;
  }

  function markDirty(clearCertification) {
    if (clearCertification && state.certified) {
      state.certified = false;
      state.templateStatus = "draft";
      dom.certifiedInput.checked = false;
    }
    state.lastResult = null;
    dom.resultCard.hidden = true;
    dom.modelStatus.textContent = "Draft";
    dom.modelStatus.className = "status-pill";
  }

  function notify(message, isError) {
    window.clearTimeout(toastTimer);
    dom.canvasToast.textContent = message;
    dom.canvasToast.hidden = false;
    dom.canvasToast.style.background = isError ? "rgba(132, 44, 39, .95)" : "rgba(23, 36, 43, .93)";
    dom.liveRegion.textContent = message;
    toastTimer = window.setTimeout(() => {
      dom.canvasToast.hidden = true;
    }, 4200);
  }

  function svgElement(tag, attributes) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes || {}).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

  function curvePath(points, closed) {
    if (!points.length) return "";
    const commands = [`M ${roundCoord(points[0].x)} ${roundCoord(points[0].y)}`];
    points.slice(1).forEach((point) => commands.push(`L ${roundCoord(point.x)} ${roundCoord(point.y)}`));
    if (closed) commands.push("Z");
    return commands.join(" ");
  }

  function roundCoord(value) {
    return Math.round(value * 10) / 10;
  }

  function svgPoint(event) {
    const ctm = dom.diagramCanvas.getScreenCTM();
    if (ctm && typeof DOMPoint === "function") {
      return new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    }
    const rect = dom.diagramCanvas.getBoundingClientRect();
    const [x, y, width, height] = state.viewBox;
    return {
      x: x + ((event.clientX - rect.left) / rect.width) * width,
      y: y + ((event.clientY - rect.top) / rect.height) * height
    };
  }

  function clampPoint(point) {
    const [x, y, width, height] = state.viewBox;
    const margin = 12;
    return {
      x: Math.max(x + margin, Math.min(x + width - margin, point.x)),
      y: Math.max(y + margin, Math.min(y + height - margin, point.y))
    };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function interpolate(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function offsetLabelPoint(a, b) {
    const length = Math.max(1, distance(a, b));
    return {
      x: a.x + ((b.y - a.y) / length) * 15 + 9,
      y: a.y - ((b.x - a.x) / length) * 15 - 7
    };
  }

  function removeAdjacentDuplicates(points) {
    const result = [];
    points.forEach((point) => {
      if (!result.length || distance(point, result[result.length - 1]) > 3) result.push(point);
    });
    if (result.length > 2 && distance(result[0], result[result.length - 1]) <= 3) result.pop();
    return result;
  }

  function nextCurveId(type) {
    const prefix = type === "lower" ? "eta" : "mu";
    let index = 1;
    while (findCurve(type, `${prefix}${index}`)) index += 1;
    return `${prefix}${index}`;
  }

  function nextCrossingId() {
    const used = new Set(state.crossings.map((item) => item.id));
    while (used.has(`p${crossingSerial}`)) crossingSerial += 1;
    return `p${crossingSerial++}`;
  }

  function integerOrNaN(value) {
    if (typeof value === "number") return Number.isSafeInteger(value) ? value : Number.NaN;
    if (typeof value !== "string" || value.trim() === "") return Number.NaN;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : Number.NaN;
  }

  function finiteInputValue(value) {
    return Number.isFinite(value) ? String(value) : "";
  }

  function recomputeCrossings() {
    if (state.explicitOrderMode) return;
    const previous = state.crossings.slice();
    const detected = detectIntersections(state.lower, state.upper);
    const used = new Set();
    const previousByPair = groupBy(previous, crossingPairKey);
    const detectedByPair = groupBy(detected, crossingPairKey);

    detected.forEach((candidate) => {
      const pair = crossingPairKey(candidate);
      const oldForPair = previousByPair.get(pair) || [];
      const newForPair = detectedByPair.get(pair) || [];
      let best = null;
      let bestScore = Number.POSITIVE_INFINITY;
      oldForPair.forEach((oldCrossing) => {
        if (used.has(oldCrossing.id)) return;
        const spatial = distance(candidate, oldCrossing);
        const positional = Math.abs((candidate.lowerPosition || 0) - (oldCrossing.lowerPosition || 0))
          + Math.abs((candidate.upperPosition || 0) - (oldCrossing.upperPosition || 0));
        const score = spatial + positional * 8;
        if (score < bestScore) {
          best = oldCrossing;
          bestScore = score;
        }
      });
      const preserve = best && (bestScore <= CROSSING_MATCH_RADIUS || oldForPair.length === newForPair.length);
      if (preserve) {
        used.add(best.id);
        candidate.id = best.id;
        candidate.antipode_power = best.antipode_power;
        candidate.tilt_power = best.tilt_power;
      } else {
        candidate.id = nextCrossingId();
        candidate.antipode_power = 0;
        candidate.tilt_power = 0;
      }
    });

    state.crossings = detected;
    state.lower.concat(state.upper).forEach((curve) => {
      curve.crossings = curveOrder(curve);
    });
    if (state.selected && state.selected.kind === "crossing" && !selectedCrossing()) {
      state.selected = null;
    }
    seedCrossingSerial();
  }

  function detectIntersections(lowerCurves, upperCurves) {
    const result = [];
    lowerCurves.forEach((lower) => {
      upperCurves.forEach((upper) => {
        const lowerSegments = curveSegments(lower);
        const upperSegments = curveSegments(upper);
        lowerSegments.forEach((lowerSegment) => {
          upperSegments.forEach((upperSegment) => {
            const hit = segmentIntersection(lowerSegment.a, lowerSegment.b, upperSegment.a, upperSegment.b);
            if (!hit) return;
            const candidate = {
              lower: lower.id,
              upper: upper.id,
              x: hit.x,
              y: hit.y,
              lowerPosition: lowerSegment.index + hit.t,
              upperPosition: upperSegment.index + hit.u,
              lowerSegment: lowerSegment.index,
              upperSegment: upperSegment.index
            };
            const duplicate = result.some((existing) => crossingPairKey(existing) === crossingPairKey(candidate) && distance(existing, candidate) < 2.2);
            if (!duplicate) result.push(candidate);
          });
        });
      });
    });
    result.sort((a, b) => a.lower.localeCompare(b.lower, undefined, { numeric: true }) || a.lowerPosition - b.lowerPosition || a.upper.localeCompare(b.upper, undefined, { numeric: true }));
    return result;
  }

  function curveSegments(curve) {
    if (!Array.isArray(curve.points) || curve.points.length < 2) return [];
    const result = [];
    const count = curve.closed === false ? curve.points.length - 1 : curve.points.length;
    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % curve.points.length;
      result.push({ index, a: curve.points[index], b: curve.points[next] });
    }
    return result;
  }

  function segmentIntersection(a, b, c, d) {
    const r = { x: b.x - a.x, y: b.y - a.y };
    const s = { x: d.x - c.x, y: d.y - c.y };
    const denominator = cross2(r, s);
    if (Math.abs(denominator) < 1e-8) return null;
    const cma = { x: c.x - a.x, y: c.y - a.y };
    const t = cross2(cma, s) / denominator;
    const u = cross2(cma, r) / denominator;
    const epsilon = 1e-7;
    if (t < -epsilon || t > 1 + epsilon || u < -epsilon || u > 1 + epsilon) return null;
    const tc = Math.max(0, Math.min(1, t));
    const uc = Math.max(0, Math.min(1, u));
    return {
      x: a.x + tc * r.x,
      y: a.y + tc * r.y,
      t: tc,
      u: uc
    };
  }

  function cross2(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  function crossingPairKey(crossing) {
    return `${crossing.lower}\u0000${crossing.upper}`;
  }

  function groupBy(items, keyFunction) {
    const result = new Map();
    items.forEach((item) => {
      const key = keyFunction(item);
      if (!result.has(key)) result.set(key, []);
      result.get(key).push(item);
    });
    return result;
  }

  function seedCrossingSerial() {
    state.crossings.forEach((crossing) => {
      const match = /^p(\d+)$/.exec(crossing.id);
      if (match) crossingSerial = Math.max(crossingSerial, Number(match[1]) + 1);
    });
  }

  function compileCurrentDiagram() {
    const lower = state.lower.map((curve) => ({
      id: curve.id,
      theta2: curve.theta2,
      crossings: curveOrder(curve)
    }));
    const upper = state.upper.map((curve) => ({
      id: curve.id,
      theta2: curve.theta2,
      crossings: curveOrder(curve)
    }));
    const crossings = state.crossings.map((crossing) => ({
      id: crossing.id,
      lower: crossing.lower,
      upper: crossing.upper,
      antipode_power: crossing.antipode_power,
      tilt_power: crossing.tilt_power
    }));
    return {
      schema_version: 1,
      convention: "cnw-2025-corrected-right-cointegral",
      local_labels_certified: state.certified === true,
      name: state.name.trim(),
      genus: state.genus,
      combing: {
        kind: "difference_to_reference",
        reference: state.combing.reference.trim(),
        alpha: state.combing.alpha.slice(),
        beta: state.combing.beta.slice(),
        nu: state.combing.nu.slice(),
        mu: state.combing.mu.slice()
      },
      lower,
      upper,
      crossings
    };
  }

  function validateCurrent() {
    const errors = [];
    const warnings = [];
    const diagram = compileCurrentDiagram();

    if (!diagram.name) errors.push("Give the diagram a non-empty name.");
    if (!Number.isSafeInteger(state.ell) || state.ell < 3 || state.ell % 2 === 0) {
      errors.push("The Taft level ℓ must be an odd safe integer at least 3.");
    } else if (state.ell > 101) {
      errors.push("The browser evaluator limits ℓ to 101; use the Python CLI or an explicit engine override for a larger level.");
    }
    if (!Number.isSafeInteger(state.rootPower)) {
      errors.push("The root power must be a safe integer.");
    } else if (Number.isSafeInteger(state.ell) && state.ell > 0 && gcd(Math.abs(state.rootPower), state.ell) !== 1) {
      errors.push("The root power must be coprime to ℓ so q is primitive.");
    }
    if (!Number.isSafeInteger(diagram.genus) || diagram.genus < 1) {
      errors.push("Genus g must be a positive integer.");
    }
    if (diagram.lower.length !== diagram.genus || diagram.upper.length !== diagram.genus) {
      errors.push(`A genus-${diagram.genus} diagram needs exactly ${diagram.genus} lower and ${diagram.genus} upper curve${diagram.genus === 1 ? "" : "s"}; found ${diagram.lower.length} and ${diagram.upper.length}.`);
    }

    const curveIds = new Set();
    diagram.lower.concat(diagram.upper).forEach((curve) => {
      const scoped = `${diagram.lower.includes(curve) ? "lower" : "upper"}:${curve.id}`;
      if (!curve.id || curveIds.has(scoped)) errors.push("Curve IDs must be non-empty and unique within each family.");
      curveIds.add(scoped);
      if (!Number.isSafeInteger(curve.theta2) || curve.theta2 % 2 === 0) {
        errors.push(`${curve.id || "A curve"}: θ₂ must be an odd safe integer.`);
      }
      if (new Set(curve.crossings).size !== curve.crossings.length) {
        errors.push(`${curve.id}: a crossing occurs more than once in its based order.`);
      }
      if (curve.crossings.length === 0) warnings.push(`${curve.id} is detached, so the Taft contraction is zero.`);
    });

    COMBING_KEYS.forEach((key) => {
      const values = diagram.combing[key];
      if (!Array.isArray(values) || values.length !== diagram.genus || values.some((value) => !Number.isSafeInteger(value))) {
        errors.push(`Combing row ${key} must contain exactly ${diagram.genus} safe integers.`);
      }
    });
    if (!diagram.combing.reference) errors.push("Name the reference combing used for the 4g coordinates.");

    const crossingIds = new Set();
    const lowerAppearances = new Map();
    const upperAppearances = new Map();
    const lowerOwner = new Map();
    const upperOwner = new Map();
    diagram.lower.forEach((curve) => curve.crossings.forEach((id) => {
      lowerAppearances.set(id, (lowerAppearances.get(id) || 0) + 1);
      lowerOwner.set(id, curve.id);
    }));
    diagram.upper.forEach((curve) => curve.crossings.forEach((id) => {
      upperAppearances.set(id, (upperAppearances.get(id) || 0) + 1);
      upperOwner.set(id, curve.id);
    }));
    diagram.crossings.forEach((crossing) => {
      if (!crossing.id || crossingIds.has(crossing.id)) errors.push("Crossing IDs must be non-empty and unique.");
      crossingIds.add(crossing.id);
      if (!Number.isSafeInteger(crossing.antipode_power)) errors.push(`${crossing.id || "A crossing"}: antipode power s must be a safe integer.`);
      if (!Number.isSafeInteger(crossing.tilt_power)) errors.push(`${crossing.id || "A crossing"}: tilt power t must be a safe integer.`);
      if (!diagram.lower.some((curve) => curve.id === crossing.lower)) errors.push(`${crossing.id}: unknown lower curve ${crossing.lower}.`);
      if (!diagram.upper.some((curve) => curve.id === crossing.upper)) errors.push(`${crossing.id}: unknown upper curve ${crossing.upper}.`);
      if (lowerAppearances.get(crossing.id) !== 1 || upperAppearances.get(crossing.id) !== 1) {
        errors.push(`${crossing.id}: must occur exactly once in one lower and one upper order.`);
      }
      if (lowerOwner.get(crossing.id) !== crossing.lower || upperOwner.get(crossing.id) !== crossing.upper) {
        errors.push(`${crossing.id}: incident-curve metadata disagrees with its based orders.`);
      }
    });
    lowerAppearances.forEach((_, id) => {
      if (!crossingIds.has(id)) errors.push(`Lower order refers to unknown crossing ${id}.`);
    });
    upperAppearances.forEach((_, id) => {
      if (!crossingIds.has(id)) errors.push(`Upper order refers to unknown crossing ${id}.`);
    });
    if (state.crossings.length === 0) warnings.push("There are no lower–upper intersections; the contraction is zero.");
    if (diagram.local_labels_certified !== true) {
      errors.push("Certify that the explicit local labels encode the pictured diagram and combing.");
    }

    return { diagram, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings) };
  }

  function updateValidation(announce) {
    const validation = validateCurrent();
    if (validation.errors.length) {
      const extra = validation.errors.length > 3 ? ` (+${validation.errors.length - 3} more)` : "";
      dom.validationBox.textContent = `${validation.errors.slice(0, 3).join(" ")}${extra}`;
      dom.validationBox.className = "validation-box is-error";
      dom.modelStatus.textContent = "Needs data";
      dom.modelStatus.className = "status-pill is-error";
      if (announce) notify(`${validation.errors.length} validation issue${validation.errors.length === 1 ? "" : "s"}.`, true);
    } else {
      const warning = validation.warnings.length ? ` ${validation.warnings[0]}` : "";
      dom.validationBox.textContent = `Valid schema-v1 decorated diagram.${warning}`;
      dom.validationBox.className = "validation-box is-valid";
      dom.modelStatus.textContent = state.templateStatus === "verified" ? "Verified preset" : "Valid";
      dom.modelStatus.className = "status-pill is-valid";
      if (announce) notify("Diagram and local labels validate.");
    }
    return validation;
  }

  async function computeInvariant() {
    const validation = updateValidation(false);
    if (validation.errors.length) {
      notify(validation.errors[0], true);
      dom.validationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    const api = window.KuperbergTaft || window.KuperbergTaftEngine || window.TaftKuperberg;
    const evaluator = api && (api.evaluateDiagram || api.evaluate);
    if (typeof evaluator !== "function") {
      dom.validationBox.textContent = "The exact evaluator did not load. Reload this page and check that engine.js is beside index.html.";
      dom.validationBox.className = "validation-box is-error";
      notify("Exact evaluator unavailable.", true);
      return;
    }

    dom.computeButton.disabled = true;
    dom.computeButton.classList.add("is-busy");
    dom.computeButton.querySelector("span").textContent = "Contracting states…";
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    try {
      const result = await Promise.resolve(evaluator.call(api, validation.diagram, {
        ell: state.ell,
        rootPower: state.rootPower,
        maxStates: 2_000_000
      }));
      state.lastResult = result;
      renderResult(result);
      dom.modelStatus.textContent = "Computed";
      dom.modelStatus.className = "status-pill is-valid";
      notify("Exact contraction complete.");
    } catch (error) {
      dom.validationBox.textContent = error && error.message ? error.message : String(error);
      dom.validationBox.className = "validation-box is-error";
      notify("Computation stopped; see the validation panel.", true);
    } finally {
      dom.computeButton.disabled = false;
      dom.computeButton.classList.remove("is-busy");
      dom.computeButton.querySelector("span").textContent = "Compute Kuperberg invariant";
    }
  }

  function renderResult(result) {
    const exact = result && result.exact != null ? String(result.exact) : String(result && result.value != null ? result.value : result);
    const approximate = result && result.approximate;
    dom.exactResult.textContent = exact;
    dom.rootDescription.textContent = result && result.root
      ? String(result.root)
      : `q = ζ^${result && result.root_power != null ? result.root_power : state.rootPower}, with ζ a primitive ${result && result.ell != null ? result.ell : state.ell}-th root`;
    dom.approxResult.textContent = formatApproximation(approximate);
    dom.statesResult.textContent = formatInteger(result && (result.states_evaluated ?? result.statesEvaluated));
    dom.workResult.textContent = formatInteger(result && (result.estimated_work ?? result.estimatedWork));
    const coefficients = result && (result.coefficients_mod_cyclotomic_polynomial ?? result.coefficients);
    dom.coefficientResult.textContent = Array.isArray(coefficients)
      ? `[${coefficients.map(String).join(", ")}]`
      : coefficients == null ? "—" : safeJsonStringify(coefficients);
    dom.resultCard.hidden = false;
    dom.resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function formatApproximation(value) {
    if (value == null) return "—";
    const real = Array.isArray(value) ? value[0] : value.real;
    const imag = Array.isArray(value) ? value[1] : value.imag;
    if (real == null || imag == null) return "Unavailable (exact value retained)";
    if (!Number.isFinite(Number(real)) || !Number.isFinite(Number(imag))) return String(value);
    const r = formatFloat(Number(real));
    const i = formatFloat(Math.abs(Number(imag)));
    return `${r} ${Number(imag) < 0 ? "−" : "+"} ${i}i`;
  }

  function formatFloat(number) {
    if (Math.abs(number) < 5e-13) return "0";
    return Number(number.toPrecision(10)).toString();
  }

  function formatInteger(value) {
    if (value == null) return "—";
    if (typeof value === "bigint") return value.toLocaleString("en-US");
    const number = Number(value);
    return Number.isFinite(number) ? Math.trunc(number).toLocaleString("en-US") : String(value);
  }

  function safeJsonStringify(value) {
    try {
      return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
    } catch (_) {
      return String(value);
    }
  }

  async function copyExactResult() {
    const text = dom.exactResult.textContent;
    try {
      await navigator.clipboard.writeText(text);
      notify("Exact cyclotomic value copied.");
    } catch (_) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(dom.exactResult);
      selection.removeAllRanges();
      selection.addRange(range);
      notify("Result selected; press Ctrl+C to copy.");
    }
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x;
  }

  function uniqueStrings(values) {
    return Array.from(new Set(values));
  }

  function populateTemplates() {
    const catalog = window.KuperbergCatalog;
    const templates = catalog && Array.isArray(catalog.templates) ? catalog.templates : [];
    const groups = new Map();
    templates.forEach((template) => {
      const category = template.category || "other";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(template);
    });
    const blank = dom.templateSelect.querySelector("option[value='']");
    dom.templateSelect.replaceChildren(blank || new Option("Blank canvas", ""));
    groups.forEach((entries, category) => {
      const group = document.createElement("optgroup");
      group.label = category.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
      entries.forEach((template) => {
        const suffix = template.status === "illustrative" ? " · drawing only" : "";
        group.appendChild(new Option(`${template.title}${suffix}`, template.id));
      });
      dom.templateSelect.appendChild(group);
    });
  }

  function onTemplateChange() {
    const id = dom.templateSelect.value;
    if (!id) {
      if (!hasWork() || window.confirm("Replace the current work with a blank diagram?")) resetBlank();
      return;
    }
    const catalog = window.KuperbergCatalog;
    const template = catalog && (typeof catalog.cloneTemplate === "function"
      ? catalog.cloneTemplate(id)
      : (catalog.templates || []).find((entry) => entry.id === id));
    if (!template) {
      notify("That catalog entry is unavailable.", true);
      return;
    }
    if (hasWork() && !window.confirm(`Load ${template.title}? Unsaved drawing changes will be discarded.`)) {
      dom.templateSelect.value = state.templateId || "";
      return;
    }
    loadTemplate(template);
  }

  function generateLensTemplate() {
    const n = integerOrNaN(dom.lensN.value);
    const k = integerOrNaN(dom.lensK.value);
    const framing = dom.lensFraming.value;
    const catalog = window.KuperbergCatalog;
    try {
      if (!catalog || typeof catalog.makeLensTemplate !== "function") {
        throw new Error("The lens-space catalog generator did not load.");
      }
      const template = catalog.makeLensTemplate(n, k, framing);
      if (hasWork() && !window.confirm(`Generate ${template.title}? Unsaved drawing changes will be discarded.`)) return;
      dom.templateSelect.value = "";
      loadTemplate(template, true);
      notify(`${template.title} generated from the published special-diagram recursion.`);
    } catch (error) {
      notify(error && error.message ? error.message : String(error), true);
    }
  }

  function loadTemplate(template, generated) {
    const diagram = deepClone(template.diagram);
    assertDiagramShape(diagram);
    const geometry = template.geometry || makeCompiledGeometry(diagram);
    const geometryCrossings = new Map((geometry.crossings || []).map((item) => [item.id, item]));
    const fallbackGeometry = makeCompiledGeometry(diagram);
    const fallbackCrossings = new Map(fallbackGeometry.crossings.map((item) => [item.id, item]));
    const lowerById = new Map(diagram.lower.map((curve) => [curve.id, curve]));
    const upperById = new Map(diagram.upper.map((curve) => [curve.id, curve]));

    state = createBlankState();
    crossingSerial = 1;
    state.name = diagram.name;
    state.genus = diagram.genus;
    state.ell = template.recommendedEll || (template.expected && template.expected.ell) || 3;
    state.rootPower = (template.expected && template.expected.rootPower) || 1;
    state.combing = normalizeCombing(diagram.combing, diagram.genus);
    state.certified = diagram.local_labels_certified === true && template.status !== "illustrative";
    state.templateId = generated ? "" : (template.id || "");
    state.templateStatus = template.status || (state.certified ? "certified" : "illustrative");
    state.viewBox = normalizeViewBox(geometry.viewBox);
    state.surface = geometry.surface || null;
    state.explicitOrderMode = template.status !== "illustrative" && diagram.crossings.length > 0;
    state.lower = geometryCurves("lower", geometry.lower, diagram.lower, lowerById);
    state.upper = geometryCurves("upper", geometry.upper, diagram.upper, upperById);
    state.crossings = diagram.crossings.map((crossing) => {
      const marker = geometryCrossings.get(crossing.id) || fallbackCrossings.get(crossing.id) || {};
      return {
        ...crossing,
        x: Number(marker.x),
        y: Number(marker.y),
        lowerPosition: orderIndex(diagram.lower, crossing.lower, crossing.id),
        upperPosition: orderIndex(diagram.upper, crossing.upper, crossing.id)
      };
    });
    if (!state.explicitOrderMode) recomputeCrossings();
    seedCrossingSerial();
    state.selected = null;
    draft = null;
    drag = null;
    activeTool = "select";
    syncFormFromState();
    renderCombingTable();
    setTool("select");
    renderAll();
    updateValidation(false);
    dom.ioNote.textContent = template.status === "illustrative"
      ? "Illustrative layout loaded: local labels remain uncertified."
      : "Certified compiled order and catalog geometry loaded.";
    const statusWord = template.status === "illustrative" ? "Illustrative" : "Certified";
    notify(`${statusWord} template loaded: ${template.title}.`);
  }

  function geometryCurves(type, geometryCurvesInput, diagramCurves, diagramMap) {
    const geometryById = new Map((geometryCurvesInput || []).map((curve) => [curve.id, curve]));
    const fallback = makeCompiledGeometry({
      genus: state.genus,
      lower: type === "lower" ? diagramCurves : [],
      upper: type === "upper" ? diagramCurves : [],
      crossings: []
    });
    const fallbackById = new Map(fallback[type].map((curve) => [curve.id, curve]));
    return diagramCurves.map((diagramCurve) => {
      const geometry = geometryById.get(diagramCurve.id) || fallbackById.get(diagramCurve.id) || {};
      const sourcePoints = Array.isArray(geometry.points) ? geometry.points : [];
      const points = sourcePoints.map((point) => Array.isArray(point)
        ? { x: Number(point[0]), y: Number(point[1]) }
        : { x: Number(point.x), y: Number(point.y) });
      const authoritative = diagramMap.get(diagramCurve.id) || diagramCurve;
      return {
        id: diagramCurve.id,
        type,
        theta2: authoritative.theta2,
        crossings: Array.isArray(authoritative.crossings) ? authoritative.crossings.slice() : [],
        points,
        closed: geometry.closed !== false
      };
    });
  }

  function orderIndex(curves, curveId, crossingId) {
    const curve = curves.find((item) => item.id === curveId);
    return curve ? curve.crossings.indexOf(crossingId) : -1;
  }

  async function importJsonFile() {
    const file = dom.fileInput.files && dom.fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const diagram = JSON.parse(text);
      assertDiagramShape(diagram);
      importCompiledDiagram(diagram);
      dom.ioNote.textContent = `Imported ${file.name}. Geometry is not part of compiled schema v1, so the canvas shows an order schematic.`;
      notify(`Imported ${file.name}.`);
    } catch (error) {
      dom.ioNote.textContent = "";
      notify(`Import failed: ${error && error.message ? error.message : error}`, true);
    } finally {
      dom.fileInput.value = "";
    }
  }

  function importCompiledDiagram(diagram) {
    const matchingTemplate = catalogTemplateForDiagram(diagram);
    if (matchingTemplate) {
      const copy = deepClone(matchingTemplate);
      copy.diagram = deepClone(diagram);
      copy.status = diagram.local_labels_certified === true ? "certified" : "illustrative";
      loadTemplate(copy);
      dom.templateSelect.value = matchingTemplate.id;
      return;
    }
    const geometry = makeCompiledGeometry(diagram);
    state = createBlankState();
    crossingSerial = 1;
    state.name = diagram.name;
    state.genus = diagram.genus;
    state.combing = normalizeCombing(diagram.combing, diagram.genus);
    state.certified = diagram.local_labels_certified === true;
    state.templateStatus = "imported";
    state.explicitOrderMode = true;
    state.viewBox = geometry.viewBox;
    state.surface = geometry.surface;
    state.lower = geometryCurves("lower", geometry.lower, diagram.lower, new Map(diagram.lower.map((curve) => [curve.id, curve])));
    state.upper = geometryCurves("upper", geometry.upper, diagram.upper, new Map(diagram.upper.map((curve) => [curve.id, curve])));
    const positions = new Map(geometry.crossings.map((item) => [item.id, item]));
    state.crossings = diagram.crossings.map((crossing) => ({ ...crossing, ...(positions.get(crossing.id) || {}) }));
    state.selected = null;
    draft = null;
    drag = null;
    seedCrossingSerial();
    dom.templateSelect.value = "";
    syncFormFromState();
    renderCombingTable();
    setTool("select");
    renderAll();
    updateValidation(false);
  }

  function exportCompiledJson() {
    const validation = updateValidation(false);
    if (validation.errors.length) {
      notify(`Cannot export: ${validation.errors[0]}`, true);
      return;
    }
    const text = `${JSON.stringify(validation.diagram, null, 2)}\n`;
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(validation.diagram.name)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    dom.ioNote.textContent = "Exported strict schema-v1 JSON. Drawing coordinates are intentionally not part of the compiled format.";
    notify("Compiled JSON downloaded.");
  }

  function assertDiagramShape(diagram) {
    if (!diagram || typeof diagram !== "object" || Array.isArray(diagram)) throw new TypeError("Top-level JSON must be an object.");
    if (diagram.schema_version !== 1) throw new RangeError("Only schema_version 1 is supported.");
    if (diagram.convention !== "cnw-2025-corrected-right-cointegral") throw new RangeError("Unsupported contraction convention.");
    if (!Number.isSafeInteger(diagram.genus) || diagram.genus < 1) throw new TypeError("genus must be a positive safe integer.");
    if (!Array.isArray(diagram.lower) || !Array.isArray(diagram.upper) || !Array.isArray(diagram.crossings)) {
      throw new TypeError("lower, upper, and crossings must be arrays.");
    }
    if (!diagram.combing || typeof diagram.combing !== "object") throw new TypeError("combing must be an object.");
    diagram.lower.concat(diagram.upper).forEach((curve) => {
      if (!curve || typeof curve.id !== "string" || !Array.isArray(curve.crossings)) throw new TypeError("Each curve needs an id and crossings array.");
    });
    diagram.crossings.forEach((crossing) => {
      if (!crossing || typeof crossing.id !== "string" || typeof crossing.lower !== "string" || typeof crossing.upper !== "string") {
        throw new TypeError("Each crossing needs id, lower, and upper strings.");
      }
    });
  }

  function makeCompiledGeometry(diagram) {
    const viewBox = DEFAULT_VIEWBOX.slice();
    const lower = Array.isArray(diagram.lower) ? diagram.lower : [];
    const upper = Array.isArray(diagram.upper) ? diagram.upper : [];
    const crossings = Array.isArray(diagram.crossings) ? diagram.crossings : [];
    const xLeft = 90;
    const xRight = 810;
    const yTop = 80;
    const yBottom = 480;
    const lowerYs = lanePositions(lower.length, yTop, yBottom);
    const upperXs = lanePositions(upper.length, 120, 780);
    const pairCounts = new Map();
    const markers = crossings.map((crossing, index) => {
      const lowerIndex = Math.max(0, lower.findIndex((curve) => curve.id === crossing.lower));
      const upperIndex = Math.max(0, upper.findIndex((curve) => curve.id === crossing.upper));
      const pair = crossingPairKey(crossing);
      const occurrence = pairCounts.get(pair) || 0;
      pairCounts.set(pair, occurrence + 1);
      const jitter = (occurrence - 1.5) * 12;
      return {
        id: crossing.id,
        x: (upperXs[upperIndex] ?? 450) + jitter,
        y: (lowerYs[lowerIndex] ?? 280) + ((index % 3) - 1) * 5
      };
    });
    return {
      viewBox,
      surface: { kind: "compiled-order-schematic", label: "Compiled crossing-order schematic" },
      lower: lower.map((curve, index) => ({
        id: curve.id,
        points: [[xLeft, lowerYs[index]], [xRight, lowerYs[index]]],
        closed: false
      })),
      upper: upper.map((curve, index) => ({
        id: curve.id,
        points: [[upperXs[index], yTop - 25], [upperXs[index], yBottom + 25]],
        closed: false
      })),
      crossings: markers
    };
  }

  function lanePositions(count, start, end) {
    if (count <= 0) return [];
    if (count === 1) return [(start + end) / 2];
    return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
  }

  function catalogTemplateForDiagram(diagram) {
    const catalog = window.KuperbergCatalog;
    if (!catalog || !Array.isArray(catalog.templates)) return null;
    return catalog.templates.find((template) => {
      const candidate = template.diagram;
      return candidate && candidate.name === diagram.name
        && candidate.genus === diagram.genus
        && candidate.crossings.length === diagram.crossings.length;
    }) || null;
  }

  function normalizeCombing(combing, genus) {
    const result = {
      kind: "difference_to_reference",
      reference: typeof combing.reference === "string" ? combing.reference : "diagram framing"
    };
    COMBING_KEYS.forEach((key) => {
      const source = Array.isArray(combing[key]) ? combing[key] : [];
      result[key] = Array.from({ length: genus }, (_, index) => source[index] ?? 0);
    });
    return result;
  }

  function normalizeViewBox(viewBox) {
    if (!Array.isArray(viewBox) || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(Number(value)))) {
      return DEFAULT_VIEWBOX.slice();
    }
    return viewBox.map(Number);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeFilename(name) {
    const value = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return value || "kuperberg-diagram";
  }

  init();
})();
