---
title: A Clever Proof of Sylow Theorems 
layout: post
post-image: /assets/images/Snake.svg.png
description:  We introduce a interesting proof of Sylow's theorem. 
tags:
- algebra
- group theory
categories: Math
---

# Introduction

One of the fundamental theorems in group theory is Lagrange's theorem: the order of a subgroup of a finite group $G$ must divide $ \|G\| $. A natural question is,

>**Q1:** conversely, if $m$ divides $\|G\|$, do we have a subgroup of order $m$?

Sylow's theorem is a partial answer to this question.

>**Sylow's first theorem** states that if $p^a$ divides $\|G\|$, then $G$ always has a subgroup of order $p^a$.

As a consequence, a finite $p$-group (the order of every group element is power of $p$) satisfies the property in **Q1**.  

# Sketch of Some "Common" Proofs

There are many ways to prove this theorem. For example, you can first prove a weaker version:

>**Cauchy:** every group have a cyclic $p$ subgroup if $p$ divides $\|G\|$.

$\newcommand{\Z}{\mathbb Z}$

**proof:** Consider the set $$\begin{align}X=\{(g_j)\in G^p:g_1g_2\cdots g_{p}=1\}\end{align}$$
 $\Z_p$ naturally acts on $X$ by permutation, and clearly the size $|X|=|G|^{p}$ is divisible by $p$. Now, consider the orbit decomposition of $X$, the length of the orbit is either $p$ or $1$(i.e. fixed points, points on the diagonal of $G^p$), thus modulo $p$, the number of fixed points must be 0 modulo $p$. Since $(1)\in X$ is one of the fixed points, there must be other $kp-1$ points $(g)$ s.t. $g^p=1$.#

Note that the theorem is true for abelian group

 $$\begin{align}    \end{align}$$  


# Let Representation Theory Enter the Game!

If we look at the above proofs of the theorem, they all heavily use the method of group actions. But a group action can be realized as a special case of representation theory: the permutation representation, namely we linearize an action on set $X$ by consider the action on linear span of $X$. One might wonder what would our representation theory in this category looks like. In fact, for a given group $G$, we can completely classify all action of $G$.

 Let's call the set $X$ that $G$ acts on a $G$-set. We can decompose $X$ into orbits $\coprod_xO_x$, in the jargon of representation theory, these are "indecomposable" or "cyclic" objects.  

# The Story Never Ends...

Let's get back to our original question **Q1**, a group that has a **normal** subgroup of all possible order by Lagrange's theorem is called a **nilpotent group**, such a group is in some sense a generalization of $p$-group. There is a famous classification theorem for finite $p$ nilpotent groups, and one of the equivalent definition of nilpotent group is that it's a direct product of all its Sylow subgroups!