"""Command-line interface."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Sequence

from .diagram import DecoratedDiagram
from .evaluator import StateSpaceTooLarge, evaluate
from .presets import DEFAULT_MAX_LENS_CROSSINGS, lens_diagram, t3_diagram
from .taft import DEFAULT_MAX_ELL, TaftAlgebra


def _positive_int(text: str) -> int:
    value = int(text)
    if value < 1:
        raise argparse.ArgumentTypeError("must be positive")
    return value


def _add_evaluation_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--ell", type=_positive_int, required=True, help="odd Taft parameter ell")
    parser.add_argument(
        "--max-ell",
        type=_positive_int,
        default=DEFAULT_MAX_ELL,
        help=f"refuse a larger cyclotomic field allocation (default: {DEFAULT_MAX_ELL})",
    )
    parser.add_argument(
        "--root-power",
        type=int,
        default=1,
        help="use q=zeta^u (u must be coprime to ell; default: 1)",
    )
    parser.add_argument(
        "--max-states",
        type=_positive_int,
        default=10_000_000,
        help="refuse a larger explicit state sum (default: 10000000)",
    )
    parser.add_argument(
        "--max-tensor-cells",
        type=_positive_int,
        default=10_000_000,
        help="refuse larger coproduct materialization (default: 10000000)",
    )
    parser.add_argument(
        "--max-coefficient-cells",
        type=_positive_int,
        default=10_000_000,
        help="refuse larger dense cyclotomic storage (default: 10000000)",
    )
    parser.add_argument(
        "--max-work",
        type=_positive_int,
        default=10_000_000,
        help="refuse more crossing-state visits (default: 10000000)",
    )
    parser.add_argument("--json", action="store_true", help="print machine-readable result JSON")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kuperberg-taft",
        description="Exact Kuperberg invariants for odd Taft algebras",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    lens = subparsers.add_parser("lens", help="evaluate the Chang-Ng-Wang L(n,k) preset")
    lens.add_argument("n", type=_positive_int)
    lens.add_argument("k", type=_positive_int)
    lens.add_argument("--framing", choices=("auto", "fL", "fR"), default="auto")
    lens.add_argument(
        "--max-lens-crossings",
        type=_positive_int,
        default=DEFAULT_MAX_LENS_CROSSINGS,
        help=f"refuse a larger generated lens diagram (default: {DEFAULT_MAX_LENS_CROSSINGS})",
    )
    _add_evaluation_options(lens)

    torus = subparsers.add_parser("t3", help="evaluate the Chang-Wang-Zhai T^3 preset")
    _add_evaluation_options(torus)

    diagram = subparsers.add_parser("diagram", help="evaluate a decorated diagram JSON file")
    diagram.add_argument("path", type=Path)
    _add_evaluation_options(diagram)

    emit = subparsers.add_parser("emit-preset", help="write a validated preset as diagram JSON")
    emit.add_argument("kind", choices=("lens", "t3"))
    emit.add_argument("output", type=Path)
    emit.add_argument("--n", type=_positive_int)
    emit.add_argument("--k", type=_positive_int)
    emit.add_argument("--framing", choices=("auto", "fL", "fR"), default="auto")
    emit.add_argument(
        "--max-lens-crossings",
        type=_positive_int,
        default=DEFAULT_MAX_LENS_CROSSINGS,
        help=f"refuse a larger generated lens diagram (default: {DEFAULT_MAX_LENS_CROSSINGS})",
    )
    return parser


def _print_result(result, *, as_json: bool) -> None:
    if as_json:
        print(json.dumps(result.to_dict(), indent=2))
        return
    approximation = result.value.approximate()
    print(f"diagram: {result.diagram_name}")
    print(f"algebra: T_{result.ell}, q = zeta^{result.root_power}")
    print(f"Kuperberg invariant: {result.value}")
    print(f"power-basis coefficients: {result.value.as_coefficient_strings()}")
    print(f"numerical approximation: {approximation.real:.12g} {approximation.imag:+.12g}i")
    print(f"states evaluated: {result.states_evaluated:,}")
    print(f"estimated tensor cells: {result.estimated_tensor_cells:,}")
    print(f"estimated cyclotomic coefficient cells: {result.estimated_coefficient_cells:,}")
    print(f"estimated crossing-state visits: {result.estimated_work:,}")


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command == "emit-preset":
            if args.kind == "t3":
                diagram = t3_diagram()
            else:
                if args.n is None or args.k is None:
                    parser.error("emit-preset lens requires --n and --k")
                diagram = lens_diagram(
                    args.n,
                    args.k,
                    framing=args.framing,
                    max_crossings=args.max_lens_crossings,
                )
            args.output.parent.mkdir(parents=True, exist_ok=True)
            diagram.write(args.output)
            print(args.output)
            return 0

        if args.command == "lens":
            diagram = lens_diagram(
                args.n,
                args.k,
                framing=args.framing,
                max_crossings=args.max_lens_crossings,
            )
        elif args.command == "t3":
            diagram = t3_diagram()
        else:
            diagram = DecoratedDiagram.read(args.path)
        algebra = TaftAlgebra(
            args.ell,
            root_power=args.root_power,
            max_ell=args.max_ell,
        )
        result = evaluate(
            diagram,
            algebra,
            max_states=args.max_states,
            max_tensor_cells=args.max_tensor_cells,
            max_coefficient_cells=args.max_coefficient_cells,
            max_work=args.max_work,
        )
        _print_result(result, as_json=args.json)
        return 0
    except (OSError, ValueError, StateSpaceTooLarge, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
