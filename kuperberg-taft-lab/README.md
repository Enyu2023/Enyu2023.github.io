# Kuperberg–Taft Workbench

An offline-first web workbench for exact Kuperberg-invariant calculations from a **prepared, numbered combed Heegaard diagram**. It implements the Chang–Cui tensor-network convention for the odd Taft algebra

\[
T_\ell(\zeta)=\langle x,g\mid x^\ell=0,\ g^\ell=1,\ gx=\zeta xg\rangle,
\qquad
\Delta(x)=x\otimes g+1\otimes x,
\]

with odd \(\ell\ge 3\). Results are exact elements of \(\mathbb Z[\zeta_\ell]\), accompanied by a numerical approximation and computation statistics.

**Live workbench:** <https://enyu2023.github.io/kuperberg-taft-lab/>  
**Published files:** <https://github.com/Enyu2023/Enyu2023.github.io/tree/main/kuperberg-taft-lab>

> [!IMPORTANT]
> This is a research prototype, not a topological recognizer. The numbered preparation table is the algebraic source of truth. The SVG drawing is an editor and consistency aid; visual intersections are only suggestions until you confirm their crossing records.

## Run it

You need a current Node.js installation.

```text
npm install
npm run dev
```

Open the local address shown in the terminal. To run the verified examples and make the deployable static site:

```text
npm test
npm run build
```

Everything runs locally in the browser. Import, export, and autosave do not send diagram data to a server.

## Use the workbench

1. Start with **Lens L(7,1)**, **Lens L(7,2)**, **3-torus**, or a blank genus-\(g\) diagram.
2. Draw or adjust lower and upper curves in the canvas. Add and confirm crossing records, then put each crossing ID in the positive order encountered after the circle's basepoint.
3. Enter the trusted integer data \(R_0,B,N_0,A\), choose the \(4g\) combing coordinates, select odd \(\ell\), and compute.

The editor continuously validates incidence, dimensions, parity, and ordering. It also displays the derived labels used by the tensor contraction.

## Prepared numbered input

The input is portable JSON (`schemaVersion: 1`). A genus-\(g\) record has exactly \(4g\) freely chosen combing integers

\[
n=(n_{x_1},n_{y_1},\ldots,n_{x_g},n_{y_g},n_{\nu_1},\ldots,n_{\nu_g},n_{\mu_1},\ldots,n_{\mu_g}).
\]

These labels denote a chosen relative cut basis; they are not assumed to be the Heegaard \(\alpha/\beta\) curves.

For every lower or upper circle \(c\), supply:

- `R0`: the odd doubled total reference rotation \(2\theta_0(c)\);
- `B`: its \(4g\)-entry full-circuit phase-front counter;
- `order`: crossing IDs in positive order after the basepoint.

For every crossing \(p\), supply:

- `N0`: the reference antipode exponent;
- `A`: the \(4g\)-entry lower-minus-upper partial-path counter;
- the incident lower and upper circle IDs.

New circle rows and rows copied from the SVG intersection suggester have `labelsPrepared: false`. They cannot be evaluated until you review `R0`/`B` or `N0`/`A` and mark them ready. Existing prepared schema-v1 files may omit this flag; omission means the numeric row is authoritative.

The selected combing changes the labels by

\[
R(c)=R_0(c)-2B(c)\cdot n,
\qquad
N(p)=N_0(p)-2A(p)\cdot n.
\]

Because `R0` is odd, every derived circle label remains odd. The full mathematical and convention notes are in [docs/MATHEMATICS.md](docs/MATHEMATICS.md).

If you already have final local labels but no calibrated phase-front table, use zero combing coordinates and zero `A`/`B` vectors, then put the authoritative doubled rotations in `R0` and antipode exponents in `N0`. This direct-label mode does not pretend to derive missing geometry.

## Verification examples

The test suite includes:

- exact Taft-algebra laws and exact cyclotomic reduction;
- prepared-network validation and combing-label changes;
- the published Lens-space contractions for \(L(7,1)\) and \(L(7,2)\), with the paper's cointegral-sidedness correction made explicit;
- the published genus-three \(T^3\) crossing network, which evaluates exactly to \(0\) for \(T_3\).

The Lens-space source prints an integral/cointegral pairing whose side and normalization are not mutually consistent under its displayed coproduct convention. The implementation never hides that discrepancy: it uses the normalized right cointegral \(\zeta\,\delta_{x^{\ell-1}g}\), which satisfies the displayed identity and reproduces the published value, while the literal printed \(\delta_{x^{\ell-1}}\) is covered by a separate convention check.

## Computational limits

The contraction is sparse but exponential in the number of lower-circle tensor states. Browser-safe operation, tensor-term, state, and live-assignment budgets stop accidental lockups. Small levels and the included genus-one/genus-three examples are the intended range; a large diagram may return `limit` rather than freeze the page.

## Publish with GitHub Pages

This repository includes `.github/workflows/pages.yml`.

1. Push the repository to a GitHub repository whose default branch is `main`.
2. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. Push to `main`, or run the workflow manually from the **Actions** tab.

The Vite build uses relative assets, so it works both at `username.github.io/repository/` and in a local static preview.

## Sources

- The reference-table/\(4g\) affine update proposed in the [shared algorithm discussion](https://chatgpt.com/share/6a8af0b2-7378-83ea-9ee2-de3f65a1e595)
- Greg Kuperberg, *Non-involutory Hopf algebras and 3-manifold invariants* (1997), <https://arxiv.org/abs/q-alg/9712047>
- Liang Chang and Shawn X. Cui, *On Two Invariants of Three Manifolds from Hopf Algebras* (2019), <https://arxiv.org/abs/1710.09524>
- Liang Chang, Siu-Hung Ng, and Yilong Wang, *Generalizations of Frobenius–Schur indicators from Kuperberg invariants* (2025), <https://arxiv.org/abs/2506.07409>
- Liang Chang, Yilong Wang, and Saifei Zhai, *On the gauge invariance of the Kuperberg invariant of certain high genus framed 3-manifolds* (2026), <https://arxiv.org/abs/2601.19485>

Released under the [MIT License](LICENSE).
