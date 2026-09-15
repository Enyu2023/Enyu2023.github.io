---
title: Baire 纲定理与泛函分析的三大定理
layout: post
date: 2022-11-16 18:00:03 +0800
permalink: /blog/math/Baire-Category-and-Functional-Analysis
description: 从逐点有界到一致有界，从近似开映射到开映射：用 Baire 纲定理理解共鸣定理、开映射定理和闭图像定理。
tags:
- functional analysis
- topology
categories: Math
lang: zh-CN
---

共鸣定理、开映射定理和闭图像定理为什么总是与 Baire 纲定理一起出现？

一个共同的思路是：**先用 Baire 纲定理，从一族逐点成立的条件中找出一个可以一致控制的开集，再利用线性结构，把这个开集移到原点并进行伸缩。** 开映射定理还需要进一步利用完备性，把近似解变成真正的解。

这几个定理有共同的 Baire 纲定理背景。其中，开映射定理、有界逆定理和闭图像定理之间，还可以直接互推。

## 1. Baire 纲定理提供了什么？

一个集合称为**疏集**（nowhere dense set），如果它的闭包没有内点；可数个疏集的并称为**第一纲集**（meagre set）。Baire 空间是指其中每个非空开集都不是第一纲集的拓扑空间。

这可以与测度论中的“小集合”作类比，但纲与测度是不同的概念：第一纲集不等同于零测集。

**Baire 纲定理**告诉我们，完备度量空间是 Baire 空间。在泛函分析中，最常用的是下面这个形式：

> 如果一个非空 Baire 空间可以写成可数个闭集的并，那么其中至少一个闭集有非空内部。

也就是说，若

$$
X=\bigcup_{n=1}^{\infty}E_n,\qquad E_n\text{ 闭},
$$

那么存在 $$N$$，使得 $$\operatorname{int}E_N\neq\varnothing$$。

关键在于如何选取这些闭集：通常让 $$E_n$$ 表示“某个量被同一个常数 $$n$$ 控制的所有点”。逐点成立的条件保证它们覆盖整个空间；Baire 纲定理则给出一个统一的常数和一个非空开集。

## 2. 共鸣定理：从逐点有界到一致有界

### 2.1. 先不要求线性

设 $$X$$ 是非空 Baire 空间，$$Y$$ 是赋范空间，$$\mathcal F\subset C(X,Y)$$ 是一族连续映射。假设它们**逐点有界**：

$$
\forall x\in X,\qquad \sup_{f\in\mathcal F}\|f(x)\|<\infty.
$$

那么存在非空开集 $$U\subset X$$ 和常数 $$M$$，使得

$$
\sup_{f\in\mathcal F}\sup_{x\in U}\|f(x)\|\leq M.
$$

证明只需要考虑

$$
E_n=\{x\in X:\|f(x)\|\leq n\text{ 对每个 }f\in\mathcal F\text{ 都成立}\}.
$$

每个 $$E_n$$ 都是闭集，而逐点有界性给出 $$X=\bigcup_{n\geq1}E_n$$。由 Baire 纲定理，某个 $$E_N$$ 有非空内部。取 $$U=\operatorname{int}E_N$$、$$M=N$$ 即可。

这里得到的是**某个开集上的一致有界性**。对一般的连续函数族，不能直接把它扩展到整个空间。

### 2.2. 线性结构把开集移到原点

现在设 $$X$$ 是 Banach 空间，$$Y$$ 是赋范空间，$$\mathcal T\subset\mathcal L(X,Y)$$ 是一族有界线性算子。若

$$
\forall x\in X,\qquad \sup_{T\in\mathcal T}\|Tx\|<\infty,
$$

则

$$
\sup_{T\in\mathcal T}\|T\|<\infty.
$$

这就是**一致有界原理**，也称**共鸣定理**或 Banach–Steinhaus 定理。注意，这里不要求 $$Y$$ 完备。

沿用上面的 $$E_n$$，取一个开球 $$B(x_0,r)\subset E_N$$。对任意 $$\|h\|<r$$ 和 $$T\in\mathcal T$$，有

$$
\|Th\|
=\|T(x_0+h)-Tx_0\|
\leq 2N.
$$

于是整个算子族在原点的一个邻域上一致有界。再把单位向量缩放到 $$B(0,r)$$ 中，就得到

$$
\|T\|\leq \frac{2N}{r}
\qquad(T\in\mathcal T).
$$

这个证明分成两步：Baire 纲定理找到一个开球，线性性负责平移和伸缩。

## 3. 代数内部与拓扑内部

上述过程也可以用**代数内部**（core）来理解。

设 $$A$$ 是一个实或复赋范空间中的子集。这里沿实参数的方向定义

$$
\operatorname{core}A=
\left\{
a\in A:
\begin{array}{l}
\text{对每个 }v\in X,\text{ 存在 }\varepsilon>0,\\
a+tv\in A\quad\text{当 }|t|<\varepsilon
\end{array}
\right\}.
$$

从代数内点出发，沿每个方向都可以在集合里走一小段，但允许的长度可以依赖方向。拓扑内点则要求存在一个整个包含在集合中的开球，因而给出了对所有单位方向的一致控制。

显然，

$$
\operatorname{int}A\subset\operatorname{core}A.
$$

对凸集，这两个概念有如下联系。

### 3.1. 凸集有内点时，内部等于代数内部

设 $$A$$ 凸且 $$\operatorname{int}A\neq\varnothing$$。取 $$x\in\operatorname{int}A$$，以及原点的开邻域 $$U$$，使得 $$x+U\subset A$$。

给定 $$a\in\operatorname{core}A$$，沿着 $$a-x$$ 的方向稍微越过 $$a$$，可取 $$\varepsilon>0$$，使

$$
b=a+\varepsilon(a-x)\in A.
$$

由凸性，

$$
\begin{aligned}
\frac{\varepsilon}{1+\varepsilon}(x+U)
+\frac{1}{1+\varepsilon}b
&=a+\frac{\varepsilon}{1+\varepsilon}U\\
&\subset A.
\end{aligned}
$$

右边是 $$a$$ 的一个开邻域，因此 $$a\in\operatorname{int}A$$。几何上，这就是把一个已有的开球，通过平移和缩放带到任意代数内点处。

### 3.2. Banach 空间中的闭凸集

如果 $$A$$ 是 Banach 空间中的闭凸集，那么

$$
\operatorname{int}A=\operatorname{core}A.
$$

若代数内部为空，结论立即成立。否则，取 $$a\in\operatorname{core}A$$，先平移，记 $$C=A-a$$。此时 $$0\in\operatorname{core}C$$，所以 $$C$$ 是吸收集：

$$
X=\bigcup_{n=1}^{\infty}nC.
$$

这些集合都是闭集。Baire 纲定理保证某个 $$nC$$ 有非空内部，伸缩后便知 $$C$$、从而 $$A$$ 有非空内部。再用上一节的结论即可。

### 3.3. 重新看共鸣定理

对逐点有界的算子族 $$\mathcal T$$，令

$$
A=\left\{x\in X:\sup_{T\in\mathcal T}\|Tx\|\leq1\right\}.
$$

这是闭凸集。逐点有界性恰好保证 $$0\in\operatorname{core}A$$：对每个固定方向 $$x$$，只要把它缩得足够小，就能同时控制所有 $$Tx$$。

闭凸集的结论于是给出 $$0\in\operatorname{int}A$$，也就是所有算子在同一个原点邻域上一致有界。

因此，共鸣定理中的 Baire 纲定理作用在**定义域**上，把逐方向的代数信息提升为一个拓扑邻域上的一致信息。

## 4. 开映射定理：在值域上使用 Baire

**开映射定理**说：若 $$X,Y$$ 是 Banach 空间，$$T:X\to Y$$ 是有界线性满射，那么 $$T$$ 把开集映成开集。

记 $$B=B_X(0,1)$$ 为开单位球。由线性性，只需证明

$$
0\in\operatorname{int}T(B).
$$

满射性保证 $$T(B)$$ 是吸收集，因此

$$
0\in\operatorname{core}T(B).
$$

这与共鸣定理很相似：又要从代数内部得到拓扑内部。但这里有一个障碍——**即使 $$T$$ 连续，$$T(B)$$ 也未必是闭集。**

### 4.1. Baire 先给出近似的结论

集合 $$\overline{T(B)}$$ 是 $$Y$$ 中的闭凸吸收集。对值域 $$Y$$ 使用上一节的结论，得到

$$
0\in\operatorname{int}\overline{T(B)}.
$$

于是存在 $$\delta>0$$，使得

$$
B_Y(0,\delta)\subset\overline{T(B_X(0,1))}.
$$

这只说明一个小球中的点可以由单位球的像来逼近。还不能直接去掉闭包。

### 4.2. 完备性把近似解变成真正的解

取 $$\|y\|<\delta/2$$。利用上面的包含关系及伸缩性，可以选取 $$x_1$$，使

$$
\|x_1\|<\frac12,\qquad
\|y-Tx_1\|<\frac{\delta}{4}.
$$

对剩余误差重复这一过程，依次选取 $$x_n$$，满足

$$
\|x_n\|<2^{-n},\qquad
\left\|y-T\sum_{k=1}^{n}x_k\right\|
<\delta\,2^{-n-1}.
$$

因为 $$X$$ 完备，级数 $$\sum_{n\geq1}x_n$$ 收敛到某个 $$x\in X$$，且

$$
\|x\|\leq\sum_{n=1}^{\infty}\|x_n\|<1.
$$

再由 $$T$$ 连续和误差趋于零，得到 $$Tx=y$$。因此

$$
B_Y(0,\delta/2)\subset T(B_X(0,1)),
$$

从而 $$T$$ 是开映射。

两个空间的完备性在这里承担不同的工作：$$Y$$ 的完备性通过 Baire 纲定理给出近似解，$$X$$ 的完备性保证逐次修正的和确实落在定义域中。

## 5. Almost continuous 与 almost open

把这两个证明放在一起看，可以引入两个对称的概念。设 $$T:X\to Y$$ 是拓扑向量空间之间处处定义的线性映射。

- 称 $$T$$ 为 **almost continuous**，如果对 $$Y$$ 中每个原点邻域 $$V$$，都有

  $$
  0\in\operatorname{int}_X\overline{T^{-1}(V)}.
  $$

- 称 $$T$$ 为 **almost open**，如果对 $$X$$ 中每个原点邻域 $$U$$，都有

  $$
  0\in\operatorname{int}_Y\overline{T(U)}.
  $$

Baire 纲定理给出：

1. 若 $$X$$ 是 Baire 空间，那么任意这样的线性映射 $$T$$ 都是 almost continuous。
2. 若 $$Y$$ 是 Baire 空间，而且 $$T$$ 是**满射**，那么 $$T$$ 是 almost open。

这两个结论本身都不要求 $$T$$ 连续。它们只保证闭包中含有原点邻域。

例如，为证明第一条，对给定的 $$V$$ 选取更小的原点邻域 $$W$$，使 $$W-W\subset V$$。因为 $$W$$ 是吸收集，

$$
X=\bigcup_{n\geq1}nT^{-1}(W).
$$

对这些集合的闭包使用 Baire 纲定理，再进行伸缩，可得 $$\overline{T^{-1}(W)}$$ 有非空内部。取这个内部与自身的差，便得到原点的一个邻域；同时

$$
\overline{T^{-1}(W)}-\overline{T^{-1}(W)}
\subset\overline{T^{-1}(W-W)}
\subset\overline{T^{-1}(V)}.
$$

第二条完全类似，只是在值域中使用由满射性得到的覆盖

$$
Y=\bigcup_{n\geq1}nT(W).
$$

开映射定理的最后一步，正是在连续性和完备性的帮助下，去掉 almost open 中的闭包。闭图像定理则说明，在 Banach 空间之间，闭图像这个条件足以把相应的弱控制提升为真正的连续性。

## 6. 开映射、有界逆与闭图像

在 Banach 空间的范围内，下面三个定理可以直接互推：

$$
\text{开映射定理}
\quad\Longleftrightarrow\quad
\text{有界逆定理}
\quad\Longleftrightarrow\quad
\text{闭图像定理}.
$$

### 6.1. 开映射定理推出有界逆定理

若 $$T:X\to Y$$ 是有界线性双射，开映射定理说明 $$T$$ 是开映射。因此 $$T^{-1}$$ 连续，也就是有界。

### 6.2. 有界逆定理推出闭图像定理

设 $$T:X\to Y$$ 线性，且它的图

$$
\Gamma(T)=\{(x,Tx):x\in X\}
$$

在 $$X\times Y$$ 中闭。赋予乘积空间范数

$$
\|(x,y)\|=\|x\|+\|y\|.
$$

由于 $$X,Y$$ 完备，闭子空间 $$\Gamma(T)$$ 也是 Banach 空间。投影

$$
P:\Gamma(T)\longrightarrow X,\qquad (x,Tx)\longmapsto x
$$

是有界线性双射。由有界逆定理，它的逆

$$
P^{-1}:x\longmapsto(x,Tx)
$$

连续。再与第二个坐标投影复合，就得到 $$T$$ 连续。

反方向是容易的：连续映射取值于 Hausdorff 空间时，它的图总是闭的。因此，对 Banach 空间之间处处定义的线性算子，闭图像与连续性等价。

### 6.3. 闭图像定理推出有界逆定理

若 $$T:X\to Y$$ 是有界线性双射，则 $$\Gamma(T)$$ 闭。交换两个坐标，就得到

$$
\Gamma(T^{-1})=\{(Tx,x):x\in X\},
$$

它同样是闭集。对 $$T^{-1}$$ 使用闭图像定理，就知道它有界。

### 6.4. 有界逆定理推出开映射定理

设 $$T:X\to Y$$ 是有界线性满射。由于 $$\ker T$$ 闭，商空间 $$X/\ker T$$ 是 Banach 空间，而且 $$T$$ 可以分解为

$$
X\xrightarrow{\ q\ }X/\ker T
\xrightarrow{\ \widetilde T\ }Y,
\qquad
\widetilde T(x+\ker T)=Tx.
$$

商映射 $$q$$ 是开映射：若 $$U\subset X$$ 开，则

$$
q^{-1}(q(U))=U+\ker T
$$

也是开集。另一方面，$$\widetilde T$$ 是有界线性双射，由有界逆定理可知它是同胚，因而也是开映射。于是 $$T=\widetilde T\circ q$$ 是开映射。

这解释了为什么这三个定理之间的联系尤其紧密：图像、坐标投影和商空间，恰好把它们的假设相互转换。

## 7. 闭图像也是一种较弱的连续性

还有一个有意思的拓扑观点。设 $$X,Y$$ 是 Hausdorff 拓扑向量空间，$$T:X\to Y$$ 线性且处处定义。那么：

> $$\Gamma(T)$$ 闭，当且仅当可以在 $$Y$$ 上赋予一个比原拓扑更粗的 Hausdorff 向量拓扑，使得 $$T$$ 对这个拓扑连续。

这里“较弱的拓扑”并不特指通常的弱拓扑 $$\sigma(Y,Y^*)$$，而是某个较粗的 Hausdorff 拓扑。

先看容易的方向。若 $$T:X\to Y_w$$ 连续，且 $$Y_w$$ 是 Hausdorff 的，那么

$$
X\times Y\longrightarrow Y_w\times Y_w,
\qquad (x,y)\longmapsto(Tx,y)
$$

连续。$$\Gamma(T)$$ 是 $$Y_w$$ 的对角线在这个映射下的原像，而 Hausdorff 空间的对角线闭，所以 $$\Gamma(T)$$ 闭。

反过来，若 $$\Gamma(T)$$ 闭，考虑 Hausdorff 商空间

$$
Z=(X\times Y)/\Gamma(T),
$$

并记商映射为 $$Q$$。映射

$$
j:Y\longrightarrow Z,\qquad j(y)=Q(0,y)
$$

是连续线性双射：单射性由 $$(0,y)\in\Gamma(T)\Rightarrow y=0$$ 得到；满射性则来自

$$
Q(x,y)=Q(0,y-Tx)=j(y-Tx).
$$

用 $$j$$ 把 $$Z$$ 的拓扑搬到 $$Y$$ 上，得到一个较粗的 Hausdorff 向量拓扑。由于

$$
j(Tx)=Q(-x,0),
$$

$$T$$ 对这个新拓扑连续。

从这个角度看，闭图像定理所做的事情，就是在 Banach 空间的条件下，把这种较弱的连续性提升为原范数拓扑下的连续性。

## 8. 回到共同的思路

- **共鸣定理**在定义域上使用 Baire 纲定理，把逐点有界提升为一个原点邻域上的一致有界，再用伸缩得到算子范数的一致控制。
- **开映射定理**在值域上使用 Baire 纲定理，先得到像的闭包包含原点邻域，再用定义域的完备性和算子的连续性去掉闭包。
- **有界逆定理与闭图像定理**通过图像、投影和商空间与开映射定理联系起来。

因此，这些定理的共同之处，不只是证明中都引用了 Baire 纲定理。更具体地说，它们都在寻找同一种提升：从逐点、逐方向或近似的信息，得到可以在一个邻域内一致使用的结论。

## 参考

- Terence Tao, [*245B, Notes 9: The Baire category theorem and its Banach space consequences*](https://terrytao.wordpress.com/2009/02/01/245b-notes-9-the-baire-category-theorem-and-its-banach-space-consequences/).
- Lawrence Narici and Edward Beckenstein, *Topological Vector Spaces*, Chapter 14.
- John Gowers, [*The topological closed graph theorem*](https://johngowe.rs/blog/2019/10/20/the-topological-closed-graph-theorem/).
- [*Direct approach to the closed graph theorem*](https://math.stackexchange.com/questions/137673/direct-approach-to-the-closed-graph-theorem), Mathematics Stack Exchange.
