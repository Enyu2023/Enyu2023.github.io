"""Exact Kuperberg state sums for odd Taft algebras."""

from .cyclotomic import DEFAULT_MAX_CYCLOTOMIC_ORDER, CyclotomicElement, CyclotomicField
from .diagram import CombingCoordinates, Crossing, Curve, DecoratedDiagram
from .evaluator import EvaluationResult, evaluate
from .presets import DEFAULT_MAX_LENS_CROSSINGS, lens_diagram, lens_l1_diagram, t3_diagram
from .taft import DEFAULT_MAX_ELL, TaftAlgebra

__all__ = [
    "CombingCoordinates",
    "Crossing",
    "Curve",
    "CyclotomicElement",
    "CyclotomicField",
    "DecoratedDiagram",
    "DEFAULT_MAX_ELL",
    "DEFAULT_MAX_CYCLOTOMIC_ORDER",
    "DEFAULT_MAX_LENS_CROSSINGS",
    "EvaluationResult",
    "TaftAlgebra",
    "evaluate",
    "lens_diagram",
    "lens_l1_diagram",
    "t3_diagram",
]

__version__ = "0.1.0"
