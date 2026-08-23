(function installKuperbergCatalog(global) {
  "use strict";

  const CONVENTION = "cnw-2025-corrected-right-cointegral";
  const MAX_LENS_CROSSINGS = 4_096;
  const CNW_SOURCE = Object.freeze({
    label: "Chang–Ng–Wang, Example 4.18",
    href: "https://arxiv.org/abs/2506.07409",
    locator: "Equations (3.2)–(3.4), Section 4, and Example 4.18",
  });
  const T3_SOURCE = Object.freeze({
    label: "Chang–Wang–Zhai, Figure 3 and Theorem 3",
    href: "https://arxiv.org/abs/2601.19485",
    locator: "Figure 3, the rotation table on page 17, and Theorem 3",
  });

  function jsonClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.values(value).forEach(deepFreeze);
    }
    return value;
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      [x, y] = [y, x % y];
    }
    return x;
  }

  function zeroCombing(genus, reference) {
    const zeros = Array(genus).fill(0);
    return {
      kind: "difference_to_reference",
      reference,
      alpha: [...zeros],
      beta: [...zeros],
      nu: [...zeros],
      mu: [...zeros],
    };
  }

  function cyclicValues(n, step, start, initial, delta) {
    const values = Array(n + 1).fill(null);
    values[start] = initial;
    let current = start;
    for (let count = 0; count < n; count += 1) {
      const following = ((current + step - 1) % n) + 1;
      const candidate = values[current] + delta(current);
      if (values[following] !== null && values[following] !== candidate) {
        throw new Error("Inconsistent lens-space rotation recursion.");
      }
      values[following] = candidate;
      current = following;
    }
    if (current !== start || values.slice(1).some((value) => value === null)) {
      throw new Error("Lens-space rotation recursion did not form one cycle.");
    }
    return values.slice(1);
  }

  /**
   * Compile the Chang–Ng–Wang special lens-space diagram.
   *
   * This mirrors src/kuperberg_taft/presets.py.  The fL form requires odd k;
   * the fR form requires odd n-k.  "auto" prefers fL and otherwise uses fR.
   */
  function makeLensDiagram(n, k, framing = "auto") {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k)) {
      throw new TypeError("n and k must be safe integers.");
    }
    if (n > MAX_LENS_CROSSINGS) {
      throw new RangeError(
        `The browser catalog limits generated lens diagrams to ${MAX_LENS_CROSSINGS} crossings; ` +
        "use the Python CLI for a larger compiled fixture.",
      );
    }
    if (!((n > k && k > 0) || (n === 1 && k === 1)) || gcd(n, k) !== 1) {
      throw new RangeError("Use coprime n > k > 0, or (1,1) for stabilized S³.");
    }

    let chosen = framing;
    if (chosen === "auto") chosen = k % 2 === 1 ? "fL" : "fR";
    if (chosen !== "fL" && chosen !== "fR") {
      throw new RangeError("framing must be auto, fL, or fR.");
    }

    let powers;
    let upperIndices;
    let upperTheta2;
    if (chosen === "fL") {
      if (k % 2 === 0) throw new RangeError("The fL preset requires odd k.");
      const k1 = (k - 1) / 2;
      powers = cyclicValues(n, k, 1, 1, (index) => {
        if (index <= n - k + 1) return 0;
        if (index <= n - k1) return 2;
        return -2;
      });
      upperIndices = [1];
      while (upperIndices.length < n) {
        upperIndices.push(((upperIndices.at(-1) + k - 1) % n) + 1);
      }
      upperTheta2 = -1;
    } else {
      if ((n - k) % 2 === 0) throw new RangeError("The fR preset requires odd n-k.");
      const k0 = (n - k - 1) / 2;
      const cValues = cyclicValues(n, k, n, 0, (index) => {
        if (index <= k0) return 1;
        if (index <= 2 * k0) return -1;
        return 0;
      });
      powers = cValues.map((value) => 2 * value + 1);
      upperIndices = [n];
      while (upperIndices.length < n) {
        upperIndices.push(((upperIndices.at(-1) + k - 1) % n) + 1);
      }
      upperTheta2 = 1;
    }

    const ids = Array.from({ length: n }, (_, index) => `p${index + 1}`);
    const reference = `Chang-Ng-Wang L(${n},${k}) ${chosen}`;
    return {
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: true,
      name: `L(${n},${k}), Chang-Ng-Wang ${chosen} framing`,
      genus: 1,
      combing: zeroCombing(1, reference),
      lower: [{ id: "eta1", theta2: 1, crossings: [...ids] }],
      upper: [{
        id: "mu1",
        theta2: upperTheta2,
        crossings: upperIndices.map((index) => `p${index}`),
      }],
      crossings: ids.map((id, index) => ({
        id,
        lower: "eta1",
        upper: "mu1",
        antipode_power: powers[index],
        tilt_power: 0,
      })),
    };
  }

  function lensGeometry(diagram) {
    const ids = diagram.lower[0].crossings;
    const left = 115;
    const right = 785;
    const y = 280;
    const step = ids.length === 1 ? 0 : (right - left) / (ids.length - 1);
    const markerById = new Map(ids.map((id, index) => [id, {
      id,
      x: ids.length === 1 ? 450 : left + step * index,
      y,
    }]));
    const upperOrder = diagram.upper[0].crossings;
    const upperPoints = [];
    if (upperOrder.length === 1) {
      upperPoints.push([450, 95], [450, 280], [450, 465]);
    } else {
      const first = markerById.get(upperOrder[0]);
      upperPoints.push([first.x, 105]);
      upperOrder.forEach((id, index) => {
        const here = markerById.get(id);
        upperPoints.push([here.x, here.y]);
        if (index < upperOrder.length - 1) {
          const next = markerById.get(upperOrder[index + 1]);
          upperPoints.push([(here.x + next.x) / 2, index % 2 === 0 ? 420 : 140]);
        }
      });
      const lastSide = upperOrder.length % 2 === 1 ? 455 : 105;
      upperPoints.push([markerById.get(upperOrder.at(-1)).x, lastSide]);
    }
    return {
      viewBox: [0, 0, 900, 560],
      surface: {
        kind: "torus-fundamental-domain",
        label: "Genus-one surface; opposite sides are identified",
        note: "The polyline is a readable schematic. Marked crossings and their based orders, not incidental line intersections, are the computation data.",
      },
      lower: [{
        id: "eta1",
        points: [[70, y], ...ids.map((id) => {
          const marker = markerById.get(id);
          return [marker.x, marker.y];
        }), [830, y]],
        closed: false,
        basepoint: [70, y],
        orientation: "left-to-right",
      }],
      upper: [{
        id: "mu1",
        points: upperPoints,
        closed: false,
        basepoint: upperPoints[0],
        orientation: "point-order",
      }],
      crossings: [...markerById.values()],
    };
  }

  function makeLensTemplate(n, k, framing = "auto") {
    const diagram = makeLensDiagram(n, k, framing);
    const chosen = diagram.name.includes(" fL ") ? "fL" : "fR";
    return {
      id: `lens-l${n}-${k}-${chosen.toLowerCase()}`,
      title: `Lens space L(${n},${k}) — ${chosen}`,
      shortTitle: `L(${n},${k})`,
      manifold: `L(${n},${k})`,
      genus: 1,
      category: "lens space",
      status: "certified",
      badge: "Published special diagram",
      readiness: "compute",
      recommendedEll: 3,
      summary: `Genus-one Chang–Ng–Wang ${chosen} special diagram with ${n} crossings.`,
      details: "Its local antipode powers and based crossing orders are generated by the published lens-space recursion. The exact scalar depends on the odd Taft parameter ℓ.",
      verification: {
        level: "preset-certified",
        localLabelsCertified: true,
        note: "Computation-ready; only specifically listed regression examples have an independently asserted expected scalar in this catalog.",
      },
      source: CNW_SOURCE,
      expected: null,
      diagram,
      geometry: lensGeometry(diagram),
      tips: [
        "The canvas is a torus fundamental-domain schematic, not a planar embedding certificate.",
        "The first crossing in each curve array is immediately after its basepoint in the chosen orientation.",
      ],
    };
  }

  function t3Diagram() {
    const lowerOrders = {
      eta1: ["p1", "p2", "p3", "p4"],
      eta2: ["q1", "q2", "q3", "q4"],
      eta3: ["r1", "r2", "r3", "r4"],
    };
    const upperOrders = {
      mu1: ["p1", "r4", "p3", "r2"],
      mu2: ["q1", "p2", "q3", "p4"],
      mu3: ["r1", "q2", "r3", "q4"],
    };
    const powers = {
      p1: 1, p2: 2, p3: 2, p4: 1,
      q1: 1, q2: 1, q3: 2, q4: 2,
      r1: 1, r2: 3, r3: 2, r4: 2,
    };
    const lowerFor = {};
    const upperFor = {};
    Object.entries(lowerOrders).forEach(([curve, order]) => {
      order.forEach((crossing) => { lowerFor[crossing] = curve; });
    });
    Object.entries(upperOrders).forEach(([curve, order]) => {
      order.forEach((crossing) => { upperFor[crossing] = curve; });
    });
    return {
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: true,
      name: "T^3, Chang-Wang-Zhai Figure 3 framing f1",
      genus: 3,
      combing: zeroCombing(3, "Chang-Wang-Zhai Figure 3 framing f1"),
      lower: Object.entries(lowerOrders).map(([id, crossings]) => ({
        id, theta2: 1, crossings,
      })),
      upper: Object.entries(upperOrders).map(([id, crossings]) => ({
        id, theta2: -1, crossings,
      })),
      crossings: Object.keys(lowerFor).map((id) => ({
        id,
        lower: lowerFor[id],
        upper: upperFor[id],
        antipode_power: powers[id],
        tilt_power: 0,
      })),
    };
  }

  function t3Geometry() {
    const positions = {
      p1: [135, 150], p2: [340, 150], p3: [545, 150], p4: [750, 150],
      q1: [135, 280], q2: [340, 280], q3: [545, 280], q4: [750, 280],
      r1: [135, 410], r2: [340, 410], r3: [545, 410], r4: [750, 410],
    };
    const route = (order, offset) => {
      const points = [];
      order.forEach((id, index) => {
        const [x, y] = positions[id];
        if (index) {
          const [previousX, previousY] = positions[order[index - 1]];
          points.push([(previousX + x) / 2, (previousY + y) / 2 + offset * (index % 2 ? 1 : -1)]);
        }
        points.push([x, y]);
      });
      return points;
    };
    return {
      viewBox: [0, 0, 900, 560],
      surface: {
        kind: "genus-three-schematic",
        label: "Genus-three Heegaard surface",
        note: "Curve routing is laid out for legibility. The twelve marked incidences and stored based orders are authoritative.",
      },
      lower: [
        { id: "eta1", points: [[65, 150], ...["p1", "p2", "p3", "p4"].map((id) => positions[id]), [835, 150]], closed: false, basepoint: [65, 150], orientation: "left-to-right" },
        { id: "eta2", points: [[65, 280], ...["q1", "q2", "q3", "q4"].map((id) => positions[id]), [835, 280]], closed: false, basepoint: [65, 280], orientation: "left-to-right" },
        { id: "eta3", points: [[65, 410], ...["r1", "r2", "r3", "r4"].map((id) => positions[id]), [835, 410]], closed: false, basepoint: [65, 410], orientation: "left-to-right" },
      ],
      upper: [
        { id: "mu1", points: route(["p1", "r4", "p3", "r2"], 38), closed: true, basepoint: positions.p1, orientation: "point-order" },
        { id: "mu2", points: route(["q1", "p2", "q3", "p4"], -42), closed: true, basepoint: positions.q1, orientation: "point-order" },
        { id: "mu3", points: route(["r1", "q2", "r3", "q4"], 44), closed: true, basepoint: positions.r1, orientation: "point-order" },
      ],
      crossings: Object.entries(positions).map(([id, [x, y]]) => ({ id, x, y })),
    };
  }

  function illustrativeDiagram(name, genus, reference, lower, upper) {
    return {
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: false,
      name,
      genus,
      combing: zeroCombing(genus, reference),
      lower: lower.map((curve) => ({ ...curve, crossings: [] })),
      upper: upper.map((curve) => ({ ...curve, crossings: [] })),
      crossings: [],
    };
  }

  const s3 = makeLensTemplate(1, 1, "fL");
  Object.assign(s3, {
    id: "s3-stabilized",
    title: "3-sphere S³ — stabilized genus one",
    shortTitle: "S³",
    manifold: "S³",
    category: "basic manifold",
    status: "verified",
    badge: "Regression verified",
    recommendedEll: 3,
    summary: "The one-crossing stabilized S³ member of the lens-space family.",
    details: "The evaluator deliberately uses the stabilized genus-one diagram because its compiled format requires positive genus.",
    verification: {
      level: "regression-verified",
      localLabelsCertified: true,
      note: "The automated Python suite checks the value 1 at ℓ=3.",
    },
    expected: {
      ell: 3,
      rootPower: 1,
      exact: "1",
      coefficients: ["1", "0"],
      testedBy: "tests/test_manifolds.py::ManifoldRegressionTests::test_stabilized_s3_is_one",
    },
  });

  const lens71 = makeLensTemplate(7, 1, "fL");
  Object.assign(lens71, {
    id: "lens-l7-1",
    title: "Lens space L(7,1) — fL",
    status: "verified",
    badge: "Published scalar verified",
    recommendedEll: 7,
    summary: "Seven-crossing genus-one oracle for a nonzero cyclotomic value.",
    details: "This is the main exact nonzero regression case. The power-basis value is reduced modulo Φ₇(ζ)=1+ζ+⋯+ζ⁶.",
    verification: {
      level: "published-scalar-regression",
      localLabelsCertified: true,
      note: "The generic tensor network reproduces the value printed in Chang–Ng–Wang Example 4.18.",
    },
    expected: {
      ell: 7,
      rootPower: 1,
      exact: "7 - 35ζ - 28ζ² - 21ζ³ - 14ζ⁴ - 7ζ⁵",
      coefficients: ["7", "-35", "-28", "-21", "-14", "-7"],
      sourceForm: "-42ζ - 35ζ² - 28ζ³ - 21ζ⁴ - 14ζ⁵ - 7ζ⁶",
      states: 6468,
      testedBy: "tests/test_manifolds.py::ManifoldRegressionTests::test_l7_1_published_taft_value",
    },
  });

  const lens72 = makeLensTemplate(7, 2, "fR");
  Object.assign(lens72, {
    id: "lens-l7-2",
    title: "Lens space L(7,2) — fR",
    status: "verified",
    badge: "Published scalar verified",
    recommendedEll: 7,
    summary: "Seven-crossing genus-one oracle whose Taft T₇ value vanishes.",
    details: "This exercises the fR rotation recursion and a nontrivial upper-circle crossing order.",
    verification: {
      level: "published-scalar-regression",
      localLabelsCertified: true,
      note: "The generic tensor network reproduces the zero printed in Chang–Ng–Wang Example 4.18.",
    },
    expected: {
      ell: 7,
      rootPower: 1,
      exact: "0",
      coefficients: ["0", "0", "0", "0", "0", "0"],
      testedBy: "tests/test_manifolds.py::ManifoldRegressionTests::test_l7_2_published_zero",
    },
  });

  const t3 = {
    id: "t3",
    title: "3-torus T³ — Figure 3 framing f1",
    shortTitle: "T³",
    manifold: "T³",
    genus: 3,
    category: "higher genus",
    status: "verified",
    badge: "Independent wiring check",
    readiness: "compute",
    recommendedEll: 3,
    summary: "Twelve-crossing genus-three Chang–Wang–Zhai diagram.",
    details: "The paper supplies the contraction rather than a Taft scalar. The value zero at ℓ=3 is derived exactly and checked against a second, literal Theorem 3 wiring.",
    verification: {
      level: "independent-wiring-regression",
      localLabelsCertified: true,
      note: "Generic diagram wiring and a separately encoded Theorem 3 contraction agree at ℓ=3.",
    },
    source: T3_SOURCE,
    expected: {
      ell: 3,
      rootPower: 1,
      exact: "0",
      coefficients: ["0", "0"],
      states: 27000,
      testedBy: "tests/test_manifolds.py::ManifoldRegressionTests::test_t3_matches_separately_encoded_theorem3_wiring",
    },
    diagram: t3Diagram(),
    geometry: t3Geometry(),
    tips: [
      "Use ℓ=3 for an interactive run; the explicit state sum grows rapidly.",
      "At ℓ=5 the Cartesian state count is 5,359,375, before crossing-work accounting.",
    ],
  };

  const s1xs2Diagram = illustrativeDiagram(
    "S^1 x S^2, standard genus-one layout (illustrative only)",
    1,
    "Uncertified S1xS2 drawing layout",
    [{ id: "eta1", theta2: 1 }],
    [{ id: "upper1", theta2: -1 }],
  );
  const s1xs2 = {
    id: "s1xs2-layout",
    title: "S¹ × S² — standard genus-one layout",
    shortTitle: "S¹ × S²",
    manifold: "S¹ × S²",
    genus: 1,
    category: "basic manifold",
    status: "illustrative",
    badge: "Drawing only",
    readiness: "needs-local-labels",
    recommendedEll: 3,
    summary: "Parallel isotopic attaching curves, shown as a familiar genus-one starting point.",
    details: "This entry is intentionally not computation-ready. No claim is made that the placeholder rotations encode a particular framing or combing.",
    verification: {
      level: "none",
      localLabelsCertified: false,
      note: "Provide a reference combing, certified rotations, and all local labels before evaluation.",
    },
    source: {
      label: "Standard genus-one Heegaard layout",
      href: "https://en.wikipedia.org/wiki/Heegaard_splitting",
      locator: "Included only as a drawing aid; not used as a mathematical oracle",
    },
    expected: null,
    diagram: s1xs2Diagram,
    geometry: {
      viewBox: [0, 0, 900, 560],
      surface: {
        kind: "torus-fundamental-domain",
        label: "Genus-one surface; opposite sides are identified",
        note: "The two parallel curves have no transverse crossings in this layout.",
      },
      lower: [{ id: "eta1", points: [[70, 245], [830, 245]], closed: false, basepoint: [70, 245], orientation: "left-to-right" }],
      upper: [{ id: "upper1", points: [[70, 315], [830, 315]], closed: false, basepoint: [70, 315], orientation: "left-to-right" }],
      crossings: [],
    },
    tips: [
      "Keep this as an illustration unless a trusted geometric compiler supplies its local rotation data.",
      "Zero values in the 4g fields mean difference from the named reference, not an absolute zero combing.",
    ],
  };

  const genus2Diagram = illustrativeDiagram(
    "Blank genus-two workbench (manifold unresolved)",
    2,
    "User must name and define a fixed reference combing",
    [{ id: "eta1", theta2: 1 }, { id: "eta2", theta2: 1 }],
    [{ id: "upper1", theta2: -1 }, { id: "upper2", theta2: -1 }],
  );
  const genus2Workbench = {
    id: "genus2-workbench",
    title: "Blank genus-two workbench",
    shortTitle: "Genus 2 blank",
    manifold: "Unresolved until curves are supplied",
    genus: 2,
    category: "workbench",
    status: "illustrative",
    badge: "Uncertified starter",
    readiness: "needs-local-labels",
    recommendedEll: 3,
    summary: "Two-handle surface layout for entering a producer-compiled decorated diagram.",
    details: "This is not a Heegaard presentation of a named manifold and has no expected invariant. It is a visual scaffold only.",
    verification: {
      level: "none",
      localLabelsCertified: false,
      note: "Drawing a plausible picture does not certify curve orders, rotations, or local antipode powers.",
    },
    source: null,
    expected: null,
    diagram: genus2Diagram,
    geometry: {
      viewBox: [0, 0, 900, 560],
      surface: {
        kind: "genus-two-schematic",
        label: "Blank genus-two surface",
        note: "Layout guide only; it carries no manifold or framing assertion.",
      },
      lower: [
        { id: "eta1", points: [[90, 185], [375, 185]], closed: false, basepoint: [90, 185], orientation: "left-to-right" },
        { id: "eta2", points: [[525, 375], [810, 375]], closed: false, basepoint: [525, 375], orientation: "left-to-right" },
      ],
      upper: [
        { id: "upper1", points: [[90, 245], [375, 245]], closed: false, basepoint: [90, 245], orientation: "left-to-right" },
        { id: "upper2", points: [[525, 315], [810, 315]], closed: false, basepoint: [525, 315], orientation: "left-to-right" },
      ],
      crossings: [],
    },
    tips: [
      "Set the genus first so every one of alpha, beta, nu, and mu has exactly two integers.",
      "Choose and record basepoints before transcribing crossing orders.",
    ],
  };

  const templates = [lens71, lens72, t3, s3, s1xs2, genus2Workbench];
  templates.forEach(deepFreeze);
  Object.freeze(templates);

  const api = Object.freeze({
    MAX_LENS_CROSSINGS,
    templates,
    getTemplate(id) {
      return templates.find((entry) => entry.id === id) || null;
    },
    cloneTemplate(id) {
      const template = templates.find((entry) => entry.id === id);
      return template ? jsonClone(template) : null;
    },
    cloneDiagram(id) {
      const template = templates.find((entry) => entry.id === id);
      return template ? jsonClone(template.diagram) : null;
    },
    makeLensDiagram,
    makeLensTemplate(n, k, framing = "auto") {
      return jsonClone(makeLensTemplate(n, k, framing));
    },
  });

  global.KuperbergCatalog = api;
}(typeof window !== "undefined" ? window : globalThis));
