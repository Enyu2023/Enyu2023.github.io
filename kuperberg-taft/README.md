# Kuperberg invariants for odd Taft algebras

This project evaluates a **producer-certified, compiled Kuperberg tensor network** associated with a decorated, combed Heegaard diagram for the odd Taft algebra `T_ell`. Arithmetic is exact in the cyclotomic field `Q(zeta_ell)`; no floating-point approximation is used in the state sum. Custom inputs must already contain the local rotation/antipode labels described below.

It includes:

- a general evaluator for validated crossing-order data;
- a dependency-free browser editor for drawing based, oriented curves, detecting
  intersections, and entering the `4g` global and local contraction labels;
- Chang--Ng--Wang special diagrams for every supported lens space `L(n,k)` (`fL` when `k` is odd, `fR` when `n-k` is odd);
- the Chang--Wang--Zhai genus-three diagram for `T^3`;
- exact tests against the published `L(7,1)` and `L(7,2)` Taft values and separately encoded wiring for the published `T^3` formula, using the same tested Taft arithmetic primitives.

## Quick start

The interactive editor is published at
[enyu2023.github.io/kuperberg-taft](https://enyu2023.github.io/kuperberg-taft/).
It runs entirely in the browser: choose a verified example or draw lower and
upper curves, enter the numerical labels, validate, and compute. No data is
uploaded by the page. See [GUIDE.md](GUIDE.md) for the illustrated workflow and
the precise distinction between global combing coordinates and local labels.

Python 3.10 or newer is sufficient; the package has no runtime dependencies.

```console
python -m pip install -e .

# L(7,1), the paper's fL framing, over T_7
kuperberg-taft lens 7 1 --framing fL --ell 7

# L(7,2), the paper's fR framing, over T_7
kuperberg-taft lens 7 2 --framing fR --ell 7

# The Figure 3 framing of the 3-torus over T_3
kuperberg-taft t3 --ell 3

# A custom compiled diagram
kuperberg-taft diagram examples/t3.json --ell 3 --json
```

The same commands work without installation from this directory:

```console
PYTHONPATH=src python -m kuperberg_taft t3 --ell 3
```

On PowerShell, use `$env:PYTHONPATH = "src"` first.

## Verified values

With `q=zeta_ell` and the conventions below:

```text
K(L(7,1), fL, T_7)
  = 7 - 35*zeta - 28*zeta^2 - 21*zeta^3 - 14*zeta^4 - 7*zeta^5

K(L(7,2), fR, T_7) = 0
K(T^3, f1, T_3)     = 0
```

The first displayed value is the canonical power-basis reduction modulo
`Phi_7(zeta)=1+zeta+...+zeta^6`. It is equal to the source's expression

```text
-42*zeta - 35*zeta^2 - 28*zeta^3 - 21*zeta^4 - 14*zeta^5 - 7*zeta^6.
```

The two lens values are printed in Example 4.18 of the 2025 paper. The `T^3` paper gives the contraction, not a Taft scalar; `0` is an exact derived result, checked both through the generic diagram wiring and a separate literal encoding of its Theorem 3 wiring. Both paths intentionally share the same algebra arithmetic primitives.

## Input contract and the 4g combing numbers

The attached three-page draft says that, relative to a fixed reference combing and with fixed boundary behavior on the punctured surface `R0`, a genus-`g` surface combing is represented by the `4g` integer rotation differences on

```text
alpha_1,...,alpha_g, beta_1,...,beta_g,
nu_1,...,nu_g,       mu_1,...,mu_g.
```

The draft establishes this classification on `R0`; it only suggests that the numbers should also determine the three-manifold combing. In either case, the integers do **not** determine a tensor contraction by themselves. A Kuperberg state sum also needs:

- a basepoint and orientation on every lower and upper circle, encoded implicitly by the first entry and direction of each `crossings` array;
- the resulting based, oriented crossing order on every circle;
- each curve's doubled total rotation `theta2 = 2 theta`;
- the integer local label
  `s(p) = 2(theta_lower(p)-theta_upper(p)) + 1/2` at every crossing.

The attached draft ends before defining a compiler from its global `4g` periods and embedded surface geometry to these local labels. Accordingly, this program accepts a **compiled decorated diagram**. The four length-`g` combing arrays and their named reference are provenance only: the evaluator consumes the explicit local labels and does not consume or cross-check the `4g` arrays.

Every JSON input must set `local_labels_certified` to the literal Boolean `true`. This is an explicit, unchecked producer assertion that the local labels incorporate the stated `4g` coordinates and reference. It is certification, not a geometric verification by this program.

The `combing.mu` array uses the attached draft's name for the spider arcs. Curve IDs such as `mu1` in the supplied presets instead follow the later Chang papers' name for an upper Heegaard circle. They are separate namespaces; custom producers may use less ambiguous curve IDs.

Minimal shape:

```json
{
  "schema_version": 1,
  "convention": "cnw-2025-corrected-right-cointegral",
  "local_labels_certified": true,
  "name": "my diagram",
  "genus": 1,
  "combing": {
    "kind": "difference_to_reference",
    "reference": "name of fixed reference combing",
    "alpha": [0],
    "beta": [0],
    "nu": [0],
    "mu": [0]
  },
  "lower": [
    {"id": "eta1", "theta2": 1, "crossings": ["p1"]}
  ],
  "upper": [
    {"id": "mu1", "theta2": -1, "crossings": ["p1"]}
  ],
  "crossings": [
    {
      "id": "p1",
      "lower": "eta1",
      "upper": "mu1",
      "antipode_power": 1,
      "tilt_power": 0
    }
  ]
}
```

The complete fixtures are [examples/lens_L7_1.json](examples/lens_L7_1.json) and [examples/t3.json](examples/t3.json). Generate other presets with:

```console
kuperberg-taft emit-preset lens my-lens.json --n 9 --k 2 --framing auto
kuperberg-taft emit-preset t3 my-t3.json
```

All IDs, arities, curve memberships, half-rotations, crossing occurrences, and the `4g` lengths are syntactically validated before evaluation. The validator cannot prove embeddability, recover basepoints, verify winding geometry, or prove that `s(p)` agrees with the stated `4g` coordinates.

### Browser drawing format

The editor represents each circle as a closed SVG polyline. Its first vertex
is the square basepoint and its vertex order gives the orientation. Every
transverse lower--upper segment intersection becomes a crossing; the editor
sorts these crossings along each oriented circle and exposes each one in the
local-label inspector. Geometry is saved alongside the compiled contraction in
the browser, while **Export JSON** emits the same schema-v1 contraction accepted
by the Python CLI. Moving a vertex recomputes the intersections, so local labels
must be reviewed and certified again.

## Algebra and state-sum conventions

The basis is `e[a,b] = x^a g^b`, for `0 <= a,b < ell`, with

```text
x^ell = 0,  g^ell = 1,  g*x = q*x*g,
Delta(g) = g tensor g,
Delta(x) = x tensor g + 1 tensor x,
S(g) = g^-1,
S(x) = -x*g^-1.
```

The normalized left integral and right cointegral used by the program are

```text
Lambda = sum_b q^(-b) e[ell-1,b],
lambda(e[a,b]) = q if (a,b)=(ell-1,1), and 0 otherwise.
```

The 2025 preprint prints `lambda=delta_(x^(ell-1))` in Example 4.18. Read literally in its displayed `x^a g^b` basis, that functional fails the paper's own right-cointegral identity for its displayed coproduct and gives the wrong lens result. The corrected functional above is forced by

```text
(lambda tensor id) Delta(h) = lambda(h) 1,
lambda(Lambda) = 1,
```

and reproduces the paper's `L(7,1)` oracle. These identities are regression-tested for `ell=3,5,7`.

For this Taft convention, `S^2=Ad_g` and Kuperberg's tilt `T` is the identity. The JSON retains `tilt_power` for an auditable match with the general formula, but its value does not change a Taft evaluation.

`--root-power u` uses `q=zeta_ell^u`; `u` must be coprime to `ell`. Output remains in the canonical power basis of `zeta_ell`.

## Cost and safety guard

The evaluator is a sparse, explicit state sum. Before constructing integrals or materializing a coproduct it estimates four separate costs: Cartesian states, stored tensor cells, dense cyclotomic coefficient cells, and crossing-state visits. Their defaults are respectively `--max-states 10000000`, `--max-tensor-cells 10000000`, `--max-coefficient-cells 10000000`, and `--max-work 10000000`. Cyclotomic powers are cached lazily, so a guard can reject an oversized request without first allocating a quadratic root table.

Two earlier allocation guards prevent a mistyped parameter from freezing a
browser or CLI before those estimates exist. The defaults are odd `ell <= 101`
and at most 4,096 crossings in a generated lens diagram. The CLI options
`--max-ell` and `--max-lens-crossings`, the Python constructor argument
`max_ell`, `CyclotomicField(..., max_n=...)`, and the preset argument
`max_crossings` can raise those limits explicitly. The JavaScript low-level
constructors have corresponding `maxEll` and `maxOrder` options. The browser
form keeps the conservative defaults; use the CLI for larger controlled runs.

For the `T^3` preset, one fourfold coproduct has

```text
ell * binomial(ell+2, 3)
```

terms. The triple state counts are `27,000` for `ell=3`, `5,359,375` for `ell=5`, and `203,297,472` for `ell=7`. The first is suitable for routine testing. The latter two exceed the default work guard; override it only when the cost is intended. A variable-elimination implementation would be preferable for large `ell`.

## Tests

```console
PYTHONPATH=src python -m unittest discover -s tests -v
```

The suite checks cyclotomic reduction, Taft relations, antipode axioms, integral and cointegral identities, JSON validation, the state-space guard, `S^3`, both lens-space source oracles, and the `T^3` generic-versus-Theorem-3 comparison.

The browser evaluator also has Node regression tests, and the complete page is
exercised headlessly in Chromium. From this repository, run:

```console
node --test web/tests/engine.test.mjs
node --test web/tests/ui.test.mjs
```

The second command requires Playwright (or a compatible local Chromium path as
described at the top of that test file); it covers the verified lens-space and
3-torus templates as well as drawing/import/export interactions.

## Primary sources

- G. Kuperberg, [Non-involutory Hopf algebras and 3-manifold invariants](https://arxiv.org/abs/q-alg/9712047).
- L. Chang and S. X. Cui, [On two invariants of three manifolds from Hopf algebras](https://arxiv.org/abs/1710.09524), especially the special Heegaard diagrams.
- L. Chang, S.-H. Ng, and Y. Wang, [Generalizations of Frobenius--Schur indicators from Kuperberg invariants](https://arxiv.org/abs/2506.07409), equations (3.2)--(3.4), Section 4, and Example 4.18.
- L. Chang, Y. Wang, and S. Zhai, [On the gauge invariance of the Kuperberg invariant of certain high genus framed 3-manifolds](https://arxiv.org/abs/2601.19485), Figure 3 and Theorem 3.

## Deliberate limits

- Odd `ell >= 3` only, as requested.
- Taft algebras only; this is not a generic Hopf-algebra package.
- The Python input is combinatorial JSON. The browser can compile its own SVG
  polylines, but it is not an image-recognition system or a general surface
  embedding package.
- The program does not invent local crossing labels from, or mathematically consume, the `4g` periods. Use a preset or supply producer-certified compiled labels.
- Complexity is exponential in a naive contraction; the state-count guard prevents accidental very large runs.
