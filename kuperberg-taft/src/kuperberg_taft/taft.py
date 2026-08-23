"""The odd Taft algebra T_l and its exact sparse tensor calculus.

Conventions follow Chang--Ng--Wang, Example 4.18:

    x^l = 0,  g^l = 1,  g x = zeta x g,
    Delta(g) = g tensor g,
    Delta(x) = x tensor g + 1 tensor x,
    S(g) = g^-1,  S(x) = -x g^-1.

The basis is x^a g^b for 0 <= a,b < l.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import cached_property
from itertools import product
from math import gcd
from typing import Iterable, Mapping, TypeAlias

from .cyclotomic import CyclotomicElement, CyclotomicField

Basis: TypeAlias = tuple[int, int]
TensorBasis: TypeAlias = tuple[Basis, ...]
Element: TypeAlias = dict[Basis, CyclotomicElement]
TensorElement: TypeAlias = dict[TensorBasis, CyclotomicElement]
DEFAULT_MAX_ELL = 101


def _put(target: dict, key: object, value: CyclotomicElement) -> None:
    if not value:
        return
    updated = target.get(key, value.field.zero) + value
    if updated:
        target[key] = updated
    elif key in target:
        del target[key]


@dataclass
class TaftAlgebra:
    """Sparse exact arithmetic for T_l over Q(zeta_l)."""

    ell: int
    root_power: int = 1
    max_ell: int | None = DEFAULT_MAX_ELL

    def __post_init__(self) -> None:
        if not isinstance(self.ell, int) or isinstance(self.ell, bool):
            raise ValueError("ell must be an odd integer >= 3")
        if self.ell < 3 or self.ell % 2 == 0:
            raise ValueError("this implementation requires an odd ell >= 3")
        if self.max_ell is not None:
            if (
                not isinstance(self.max_ell, int)
                or isinstance(self.max_ell, bool)
                or self.max_ell < 1
            ):
                raise ValueError("max_ell must be a positive integer or None")
            if self.ell > self.max_ell:
                raise ValueError(
                    f"Taft level ell={self.ell} is above max_ell={self.max_ell}; "
                    "raise max_ell explicitly if this cyclotomic allocation is intended"
                )
        if not isinstance(self.root_power, int) or isinstance(self.root_power, bool):
            raise ValueError("root_power must be an integer")
        self.root_power %= self.ell
        if gcd(self.root_power, self.ell) != 1:
            raise ValueError("root_power must be coprime to ell so that zeta^root_power is primitive")
        self.field = CyclotomicField(self.ell, max_n=self.max_ell)
        self._coproduct_cache: dict[tuple[Basis, int], TensorElement] = {}
        self._coproduct_x_power_cache: dict[tuple[int, int], TensorElement] = {}

    @property
    def dimension(self) -> int:
        return self.ell * self.ell

    @property
    def q(self) -> CyclotomicElement:
        return self.field.zeta_power(self.root_power)

    def q_power(self, exponent: int) -> CyclotomicElement:
        return self.field.zeta_power(self.root_power * exponent)

    @property
    def one_basis(self) -> Basis:
        return (0, 0)

    @property
    def x_basis(self) -> Basis:
        return (1, 0)

    @property
    def g_basis(self) -> Basis:
        return (0, 1)

    def zero(self) -> Element:
        return {}

    def _validate_basis(self, basis: Basis, context: str = "basis") -> Basis:
        if not isinstance(basis, tuple) or len(basis) != 2:
            raise ValueError(f"{context} must be a pair (a,b)")
        a, b = basis
        if not all(isinstance(value, int) and not isinstance(value, bool) for value in (a, b)):
            raise ValueError(f"{context} exponents must be integers")
        if not (0 <= a < self.ell and 0 <= b < self.ell):
            raise ValueError(f"{context} must satisfy 0 <= a,b < ell={self.ell}")
        return a, b

    def basis_element(self, basis: Basis, coefficient: CyclotomicElement | int = 1) -> Element:
        basis = self._validate_basis(basis)
        value = coefficient if isinstance(coefficient, CyclotomicElement) else self.field.scalar(coefficient)
        return {} if not value else {basis: value}

    def scalar(self, value: int) -> Element:
        return self.basis_element(self.one_basis, value)

    @cached_property
    def _x_value(self) -> Element:
        return self.basis_element(self.x_basis)

    @property
    def x(self) -> Element:
        return dict(self._x_value)

    @cached_property
    def _g_value(self) -> Element:
        return self.basis_element(self.g_basis)

    @property
    def g(self) -> Element:
        return dict(self._g_value)

    @cached_property
    def _unit_value(self) -> Element:
        return self.scalar(1)

    @property
    def unit(self) -> Element:
        return dict(self._unit_value)

    def add(self, *elements: Mapping[Basis, CyclotomicElement]) -> Element:
        result: Element = {}
        for element in elements:
            for basis, coefficient in element.items():
                _put(result, basis, coefficient)
        return result

    def scale(self, element: Mapping[Basis, CyclotomicElement], scalar: CyclotomicElement | int) -> Element:
        value = scalar if isinstance(scalar, CyclotomicElement) else self.field.scalar(scalar)
        return {basis: coefficient * value for basis, coefficient in element.items() if coefficient * value}

    def multiply_basis(self, left: Basis, right: Basis) -> tuple[Basis | None, CyclotomicElement]:
        a, b = self._validate_basis(left, "left basis")
        c, d = self._validate_basis(right, "right basis")
        if a + c >= self.ell:
            return None, self.field.zero
        phase = self.q_power(b * c)
        return (a + c, (b + d) % self.ell), phase

    def multiply(
        self,
        left: Mapping[Basis, CyclotomicElement],
        right: Mapping[Basis, CyclotomicElement],
    ) -> Element:
        result: Element = {}
        for left_basis, left_coefficient in left.items():
            for right_basis, right_coefficient in right.items():
                basis, phase = self.multiply_basis(left_basis, right_basis)
                if basis is not None:
                    _put(result, basis, left_coefficient * right_coefficient * phase)
        return result

    def power(self, element: Mapping[Basis, CyclotomicElement], exponent: int) -> Element:
        if not isinstance(exponent, int) or isinstance(exponent, bool) or exponent < 0:
            raise ValueError("negative algebra powers are not supported")
        result = self.unit
        base = dict(element)
        remaining = exponent
        while remaining:
            if remaining & 1:
                result = self.multiply(result, base)
            base = self.multiply(base, base)
            remaining >>= 1
        return result

    def counit_basis(self, basis: Basis) -> int:
        basis = self._validate_basis(basis)
        return 1 if basis[0] == 0 else 0

    def counit(self, element: Mapping[Basis, CyclotomicElement]) -> CyclotomicElement:
        result = self.field.zero
        for basis, coefficient in element.items():
            if self.counit_basis(basis):
                result += coefficient
        return result

    def antipode_basis(self, basis: Basis, exponent: int = 1) -> tuple[Basis, CyclotomicElement]:
        """Return S^exponent on one basis monomial.

        Since S^2(x)=zeta*x and S^2(g)=g, the antipode has order 2*ell.
        """

        a, b = self._validate_basis(basis)
        if not isinstance(exponent, int) or isinstance(exponent, bool):
            raise ValueError("antipode exponent must be an integer")
        reduced = exponent % (2 * self.ell)
        half, odd = divmod(reduced, 2)
        coefficient = self.q_power(half * a)
        if not odd:
            return basis, coefficient
        sign = -1 if a % 2 else 1
        phase_exponent = -a * b - a * (a - 1) // 2
        coefficient *= sign * self.q_power(phase_exponent)
        return (a, (-a - b) % self.ell), coefficient

    def antipode(
        self,
        element: Mapping[Basis, CyclotomicElement],
        exponent: int = 1,
    ) -> Element:
        result: Element = {}
        for basis, coefficient in element.items():
            image, phase = self.antipode_basis(basis, exponent)
            _put(result, image, coefficient * phase)
        return result

    def tensor_multiply(
        self,
        left: Mapping[TensorBasis, CyclotomicElement],
        right: Mapping[TensorBasis, CyclotomicElement],
    ) -> TensorElement:
        result: TensorElement = {}
        for left_basis, left_coefficient in left.items():
            for right_basis, right_coefficient in right.items():
                if len(left_basis) != len(right_basis):
                    raise ValueError("tensor arities do not agree")
                output: list[Basis] = []
                phase = self.field.one
                vanishes = False
                for lhs, rhs in zip(left_basis, right_basis):
                    basis, local_phase = self.multiply_basis(lhs, rhs)
                    if basis is None:
                        vanishes = True
                        break
                    output.append(basis)
                    phase *= local_phase
                if not vanishes:
                    _put(result, tuple(output), left_coefficient * right_coefficient * phase)
        return result

    def tensor_power(
        self,
        element: Mapping[TensorBasis, CyclotomicElement],
        exponent: int,
        arity: int,
    ) -> TensorElement:
        if not isinstance(exponent, int) or isinstance(exponent, bool) or exponent < 0:
            raise ValueError("negative tensor powers are not supported")
        identity_basis = tuple(self.one_basis for _ in range(arity))
        result: TensorElement = {identity_basis: self.field.one}
        base = dict(element)
        remaining = exponent
        while remaining:
            if remaining & 1:
                result = self.tensor_multiply(result, base)
            remaining >>= 1
            if remaining:
                base = self.tensor_multiply(base, base)
        return result

    def coproduct_basis(self, basis: Basis, arity: int) -> TensorElement:
        """Compute the arity-fold coproduct of one basis element."""

        if not isinstance(arity, int) or isinstance(arity, bool) or arity < 1:
            raise ValueError("coproduct arity must be positive")
        basis = self._validate_basis(basis)
        cache_key = (basis, arity)
        cached = self._coproduct_cache.get(cache_key)
        if cached is not None:
            return dict(cached)
        a, b = basis
        delta_x: TensorElement = {}
        for position in range(arity):
            monomial = tuple(
                self.one_basis if index < position else self.x_basis if index == position else self.g_basis
                for index in range(arity)
            )
            delta_x[monomial] = self.field.one
        x_cache_key = (a, arity)
        result = self._coproduct_x_power_cache.get(x_cache_key)
        if result is None:
            result = self.tensor_power(delta_x, a, arity)
            self._coproduct_x_power_cache[x_cache_key] = result
        delta_g_basis = tuple(self.g_basis for _ in range(arity))
        delta_g = self.tensor_power({delta_g_basis: self.field.one}, b, arity)
        result = self.tensor_multiply(result, delta_g)
        self._coproduct_cache[cache_key] = result
        return dict(result)

    def iterated_coproduct(
        self,
        element: Mapping[Basis, CyclotomicElement],
        arity: int,
    ) -> TensorElement:
        if not isinstance(arity, int) or isinstance(arity, bool) or arity < 1:
            raise ValueError("coproduct arity must be positive")
        result: TensorElement = {}
        for basis, coefficient in element.items():
            for tensor_basis, tensor_coefficient in self.coproduct_basis(basis, arity).items():
                _put(result, tensor_basis, coefficient * tensor_coefficient)
        return result

    @cached_property
    def _left_integral_value(self) -> Element:
        """Lambda=(sum_{j=1}^ell g^j)x^(ell-1), normalized by lambda(Lambda)=1."""

        x_top = self.power(self.x, self.ell - 1)
        terms = []
        for exponent in range(1, self.ell + 1):
            terms.append(self.multiply(self.power(self.g, exponent), x_top))
        return self.add(*terms)

    @property
    def left_integral(self) -> Element:
        return dict(self._left_integral_value)

    @cached_property
    def _right_integral_value(self) -> Element:
        return self.antipode(self._left_integral_value)

    @property
    def right_integral(self) -> Element:
        return dict(self._right_integral_value)

    def integral_variant(self, index2: int) -> Element:
        """Return Lambda_r for r=index2/2, using Chang--Ng--Wang (2.4).

        The index must be a half-integer, encoded by an odd integer `index2`.
        If r=n-1/2, Lambda_r=alpha^{-n} acting on S(Lambda).
        """

        if not isinstance(index2, int) or isinstance(index2, bool) or index2 % 2 == 0:
            raise ValueError("integral index must be a half-integer (odd doubled index)")
        n = (index2 + 1) // 2
        result: Element = {}
        for (a, b), coefficient in self.right_integral.items():
            phase = self.q_power(-n * (a + b))
            _put(result, (a, b), coefficient * phase)
        return result

    def cointegral(self, element: Mapping[Basis, CyclotomicElement]) -> CyclotomicElement:
        """Evaluate the normalized right cointegral.

        For the printed coproduct convention, the right-cointegral identity
        `(lambda tensor id) Delta(h)=lambda(h)1` and lambda(Lambda)=1 give

            lambda(x^a g^b) = zeta * delta[a,ell-1] * delta[b,1].

        Example 4.18 of Chang--Ng--Wang prints `delta_{x^(ell-1)}`; interpreted
        literally in its displayed x^a g^b basis, that functional fails the
        cointegral identity.  The corrected functional also reproduces their
        published L(7,1) value.
        """

        return self.q * element.get((self.ell - 1, 1), self.field.zero)

    def cointegral_variant(
        self,
        index2: int,
        element: Mapping[Basis, CyclotomicElement],
    ) -> CyclotomicElement:
        """Evaluate lambda_r for r=index2/2, using Chang--Ng--Wang (2.4)."""

        if not isinstance(index2, int) or isinstance(index2, bool) or index2 % 2 == 0:
            raise ValueError("cointegral index must be a half-integer (odd doubled index)")
        n = (index2 + 1) // 2
        return self.q * element.get(
            (self.ell - 1, (1 - n) % self.ell), self.field.zero
        )

    def cointegral_variant_basis(
        self,
        index2: int,
        basis: Basis,
    ) -> CyclotomicElement:
        """Evaluate a cointegral variant on a single basis monomial."""

        if not isinstance(index2, int) or isinstance(index2, bool) or index2 % 2 == 0:
            raise ValueError("cointegral index must be a half-integer (odd doubled index)")
        basis = self._validate_basis(basis)
        n = (index2 + 1) // 2
        return (
            self.q
            if basis == (self.ell - 1, (1 - n) % self.ell)
            else self.field.zero
        )

    def tilt(self, element: Mapping[Basis, CyclotomicElement], exponent: int = 1) -> Element:
        """Apply Kuperberg's tilt T.

        For these Taft conventions T fixes x and g and is the identity on every basis monomial.
        The explicit method keeps diagram code faithful to the general S^s T^t formula.
        """

        _ = exponent
        return dict(element)

    def all_basis(self) -> Iterable[Basis]:
        return product(range(self.ell), repeat=2)
