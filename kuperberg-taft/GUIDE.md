# Diagram Lab user guide

The Diagram Lab turns a **compiled, decorated Heegaard diagram** into the exact Kuperberg invariant for an odd Taft algebra `T_ell`. It runs entirely in the browser and uses exact arithmetic in `Q(zeta_ell)` until it separately reports a numerical approximation.

The crucial word is *compiled*. A picture and the `4g` global combing coordinates do not, by themselves, specify the tensor contraction. The page must also know the basepoint and orientation of each curve, both based crossing orders, every curve rotation, and every local antipode label. The verified templates already contain that information. A custom drawing is computation-ready only after a trusted producer supplies and certifies it.

## Fastest verified run

1. Open the page and choose **Lens space L(7,1) — fL** from **Common diagram**.
2. Leave **Odd level ell** at `7` and **Root power** at `1`. The template normally sets the recommended level when it loads.
3. Read the green verification status, then choose **Validate**.
4. Choose **Compute Kuperberg invariant**.

The exact coefficient vector should be

```text
[7, -35, -28, -21, -14, -7]
```

which means

```text
7 - 35*zeta - 28*zeta^2 - 21*zeta^3 - 14*zeta^4 - 7*zeta^5
```

in the canonical power basis modulo `Phi_7(zeta)`.

Two useful zero checks are **Lens space L(7,2) — fR** at `ell=7` and **3-torus T^3 — Figure 3 framing f1** at `ell=3`.

## Drawing a custom diagram

### 1. Set up the surface and algebra

Choose **New**, set the genus `g`, name the diagram, and name the fixed **Reference combing**. Enter an odd `ell >= 3`. The root power `u` selects `q = zeta_ell^u` and must be coprime to `ell`.

Changing the genus changes the required data to exactly `g` lower curves, `g` upper curves, and four arrays of length `g`.

### 2. Draw the based, oriented curves

Choose **Lower** or press `L`, then click at least three vertices. Choose **Close curve** or press Enter. Repeat with **Upper** or `U`.

- Lower curves are the teal `eta` curves; upper curves are the coral `mu` curves.
- The first vertex is the square basepoint.
- Point order determines orientation, shown by the arrow.
- The based crossing order starts just after the basepoint and follows that orientation.
- Upper/lower intersections are detected from the canvas geometry.

Use **Select** or press `V` to drag a vertex. Select a curve and use **Delete** to remove it. Moving a curve can create, remove, or reorder crossings, so review every local label after a geometric edit.

The canvas is a combinatorial editor, not a surface-topology prover. In particular, a torus fundamental polygon or a higher-genus cut system has edge identifications that a planar intersection detector does not reconstruct. For published special diagrams, prefer the precompiled templates. For a custom quotient-surface drawing, make sure the compiled crossing data—not merely its canvas routing—matches the intended embedded curves.

### 3. Enter each curve rotation

Select a curve. In **Inspector**, set `theta2`, the stored integer `2*theta` for that curve's half-integer total rotation. The current convention requires an odd integer. The inspector also displays the curve's based crossing order; compare it with the producer's compiled data.

Changing the basepoint or reversing the orientation changes the order and can change the local data. Redrawing a curve is therefore a mathematical edit, not just a cosmetic one.

### 4. Enter every local crossing label

Select an amber intersection and enter:

- **Antipode power s**: the integer exponent in the local `S^s` action;
- **Tilt power t**: the exponent in `T^t`.

For the Taft convention implemented here, the tilt is the identity, so `t` does not change the scalar. It remains in the schema to preserve the general Kuperberg decoration and make the transcription auditable.

In the conventions used by the source construction, the local antipode exponent is derived from the relative rotation at the crossing, schematically

```text
s(p) = 2(theta_lower(p) - theta_upper(p)) + 1/2.
```

Do not guess `s` from how steep two segments look on screen. It must come from the same embedded geometry, basepoints, orientations, combing, and rotation convention as the rest of the compiled diagram.

### 5. Enter the `4g` global combing coordinates

The table has one column per handle and four rows:

```text
alpha_1,...,alpha_g
beta_1,...,beta_g
nu_1,...,nu_g
mu_1,...,mu_g
```

These are integer rotation **differences from the named reference combing**. A row of zeros means “the same periods as this reference,” not an absolute zero combing.

The `mu` row in the combing table names spider arcs in the supplied `4g` convention. An upper Heegaard curve whose ID happens to be `mu1` belongs to a separate namespace. The verified presets retain the papers' curve names, so this collision is historical rather than mathematical.

### 6. Validate, certify, and compute

Choose **Validate** to check the schema: genus, curve counts, curve IDs, odd `theta2` values, crossing membership, based orders, integer labels, and the lengths of all four combing arrays.

For a custom diagram, select **I certify the local labels** only when the explicit orders and `S^s T^t` powers have been derived for the pictured diagram and the stated reference combing. This checkbox sets `local_labels_certified: true`; it is a producer assertion. The application cannot prove it from the drawing or from the `4g` integers.

Once validation succeeds, choose **Compute Kuperberg invariant**. The result card reports:

- the exact cyclotomic expression;
- its coefficient vector modulo the cyclotomic polynomial;
- a floating-point approximation for convenience;
- states evaluated and an estimated work count.

Use **Copy exact** to copy the exact expression.

## What the input fields mean

| Field | Mathematical role | Checked automatically? |
| --- | --- | --- |
| `genus` | Number of handles; also the number of lower and upper curves | Yes |
| `combing.alpha/beta/nu/mu` | `4g` rotation differences from a named reference | Length and integer type only |
| curve `id` | Stable name used by crossing incidences | Yes |
| curve `theta2` | Twice its half-integer total rotation | Odd integer only |
| curve `crossings` | Based, oriented order after its basepoint | Incidence consistency only |
| crossing `lower`, `upper` | The two incident curves | Yes |
| `antipode_power` | Local `S` exponent | Integer type only |
| `tilt_power` | Local `T` exponent; inert for this Taft convention | Integer type only |
| `local_labels_certified` | Producer assertion that global and local data agree | Must be literal `true` to evaluate |

Validation proves that the contraction is internally well-formed. It does not prove that the curves embed on the named surface, that they present the named 3-manifold, or that their labels describe the stated combing.

## Why the `4g` numbers are not enough

The global coordinates classify a surface combing relative to fixed reference and boundary behavior in the supplied draft convention. A Kuperberg tensor network needs data localized at every crossing. Recovering those labels requires the actual embedded curves and a consistent geometric compiler that tracks rotations from their basepoints.

There is therefore no sound formula in this project that takes only `4g` integers and invents all local exponents. The web page stores both layers:

```text
reference + 4g periods         provenance for the global combing
based curve orders + theta2   curve-level compiled data
S^s T^t at every crossing     local compiled data used by the contraction
```

The evaluator consumes the last two layers. It preserves the first layer in imports and exports, but does not cross-check it against the local labels.

## Common diagram catalog

The template picker deliberately distinguishes computation-ready entries from drawing aids.

| Entry | Status | Recommended run | What has been checked |
| --- | --- | --- | --- |
| `L(7,1)`, fL | Published scalar verified | `T_7`, root power 1 | Exact published nonzero scalar; 6,468 states |
| `L(7,2)`, fR | Published scalar verified | `T_7`, root power 1 | Exact published zero |
| `T^3`, framing f1 | Independent wiring check | `T_3`, root power 1 | Generic diagram agrees with a separately encoded Theorem 3 contraction; exact zero; 27,000 states |
| Stabilized `S^3` | Regression verified | `T_3`, root power 1 | Exact value 1 in the automated suite |
| `S^1 x S^2` layout | Illustrative only | Do not compute as supplied | Familiar parallel-curve layout; rotations and combing are placeholders |
| Blank genus-two workbench | Illustrative only | Do not compute as supplied | Surface scaffold with no manifold or framing assertion |

For the first three entries, “zero combing coordinates” means zero **relative to the preset framing named in the template**.

### Other lens spaces

Open **Generate a lens-space diagram**, enter coprime integers `n > k > 0`, choose **Automatic**, **fL**, or **fR**, then choose **Generate L(n,k)**. The generated entry is a computation-ready special diagram, with its based orders and local antipode powers filled in by the same recursion as the Python package.

The Python package can compile the Chang–Ng–Wang special lens diagram for coprime `n > k > 0`:

```console
kuperberg-taft emit-preset lens L9_2.json --n 9 --k 2 --framing auto
```

The `fL` construction requires odd `k`; the `fR` construction requires odd `n-k`. `auto` prefers `fL` and otherwise chooses `fR`. Since `n` and `k` are coprime, one of those parities is available.

The page catalog exposes the same compiler to JavaScript:

```js
const template = KuperbergCatalog.makeLensTemplate(9, 2, "auto");
const diagram = template.diagram;
```

These generated local labels are computation-ready special-diagram data. They are not all independent published scalar regression oracles; that stronger status is reserved for the listed `L(7,1)` and `L(7,2)` cases.

## Import and export

**Export JSON** downloads the schema-v1 compiled contraction. It includes the exact data used by both the browser evaluator and the Python CLI. Freehand canvas vertices are presentation geometry and are not part of the mathematical JSON contract.

**Import JSON** accepts the same schema. Because schema v1 has no freehand vertices, an imported contraction is displayed as a based-order schematic and its stored crossing arrays remain authoritative. Choose **New** if you want to return to editable planar geometry. A minimal shape is:

```json
{
  "schema_version": 1,
  "convention": "cnw-2025-corrected-right-cointegral",
  "local_labels_certified": true,
  "name": "my compiled diagram",
  "genus": 1,
  "combing": {
    "kind": "difference_to_reference",
    "reference": "my fixed reference combing",
    "alpha": [0],
    "beta": [0],
    "nu": [0],
    "mu": [0]
  },
  "lower": [
    {"id": "eta1", "theta2": 1, "crossings": ["p1"]}
  ],
  "upper": [
    {"id": "upper1", "theta2": -1, "crossings": ["p1"]}
  ],
  "crossings": [
    {
      "id": "p1",
      "lower": "eta1",
      "upper": "upper1",
      "antipode_power": 1,
      "tilt_power": 0
    }
  ]
}
```

The browser and CLI intentionally reject unknown top-level fields. Keep separate drawing metadata in another file rather than adding it to this schema.

Evaluate an exported file with Python:

```console
kuperberg-taft diagram my-diagram.json --ell 3 --root-power 1 --json
```

## Algebra convention

The basis is `e[a,b] = x^a g^b`, with `0 <= a,b < ell`, and

```text
x^ell = 0
g^ell = 1
g*x = q*x*g
Delta(g) = g tensor g
Delta(x) = x tensor g + 1 tensor x
S(g) = g^(-1)
S(x) = -x*g^(-1)
```

The normalized left integral and corrected right cointegral are

```text
Lambda = sum_b q^(-b) x^(ell-1) g^b
lambda(x^a g^b) = q  if (a,b)=(ell-1,1), and 0 otherwise.
```

With this convention, `S^2 = Ad_g` and the Kuperberg tilt is the identity. See the project README for the correction to the functional printed in the 2025 preprint and the regression identities that force this normalization.

## Performance limits

The current contraction is a sparse but explicit state sum. Its cost grows quickly with `ell`, genus, and crossing arity. For the supplied `T^3` diagram, the Cartesian state counts are:

```text
ell=3:       27,000
ell=5:    5,359,375
ell=7:  203,297,472
```

Use `ell=3` for the interactive `T^3` test. A stopped or rejected large run is a resource safeguard, not evidence that the invariant is undefined. The Python CLI exposes explicit state, tensor-cell, coefficient-cell, and work guards for controlled larger experiments.

The browser additionally limits `ell` to 101 and generated lens diagrams to
4,096 crossings so that accidental huge integers are rejected before a
cyclotomic polynomial or diagram array is allocated. The Python CLI uses the
same defaults and exposes `--max-ell` and `--max-lens-crossings` when a larger
allocation is intentional.

## Validation checklist for custom work

Before treating a computed number as a 3-manifold invariant, confirm all of the following outside the program:

- The lower and upper attaching curves give the intended Heegaard splitting.
- Each curve has the intended orientation and basepoint.
- Both based crossing orders agree with the embedded diagram.
- Every `theta2` and local antipode power uses the same rotation convention.
- The four length-`g` arrays are measured relative to the reference named in the file.
- The reference surface combing extends in the required way to the three-manifold combing or framing used by the source theorem.
- The algebra, integral, cointegral, root, and orientation conventions match the value being compared.
- Any homeomorphism or framing claim used to name the manifold has been established independently.

The **certify** checkbox is a reminder of this boundary, not a substitute for those checks.

## Run locally and test

Serve the static page from the project directory:

```console
python -m http.server 8000 -d web
```

Then open `http://localhost:8000/`. Serving is preferable to opening `index.html` directly because browsers apply stricter file-URL rules to downloads and modules.

Run all browser-side Node tests:

```console
node --test web/tests/*.mjs
```

Run the Python reference suite from PowerShell:

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests -v
```

The catalog tests evaluate stabilized `S^3`, `L(7,1)`, `L(7,2)`, and `T^3`; compare the fixed catalog JSON with independently encoded browser presets; and check both lens recursion branches.

## Known limits

- Odd `ell >= 3` and Taft algebras only.
- No automatic proof of surface embeddability or of the named 3-manifold.
- No geometric compiler from only the `4g` periods to local rotation labels.
- Canvas intersections are planar; edge identifications of a polygonal surface need producer handling.
- The drawing is not preserved in schema-v1 JSON; the contraction data are.
- Complexity is exponential for the current explicit contraction.
- Conservative early-allocation defaults are `ell <= 101` and at most 4,096
  crossings for a generated lens diagram; the CLI can raise them explicitly.
- The browser is an exploratory interface. For reproducible or larger runs, export JSON and use the Python CLI with explicit resource limits.

## Primary sources

- G. Kuperberg, [Non-involutory Hopf algebras and 3-manifold invariants](https://arxiv.org/abs/q-alg/9712047).
- L. Chang and S. X. Cui, [On two invariants of three manifolds from Hopf algebras](https://arxiv.org/abs/1710.09524).
- L. Chang, S.-H. Ng, and Y. Wang, [Generalizations of Frobenius–Schur indicators from Kuperberg invariants](https://arxiv.org/abs/2506.07409).
- L. Chang, Y. Wang, and S. Zhai, [On the gauge invariance of the Kuperberg invariant of certain high genus framed 3-manifolds](https://arxiv.org/abs/2601.19485).
