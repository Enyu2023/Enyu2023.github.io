---
title: Hahn–Banach 定理
layout: post
post-image: /assets/images/me.jpg
description: 从极小次线性函数出发，证明延拓定理，并讨论保范数延拓、夹逼与凸集分离。
tags:
- functional analysis
categories: Math
lang: zh-CN
---

Hahn–Banach 定理是一族延拓定理：先有一个只定义在子空间上的线性泛函，希望把它延拓到整个空间，同时保留一个控制不等式。在赋范空间中，这个控制条件就是范数。

下面先讨论纯代数的实数版本，再转到保范数延拓和几何分离。整个证明不要求空间完备。

## 1. 代数形式

设 $$X$$ 是实向量空间。函数 $$p:X\to\mathbb R$$ 称为**次线性函数**，如果

$$
p(x+y)\leq p(x)+p(y),\qquad
p(tx)=tp(x)\quad(t\geq 0).
$$

这里不要求 $$p$$ 非负。由定义总有 $$p(0)=0$$ 和 $$-p(-x)\leq p(x)$$。

**Hahn–Banach 定理。** 设 $$Y\subset X$$ 是线性子空间，$$l:Y\to\mathbb R$$ 是线性的，且 $$l(y)\leq p(y)$$ 对所有 $$y\in Y$$ 成立。那么存在一个线性泛函 $$L:X\to\mathbb R$$，满足

$$
L\vert_Y=l,\qquad L(x)\leq p(x)\quad(x\in X).
$$

Banach 的经典证明逐步扩大 $$l$$ 的定义域。另一种思路是从控制函数出发，把一个次线性函数降到极小，再证明极小性迫使它线性。

## 2. 极小次线性函数的证明

这个思路与 Gerard Buskes 的综述 *The Hahn–Banach Theorem surveyed*（1993）第 5 节讨论的简短证明相对应：用 Zorn 引理选取极小的次线性控制函数，再由极小性得到线性。下面把候选集合非空、链的下界和最后的线性验证都写出来。

### 2.1. 先证明候选集合非空

考虑按逐点大小排序的集合

$$
\Phi=\{q:X\to\mathbb R:
q\text{ 次线性},\ q\leq p,\ q\vert_Y=l\}.
$$

不能直接假设 $$p\in\Phi$$，因为 $$p$$ 在 $$Y$$ 上未必等于 $$l$$。定义

$$
q_0(x)=\inf_{y\in Y}\bigl(p(x+y)-l(y)\bigr).
$$

这个下确界是有限的。事实上，

$$
l(y)\leq p(y)\leq p(x+y)+p(-x),
$$

所以 $$q_0(x)\geq-p(-x)$$；取 $$y=0$$ 又得 $$q_0(x)\leq p(x)$$。

由 $$Y$$ 是子空间以及 $$l$$ 线性，直接换元可得 $$q_0$$ 正齐次。分别为 $$x_1,x_2$$ 取逼近下确界的 $$y_1,y_2$$，再利用 $$p$$ 的次可加性，就得到 $$q_0(x_1+x_2)\leq q_0(x_1)+q_0(x_2)$$。

若 $$x\in Y$$，则 $$p(x+y)-l(y)\geq l(x)$$，而取 $$y=-x$$ 得等号。因此 $$q_0\vert_Y=l$$，所以 $$\Phi\neq\varnothing$$。

### 2.2. 每条链都有下界

设 $$\{q_j\}$$ 是 $$\Phi$$ 中的一条链，令 $$q(x)=\inf_j q_j(x)$$。对每个 $$j$$，

$$
-p(-x)\leq-q_j(-x)\leq q_j(x)\leq p(x),
$$

故 $$q$$ 仍是实值函数。它的正齐次性和在 $$Y$$ 上的取值都立即成立。

次可加性用到了“链”：给定 $$x_1,x_2$$ 和 $$\varepsilon>0$$，先分别选取近似实现两个下确界的元素，再取这两个元素中较小的一个 $$q_j$$。于是

$$
q(x_1+x_2)
\leq q_j(x_1+x_2)
\leq q_j(x_1)+q_j(x_2)
\leq q(x_1)+q(x_2)+2\varepsilon.
$$

令 $$\varepsilon\to0$$，得到 $$q\in\Phi$$。对逆序使用 Zorn 引理，$$\Phi$$ 中存在极小元 $$f$$。

### 2.3. 极小性迫使线性

固定任意 $$z\in X$$，定义

$$
q_z(x)=\inf_{t\geq0}\bigl(f(x+tz)-tf(z)\bigr).
$$

由

$$
tf(z)=f(tz)\leq f(x+tz)+f(-x)
$$

可知 $$q_z(x)\geq-f(-x)$$；取 $$t=0$$ 可知 $$q_z\leq f$$。对正齐次性作换元，对次可加性把两个参数相加，就得到 $$q_z$$ 次线性。

还要检查它保留 $$l$$。因为 $$f\vert_Y=l$$ 且 $$l$$ 线性，次可加性同时给出

$$
f(x+y)\leq f(x)+l(y),\qquad
f(x)\leq f(x+y)-l(y),
$$

所以 $$f(x+y)=f(x)+l(y)$$。于是对 $$y\in Y$$，

$$
q_z(y)=\inf_{t\geq0}\bigl(l(y)+tf(z)-tf(z)\bigr)=l(y).
$$

因此 $$q_z\in\Phi$$。由极小性，$$q_z=f$$。在 $$x=-z$$ 处取 $$t=1$$，得到

$$
f(-z)=q_z(-z)\leq-f(z).
$$

而次可加性给出相反的不等式，故 $$f(-z)=-f(z)$$。次线性函数一旦是奇函数，就必定可加：除了原来的上界，还有

$$
f(x)\leq f(x+y)+f(-y)=f(x+y)-f(y).
$$

所以 $$f(x+y)=f(x)+f(y)$$。结合正齐次性和奇性，$$f$$ 是实线性的，这就是所求的延拓。$$\square$$

## 3. 保范数延拓

设 $$X$$ 是实赋范空间，$$l:Y\to\mathbb R$$ 有界。取

$$
p(x)=\lVert l\rVert\,\lVert x\rVert.
$$

代数形式给出 $$L\leq p$$。再把 $$x$$ 换成 $$-x$$，便有

$$
\vert L(x)\vert\leq\lVert l\rVert\,\lVert x\rVert.
$$

因此 $$\lVert L\rVert\leq\lVert l\rVert$$；由于 $$L$$ 延拓 $$l$$，反向不等式也成立。即

$$
\boxed{\lVert L\rVert=\lVert l\rVert.}
$$

### 复数情形

设 $$l:Y\to\mathbb C$$ 是复线性的。把 $$X,Y$$ 看成实向量空间，先延拓 $$\operatorname{Re}l$$，得到实线性泛函 $$g$$，且 $$\lVert g\rVert=\lVert\operatorname{Re}l\rVert\leq\lVert l\rVert$$。定义

$$
L(x)=g(x)-i\,g(ix).
$$

容易验证 $$L(ix)=iL(x)$$，且 $$L\vert_Y=l$$。为了估计范数，给定 $$x$$，选一个模为一的 $$\lambda\in\mathbb C$$，使 $$\lambda L(x)=\vert L(x)\vert$$。于是

$$
\vert L(x)\vert=\operatorname{Re}L(\lambda x)
=g(\lambda x)\leq\lVert l\rVert\,\lVert x\rVert.
$$

仍然得到保范数延拓。

一个常用推论是：对每个非零 $$x\in X$$，存在 $$f\in X^*$$，使

$$
\lVert f\rVert=1,\qquad f(x)=\lVert x\rVert.
$$

只需先在 $$\operatorname{span}\{x\}$$ 上定义 $$f(\lambda x)=\lambda\lVert x\rVert$$，再延拓即可。因此连续线性泛函足以区分赋范空间中的不同点。

## 4. Sandwich theorem

控制条件也可以同时有上下两边。设 $$p:X\to\mathbb R$$ 次线性，$$q:X\to\mathbb R$$ **超线性**，即正齐次且满足 $$q(x+y)\geq q(x)+q(y)$$。如果 $$q\leq p$$，那么存在实线性泛函 $$L$$ 满足

$$
q\leq L\leq p.
$$

证明仍然使用下确界构造：

$$
s(x)=\inf_{y\in X}\bigl(p(x+y)-q(y)\bigr).
$$

由 $$q(y)\leq p(y)\leq p(x+y)+p(-x)$$，有 $$-p(-x)\leq s(x)\leq p(x)$$。正齐次性直接成立，而 $$p$$ 次可加、$$q$$ 超可加共同给出 $$s$$ 次可加。

从零子空间出发，对 $$s$$ 应用 Hahn–Banach，得到线性泛函 $$L\leq s\leq p$$。最后，在定义 $$s(-x)$$ 时取 $$y=x$$，得到

$$
s(-x)\leq-q(x),\qquad
L(x)=-L(-x)\geq-s(-x)\geq q(x).
$$

这便完成了夹逼。$$\square$$

## 5. Mazur 的几何形式：用超平面分离凸集

下面 $$X$$ 是实赋范空间。复赋范空间的几何分离可对其底层实空间进行。

### 5.1. 从点与开凸集的分离出发

**分离定理。** 设 $$C\subset X$$ 是非空开凸集，$$x_0\notin C$$。则存在非零连续线性泛函 $$f$$，使

$$
f(c)<f(x_0)\qquad(c\in C).
$$

证明的桥梁是 **Minkowski 泛函**。选 $$c_0\in C$$，令 $$U=C-c_0$$。则 $$U$$ 是包含零点的开凸集，定义

$$
p_U(x)=\inf\{t>0:x\in tU\}.
$$

因为 $$U$$ 包含某个零点邻域，$$p_U$$ 处处有限；凸性给出次可加性，换元给出正齐次性。又有

$$
U=\{x:p_U(x)<1\}.
$$

例如，若 $$x\in U$$，由开性可沿射线稍稍向外移动，所以 $$x\in tU$$ 对某个 $$t<1$$ 成立；反方向则由凸性和 $$0\in U$$ 得到。

令 $$z=x_0-c_0$$，则 $$p_U(z)\geq1$$。在直线 $$\mathbb Rz$$ 上定义 $$l(tz)=tp_U(z)$$。正的 $$t$$ 时它与 $$p_U$$ 相等，负的 $$t$$ 时由 $$-p_U(z)\leq p_U(-z)$$ 知 $$l\leq p_U$$。

Hahn–Banach 给出延拓 $$f\leq p_U$$。若 $$B(0,r)\subset U$$，则 $$p_U(x)\leq\lVert x\rVert/r$$，从而 $$\vert f(x)\vert\leq\lVert x\rVert/r$$，所以 $$f$$ 连续。对 $$c\in C$$，

$$
f(c)-f(c_0)\leq p_U(c-c_0)<1
\leq p_U(z)=f(x_0)-f(c_0).
$$

且 $$f(z)\geq1$$，保证了 $$f\neq0$$。$$\square$$

这里对每个 $$c$$ 都是严格不等式，但在 $$x_0$$ 位于边界时，未必存在统一的正间隔。

如果 $$C$$ 是**闭凸集**而 $$x_0\notin C$$，取 $$0<r<\operatorname{dist}(x_0,C)$$，对开凸集 $$C+B(0,r)$$ 应用上面的结论。再对球中的向量取上确界，得到

$$
\sup_{c\in C}f(c)+r\lVert f\rVert\leq f(x_0),
$$

于是有真正的严格分离：

$$
\sup_{c\in C}f(c)<f(x_0).
$$

类似地，若两个非空凸集 $$A,B$$ 不交，且 $$A$$ 是开的，对 $$A-B$$ 与零点分离，就得到 $$f(a)<f(b)$$ 对所有 $$a\in A,b\in B$$ 成立。

### 5.2. Mazur 的几何 Hahn–Banach 定理

现在可以得到凸集与仿射子空间的分离形式，这也是 Buskes 综述第 8 节讨论的几何定理。

**Mazur 的几何分离定理。** 设 $$C\subset X$$ 是凸集，且 $$\operatorname{int}C\neq\varnothing$$。设 $$V=a+Y$$ 是仿射子空间，其中 $$Y$$ 是线性子空间，且 $$V\cap\operatorname{int}C=\varnothing$$。则存在非零连续线性泛函 $$f$$ 和实数 $$\alpha$$，使

$$
f(v)=\alpha\quad(v\in V),\qquad
f(c)<\alpha\quad(c\in\operatorname{int}C).
$$

因此闭超平面 $$H=\{x:f(x)=\alpha\}$$ 包含 $$V$$，并且不与 $$C$$ 的内部相交。

**证明。** 集合 $$D=\operatorname{int}C-V$$ 是非空开凸集，且 $$0\notin D$$。应用上面的点与开凸集分离定理，得到非零连续线性泛函 $$f$$，满足

$$
f(c)<f(v)\qquad(c\in\operatorname{int}C,\ v\in V).
$$

固定一个 $$c\in\operatorname{int}C$$。对任意 $$y\in Y$$ 和 $$t\in\mathbb R$$，都有 $$a+ty\in V$$，所以

$$
f(c)<f(a)+tf(y).
$$

若 $$f(y)\neq0$$，适当令 $$t\to+\infty$$ 或 $$t\to-\infty$$ 就会矛盾。因此 $$f\vert_Y=0$$，从而 $$f$$ 在 $$V$$ 上恒等于 $$\alpha=f(a)$$。这就给出了所需的超平面。$$\square$$

## 6. 应用：Mazur 引理与弱收敛

另一个常以 Mazur 命名的结论涉及弱收敛序列的凸组合。它是凸集分离的应用，与上一节的几何分离定理有不同的表述和用途。

**Mazur 引理。** 若 $$x_n\rightharpoonup x$$ 弱收敛，则对每个 $$N$$，可以从尾部 $$x_N,x_{N+1},\ldots$$ 中选有限个向量作凸组合 $$y_N$$，使 $$y_N\to x$$ 在范数下收敛。

令

$$
C_N=\overline{\operatorname{conv}\{x_n:n\geq N\}}^{\,\lVert\cdot\rVert}.
$$

如果 $$x\notin C_N$$，闭凸集分离给出连续线性泛函 $$f$$，使

$$
\sup_{z\in C_N}f(z)<f(x).
$$

但对所有 $$n\geq N$$，$$x_n\in C_N$$，这与 $$f(x_n)\to f(x)$$ 矛盾。因此 $$x\in C_N$$。

由闭包的定义，存在有限凸组合

$$
y_N=\sum_{j=N}^{m_N}\lambda_{N,j}x_j,\qquad
\lambda_{N,j}\geq0,\qquad
\sum_{j=N}^{m_N}\lambda_{N,j}=1,
$$

使 $$\lVert y_N-x\rVert<1/N$$，结论得证。

这并不是说原序列本身范数收敛。例如 $$\ell^2$$ 的标准基 $$e_n$$ 弱收敛到零，但范数恒为一；其平均

$$
\frac1N\sum_{j=1}^N e_j
$$

的范数却是 $$N^{-1/2}$$。凸组合正是把弱收敛转化为强收敛的关键。

## 参考与延伸阅读

- Gerard Buskes，[*The Hahn–Banach Theorem surveyed*](https://home.agh.edu.pl/~rudol/Paradoxes/Hahn_Banach%20%28Dissert.M%29.pdf)，*Dissertationes Mathematicae* 327（1993）。第 5 节讨论极小次线性函数的证明与夹逼定理，第 8 节讨论 Mazur 的几何形式；全文还比较了其他证明方法。
- [MIT 18.102：Zorn 引理与 Hahn–Banach 定理](https://ocw.mit.edu/courses/18-102-introduction-to-functional-analysis-spring-2021/resources/mit18_102s21_lec5/)，可对照经典的逐步延拓证明。
- [Michael Crandall 的分析讲义，第 8 节](https://web.math.ucsb.edu/~crandall/math201b/201b.pdf)，讨论次线性函数、Mazur–Orlicz 引理和延拓定理。
- [Stephen Simons：Hahn–Banach 定理及其应用](https://web.math.ucsb.edu/~simons/preprints/HBT.pdf)，包含更一般的夹逼形式。
