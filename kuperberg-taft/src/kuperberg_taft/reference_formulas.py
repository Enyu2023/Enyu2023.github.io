"""Separately encoded paper-formula wiring, using the shared Taft primitives."""

from __future__ import annotations

from itertools import product
from math import comb

from .cyclotomic import CyclotomicElement
from .evaluator import StateSpaceTooLarge, _multiply_word
from .taft import Basis, TaftAlgebra


def lens_l1_formula(n: int, algebra: TaftAlgebra) -> CyclotomicElement:
    """lambda(Lambda_(n)...Lambda_(1)) for Chang--Ng--Wang's f_L framing."""

    if not isinstance(n, int) or isinstance(n, bool) or n < 1:
        raise ValueError("n must be a positive integer")
    coproduct = algebra.iterated_coproduct(algebra.left_integral, n)
    total = algebra.field.zero
    for tensor_basis, coefficient in coproduct.items():
        word_basis, word_coefficient = _multiply_word(
            algebra,
            [(basis, algebra.field.one) for basis in reversed(tensor_basis)],
        )
        if word_basis is not None:
            total += coefficient * word_coefficient * algebra.cointegral_variant_basis(-1, word_basis)
    return total


def _s(algebra: TaftAlgebra, basis: Basis, exponent: int) -> tuple[Basis, CyclotomicElement]:
    return algebra.antipode_basis(basis, exponent)


def t3_theorem3_formula(
    algebra: TaftAlgebra,
    *,
    max_states: int | None = 10_000_000,
) -> CyclotomicElement:
    """Theorem 3 of Chang--Wang--Zhai, evaluated literally.

    For independent fourfold coproducts Lambda1, Lambda2, Lambda3, this uses

      lambda(S^2(L3_2) S(L1_3) S(L3_4) L1_1)
      lambda(L1_4 S(L2_3) S(L1_2) L2_1)
      lambda(S(L2_4) S(L3_3) L2_2 L3_1).
    """

    term_count = algebra.ell * comb(algebra.ell + 2, 3)
    estimated = term_count**3
    if max_states is not None and estimated > max_states:
        raise StateSpaceTooLarge(
            f"T^3 reference formula expands to {estimated:,} states, "
            f"above max_states={max_states:,}"
        )
    terms = list(algebra.iterated_coproduct(algebra.left_integral, 4).items())
    if len(terms) != term_count:
        raise AssertionError(
            f"internal fourfold coproduct count mismatch: estimated {term_count}, got {len(terms)}"
        )
    total = algebra.field.zero
    one = algebra.field.one
    for (l1, c1), (l2, c2), (l3, c3) in product(terms, repeat=3):
        state = c1 * c2 * c3
        words = (
            (_s(algebra, l3[1], 2), _s(algebra, l1[2], 1), _s(algebra, l3[3], 1), (l1[0], one)),
            ((l1[3], one), _s(algebra, l2[2], 1), _s(algebra, l1[1], 1), (l2[0], one)),
            (_s(algebra, l2[3], 1), _s(algebra, l3[2], 1), (l2[1], one), (l3[0], one)),
        )
        for word in words:
            basis, coefficient = _multiply_word(algebra, list(word))
            if basis is None:
                state = algebra.field.zero
                break
            state *= coefficient * algebra.cointegral_variant_basis(-1, basis)
        total += state
    return total
