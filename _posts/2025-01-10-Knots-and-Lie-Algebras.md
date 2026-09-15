---
title: "Knots and Lie Algebras: Why Are They Related?"
layout: post
date: 2025-01-10 04:58:00 +0800
permalink: /blog/math/Knots-and-Lie-Algebras
description: "How crossing changes lead to chord diagrams, and why their relations are the identities of Lie algebras."
tags:
- topology
- Lie algebras
- finite type invariants
categories: Math
related_note: /notes/finite-type-invariants/
---

*Adapted from [my Zhihu answer](https://www.zhihu.com/question/293415543/answer/75742755445), first published on 10 January 2025.*

*The illustrations are screenshots from my [undergraduate thesis]({{ '/assets/notes/finite-type-invariants.pdf' | relative_url }}).*

**Previous:** [What is a finite type invariant?]({{ '/blog/math/What-Is-Finite-Type-Invariants' | relative_url }})

A knot can look like a tangled piece of string. A Lie algebra, by contrast, is a vector space with a bilinear operation satisfying a few precise identities. Why should one tell us anything about the other?

The connection becomes visible when we study **finite type invariants**. Crossing changes lead to diagrams, and the relations between those diagrams turn out to encode antisymmetry, the Jacobi identity, and the definition of a representation. Let us follow that route.

## 1. Polynomials on the space of knots

Take a numerical invariant $$v$$ of oriented knots in $$\mathbb R^3$$. At a transverse double point, extend it by

$$
v(K_\times)=v(K_+)-v(K_-).
$$

The three knots agree outside a small ball; inside it, they have a double point, a positive crossing, or a negative crossing.

![The Vassiliev skein relation: a double point is evaluated as a positive crossing minus a negative crossing.]({{ '/assets/images/knots-and-lie-algebras/skein.png' | relative_url }})

The crossing convention is illustrated by the writhe formula below: positive crossings contribute +1 and negative crossings contribute −1.

![The writhe is the number of positive crossings minus the number of negative crossings.]({{ '/assets/images/knots-and-lie-algebras/crossing-signs.png' | relative_url }})

This difference plays the role of a derivative. Repeating it extends $$v$$ to singular knots with any number of transverse double points. The order in which we resolve the double points does not matter.

![Two examples of singular knots with two double points.]({{ '/assets/images/knots-and-lie-algebras/singular-knot.png' | relative_url }})

An invariant is of **type at most $$n$$** if its extension vanishes on every singular knot with $$n+1$$ double points. Explicitly, if the double points of $$K$$ are numbered from $$1$$ to $$n+1$$, then

$$
v(K)=
\sum_{\varepsilon\in\{+,-\}^{n+1}}
(-1)^{\#\{i:\varepsilon_i=-\}}v(K_\varepsilon)=0.
$$

There are $$2^{n+1}$$ resolutions in this sum. This is the analogue of a polynomial having all derivatives of sufficiently high order equal to zero.

The analogy is more than a convenient name. For example, after substituting $$q=e^h$$ into the Jones polynomial, the coefficients of the resulting formal power series are finite type invariants. The Conway and Alexander polynomials also supply finite type invariants through their coefficients or suitable expansions. We take coefficients here: an entire polynomial invariant is not itself a finite type invariant merely because its values happen to be polynomials.

This suggests a question reminiscent of polynomial approximation:

> Can finite type invariants distinguish every pair of distinct knots?

There is no topology or convergence statement built into this question. The immediate issue is simply whether, for any two distinct knots, some finite type invariant takes different values on them.

## 2. The highest derivative remembers a chord diagram

An $$n$$-singular knot determines a **chord diagram**. Travel once around its oriented parameter circle and mark the two preimages of each double point. Join each such pair by a chord. The circle is often called the *skeleton* or *Wilson loop*.

![Five degree-three chord diagrams, with solid oriented circles and dashed chords.]({{ '/assets/images/knots-and-lie-algebras/chord-diagrams.png' | relative_url }})

The diagram forgets much of the embedding in three-dimensional space. Why is it sufficient for a finite type invariant?

Suppose $$v$$ has type at most $$n$$. Changing one ordinary crossing of an $$n$$-singular knot changes its value by its value on an $$(n+1)$$-singular knot:

$$
v(K_+)-v(K_-)=v(K_\times)=0.
$$

Any two realizations of the same chord diagram can be connected by isotopies and such crossing changes. Thus the value of the top derivative depends only on the chord diagram. We obtain a function $$w_v$$ on diagrams with $$n$$ chords.

These functions are constrained by local relations. The **four-term relation**, or **4T**, comes from moving strands past a double point and comparing the resulting crossing differences:

![The four local chord diagrams in the four-term relation, with alternating signs.]({{ '/assets/images/knots-and-lie-algebras/four-term.png' | relative_url }})

For ordinary, unframed knots there is also **1T**: a diagram with a chord whose endpoints are adjacent on the skeleton has weight zero. This reflects the first Reidemeister move. Together with 4T, it also kills any chord that does not interlace with the others, as illustrated below.

![A noninterlacing chord corresponds to a singular knot whose two resolutions are isotopic, so their difference vanishes.]({{ '/assets/images/knots-and-lie-algebras/one-term.png' | relative_url }})

Let $$\mathcal V_n$$ be the space of invariants of type at most $$n$$, and let $$\mathcal A_n$$ be the vector space spanned by degree-$$n$$ chord diagrams, modulo 4T and 1T. A **weight system** is a linear functional on this quotient. The precise map is

$$
\mathcal V_n/\mathcal V_{n-1}
\longrightarrow
\mathcal A_n^*,
\qquad [v]\longmapsto w_v.
$$

It is injective: a vanishing top derivative means that the invariant already has type at most $$n-1$$. The quotient matters, just as the leading coefficient of a polynomial cannot recover all its lower-degree terms. There are only finitely many chord diagrams in each degree, so each successive space of finite type invariants is finite-dimensional.

### Can a weight system be integrated?

The difficult direction is the converse. Over a field of characteristic zero, the fundamental theorem of finite type invariants says that every weight system is the top derivative of a finite type invariant. The map above is therefore an isomorphism.

Kontsevich proved this by constructing a universal invariant with values in a completed space of diagrams. Its integral formula already hints at how much geometry is involved:

![Kontsevich's integral as a sum over pairings and ordered heights, integrating products of logarithmic differentials.]({{ '/assets/images/knots-and-lie-algebras/kontsevich-integral.png' | relative_url }})

*Equation (3.42) from Section 3.2.1 of my thesis, written for a Morse tangle $$T$$ as $$I(T)$$. The knot invariant $$Z$$ is obtained after normalization.*

Very roughly, choose a height function on a knot, pair points lying at the same height, and attach a chord to each pair. Integrating products of logarithmic differentials over ordered heights produces diagram-valued coefficients. A suitable normalization gives the knot invariant usually denoted by $$Z$$.

One source of this construction is the Knizhnik–Zamolodchikov connection. Braids arise as loops in a configuration space of points, and the holonomy of a flat connection gives a representation of its fundamental group. The passage from that construction to knots requires further work, but it explains why a flat connection and iterated integrals appear here.

Universality means that every finite type invariant can be recovered by a linear evaluation of finitely many degrees of $$Z$$. Consequently, asking whether finite type invariants distinguish knots is equivalent to asking whether $$Z$$ does.

## 3. From chord diagrams to Jacobi diagrams

Chord diagrams can be enlarged to **Jacobi diagrams**. Keep the oriented skeleton, but allow the graph attached to it to have internal trivalent vertices. Its univalent vertices lie on the skeleton, and each trivalent vertex carries a cyclic ordering of its three incident half-edges. We require every connected component of the attached graph to meet the skeleton. We draw the skeleton with solid lines and the attached graph with dashed lines. The degree is half the total number of univalent and trivalent vertices of the dashed graph; for a chord diagram, this is its number of chords.

![Three Jacobi diagrams from the thesis, labelled Primitive, Prime, and Not Prime.]({{ '/assets/images/knots-and-lie-algebras/jacobi-diagrams.png' | relative_url }})

The key relation near the skeleton is **STU**:

![The STU relation: a trivalent vertex meeting the skeleton equals the difference of the two orders of attachment.]({{ '/assets/images/knots-and-lie-algebras/stu.png' | relative_url }})

It replaces a bracket-shaped vertex next to the skeleton by a difference between two orders of attachment. Repeatedly applying it expresses Jacobi diagrams as combinations of chord diagrams. Applying it in two ways also produces 4T:

![Applying STU twice gives the four-term relation.]({{ '/assets/images/knots-and-lie-algebras/stu-to-four-term.png' | relative_url }})

Two more familiar-looking relations appear at internal vertices:

- **AS:** reversing the cyclic order at a trivalent vertex changes the sign.
- **IHX:** three local ways to connect four external half-edges satisfy an alternating relation.

![Antisymmetry reverses a trivalent vertex's cyclic order and changes the sign.]({{ '/assets/images/knots-and-lie-algebras/antisymmetry.png' | relative_url }})

![The I, H, and X configurations in the IHX relation.]({{ '/assets/images/knots-and-lie-algebras/ihx.png' | relative_url }})

Jacobi diagrams on the skeleton, modulo AS, IHX, and STU, give the same diagram space as chord diagrams modulo 4T. For unframed knots, we impose the framing-independence relation as well. If instead we remove the skeleton and leave free legs, requiring every connected component to have at least one leg, AS and IHX define another presentation related by the diagrammatic PBW symmetrization map. This map averages over ways of attaching the legs to the circle. The unframed version is obtained by transporting the framing-independence quotient through this map.

So far, we have replaced a problem about knots by one about graphs and relations. Now comes the reason that this replacement is so useful.

## 4. The relations are Lie algebra identities

A Lie algebra is a vector space $$\mathfrak g$$ with a bilinear bracket satisfying

$$
[x,y]=-[y,x]
$$

and the Jacobi identity

$$
[x,[y,z]]+[y,[z,x]]+[z,[x,y]]=0.
$$

For instance, in a matrix Lie algebra the bracket is $$[x,y]=xy-yx$$. A representation on a vector space $$U$$ is a linear map $$\rho:\mathfrak g\to\operatorname{End}(U)$$ satisfying

$$
\rho([x,y])=\rho(x)\rho(y)-\rho(y)\rho(x).
$$

Think of a trivalent vertex as a bracket with two inputs and one output. Reversing the inputs gives antisymmetry, as in the AS diagram above. Composing two brackets gives the Jacobi identity, which has precisely the shape of the IHX diagram. Likewise, the representation identity has the form of STU: a bracket acting on a vector equals the difference of the two possible orders of action.

| Diagram relation | Algebraic identity |
| --- | --- |
| AS | Antisymmetry of the bracket |
| IHX | The Jacobi identity |
| STU | The representation respects the bracket |

### Turning a diagram into a number

To evaluate a diagram without choosing an input and output at every internal vertex, equip a finite-dimensional complex Lie algebra $$\mathfrak g$$ with a nondegenerate, symmetric, invariant bilinear form $$B$$. Invariance means

$$
B([x,y],z)=B(x,[y,z]).
$$

For a semisimple Lie algebra, the Killing form is an example. This is a bilinear form, with no requirement of positive definiteness.

The form identifies $$\mathfrak g$$ with $$\mathfrak g^*$$ and turns the bracket into a three-tensor

$$
f(x,y,z)=B([x,y],z),
\qquad
f\in(\mathfrak g^*)^{\otimes3}.
$$

The representation supplies the tensor attached to a vertex on the skeleton:

$$
\rho\in\mathfrak g^*\otimes U^*\otimes U.
$$

The orientation of the skeleton distinguishes the incoming and outgoing $$U$$-indices.

Now cut a diagram into these elementary pieces:

1. Place $$f$$ at every internal trivalent vertex, using its cyclic ordering.
2. Place $$\rho$$ at every attachment to the skeleton.
3. Along each dashed edge, contract the two $$\mathfrak g^*$$-indices using the inverse form $$B^{-1}$$.
4. Along the skeleton, contract the $$U$$- and $$U^*$$-indices. Closing the circle takes a trace.

All indices are contracted, so the result is a scalar $$W_{\mathfrak g,B,\rho}(D)$$. For example, consider the diagram with one internal vertex and three legs attached to the circle:

![A Jacobi diagram with one internal trivalent vertex and three legs attached to the circle.]({{ '/assets/images/knots-and-lie-algebras/example-diagram.png' | relative_url }})

Choose a $$B$$-orthonormal basis $$\{e_a\}$$ and put $$f_{abc}=B([e_a,e_b],e_c)$$. With compatible cyclic order and orientation conventions, its evaluation has the form

$$
W(D)=\sum_{a,b,c}
f_{abc}\operatorname{tr}_U\bigl(\rho(e_a)\rho(e_b)\rho(e_c)\bigr).
$$

Writing $$\rho(e_a)^i{}_j$$ for matrix entries makes the contractions explicit:

$$
W(D)=\sum_{a,b,c,i,j,k}
f_{abc}\rho(e_a)^i{}_j\rho(e_b)^j{}_k\rho(e_c)^k{}_i.
$$

Every summed index occurs twice. In an arbitrary basis, inverse-metric factors perform the contractions on dashed edges.

Because the tensors satisfy antisymmetry, Jacobi, and the representation identity, this evaluation respects AS, IHX, and STU. It therefore defines a weight system for **framed** knots. To obtain invariants of ordinary knots, we apply the usual deframing correction; 1T does not hold automatically for an arbitrary Lie algebra weight system. Composing the resulting weight systems with the universal invariant produces finite type knot invariants.

This is the bridge we were looking for:

$$
\text{Lie algebra and representation}
\ \longrightarrow\ 
\text{weight systems}
\ \longrightarrow\ 
\text{finite type knot invariants}.
$$

### The connection with quantum invariants

There is another celebrated route from Lie theory to knots: quantum groups and the Reshetikhin–Turaev construction. After an exponential change of variable and compatible normalizations, the formal expansions of those quantum invariants agree with the invariants obtained from the corresponding Lie algebra weight systems and the Kontsevich integral.

This raises a second question: how much of the theory of weight systems is captured by Lie algebras? It should be kept separate from the question of whether finite type invariants distinguish knots. For example, the standard quantum invariants from semisimple Lie algebras cannot distinguish a knot from its orientation reverse, even though non-invertible knots exist. Thus, if finite type invariants distinguish all oriented knots, that standard Lie-theoretic family cannot supply all their distinguishing power. See [Kuperberg's discussion of knot invertibility](https://arxiv.org/abs/q-alg/9712048).

The striking point is already visible before these deeper questions: the local identities needed to turn diagrams into knot invariants are the same identities that define Lie algebras and their representations.

## References

- [My undergraduate thesis, Finite Type Invariants of Knots]({{ '/assets/notes/finite-type-invariants.pdf' | relative_url }}), 2024. Source of the illustrations: Chapters 1–2 and equation (3.42).
- Tomotada Ohtsuki, *Quantum Invariants: A Study of Knots, 3-Manifolds, and Their Sets*, World Scientific, 2002, especially Chapter 8.
- Dror Bar-Natan, [On the Vassiliev Knot Invariants](https://www.math.utoronto.ca/drorbn/papers/OnVassiliev/index.html), *Topology* **34** (1995), 423–472.
- Greg Kuperberg, [Detecting Knot Invertibility](https://arxiv.org/abs/q-alg/9712048), *Journal of Knot Theory and Its Ramifications* **5** (1996), 173–181.

**Previous:** [What is a finite type invariant?]({{ '/blog/math/What-Is-Finite-Type-Invariants' | relative_url }}) · **Further notes:** [Finite Type Invariants]({{ '/notes/finite-type-invariants/' | relative_url }})
