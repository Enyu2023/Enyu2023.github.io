"""Validated JSON model for a decorated combed Heegaard diagram.

The 4g integer combing coordinates come from the attached draft: rotations on
alpha, beta, nu, and mu curves relative to a fixed reference combing.  A
Kuperberg contraction additionally needs the crossing orders and the local
S^s T^t labels.  Those local labels are explicit in this format because they
cannot be reconstructed from the 4g integers alone.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from collections.abc import Mapping
from typing import Any


def _check_keys(
    value: Mapping[str, Any],
    *,
    required: set[str],
    optional: set[str] | None = None,
    context: str,
) -> None:
    allowed = required | (optional or set())
    extra = set(value) - allowed
    missing = required - set(value)
    if extra or missing:
        raise ValueError(
            f"{context} keys are invalid; missing={sorted(missing)}, extra={sorted(extra)}"
        )


def _require_string(value: Any, context: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{context} must be a non-empty string")
    return value


def _require_array(value: Any, context: str) -> list[Any] | tuple[Any, ...]:
    if not isinstance(value, (list, tuple)):
        raise ValueError(f"{context} must be an array")
    return value


def _require_object(value: Any, context: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise ValueError(f"{context} must be an object")
    return value


@dataclass(frozen=True, slots=True)
class CombingCoordinates:
    alpha: tuple[int, ...]
    beta: tuple[int, ...]
    nu: tuple[int, ...]
    mu: tuple[int, ...]
    reference: str = "diagram framing"

    def validate(self, genus: int) -> None:
        _require_string(self.reference, "combing.reference")
        for name in ("alpha", "beta", "nu", "mu"):
            values = getattr(self, name)
            if len(values) != genus:
                raise ValueError(f"combing.{name} must contain exactly genus={genus} integers")
            if not all(isinstance(value, int) and not isinstance(value, bool) for value in values):
                raise ValueError(f"combing.{name} must contain only integers")

    @property
    def flat(self) -> tuple[int, ...]:
        return self.alpha + self.beta + self.nu + self.mu

    def to_dict(self) -> dict[str, list[int]]:
        return {
            "kind": "difference_to_reference",
            "reference": self.reference,
            "alpha": list(self.alpha),
            "beta": list(self.beta),
            "nu": list(self.nu),
            "mu": list(self.mu),
        }

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "CombingCoordinates":
        expected = {"alpha", "beta", "nu", "mu", "reference", "kind"}
        _check_keys(value, required=expected, context="combing")
        if value["kind"] != "difference_to_reference":
            raise ValueError("combing.kind must be 'difference_to_reference'")
        return cls(
            *(
                tuple(_require_array(value[name], f"combing.{name}"))
                for name in ("alpha", "beta", "nu", "mu")
            ),
            reference=_require_string(value["reference"], "combing.reference"),
        )


@dataclass(frozen=True, slots=True)
class Curve:
    id: str
    theta2: int
    crossings: tuple[str, ...]

    def validate(self) -> None:
        _require_string(self.id, "curve id")
        if not isinstance(self.theta2, int) or isinstance(self.theta2, bool) or self.theta2 % 2 == 0:
            raise ValueError(f"curve {self.id!r}: theta2 must be an odd integer (twice a half-rotation)")
        if len(set(self.crossings)) != len(self.crossings):
            raise ValueError(f"curve {self.id!r}: a crossing id occurs more than once")
        if not all(isinstance(item, str) and item for item in self.crossings):
            raise ValueError(f"curve {self.id!r}: crossing ids must be non-empty strings")

    def to_dict(self) -> dict[str, Any]:
        return {"id": self.id, "theta2": self.theta2, "crossings": list(self.crossings)}

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "Curve":
        _check_keys(value, required={"id", "theta2", "crossings"}, context="curve")
        crossings = _require_array(value["crossings"], "curve.crossings")
        return cls(
            id=_require_string(value["id"], "curve.id"),
            theta2=value["theta2"],
            crossings=tuple(crossings),
        )


@dataclass(frozen=True, slots=True)
class Crossing:
    id: str
    lower: str
    upper: str
    antipode_power: int
    tilt_power: int = 0

    def validate(self) -> None:
        _require_string(self.id, "crossing.id")
        _require_string(self.lower, f"crossing {self.id!r}.lower")
        _require_string(self.upper, f"crossing {self.id!r}.upper")
        if not isinstance(self.antipode_power, int) or isinstance(self.antipode_power, bool):
            raise ValueError(f"crossing {self.id!r}: antipode_power must be an integer")
        if not isinstance(self.tilt_power, int) or isinstance(self.tilt_power, bool):
            raise ValueError(f"crossing {self.id!r}: tilt_power must be an integer")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "lower": self.lower,
            "upper": self.upper,
            "antipode_power": self.antipode_power,
            "tilt_power": self.tilt_power,
        }

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "Crossing":
        _check_keys(
            value,
            required={"id", "lower", "upper", "antipode_power"},
            optional={"tilt_power"},
            context="crossing",
        )
        return cls(
            id=_require_string(value["id"], "crossing.id"),
            lower=_require_string(value["lower"], "crossing.lower"),
            upper=_require_string(value["upper"], "crossing.upper"),
            antipode_power=value["antipode_power"],
            tilt_power=value.get("tilt_power", 0),
        )


@dataclass(frozen=True, slots=True)
class DecoratedDiagram:
    name: str
    genus: int
    combing: CombingCoordinates
    lower: tuple[Curve, ...]
    upper: tuple[Curve, ...]
    crossings: tuple[Crossing, ...]
    schema_version: int = 1
    convention: str = "cnw-2025-corrected-right-cointegral"
    local_labels_certified: bool = False

    def __post_init__(self) -> None:
        self.validate()

    def validate(self) -> None:
        if not isinstance(self.schema_version, int) or isinstance(self.schema_version, bool):
            raise ValueError("schema_version must be the integer 1")
        if self.schema_version != 1:
            raise ValueError(f"unsupported schema_version {self.schema_version}; expected 1")
        _require_string(self.name, "diagram.name")
        if self.convention != "cnw-2025-corrected-right-cointegral":
            raise ValueError(
                "unsupported convention; expected 'cnw-2025-corrected-right-cointegral'"
            )
        if self.local_labels_certified is not True:
            raise ValueError(
                "local_labels_certified must be the JSON boolean true; this is a producer "
                "assertion that the explicit local labels encode the stated diagram and combing"
            )
        if not isinstance(self.genus, int) or isinstance(self.genus, bool) or self.genus < 1:
            raise ValueError("genus must be a positive integer")
        if len(self.lower) != self.genus or len(self.upper) != self.genus:
            raise ValueError("a genus-g diagram must have exactly g lower and g upper curves")
        self.combing.validate(self.genus)
        for curve in self.lower + self.upper:
            curve.validate()
        for crossing in self.crossings:
            crossing.validate()

        lower_by_id = {curve.id: curve for curve in self.lower}
        upper_by_id = {curve.id: curve for curve in self.upper}
        crossing_by_id = {crossing.id: crossing for crossing in self.crossings}
        if len(lower_by_id) != len(self.lower):
            raise ValueError("lower curve ids must be unique")
        if len(upper_by_id) != len(self.upper):
            raise ValueError("upper curve ids must be unique")
        if len(crossing_by_id) != len(self.crossings):
            raise ValueError("crossing ids must be unique")

        seen_lower: dict[str, str] = {}
        seen_upper: dict[str, str] = {}
        for curve in self.lower:
            for crossing_id in curve.crossings:
                if crossing_id not in crossing_by_id:
                    raise ValueError(f"lower curve {curve.id!r} refers to unknown crossing {crossing_id!r}")
                if crossing_id in seen_lower:
                    raise ValueError(f"crossing {crossing_id!r} occurs on two lower curves")
                seen_lower[crossing_id] = curve.id
        for curve in self.upper:
            for crossing_id in curve.crossings:
                if crossing_id not in crossing_by_id:
                    raise ValueError(f"upper curve {curve.id!r} refers to unknown crossing {crossing_id!r}")
                if crossing_id in seen_upper:
                    raise ValueError(f"crossing {crossing_id!r} occurs on two upper curves")
                seen_upper[crossing_id] = curve.id

        all_ids = set(crossing_by_id)
        if set(seen_lower) != all_ids or set(seen_upper) != all_ids:
            raise ValueError("every crossing must occur exactly once in a lower order and once in an upper order")
        for crossing in self.crossings:
            if crossing.lower not in lower_by_id or crossing.upper not in upper_by_id:
                raise ValueError(f"crossing {crossing.id!r} names an unknown incident curve")
            if seen_lower[crossing.id] != crossing.lower or seen_upper[crossing.id] != crossing.upper:
                raise ValueError(f"crossing {crossing.id!r} incident-curve metadata disagrees with curve orders")

    @property
    def crossing_map(self) -> dict[str, Crossing]:
        return {crossing.id: crossing for crossing in self.crossings}

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "convention": self.convention,
            "local_labels_certified": self.local_labels_certified,
            "name": self.name,
            "genus": self.genus,
            "combing": self.combing.to_dict(),
            "lower": [curve.to_dict() for curve in self.lower],
            "upper": [curve.to_dict() for curve in self.upper],
            "crossings": [crossing.to_dict() for crossing in self.crossings],
        }

    def to_json(self, *, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent) + "\n"

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "DecoratedDiagram":
        required = {
            "schema_version",
            "convention",
            "local_labels_certified",
            "name",
            "genus",
            "combing",
            "lower",
            "upper",
            "crossings",
        }
        _check_keys(value, required=required, context="diagram")
        lower = _require_array(value["lower"], "diagram.lower")
        upper = _require_array(value["upper"], "diagram.upper")
        crossings = _require_array(value["crossings"], "diagram.crossings")
        combing = _require_object(value["combing"], "diagram.combing")
        return cls(
            schema_version=value["schema_version"],
            convention=_require_string(value["convention"], "diagram.convention"),
            local_labels_certified=value["local_labels_certified"],
            name=_require_string(value["name"], "diagram.name"),
            genus=value["genus"],
            combing=CombingCoordinates.from_dict(combing),
            lower=tuple(
                Curve.from_dict(_require_object(item, "diagram.lower item")) for item in lower
            ),
            upper=tuple(
                Curve.from_dict(_require_object(item, "diagram.upper item")) for item in upper
            ),
            crossings=tuple(
                Crossing.from_dict(_require_object(item, "diagram.crossings item"))
                for item in crossings
            ),
        )

    @classmethod
    def from_json(cls, text: str) -> "DecoratedDiagram":
        value = json.loads(text)
        if not isinstance(value, dict):
            raise ValueError("diagram JSON must contain an object at the top level")
        return cls.from_dict(value)

    @classmethod
    def read(cls, path: str | Path) -> "DecoratedDiagram":
        return cls.from_json(Path(path).read_text(encoding="utf-8"))

    def write(self, path: str | Path) -> None:
        Path(path).write_text(self.to_json(), encoding="utf-8")
