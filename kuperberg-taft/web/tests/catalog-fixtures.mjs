import test from "node:test";
import assert from "node:assert/strict";

await import("../catalog.js");
await import("../engine.js");

const catalog = globalThis.KuperbergCatalog;
const engine = globalThis.KuperbergTaft;

test("catalog exposes unique, honest template metadata", () => {
  assert.ok(catalog);
  assert.ok(catalog.templates.length >= 6);
  assert.equal(new Set(catalog.templates.map(({ id }) => id)).size, catalog.templates.length);

  for (const template of catalog.templates) {
    assert.equal(template.diagram.genus, template.genus);
    assert.equal(template.geometry.lower.length, template.diagram.lower.length);
    assert.equal(template.geometry.upper.length, template.diagram.upper.length);
    assert.deepEqual(
      template.geometry.lower.map(({ id }) => id),
      template.diagram.lower.map(({ id }) => id),
    );
    assert.deepEqual(
      template.geometry.upper.map(({ id }) => id),
      template.diagram.upper.map(({ id }) => id),
    );

    if (template.readiness === "compute") {
      assert.equal(template.diagram.local_labels_certified, true);
      assert.doesNotThrow(() => engine.validateDiagram(template.diagram));
    } else {
      assert.equal(template.status, "illustrative");
      assert.equal(template.diagram.local_labels_certified, false);
      assert.throws(() => engine.validateDiagram(template.diagram), /local_labels_certified/);
    }
  }
});

test("fixed catalog diagrams match the engine's independently encoded presets", () => {
  assert.deepEqual(catalog.cloneDiagram("lens-l7-1"), engine.lensDiagram(7, 1, { framing: "fL" }));
  assert.deepEqual(catalog.cloneDiagram("lens-l7-2"), engine.lensDiagram(7, 2, { framing: "fR" }));
  assert.deepEqual(catalog.cloneDiagram("s3-stabilized"), engine.lensDiagram(1, 1, { framing: "fL" }));
  assert.deepEqual(catalog.cloneDiagram("t3"), engine.t3Diagram());
});

test("catalog lens generator agrees with the engine across fL and fR cases", () => {
  for (const [n, k, framing] of [[8, 3, "fL"], [9, 2, "fR"], [11, 4, "auto"]]) {
    assert.deepEqual(
      catalog.makeLensDiagram(n, k, framing),
      engine.lensDiagram(n, k, { framing }),
    );
  }
  assert.equal(catalog.MAX_LENS_CROSSINGS, 4_096);
  assert.throws(() => catalog.makeLensDiagram(4_097, 1, "fL"), /limits generated lens diagrams/);
});

test("all four computable catalog oracles evaluate to their exact expected values", () => {
  for (const id of ["s3-stabilized", "lens-l7-1", "lens-l7-2", "t3"]) {
    const template = catalog.getTemplate(id);
    const result = engine.evaluateDiagram(template.diagram, {
      ell: template.expected.ell,
      rootPower: template.expected.rootPower,
    });
    assert.deepEqual(
      result.coefficientsModCyclotomicPolynomial,
      template.expected.coefficients,
      `${id} coefficients`,
    );
    if (template.expected.states !== undefined) {
      assert.equal(result.statesEvaluated, template.expected.states, `${id} state count`);
    }
  }
});
