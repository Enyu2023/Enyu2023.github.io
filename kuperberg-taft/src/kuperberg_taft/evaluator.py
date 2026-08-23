"""Kuperberg tensor contraction for decorated Heegaard diagrams."""

from __future__ import annotations

from dataclasses import dataclass
from itertools import product
from math import comb, prod

from .cyclotomic import CyclotomicElement
from .diagram import DecoratedDiagram
from .taft import Basis, TaftAlgebra, TensorBasis


class StateSpaceTooLarge(RuntimeError):
    """Raised before a contraction whose explicit state space exceeds its guard."""


@dataclass(frozen=True, slots=True)
class EvaluationResult:
    value: CyclotomicElement
    states_evaluated: int
    estimated_states: int
    estimated_tensor_cells: int
    estimated_coefficient_cells: int
    estimated_work: int
    ell: int
    root_power: int
    diagram_name: str

    def to_dict(self) -> dict[str, object]:
        approximation = self.value.approximate()
        return {
            "diagram": self.diagram_name,
            "ell": self.ell,
            "root_power": self.root_power,
            "root": f"q = zeta^{self.root_power}, with zeta a primitive {self.ell}-th root",
            "exact": str(self.value),
            "coefficients_mod_cyclotomic_polynomial": self.value.as_coefficient_strings(),
            "approximate": {"real": approximation.real, "imag": approximation.imag},
            "states_evaluated": self.states_evaluated,
            "estimated_states": self.estimated_states,
            "estimated_tensor_cells": self.estimated_tensor_cells,
            "estimated_coefficient_cells": self.estimated_coefficient_cells,
            "estimated_work": self.estimated_work,
        }


def _multiply_word(
    algebra: TaftAlgebra,
    factors: list[tuple[Basis, CyclotomicElement]],
) -> tuple[Basis | None, CyclotomicElement]:
    basis = algebra.one_basis
    coefficient = algebra.field.one
    for factor_basis, factor_coefficient in factors:
        output, phase = algebra.multiply_basis(basis, factor_basis)
        if output is None:
            return None, algebra.field.zero
        basis = output
        coefficient *= factor_coefficient * phase
    return basis, coefficient


def evaluate(
    diagram: DecoratedDiagram,
    algebra: TaftAlgebra,
    *,
    max_states: int | None = 10_000_000,
    max_tensor_cells: int | None = 10_000_000,
    max_coefficient_cells: int | None = 10_000_000,
    max_work: int | None = 10_000_000,
) -> EvaluationResult:
    """Evaluate K(M,f,T_l) by the explicit decorated-diagram state sum.

    The implementation is Equation (3.4) of Chang--Ng--Wang specialized to
    Taft algebras.  Kuperberg's tilt T is the identity for these conventions,
    but `tilt_power` remains present in the input schema.
    """

    for name, limit in (
        ("max_states", max_states),
        ("max_tensor_cells", max_tensor_cells),
        ("max_coefficient_cells", max_coefficient_cells),
        ("max_work", max_work),
    ):
        if limit is not None and (
            not isinstance(limit, int) or isinstance(limit, bool) or limit < 1
        ):
            raise ValueError(f"{name} must be a positive integer or None")

    lower_term_counts = [
        1
        if not curve.crossings
        else algebra.ell * comb(algebra.ell + len(curve.crossings) - 2, len(curve.crossings) - 1)
        for curve in diagram.lower
    ]
    estimated_states = prod(lower_term_counts)
    estimated_tensor_cells = sum(
        term_count * len(curve.crossings)
        for curve, term_count in zip(diagram.lower, lower_term_counts)
    )
    estimated_coefficient_cells = sum(lower_term_counts) * algebra.field.degree
    estimated_work = estimated_states * len(diagram.crossings)
    if any(not curve.crossings for curve in diagram.lower + diagram.upper):
        # Every integral variant of T_l has positive x-degree, so its counit is
        # zero; every cointegral variant vanishes on 1.  A detached curve thus
        # makes the full state sum zero without materializing other factors.
        return EvaluationResult(
            value=algebra.field.zero,
            states_evaluated=0,
            estimated_states=estimated_states,
            estimated_tensor_cells=estimated_tensor_cells,
            estimated_coefficient_cells=estimated_coefficient_cells,
            estimated_work=estimated_work,
            ell=algebra.ell,
            root_power=algebra.root_power,
            diagram_name=diagram.name,
        )
    if max_states is not None and estimated_states > max_states:
        raise StateSpaceTooLarge(
            f"diagram expands to {estimated_states:,} states, above max_states={max_states:,}; "
            "raise --max-states explicitly if this cost is intended"
        )
    if max_tensor_cells is not None and estimated_tensor_cells > max_tensor_cells:
        raise StateSpaceTooLarge(
            f"coproduct materialization needs about {estimated_tensor_cells:,} tensor cells, "
            f"above max_tensor_cells={max_tensor_cells:,}; raise --max-tensor-cells "
            "explicitly if this memory cost is intended"
        )
    if (
        max_coefficient_cells is not None
        and estimated_coefficient_cells > max_coefficient_cells
    ):
        raise StateSpaceTooLarge(
            f"coproduct coefficients need about {estimated_coefficient_cells:,} "
            f"cyclotomic cells, above max_coefficient_cells={max_coefficient_cells:,}; "
            "raise --max-coefficient-cells explicitly if this memory cost is intended"
        )
    if max_work is not None and estimated_work > max_work:
        raise StateSpaceTooLarge(
            f"contraction needs about {estimated_work:,} crossing-state visits, "
            f"above max_work={max_work:,}; raise --max-work explicitly if this cost is intended"
        )

    crossing_map = diagram.crossing_map
    lower_integrals = [algebra.integral_variant(curve.theta2) for curve in diagram.lower]
    lower_expansions: list[list[tuple[TensorBasis, CyclotomicElement]]] = []
    for curve, integral in zip(diagram.lower, lower_integrals):
        if not curve.crossings:
            lower_expansions.append([(tuple(), algebra.field.one)])
        else:
            expansion = algebra.iterated_coproduct(integral, len(curve.crossings))
            lower_expansions.append(list(expansion.items()))
    actual_states = prod(len(expansion) for expansion in lower_expansions)
    if actual_states != estimated_states:
        raise AssertionError(
            f"internal Taft coproduct count mismatch: estimated {estimated_states}, got {actual_states}"
        )

    total = algebra.field.zero
    states_evaluated = 0
    for choices in product(*lower_expansions):
        states_evaluated += 1
        state_coefficient = algebra.field.one
        at_crossing: dict[str, Basis] = {}
        for curve, (tensor_basis, coefficient) in zip(diagram.lower, choices):
            state_coefficient *= coefficient
            for crossing_id, basis in zip(curve.crossings, tensor_basis):
                at_crossing[crossing_id] = basis
        if not state_coefficient:
            continue

        for curve in diagram.upper:
            if not curve.crossings:
                continue
            factors: list[tuple[Basis, CyclotomicElement]] = []
            for crossing_id in curve.crossings:
                crossing = crossing_map[crossing_id]
                basis, coefficient = algebra.antipode_basis(
                    at_crossing[crossing_id], crossing.antipode_power
                )
                # Kuperberg's T^t is identity on T_l, for every integer t.
                factors.append((basis, coefficient))
            word_basis, word_coefficient = _multiply_word(algebra, factors)
            if word_basis is None:
                state_coefficient = algebra.field.zero
                break
            state_coefficient *= word_coefficient
            state_coefficient *= algebra.cointegral_variant_basis(-curve.theta2, word_basis)
            if not state_coefficient:
                break
        total += state_coefficient

    return EvaluationResult(
        value=total,
        states_evaluated=states_evaluated,
        estimated_states=estimated_states,
        estimated_tensor_cells=estimated_tensor_cells,
        estimated_coefficient_cells=estimated_coefficient_cells,
        estimated_work=estimated_work,
        ell=algebra.ell,
        root_power=algebra.root_power,
        diagram_name=diagram.name,
    )
