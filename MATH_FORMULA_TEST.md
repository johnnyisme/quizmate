# KaTeX 数学公式测试

测试各种常见的数学符号，确保 MathML 标签完整支持。

## 基本符号
- 根号: $\sqrt{2}$, $\sqrt[3]{8}$
- 分数: $\frac{1}{2}$
- 上下标: $x^2$, $x_i$, $x_i^2$

## 矩阵和表格
$$
\begin{matrix}
a & b \\
c & d
\end{matrix}
$$

## 积分和求和
$$
\int_0^1 x^2 dx = \sum_{i=1}^n i
$$

## 括号
$$
\left( \frac{x}{y} \right)
$$

## 上下划线
$$
\overline{x+y} \quad \underline{a+b}
$$

## 空格
$$
a \quad b \qquad c
$$

## 组合符号
$$
\binom{n}{k} = \frac{n!}{k!(n-k)!}
$$

## 需要的 MathML 标签清单：

**当前已有：**
- math, mrow, mi, mn, mo, mtext
- msup, msub, msubsup
- mfrac, msqrt, mroot
- mover, munder, munderover
- mstyle
- mspace
- mtable, mtr, mtd
- menclose, mpadded
- semantics, annotation

**可能缺少的：**
- mfenced (括号)
- mphantom (幻影元素)
- merror (错误显示)
- maction (交互)
- mlabeledtr (标记的表格行)
- maligngroup, malignmark (对齐)
- mglyph (字形)
- mlongdiv (长除法)
- mscarries, mscarry (进位)
- msgroup, msline, msrow (堆叠)
- mstack (堆叠)

**常用但可能需要添加的：**
- mfenced (围栏/括号，KaTeX 常用)
- mphantom (占位符)
