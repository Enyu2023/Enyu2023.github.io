---
title: A Clever Proof of Sylow Theorems
layout: post
post-image: /assets/images/Snake.svg.png
description: "A proof of Sylow's theorems through group actions, permutation representations, and upper unitriangular matrices."
tags:
- algebra
- group theory
categories: Math
---

## Introduction

Lagrange's theorem says that the order of a subgroup of a finite group $$G$$ divides $$\vert G\vert$$. Is the converse true: does every divisor occur as the order of a subgroup?

Not in general. The Sylow theorems give a remarkably strong answer for prime powers. Fix a prime $$p$$ and write

$$
\vert G\vert=p^a m,\qquad p\nmid m.
$$

A **Sylow $$p$$-subgroup** means a subgroup of order $$p^a$$. The three theorems say:

1. A Sylow $$p$$-subgroup exists.
2. Every $$p$$-subgroup is contained in a Sylow $$p$$-subgroup, and all Sylow $$p$$-subgroups are conjugate.
3. Their number $$n_p$$ divides $$m$$ and satisfies $$n_p\equiv1\pmod p$$.

The proof below starts with group actions, then makes a short detour through linear algebra. The useful trick is to embed $$G$$ in a matrix group where a Sylow subgroup is easy to write down, and then bring that subgroup back to $$G$$.

## A warm-up: Cauchy's theorem

First, here is the orbit-counting idea in its simplest form. **Cauchy's theorem** states that if $$p\mid\vert G\vert$$, then $$G$$ contains an element of order $$p$$.

Consider

$$
X=\{(g_1,\ldots,g_p)\in G^p:g_1\cdots g_p=1\}.
$$

The first $$p-1$$ entries determine the last, so $$\vert X\vert=\vert G\vert^{p-1}$$ is divisible by $$p$$. Cyclically rotating the entries defines an action of $$C_p$$ on $$X$$. This works even when $$G$$ is not abelian: if $$g_1\cdots g_p=1$$, then

$$
g_2\cdots g_p g_1=g_1^{-1}(g_1\cdots g_p)g_1=1.
$$

Every orbit has size $$1$$ or $$p$$. Hence the number of fixed points is divisible by $$p$$. The fixed tuples are exactly $$(g,\ldots,g)$$ with $$g^p=1$$. One comes from the identity, so there must be a nonidentity solution too. Its order is $$p$$.

More generally, if a finite $$p$$-group $$P$$ acts on a finite set $$X$$, orbit-stabilizer shows that every orbit size is a power of $$p$$. Removing the one-point orbits leaves only multiples of $$p$$, giving the **fixed-point congruence**

$$
\vert X\vert\equiv\vert X^P\vert\pmod p,
$$

where $$X^P$$ is the set of points fixed by every element of $$P$$. In particular, an action on a set whose size is prime to $$p$$ has a fixed point.

## Group actions as representations on sets

A set equipped with a $$G$$-action is called a **$$G$$-set**. Every $$G$$-set is a disjoint union of its orbits, and every orbit is a coset space in disguise.

Indeed, for $$x\in X$$ let $$H=G_x$$ be its stabilizer. The map

$$
G/H\longrightarrow Gx,\qquad gH\longmapsto gx
$$

is a well-defined, equivariant bijection. Thus the transitive $$G$$-sets are precisely the coset spaces $$G/H$$. Moreover, $$G/H$$ and $$G/K$$ are isomorphic as $$G$$-sets exactly when $$H$$ and $$K$$ are conjugate. To see this, an equivariant bijection must send $$H$$ to some $$gK$$ and identify their stabilizers, giving $$H=gKg^{-1}$$; the converse follows from the same formula.

This resembles decomposing a representation into simpler pieces, with orbits as the indecomposable $$G$$-sets. We can also pass to an actual linear representation: put a basis vector $$e_x$$ at each point and define

$$
g\cdot e_x=e_{gx}.
$$

This is the **permutation representation** associated with the action. We will use it after one more observation about cosets.

## The descent lemma

**Lemma.** Suppose a finite group $$L$$ has a $$p$$-subgroup $$U$$ whose index $$[L:U]$$ is prime to $$p$$. Then every subgroup $$H\le L$$ has a Sylow $$p$$-subgroup.

**Proof.** Let $$H$$ act on $$L/U$$ by left multiplication. Since

$$
\vert L/U\vert=[L:U]
$$

is not divisible by $$p$$, at least one $$H$$-orbit has size prime to $$p$$. Choose a point $$\ell U$$ in such an orbit. Its stabilizer is

$$
H_{\ell U}
=\{h\in H:h\ell U=\ell U\}
=H\cap\ell U\ell^{-1}.
$$

Call this subgroup $$Q$$. It is a $$p$$-group, since it lies in the $$p$$-group $$\ell U\ell^{-1}$$. On the other hand, orbit-stabilizer gives

$$
[H:Q]=\vert H\cdot(\ell U)\vert,
$$

which is prime to $$p$$. If $$\vert H\vert=p^b r$$ with $$p\nmid r$$ and $$\vert Q\vert=p^c$$, then

$$
[H:Q]=p^{b-c}r.
$$

Its being prime to $$p$$ forces $$c=b$$. Thus $$Q$$ is a Sylow $$p$$-subgroup of $$H$$. $$\square$$

The important point is that this argument does not assume Sylow's existence theorem for $$H$$. It constructs the required subgroup as an intersection with a suitable conjugate of $$U$$.

## Let linear algebra enter the game

We now need a sufficiently large group $$L$$ for which we can find $$U$$ explicitly.

### A faithful permutation representation

Let $$N=\vert G\vert$$ and take the vector space $$\mathbb F_p[G]$$ with basis $$\{e_h:h\in G\}$$. Left multiplication gives

$$
\rho:G\longrightarrow\operatorname{GL}_N(\mathbb F_p),
\qquad \rho(g)e_h=e_{gh}.
$$

The rule respects multiplication. It is also faithful: if $$\rho(g)$$ is the identity, then $$e_g=\rho(g)e_1=e_1$$, so $$g=1$$. Consequently, we may regard $$G$$ as a subgroup of $$\operatorname{GL}_N(\mathbb F_p)$$.

### An explicit Sylow subgroup of the matrix group

An invertible matrix is an ordered basis of $$\mathbb F_p^N$$. Choosing its columns in order gives

$$
\begin{aligned}
\vert\operatorname{GL}_N(\mathbb F_p)\vert
&=\prod_{i=0}^{N-1}(p^N-p^i)\\
&=p^{N(N-1)/2}\prod_{j=1}^{N}(p^j-1).
\end{aligned}
$$

The first column can be any nonzero vector; the next must avoid its span; and the $$(i+1)$$-st must avoid the $$p^i$$ vectors in the span of the preceding columns. Since none of the factors $$p^j-1$$ is divisible by $$p$$, the largest power of $$p$$ dividing the group order is $$p^{N(N-1)/2}$$.

Now consider the **upper unitriangular group**

$$
U_N(\mathbb F_p)=
\left\{
\begin{pmatrix}
1&*&\cdots&*\\
0&1&\cdots&*\\
\vdots&\ddots&\ddots&\vdots\\
0&\cdots&0&1
\end{pmatrix}
\right\}.
$$

It is a subgroup. Multiplication preserves the displayed form; for inversion, write a matrix as $$I+A$$ with $$A$$ strictly upper triangular. Since $$A^N=0$$,

$$
(I+A)^{-1}=I-A+A^2-\cdots+(-1)^{N-1}A^{N-1}
$$

has the same form. There are $$N(N-1)/2$$ entries above the diagonal, each with $$p$$ choices, so

$$
\vert U_N(\mathbb F_p)\vert=p^{N(N-1)/2}.
$$

We have found a $$p$$-subgroup with index prime to $$p$$ by counting matrices directly. Apply the descent lemma to

$$
G\le\operatorname{GL}_N(\mathbb F_p).
$$

This proves **Sylow's first theorem**. The proof uses only a faithful permutation representation, elementary linear algebra, and orbit-stabilizer.

## Containment and conjugacy

Let $$P$$ be a Sylow $$p$$-subgroup of $$G$$, and let $$Q$$ be any $$p$$-subgroup. Make $$Q$$ act on $$G/P$$ by left multiplication. Because $$\vert G/P\vert=m$$ is prime to $$p$$, the fixed-point congruence gives a fixed coset $$gP$$.

The fixed-point condition says

$$
qgP=gP\quad\text{for every }q\in Q,
$$

or equivalently

$$
g^{-1}Qg\le P.
$$

Thus $$Q\le gPg^{-1}$$: every $$p$$-subgroup lies in a Sylow subgroup. If $$Q$$ itself is Sylow, both subgroups have order $$p^a$$, so the inclusion is an equality. This proves **Sylow's second theorem**.

## Counting Sylow subgroups

Let $$\mathcal S$$ be the set of Sylow $$p$$-subgroups. Conjugacy says that $$G$$ acts transitively on $$\mathcal S$$ by conjugation. The stabilizer of $$P$$ is its normalizer

$$
N_G(P)=\{g\in G:gPg^{-1}=P\}.
$$

Hence

$$
n_p=\vert\mathcal S\vert=[G:N_G(P)].
$$

Since $$P\le N_G(P)$$, the index formula

$$
m=[G:P]=[G:N_G(P)]\,[N_G(P):P]
$$

shows that $$n_p\mid m$$.

For the congruence, restrict the conjugation action to $$P$$. Its only fixed point in $$\mathcal S$$ is $$P$$ itself. Indeed, if $$Q\in\mathcal S$$ is fixed, then $$P$$ normalizes $$Q$$, so $$PQ$$ is a subgroup. Its order is

$$
\vert PQ\vert=\frac{\vert P\vert\,\vert Q\vert}{\vert P\cap Q\vert},
$$

a power of $$p$$. It contains $$Q$$, whose order is already the largest power of $$p$$ dividing $$\vert G\vert$$. Lagrange's theorem therefore forces $$PQ=Q$$, hence $$P=Q$$. Applying the fixed-point congruence gives

$$
n_p\equiv\vert\mathcal S^P\vert=1\pmod p.
$$

This completes **Sylow's third theorem**. In particular, a Sylow subgroup is normal exactly when it is the unique Sylow subgroup for that prime.

## The original question, revisited

What about a smaller prime power $$p^b\mid\vert G\vert$$? It suffices to work inside a Sylow subgroup $$P$$. Every finite $$p$$-group has a normal subgroup of each order $$p^b\le\vert P\vert$$. The order-$$1$$ case is immediate. For nontrivial $$P$$ and $$b\ge1$$, its center is nontrivial by the class equation, Cauchy's theorem supplies a central subgroup $$C$$ of order $$p$$, and induction on $$\vert P\vert$$ supplies a normal subgroup of $$P/C$$ of order $$p^{b-1}$$. Its inverse image is normal in $$P$$ and has order $$p^b$$. Thus all prime-power divisors do occur as subgroup orders in $$G$$, although the resulting subgroup need not be normal in $$G$$.

For general divisors, one useful stronger condition is **finite nilpotence**. A finite group is nilpotent if and only if all its Sylow subgroups are normal, equivalently if it is their direct product. In this case the normal subgroups just constructed in the individual Sylow factors combine to give a normal subgroup of every order dividing $$\vert G\vert$$. Conversely, having a normal subgroup of every such order gives a normal Sylow subgroup for each prime, so implies nilpotence.

Merely having a subgroup of every divisor order is weaker. For example, $$S_3$$ has subgroups of orders $$1,2,3,6$$, but its three Sylow $$2$$-subgroups are not normal.

## Further reading

- Qiaochu Yuan, [Meditation on the Sylow theorems I](https://qchu.wordpress.com/2020/11/01/meditation-on-the-sylow-theorems-i/), especially the subgroup descent argument and the proof using general linear groups.
- Keith Conrad, [The Sylow Theorems](https://kconrad.math.uconn.edu/blurbs/grouptheory/sylowpf.pdf), for proofs using fixed points and normalizers.
- The Math Stack Exchange discussion [Intuition behind picking group actions and Sylow](https://math.stackexchange.com/questions/4016511/intuition-behind-picking-group-actions-and-sylow), for related perspectives on choosing the actions.
