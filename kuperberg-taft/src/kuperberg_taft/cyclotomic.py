"""A small exact cyclotomic-number implementation with no runtime dependencies.

Elements are represented in Q[z]/Phi_n(z).  The Kuperberg computations in this
package actually stay in Z[z]/Phi_n(z), but rational coefficients make the type
useful for validation and future extensions.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
from math import cos, pi, sin
from typing import Iterable, Sequence

DEFAULT_MAX_CYCLOTOMIC_ORDER = 101


def _trim(poly: list[int]) -> list[int]:
    while len(poly) > 1 and poly[-1] == 0:
        poly.pop()
    return poly


def _divisors(n: int) -> list[int]:
    return [d for d in range(1, n + 1) if n % d == 0]


def _poly_div_exact(numerator: Sequence[int], denominator: Sequence[int]) -> list[int]:
    """Divide integer polynomials in ascending-coefficient order."""

    num = list(numerator)
    den = _trim(list(denominator))
    if den[-1] != 1:
        raise ValueError("exact division expects a monic denominator")
    if len(num) < len(den):
        raise ValueError("polynomial is not divisible")
    quotient = [0] * (len(num) - len(den) + 1)
    while len(num) >= len(den):
        coefficient = num[-1]
        shift = len(num) - len(den)
        quotient[shift] = coefficient
        for i, value in enumerate(den):
            num[i + shift] -= coefficient * value
        _trim(num)
    if any(num):
        raise ValueError("non-exact cyclotomic polynomial division")
    return _trim(quotient)


@lru_cache(maxsize=None)
def _cyclotomic_polynomial(n: int) -> tuple[int, ...]:
    if n < 1:
        raise ValueError("cyclotomic index must be positive")
    polynomial = [-1] + [0] * (n - 1) + [1]
    for divisor in _divisors(n):
        if divisor == n:
            continue
        polynomial = _poly_div_exact(polynomial, _cyclotomic_polynomial(divisor))
    return tuple(polynomial)


def cyclotomic_polynomial(
    n: int,
    *,
    max_n: int | None = DEFAULT_MAX_CYCLOTOMIC_ORDER,
) -> tuple[int, ...]:
    """Return Phi_n in ascending order, with an early allocation guard."""

    if not isinstance(n, int) or isinstance(n, bool) or n < 1:
        raise ValueError("cyclotomic index must be a positive integer")
    if max_n is not None:
        if not isinstance(max_n, int) or isinstance(max_n, bool) or max_n < 1:
            raise ValueError("max_n must be a positive integer or None")
        if n > max_n:
            raise ValueError(
                f"cyclotomic order {n} is above max_n={max_n}; "
                "raise max_n explicitly if this allocation is intended"
            )
    return _cyclotomic_polynomial(n)


class CyclotomicField:
    """The exact field Q(zeta_n), presented using the nth cyclotomic polynomial."""

    def __init__(
        self,
        n: int,
        *,
        max_n: int | None = DEFAULT_MAX_CYCLOTOMIC_ORDER,
    ):
        if not isinstance(n, int) or isinstance(n, bool) or n < 2:
            raise ValueError("n must be at least 2")
        self.n = n
        self.modulus = cyclotomic_polynomial(n, max_n=max_n)
        self.degree = len(self.modulus) - 1
        # Populate powers lazily.  Eagerly storing n dense phi(n)-vectors is
        # quadratic memory for prime n, even when a resource guard will reject
        # the requested state sum before it needs those powers.
        self._zeta_powers: dict[int, CyclotomicElement] = {}

    def _reduce(self, coefficients: Sequence[Fraction | int]) -> tuple[Fraction, ...]:
        work = [Fraction(value) for value in coefficients]
        if not work:
            work = [Fraction(0)]
        while len(work) > self.degree:
            leading = work[-1]
            exponent = len(work) - 1
            if leading:
                shift = exponent - self.degree
                for i, value in enumerate(self.modulus[:-1]):
                    work[i + shift] -= leading * value
            work.pop()
        work.extend(Fraction(0) for _ in range(self.degree - len(work)))
        return tuple(work)

    def _reduce_monomial(self, exponent: int) -> tuple[Fraction, ...]:
        coefficients = [0] * (exponent + 1)
        coefficients[exponent] = 1
        return self._reduce(coefficients)

    def element(self, coefficients: Iterable[Fraction | int]) -> "CyclotomicElement":
        return CyclotomicElement(self, self._reduce(tuple(coefficients)))

    def scalar(self, value: Fraction | int) -> "CyclotomicElement":
        coefficients = [Fraction(0)] * self.degree
        coefficients[0] = Fraction(value)
        return CyclotomicElement(self, tuple(coefficients))

    @property
    def zero(self) -> "CyclotomicElement":
        return self.scalar(0)

    @property
    def one(self) -> "CyclotomicElement":
        return self.scalar(1)

    @property
    def zeta(self) -> "CyclotomicElement":
        return self.zeta_power(1)

    def zeta_power(self, exponent: int) -> "CyclotomicElement":
        reduced = exponent % self.n
        cached = self._zeta_powers.get(reduced)
        if cached is None:
            cached = CyclotomicElement(self, self._reduce_monomial(reduced))
            self._zeta_powers[reduced] = cached
        return cached

    def __repr__(self) -> str:
        return f"CyclotomicField({self.n})"


@dataclass(frozen=True, slots=True)
class CyclotomicElement:
    field: CyclotomicField
    coefficients: tuple[Fraction, ...]

    def __post_init__(self) -> None:
        if len(self.coefficients) != self.field.degree:
            raise ValueError("coefficient vector has the wrong cyclotomic degree")

    def _coerce(self, other: object) -> "CyclotomicElement":
        if isinstance(other, CyclotomicElement):
            if other.field is not self.field:
                raise TypeError("cannot mix elements from different cyclotomic fields")
            return other
        if isinstance(other, (int, Fraction)):
            return self.field.scalar(other)
        return NotImplemented  # type: ignore[return-value]

    def __add__(self, other: object) -> "CyclotomicElement":
        rhs = self._coerce(other)
        if rhs is NotImplemented:
            return NotImplemented
        return CyclotomicElement(
            self.field,
            tuple(a + b for a, b in zip(self.coefficients, rhs.coefficients)),
        )

    __radd__ = __add__

    def __neg__(self) -> "CyclotomicElement":
        return CyclotomicElement(self.field, tuple(-value for value in self.coefficients))

    def __sub__(self, other: object) -> "CyclotomicElement":
        rhs = self._coerce(other)
        if rhs is NotImplemented:
            return NotImplemented
        return self + (-rhs)

    def __rsub__(self, other: object) -> "CyclotomicElement":
        lhs = self._coerce(other)
        if lhs is NotImplemented:
            return NotImplemented
        return lhs - self

    def __mul__(self, other: object) -> "CyclotomicElement":
        rhs = self._coerce(other)
        if rhs is NotImplemented:
            return NotImplemented
        product = [Fraction(0)] * (2 * self.field.degree - 1)
        for i, a in enumerate(self.coefficients):
            if not a:
                continue
            for j, b in enumerate(rhs.coefficients):
                if b:
                    product[i + j] += a * b
        return CyclotomicElement(self.field, self.field._reduce(product))

    __rmul__ = __mul__

    def __pow__(self, exponent: int) -> "CyclotomicElement":
        if exponent < 0:
            raise ValueError("negative powers are not implemented for general field elements")
        result = self.field.one
        base = self
        power = exponent
        while power:
            if power & 1:
                result = result * base
            base = base * base
            power >>= 1
        return result

    def __bool__(self) -> bool:
        return any(self.coefficients)

    def is_zero(self) -> bool:
        return not bool(self)

    def as_coefficient_strings(self) -> list[str]:
        return [
            str(value.numerator)
            if value.denominator == 1
            else f"{value.numerator}/{value.denominator}"
            for value in self.coefficients
        ]

    def approximate(self) -> complex:
        root = complex(cos(2 * pi / self.field.n), sin(2 * pi / self.field.n))
        return sum(float(value) * root**i for i, value in enumerate(self.coefficients))

    def __str__(self) -> str:
        terms: list[str] = []
        for exponent, coefficient in enumerate(self.coefficients):
            if not coefficient:
                continue
            sign = "-" if coefficient < 0 else "+"
            magnitude = abs(coefficient)
            if exponent == 0:
                body = str(magnitude)
            else:
                variable = "zeta" if exponent == 1 else f"zeta^{exponent}"
                body = variable if magnitude == 1 else f"{magnitude}*{variable}"
            if not terms:
                terms.append(body if sign == "+" else f"-{body}")
            else:
                terms.append(f" {sign} {body}")
        return "".join(terms) if terms else "0"

    def __repr__(self) -> str:
        return f"CyclotomicElement(n={self.field.n}, coefficients={self.coefficients!r})"
