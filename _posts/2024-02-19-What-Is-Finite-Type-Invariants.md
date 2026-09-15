---
title: What is a finite type invariant?
layout: post
post-image: /assets/images/ThreeFoldKnot.jpg
description: From crossing changes and discrete derivatives to chord diagrams, weight systems, and the fundamental theorem of finite type invariants.
tags:
- topology
- knot theory
categories: Math
related_note: /notes/finite-type-invariants/
---

Finite type invariants are often described as **polynomials on the space of knots**. This is a useful description, but it raises a question: what does differentiation mean when the input is a knot?

The answer is to take differences across crossing changes. Repeating this operation leads to singular knots, and the highest nonzero derivative forgets most of the geometry of the knot. What remains is a chord diagram. The fundamental theorem says that the linear relations between these diagrams capture exactly the leading terms of finite type invariants.

Throughout, knots are oriented and unframed, and invariants take values in a field $$\mathbb F$$ of characteristic zero, such as $$\mathbb Q$$.

## 1. Discrete calculus

For a function on the integers, differentiation can be replaced by a finite difference:

$$
\Delta f(m)=f(m+1)-f(m).
$$

For example, if $$f(m)=m^2$$, then

$$
\Delta f(m)=2m+1,\qquad
\Delta^2 f(m)=2,\qquad
\Delta^3 f(m)=0.
$$

A polynomial of degree at most $$n$$ has vanishing differences of order $$n+1$$. On a lattice with several coordinates, we also allow mixed differences: choose an elementary move in each coordinate, then take an alternating sum over the vertices of the resulting cube.

The same idea makes sense whenever we have local moves that can be performed independently. For knots, the move is a **crossing change**. If we choose $$r$$ crossings in disjoint small neighborhoods, their changes commute, and the $$2^r$$ possible choices form the vertices of a cube. An iterated derivative is an alternating sum over those vertices.

There is no need to put coordinates on the entire space of knots. We only need a way to record these local cubes.

## 2. Singular knots record the derivatives

An **$$r$$-singular knot** is an immersed circle with exactly $$r$$ ordinary transverse double points and no other singularities. A double point records a crossing at which the over/under choice has been left unresolved.

Let $$K_\times$$ be a singular knot with one selected double point. Resolving it as a positive or negative crossing gives $$K_+$$ and $$K_-$$, with the rest of the knot unchanged. Extend an ordinary knot invariant $$v$$ to singular knots by the **Vassiliev skein relation**:

$$
v(K_\times)=v(K_+)-v(K_-).
$$

This is the derivative. It is a definition of the extension of $$v$$, rather than an additional relation that an ordinary invariant must satisfy.

For an $$r$$-singular knot $$S$$ with double points labeled by $$I=\{1,\ldots,r\}$$, let $$S_J$$ be its ordinary resolution in which precisely the points in $$J\subseteq I$$ receive negative crossings. Then

$$
v(S)=\sum_{J\subseteq I}(-1)^{\vert J\vert}v(S_J).
$$

In particular, the second derivative is

$$
v(S)=v(S_{++})-v(S_{+-})-v(S_{-+})+v(S_{--}).
$$

The order in which we resolve the double points does not matter.

**Definition.** An invariant $$v$$ is of **finite type at most $$n$$** if its extension vanishes on every $$(n+1)$$-singular knot. It has degree exactly $$n$$ if it is of type at most $$n$$ but not at most $$n-1$$.

Thus a finite type invariant has only finitely many nonzero orders of discrete derivatives. Notice the indexing: a degree-$$n$$ polynomial is detected by its $$n$$th derivative, and its $$(n+1)$$st derivative vanishes.

### The singular knot filtration

It helps to package the alternating sums in a vector space. Let $$\mathcal K$$ be the free $$\mathbb F$$-vector space with ordinary knot types as a basis. For an $$r$$-singular knot $$S$$, write

$$
\partial^r S=\sum_{J\subseteq I}(-1)^{\vert J\vert}S_J\in\mathcal K,
$$

and let $$\mathcal F_r$$ be the span of all these resolutions. There is a descending filtration

$$
\mathcal K=\mathcal F_0\supseteq\mathcal F_1\supseteq\mathcal F_2\supseteq\cdots.
$$

Indeed, resolving one point of an $$(r+1)$$-singular knot expresses its complete resolution as a difference of two resolutions of $$r$$-singular knots.

Every invariant extends linearly to $$\mathcal K$$. If $$\mathcal V_n$$ denotes the space of invariants of type at most $$n$$, the definition becomes

$$
\mathcal V_n=\{v\in\mathcal K^*:v(\mathcal F_{n+1})=0\}
\cong(\mathcal K/\mathcal F_{n+1})^*.
$$

Consequently,

$$
0=\mathcal V_{-1}\subseteq\mathcal V_0\subseteq\mathcal V_1\subseteq\cdots.
$$

The quotient $$\mathcal V_n/\mathcal V_{n-1}$$ records an invariant only up to terms of lower degree. It plays the role of the space of homogeneous polynomials of degree $$n$$.

## 3. Familiar examples and a product rule

### Coefficients of the Conway polynomial

Write the Conway polynomial as

$$
\nabla_K(z)=\sum_{j\geq0}a_j(K)z^j.
$$

Its skein relation is

$$
\nabla_{L_+}(z)-\nabla_{L_-}(z)=z\nabla_{L_0}(z),
$$

where $$L_0$$ is the oriented smoothing. We allow links in this computation because smoothing a crossing of a knot can create more than one component.

Each singular crossing therefore supplies a factor of $$z$$. On an $$r$$-singular knot the extended polynomial is divisible by $$z^r$$, so its coefficient of $$z^j$$ vanishes whenever $$r>j$$. Thus **$$a_j$$ is of type at most $$j$$**.

In particular, $$a_2$$ is a nonconstant invariant of degree two: it is zero on the unknot and one on a trefoil, whose Conway polynomial is $$1+z^2$$.

### Coefficients of the Jones polynomial

There is a similar statement after expanding the Jones polynomial around $$t=1$$:

$$
J_K(e^h)=\sum_{j\geq0}v_j(K)h^j.
$$

The Jones skein relation expresses the difference at a crossing using coefficients that vanish at $$h=0$$. Applying it at successive singular crossings shows inductively that the extended series on an $$r$$-singular knot is divisible by $$h^r$$. Hence $$v_j$$ is of type at most $$j$$.

Here the finite type invariants are the coefficients of the expansion. The statement does not assert that the whole Jones polynomial has one finite bound on its type.

### Products behave like products of polynomials

If $$v\in\mathcal V_m$$ and $$w\in\mathcal V_n$$, then their pointwise product belongs to $$\mathcal V_{m+n}$$. At one crossing, the relevant discrete product rule is

$$
v_+w_+-v_-w_-
=v_+(w_+-w_-)+w_-(v_+-v_-).
$$

After iterating, each term distributes the derivatives between the two factors, with some factors evaluated at resolved crossings. Among $$m+n+1$$ derivatives, either more than $$m$$ land on $$v$$ or more than $$n$$ land on $$w$$. Every term therefore vanishes.

This is another reason the polynomial analogy is more than a slogan.

## 4. The top derivative is a chord diagram

Suppose $$v\in\mathcal V_n$$ and $$S$$ is an $$n$$-singular knot. Change an ordinary crossing away from its double points. The difference between the two values of $$v(S)$$ is a derivative on an $$(n+1)$$-singular knot, so it is zero.

The top derivative therefore ignores ordinary crossing changes. What information survives?

Travel around the parametrizing circle of $$S$$. Each double point has two preimages on that circle; join them by a chord. The result is a **chord diagram**: an oriented circle with an unordered collection of pairs of distinct marked points. Only their cyclic order matters. Intersections of drawn chords inside the circle do not represent additional vertices.

For example, two double points may be encountered in the cyclic order $$aabb$$ or $$abab$$. The first gives noninterlacing chords; the second gives interlacing chords.

Conversely, every chord diagram can be realized by a singular knot. Moreover, two singular knots with the same chord diagram can be connected by isotopies and crossing changes away from the marked double points: first align neighborhoods of the double points, then move the arcs connecting them. Thus the top derivative depends only on the chord diagram.

Let $$\mathcal D_n$$ be the vector space spanned by diagrams with $$n$$ chords. Choosing a singular realization gives a surjection

$$
\mathcal D_n\longrightarrow\mathcal F_n/\mathcal F_{n+1}.
$$

Different choices of realization have the same image, by the crossing-change argument. Since there are only finitely many chord diagrams of each degree, this already shows that the space of possible leading terms is finite-dimensional.

But the diagrams are not independent.

## 5. Two relations: 1T and 4T

### The one-term relation

Consider a chord whose endpoints are adjacent on the circle, so that one of the arcs between them contains no other endpoint. It can be realized by a small singular curl. Each of its two resolutions can be removed by a Reidemeister I move, so they represent the same unframed knot. Their difference is zero.

This gives the **one-term relation**, or **1T**: a diagram containing such a chord is zero. Together with 4T, this also kills any isolated chord, meaning a chord that does not interlace with any other chord.

The word *unframed* matters here. For framed knots, the two curls can have different framings, and we retain the one-chord diagram.

### The four-term relation

A second relation comes from moving a strand past a double point. Resolve the successive crossing changes in this local motion and take the alternating sum. The motion begins and ends at isotopic singular knots, so the resulting sum vanishes. Passing to chord diagrams gives the **four-term relation**, or **4T**.

<figure>
  <img src="{{ '/assets/images/finite-type-invariants-4t.png' | relative_url }}" alt="Four local chord diagrams with signs plus, minus, plus, minus; their alternating sum is the four-term relation." width="830" height="210" loading="lazy">
  <figcaption>The 4T relation: the displayed alternating sum is zero. All four diagrams agree outside these fragments.</figcaption>
</figure>

Define

$$
\mathcal A_n=\mathcal D_n/\langle 1T,4T\rangle.
$$

The realization map factors through these relations:

$$
\phi_n:\mathcal A_n\longrightarrow\mathcal F_n/\mathcal F_{n+1}.
$$

We have shown that $$\phi_n$$ is surjective. The difficult question is whether any further relations are needed.

## 6. Weight systems and the fundamental theorem

A **weight system of degree $$n$$** is a linear functional on $$\mathcal A_n$$. Equivalently, it assigns a number to each $$n$$-chord diagram and vanishes on the 1T and 4T relations. Write

$$
\mathcal W_n=\mathcal A_n^*.
$$

The top derivative of a finite type invariant gives a weight system:

$$
\operatorname{Symb}_n(v)(D)=v(\partial^n S),
$$

where $$S$$ is any singular realization of $$D$$. This is the **symbol** of $$v$$ in degree $$n$$.

If the symbol is zero, then $$v$$ vanishes on every $$n$$-singular knot, which is exactly the statement that $$v\in\mathcal V_{n-1}$$. We therefore obtain an injective map

$$
\mathcal V_n/\mathcal V_{n-1}\hookrightarrow\mathcal W_n.
$$

This is the elementary half of the theory: differentiate an invariant and obtain combinatorial data satisfying 1T and 4T.

**Fundamental theorem of finite type invariants.** Over a field of characteristic zero, this map is an isomorphism:

$$
\boxed{\mathcal V_n/\mathcal V_{n-1}\cong\mathcal W_n.}
$$

Equivalently, $$\phi_n$$ is an isomorphism. There are no further relations in the associated graded space of singular knots beyond 1T and 4T.

The hard direction says that **every weight system can be integrated to a finite type invariant**. The resulting invariant is determined only up to lower-degree terms. This is analogous to recovering a polynomial from its highest derivative: integration leaves lower-degree terms to choose.

### A universal invariant packages the integration

Set

$$
\mathcal A=\bigoplus_{n\geq0}\mathcal A_n,
\qquad
\widehat{\mathcal A}=\prod_{n\geq0}\mathcal A_n.
$$

The completion allows infinitely many homogeneous components. A **universal finite type invariant** is a filtration-preserving linear map

$$
Z:\mathcal K\longrightarrow\widehat{\mathcal A}
$$

whose leading term on an $$n$$-singular knot is its chord diagram:

$$
Z(\partial^n S)=D_S+\text{terms of degree greater than }n.
$$

For a weight system $$W\in\mathcal W_n$$, extend $$W$$ by zero on degrees other than $$n$$. Then $$W\circ Z$$ has type at most $$n$$ and symbol $$W$$. Conversely, any invariant of type at most $$n$$ factors through the truncation of $$Z$$ to degrees $$0,\ldots,n$$. To see this, integrate its top symbol, subtract, and repeat in lower degrees.

Chapter 2 sets up this theorem and proves the elementary direction. The constructions that prove the integration direction, using the Kontsevich integral and configuration space integrals, belong to the later chapters of the thesis.

### The first few degrees

The diagram description explains the small-degree calculation:

- **Degree zero.** A type-zero invariant is unchanged by crossing changes. Every knot can be unknotted by crossing changes, so it is constant.
- **Degree one.** The only one-chord diagram vanishes by 1T. There is no new invariant modulo constants.
- **Degree two.** Noninterlacing two-chord diagrams vanish by 1T, leaving at most the interlacing diagram. The nonconstant Conway coefficient $$a_2$$ shows that a new invariant really exists.

Thus

$$
\dim\mathcal V_0=1,\qquad
\dim\mathcal V_1=1,\qquad
\dim\mathcal V_2=2.
$$

Every invariant of type at most two is a linear combination of the constant invariant and $$a_2$$.

## 7. How the algebra fits together

Chapter 2 also keeps track of products, rather than treating each degree separately. On knots the product is connected sum, and on chord diagrams it is the analogous operation of cutting and joining the circles. The 4T relation makes the product of chord diagrams independent of the cutting points.

A diagram can also be split by dividing its chord set $$I$$ between two factors:

$$
\Delta(D)=\sum_{J\subseteq I}D_J\otimes D_{I\setminus J}.
$$

Here $$D_J$$ retains only the chords labeled by $$J$$; a diagram with no chords is the unit. Multiplication and this coproduct make $$\mathcal A$$ a connected graded commutative and cocommutative Hopf algebra.

Dually, the product of weight systems is

$$
(W_1W_2)(D)=\sum_{J\subseteq I}W_1(D_J)W_2(D_{I\setminus J}).
$$

It is not pointwise multiplication on individual diagrams. It is the operation corresponding to multiplying finite type invariants and taking their leading terms.

For braids, the chapter introduces horizontal chord diagrams on several vertical strands, multiplied by stacking. Their infinitesimal braid relations provide another setting in which the same diagrammatic calculus works.

## 8. Why trivalent diagrams appear next

A final change of language in Chapter 2 makes the connection with Lie algebras visible. Replace ordinary chords by graphs with univalent and trivalent vertices. The univalent vertices lie on the circle; each trivalent vertex has a cyclic order on its three incident edges. Every connected component of the graph is required to meet the circle. These are **Jacobi diagrams**, with degree equal to half the total number of graph vertices.

The **STU relation**, schematically $$S=T-U$$, resolves a trivalent vertex next to the circle into the difference of two ways of ordering adjacent attachments. Repeating this resolution expresses a Jacobi diagram as a combination of chord diagrams. The 4T relation ensures that the result does not depend on the order of resolution. This is the bracket-rise theorem:

$$
\frac{\text{chord diagrams}}{4T}
\cong
\frac{\text{Jacobi diagrams}}{STU}.
$$

This formulation first gives the framed diagram space; imposing 1T gives the unframed space used above.

STU also implies antisymmetry at a trivalent vertex and the IHX relation. These mirror the antisymmetry and Jacobi identities for a Lie bracket. Given a finite-dimensional Lie algebra with a nondegenerate invariant symmetric bilinear form, and a finite-dimensional representation, one can attach tensors to the vertices and contract along the edges. The Lie algebra identities make the diagram relations hold.

This produces framed weight systems; passing to unframed invariants requires accounting for 1T. The distinction is worth keeping in mind when moving between knot-theoretic and Lie-theoretic constructions.

That is the route from knots to Lie algebras: crossing changes lead to derivatives, top derivatives lead to diagrams, and the relations between diagrams have the form of familiar algebraic identities.

## Further reading

The detailed arguments and diagrammatic proofs are in [Chapter 2 of my undergraduate thesis]({{ '/assets/notes/finite-type-invariants.pdf' | relative_url }}#page=17), especially §§2.2–2.4. Chapters 3 and 4 construct universal finite type invariants and prove the integration direction of the fundamental theorem.

**Next:** [Knots and Lie Algebras: Why Are They Related?]({{ '/blog/math/Knots-and-Lie-Algebras' | relative_url }})
