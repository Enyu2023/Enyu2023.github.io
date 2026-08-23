# Mathematical conventions and scope

This note records the exact convention implemented by the workbench. It is deliberately explicit because changing the side of an integral, reversing a Sweedler order, or replacing \(\zeta\) by \(\zeta^{-1}\) changes the displayed answer.

## 1. Taft algebra

Let \(\ell\ge3\) be odd and \(\zeta\) a formal primitive \(\ell\)-th root of unity. The basis is

\[
E_{a,b}=x^a g^b,\qquad 0\le a,b<\ell,
\]

with

\[
gx=\zeta xg,\quad
\Delta(g)=g\otimes g,\quad
\Delta(x)=x\otimes g+1\otimes x,
\quad S(g)=g^{-1},\quad S(x)=-xg^{-1}.
\]

The evaluator uses exact integer polynomials modulo the cyclotomic polynomial \(\Phi_\ell\). No floating-point arithmetic participates in equality tests.

## 2. Balanced and shifted integrals

Use the Chang–Cui right/right normalized pair

\[
e_R=\sum_{b=0}^{\ell-1}E_{\ell-1,b},
\qquad
\mu_R(E_{a,b})=\delta_{a,\ell-1}\delta_{b,1}.
\]

The distinguished group-like elements are \(a=g\) and \(\alpha(g)=\zeta^{-1}\). Since

\[
S^2(x)=\zeta x=\operatorname{Ad}_g(x),
\qquad S^2(g)=g,
\]

the Taft algebra is balanced: its tilt is the identity. Therefore the first combing is sufficient and the workbench does not need framing-front `T` powers.

For an integer \(n\), write \(h=n-\tfrac12\). Chang–Cui's shifted tensors become

\[
e_h=\zeta^n\sum_{b=0}^{\ell-1}\zeta^{-nb}E_{\ell-1,b},
\qquad
\mu_h(E_{a,b})=\delta_{a,\ell-1}\delta_{b,1-n\pmod\ell}.
\]

For a lower circle with doubled rotation \(R=2\theta\), use

\[
n_{\rm lower}=\frac{R+1}{2}.
\]

For an upper circle the assigned functional has shift \(h=-\theta\), so use

\[
n_{\rm upper}=\frac{1-R}{2}.
\]

These expressions support every derived odd `R`, not just \(R=\pm1\).

## 3. Prepared tensor network

Each lower circle receives the iterated coproduct of its shifted \(e_h\). Its outgoing legs follow the stored positive crossing order. At crossing \(p\), apply \(S^{N(p)}\). Multiply the incoming elements around each upper circle in its stored positive order, then apply the corresponding shifted \(\mu_h\). Contract and sum all sparse states.

In the Chang–Cui sign convention the geometric crossing label is

\[
N(p)=2(\theta_l(p)-\theta_u(p))+\frac12.
\]

Kuperberg's original convention has \(-\tfrac12\) in the last term, hence an exponent one smaller. This project stores the Chang–Cui exponent directly.

## 4. The 4g combing update

Choose a reference combing and a relative cut basis

\[
(x_1,y_1,\ldots,x_g,y_g,\nu_1,\ldots,\nu_g,\mu_1,\ldots,\mu_g).
\]

The user-selected vector \(n\in\mathbb Z^{4g}\) is unrestricted. For a circle, `B` is the signed phase-front count around its full circuit. For a crossing, `A` is the lower basepoint-to-crossing count minus the upper basepoint-to-crossing count. The trusted preparation table is updated by

\[
R(c)=R_0(c)-2B(c)\cdot n,
\qquad
N(p)=N_0(p)-2A(p)\cdot n.
\]

The current SVG tool does not infer these phase-front counts from pixels or polylines. It can suggest geometric intersections, but only a confirmed numeric record enters the invariant.

## 5. Literature regressions

### Lens spaces

The 2025 Lens-space paper prints

\[
K(L(7,1),f_L,T(\zeta_7))
=-42\zeta_7-35\zeta_7^2-28\zeta_7^3-21\zeta_7^4-14\zeta_7^5-7\zeta_7^6
\]

and \(K(L(7,2),f_R,T(\zeta_7))=0\). Its example labels \(\delta_{x^{\ell-1}}\) a right cointegral while using \(\Delta(x)=x\otimes g+1\otimes x\); under the displayed sidedness definition, that functional is a shifted left cointegral. The normalized right cointegral is \(\zeta\,\delta_{x^{\ell-1}g}\). With that correction, the displayed reverse Sweedler contraction reproduces the published nonzero polynomial exactly. Tests isolate and document the correction instead of changing the coherent Chang–Cui core.

### Three-torus

For the genus-three diagram in Chang–Wang–Zhai, all lower totals are \(R=+1\), all upper totals are \(R=-1\), and the lower-order antipode powers are

```text
p: 1, 2, 2, 1
q: 1, 1, 2, 2
r: 1, 3, 2, 2
```

The upper orders are

```text
mu1: p1, r4, p3, r2
mu2: q1, p2, q3, p4
mu3: r1, q2, r3, q4
```

The exact sparse contraction is zero for \(T_3\), agreeing with the independent published-formula regression.

## 6. What is and is not claimed

The program evaluates a finite prepared network faithfully once its numeric table and crossing orders are correct. It does not prove that an arbitrary drawing is a valid Heegaard diagram, derive a phase-front table from an image, or certify that two inputs describe the same combed three-manifold. Those are separate geometric preprocessing problems.
