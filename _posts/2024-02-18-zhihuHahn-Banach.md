---
title: test
layout: post
post-image: Euler.jpg
description: This just test
tags:
- sample
- post
- test
---

 <script type="text/javascript" id="MathJax-script" async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
</script>

# Hahn-Banach定理
我们知道Hahn-Banach定理是一族延拓定理，它最初有一个纯代数的形式，在赋范线性空间上有一个保范数的形式. 
## The shortest proof
Banach的经典证明是从子空间 $Y$ 出发, 一步步把 $Y$ 张成 $X$；另一个方法则是从控制函数 $p$ 出发，将其降到极小，证明极小元线性.

考虑带偏序关系的集合:
$$\Phi=\left\{q:q \text{ sublinear},q\leq p, q|_Y=l\right\}$$
由对任意线性序集：$\{q_j\}$, $\inf q_j\in\Phi$ 是一个下界, $\Phi$中有极小元$f$, 令
$$q_zx:=\inf_{t\geq 0}\{f(x+tz)-tfz\}$$
则对$y\in Y$, $q_y\in \Phi$, 由极小性 $q_y=f$, 即 $f(x+y)-fy=fx$. 从而任意$z\in X$, $q_z\in\Phi$, 再由极小性 $f(x+z)-fz=fx$, #. 

利用Hahn-Banach, 我们立刻得到一个Sandwich Theorem, (或者把它看成关于两个控制函数的推广)：如果 $p$ sublinear, $q$ superlinear, $p\geq q$, 则存在一个线性函数 $l$ 使得 $q\leq l\leq p$, 

## Geometric Form

第一个是著名的Mazur's theorem: 
