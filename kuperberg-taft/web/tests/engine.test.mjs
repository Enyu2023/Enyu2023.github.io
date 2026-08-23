import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

const require = createRequire(import.meta.url);
const engine = require("../engine.js");

async function example(name) {
  const url = new URL(`../../examples/${name}`, import.meta.url);
  return JSON.parse(await readFile(url, "utf8"));
}

test("classic browser global and Node API expose the same frozen engine", () => {
  assert.equal(globalThis.KuperbergTaft, engine);
  assert.ok(Object.isFrozen(engine));
  assert.equal(typeof engine.evaluateDiagram, "function");
  assert.equal(typeof engine.lensDiagram, "function");
  assert.equal(typeof engine.t3Diagram, "function");
});

test("cyclotomic arithmetic uses exact BigInt coefficients", () => {
  assert.deepEqual(engine.cyclotomicPolynomial(3), [1n, 1n, 1n]);
  assert.deepEqual(engine.cyclotomicPolynomial(7), [1n, 1n, 1n, 1n, 1n, 1n, 1n]);
  assert.deepEqual(engine.cyclotomicPolynomial(9), [1n, 0n, 0n, 1n, 0n, 0n, 1n]);

  const field = new engine.CyclotomicField(7);
  let rootSum = field.zero;
  for (let exponent = 0; exponent < 7; exponent += 1) {
    rootSum = rootSum.add(field.zetaPower(exponent));
  }
  assert.ok(rootSum.isZero());
  assert.ok(field.zetaPower(3).multiply(field.zetaPower(4)).equals(field.one));
});

test("lens preset recursions match the Python implementation", () => {
  const left = engine.lensDiagram(8, 3, { framing: "fL" });
  assert.deepEqual(
    left.crossings.map((crossing) => crossing.antipode_power),
    [1, 3, 1, 1, 3, 1, 1, 3],
  );
  assert.deepEqual(left.upper[0].crossings, ["p1", "p4", "p7", "p2", "p5", "p8", "p3", "p6"]);
  assert.equal(left.upper[0].theta2, -1);

  const right = engine.lensDiagram(8, 3, { framing: "fR" });
  assert.deepEqual(
    right.crossings.map((crossing) => crossing.antipode_power),
    [-1, -1, 1, 1, 1, -1, -1, 1],
  );
  assert.deepEqual(right.upper[0].crossings, ["p8", "p3", "p6", "p1", "p4", "p7", "p2", "p5"]);
  assert.equal(right.upper[0].theta2, 1);
});

test("strict validation accepts JSON text and preserves all 4g coordinates", () => {
  const diagram = engine.t3Diagram();
  diagram.combing.alpha[0] = 2;
  const normalized = engine.validateDiagram(JSON.stringify(diagram));
  assert.equal(normalized.combing.alpha[0], 2);
  assert.equal(
    ["alpha", "beta", "nu", "mu"].flatMap((name) => normalized.combing[name]).length,
    4 * normalized.genus,
  );
});

test("strict validation rejects uncertified, misspelled, and malformed input", () => {
  const uncertified = engine.t3Diagram();
  uncertified.local_labels_certified = 1;
  assert.throws(() => engine.validateDiagram(uncertified), /JSON boolean true/);

  const misspelled = engine.t3Diagram();
  misspelled.crossings[0].antipode_powre = 1;
  assert.throws(() => engine.validateDiagram(misspelled), /extra=/);

  const malformed = engine.t3Diagram();
  malformed.combing.alpha = [0];
  assert.throws(() => engine.validateDiagram(malformed), /exactly genus=3/);

  assert.throws(() => engine.validateDiagram("[]"), /must be an object/);
});

test("resource guards reject work before contraction and support explicit null", () => {
  const diagram = engine.t3Diagram();
  assert.throws(
    () => engine.evaluateDiagram(diagram, { ell: 3, maxStates: 1 }),
    engine.StateSpaceTooLarge,
  );
  assert.throws(
    () => engine.evaluateDiagram(diagram, { ell: 3, maxStates: null, maxWork: 1 }),
    /crossing-state visits/,
  );
  assert.throws(
    () =>
      engine.evaluateDiagram(diagram, {
        ell: 101,
        maxStates: null,
        maxTensorCells: null,
        maxCoefficientCells: 1_000,
        maxWork: null,
      }),
    /cyclotomic cells/,
  );
  assert.throws(
    () => engine.evaluateDiagram(diagram, { maxStates: 10, max_states: 11 }),
    /cannot disagree/,
  );
  assert.throws(
    () => engine.evaluateDiagram(engine.lensDiagram(1, 1), { ell: 103 }),
    /maxEll=101/,
  );
  assert.throws(() => new engine.TaftAlgebra(103), /maxEll=101/);
  assert.equal(new engine.TaftAlgebra(103, 1, { maxEll: 103 }).ell, 103);
  assert.throws(() => new engine.CyclotomicField(103), /maxOrder=101/);
  assert.equal(new engine.CyclotomicField(103, { maxOrder: 103 }).n, 103);
  assert.throws(() => engine.cyclotomicPolynomial(103), /maxOrder=101/);
  assert.equal(engine.cyclotomicPolynomial(103, { maxOrder: 103 }).length, 103);
  assert.throws(
    () => engine.lensDiagram(4_097, 1),
    /maxCrossings=4096/,
  );
});

test("public sparse results cannot mutate integral or coproduct caches", () => {
  const algebra = new engine.TaftAlgebra(3);
  const snapshot = (sparse) => Array.from(sparse, ([key, term]) => [
    key,
    JSON.stringify(term.basis),
    term.coefficient.toString(),
  ]);

  const integral = algebra.leftIntegral;
  const expectedIntegral = snapshot(integral);
  const integralTerm = integral.values().next().value;
  assert.throws(() => { integralTerm.basis[0] = 0; }, TypeError);
  assert.throws(() => { integralTerm.coefficient = algebra.field.zero; }, TypeError);
  integral.clear();
  assert.deepEqual(snapshot(algebra.leftIntegral), expectedIntegral);

  const coproduct = algebra.coproductBasis([1, 0], 2);
  const expectedCoproduct = snapshot(coproduct);
  const coproductTerm = coproduct.values().next().value;
  assert.throws(() => { coproductTerm.basis[0][0] = 2; }, TypeError);
  assert.throws(() => { coproductTerm.coefficient = algebra.field.zero; }, TypeError);
  coproduct.clear();
  assert.deepEqual(snapshot(algebra.coproductBasis([1, 0], 2)), expectedCoproduct);
});

test("stabilized S3 evaluates to one", () => {
  const result = engine.evaluateDiagram(engine.lensDiagram(1, 1), { ell: 3 });
  assert.equal(result.exact, "1");
  assert.deepEqual(result.coefficients_mod_cyclotomic_polynomial, ["1", "0"]);
  assert.equal(result.states_evaluated, 3);
});

test("L(7,1) matches the published exact cyclotomic oracle", async () => {
  const diagram = await example("lens_L7_1.json");
  const result = engine.evaluateDiagram(diagram, { ell: 7 });
  assert.equal(result.exact, "7 - 35*zeta - 28*zeta^2 - 21*zeta^3 - 14*zeta^4 - 7*zeta^5");
  assert.deepEqual(result.coefficients_mod_cyclotomic_polynomial, [
    "7",
    "-35",
    "-28",
    "-21",
    "-14",
    "-7",
  ]);
  assert.equal(result.states_evaluated, 6_468);
  assert.equal(result.estimated_states, 6_468);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("L(7,2) in the verified fR framing evaluates to zero", () => {
  const result = engine.evaluateDiagram(engine.lensDiagram(7, 2), { ell: 7 });
  assert.equal(result.exact, "0");
  assert.deepEqual(result.coefficients_mod_cyclotomic_polynomial, ["0", "0", "0", "0", "0", "0"]);
});

test("additional lens framings match independently generated Python vectors", () => {
  const cases = [
    [3, 1, "fL", 3, 1, ["3", "-3"]],
    [5, 2, "fR", 3, 1, ["-5", "0"]],
    [5, 1, "fL", 5, 2, ["15", "5", "-5", "10"]],
    [8, 3, "fL", 3, 1, ["0", "-8"]],
    [8, 3, "fR", 3, 1, ["0", "-8"]],
  ];
  for (const [n, k, framing, ell, rootPower, expected] of cases) {
    const result = engine.evaluateDiagram(engine.lensDiagram(n, k, { framing }), {
      ell,
      rootPower,
    });
    assert.deepEqual(
      result.coefficients_mod_cyclotomic_polynomial,
      expected,
      `L(${n},${k}) ${framing}, ell=${ell}, rootPower=${rootPower}`,
    );
  }
});

test("T3 compiled diagram matches the 27,000-state zero oracle", async () => {
  const fromFile = await example("t3.json");
  assert.deepEqual(engine.validateDiagram(fromFile), engine.t3Diagram());
  const result = engine.evaluateDiagram(fromFile, { ell: 3 });
  assert.equal(result.exact, "0");
  assert.deepEqual(result.coefficients_mod_cyclotomic_polynomial, ["0", "0"]);
  assert.equal(result.states_evaluated, 27_000);
  assert.equal(result.estimated_work, 324_000);
});

test("root power must remain primitive and is normalized in output", () => {
  assert.throws(
    () => engine.evaluateDiagram(engine.lensDiagram(1, 1), { ell: 9, rootPower: 3 }),
    /coprime/,
  );
  const result = engine.evaluateDiagram(engine.lensDiagram(1, 1), {
    ell: 9,
    rootPower: -7,
  });
  assert.equal(result.root_power, 2);
});

test("a detached curve returns exact zero without enumerating states", () => {
  const detached = {
    schema_version: 1,
    convention: engine.CONVENTION,
    local_labels_certified: true,
    name: "detached test",
    genus: 1,
    combing: {
      kind: "difference_to_reference",
      reference: "test",
      alpha: [0],
      beta: [0],
      nu: [0],
      mu: [0],
    },
    lower: [{ id: "eta1", theta2: 1, crossings: [] }],
    upper: [{ id: "mu1", theta2: -1, crossings: [] }],
    crossings: [],
  };
  const result = engine.evaluateDiagram(detached, { ell: 3 });
  assert.equal(result.exact, "0");
  assert.equal(result.states_evaluated, 0);

  const compositeDetached = {
    ...detached,
    name: "detached factor bypasses state guards",
    genus: 2,
    combing: {
      ...detached.combing,
      alpha: [0, 0], beta: [0, 0], nu: [0, 0], mu: [0, 0],
    },
    lower: [
      { id: "eta1", theta2: 1, crossings: ["p1", "p2"] },
      { id: "eta2", theta2: 1, crossings: [] },
    ],
    upper: [
      { id: "mu1", theta2: -1, crossings: ["p1", "p2"] },
      { id: "mu2", theta2: -1, crossings: [] },
    ],
    crossings: [
      { id: "p1", lower: "eta1", upper: "mu1", antipode_power: 1, tilt_power: 0 },
      { id: "p2", lower: "eta1", upper: "mu1", antipode_power: 1, tilt_power: 0 },
    ],
  };
  const guardedZero = engine.evaluateDiagram(compositeDetached, { ell: 3, maxStates: 1 });
  assert.equal(guardedZero.exact, "0");
  assert.equal(guardedZero.estimated_states, 9);

  const overriddenEll = engine.evaluateDiagram(detached, { ell: 103, maxEll: 103 });
  assert.equal(overriddenEll.exact, "0");
});
