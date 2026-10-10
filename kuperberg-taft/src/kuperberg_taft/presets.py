"""Special decorated diagrams whose local data are fixed by the cited papers."""

from __future__ import annotations

from math import gcd

from .diagram import CombingCoordinates, Crossing, Curve, DecoratedDiagram

DEFAULT_MAX_LENS_CROSSINGS = 4_096


def _zero_combing(genus: int, reference: str) -> CombingCoordinates:
    """Use the preset framing itself as the reference for the 4g coordinates."""

    zeros = (0,) * genus
    return CombingCoordinates(alpha=zeros, beta=zeros, nu=zeros, mu=zeros, reference=reference)


def lens_l1_diagram(
    n: int,
    *,
    max_crossings: int | None = DEFAULT_MAX_LENS_CROSSINGS,
) -> DecoratedDiagram:
    """Chang--Ng--Wang's f_L diagram of the lens space L(n,1).

    The compiled diagram has upper order p1,...,pn, every antipode power equal
    to one, and theta_mu=-1/2.  Applying
    lambda_(1/2)=lambda composed with S^-1 then simplifies its contraction to
    K=lambda(Lambda_(n)...Lambda_(1)).
    """

    return lens_diagram(n, 1, framing="fL", max_crossings=max_crossings)


def _cyclic_values(n: int, step: int, start: int, initial: int, delta) -> list[int]:
    values: list[int | None] = [None] * (n + 1)
    values[start] = initial
    current = start
    for _ in range(n):
        following = ((current + step - 1) % n) + 1
        candidate = values[current] + delta(current)  # type: ignore[operator]
        if values[following] is not None and values[following] != candidate:
            raise ValueError("inconsistent lens-space rotation recursion")
        values[following] = candidate
        current = following
    if current != start or any(value is None for value in values[1:]):
        raise ValueError("lens-space rotation recursion did not form one cycle")
    return [int(value) for value in values[1:]]


def lens_diagram(
    n: int,
    k: int,
    *,
    framing: str = "auto",
    max_crossings: int | None = DEFAULT_MAX_LENS_CROSSINGS,
) -> DecoratedDiagram:
    """Chang--Ng--Wang's special f_L or f_R diagram of L(n,k).

    f_L exists in the paper's form when k is odd.  f_R exists when n-k is
    odd.  `auto` prefers f_L and otherwise chooses f_R.
    """

    if not all(isinstance(value, int) and not isinstance(value, bool) for value in (n, k)):
        raise ValueError("n and k must be integers")
    if max_crossings is not None:
        if (
            not isinstance(max_crossings, int)
            or isinstance(max_crossings, bool)
            or max_crossings < 1
        ):
            raise ValueError("max_crossings must be a positive integer or None")
        if n > max_crossings:
            raise ValueError(
                f"lens diagram needs {n} crossings, above max_crossings={max_crossings}; "
                "raise max_crossings explicitly if this allocation is intended"
            )
    if not ((n > k > 0) or (n, k) == (1, 1)) or gcd(n, k) != 1:
        raise ValueError("lens preset requires coprime n > k > 0, or the S^3 case (1,1)")
    if framing == "auto":
        framing = "fL" if k % 2 else "fR"
    if framing not in {"fL", "fR"}:
        raise ValueError("framing must be 'auto', 'fL', or 'fR'")

    if framing == "fL":
        if k % 2 == 0:
            raise ValueError("the f_L preset requires odd k")
        k1 = (k - 1) // 2

        def delta(index: int) -> int:
            if index <= n - k + 1:
                return 0
            if index <= n - k1:
                return 2
            return -2

        powers = _cyclic_values(n, k, start=1, initial=1, delta=delta)
        upper_indices = [1]
        for _ in range(1, n):
            upper_indices.append(((upper_indices[-1] + k - 1) % n) + 1)
        upper_theta2 = -1
    else:
        if (n - k) % 2 == 0:
            raise ValueError("the f_R preset requires odd n-k")
        k0 = (n - k - 1) // 2

        def delta(index: int) -> int:
            if index <= k0:
                return 1
            if index <= 2 * k0:
                return -1
            return 0

        c_values = _cyclic_values(n, k, start=n, initial=0, delta=delta)
        powers = [2 * value + 1 for value in c_values]
        upper_indices = [n]
        for _ in range(1, n):
            upper_indices.append(((upper_indices[-1] + k - 1) % n) + 1)
        upper_theta2 = 1

    ids = tuple(f"p{index}" for index in range(1, n + 1))
    upper_ids = tuple(f"p{index}" for index in upper_indices)
    return DecoratedDiagram(
        name=f"L({n},{k}), Chang-Ng-Wang {framing} framing",
        genus=1,
        combing=_zero_combing(1, f"Chang-Ng-Wang L({n},{k}) {framing}"),
        lower=(Curve("eta1", theta2=1, crossings=ids),),
        upper=(Curve("mu1", theta2=upper_theta2, crossings=upper_ids),),
        crossings=tuple(
            Crossing(crossing_id, "eta1", "mu1", antipode_power=powers[index - 1])
            for index, crossing_id in enumerate(ids, start=1)
        ),
        local_labels_certified=True,
    )


def t3_diagram() -> DecoratedDiagram:
    """The genus-three T^3 framing in Chang--Wang--Zhai, Figure 3/Table (p.17)."""

    lower_orders = {
        "eta1": ("p1", "p2", "p3", "p4"),
        "eta2": ("q1", "q2", "q3", "q4"),
        "eta3": ("r1", "r2", "r3", "r4"),
    }
    upper_orders = {
        "mu1": ("p1", "r4", "p3", "r2"),
        "mu2": ("q1", "p2", "q3", "p4"),
        "mu3": ("r1", "q2", "r3", "q4"),
    }
    powers = {
        "p1": 1,
        "p2": 2,
        "p3": 2,
        "p4": 1,
        "q1": 1,
        "q2": 1,
        "q3": 2,
        "q4": 2,
        "r1": 1,
        "r2": 3,
        "r3": 2,
        "r4": 2,
    }
    lower_for = {crossing: curve for curve, order in lower_orders.items() for crossing in order}
    upper_for = {crossing: curve for curve, order in upper_orders.items() for crossing in order}
    return DecoratedDiagram(
        name="T^3, Chang-Wang-Zhai Figure 3 framing f1",
        genus=3,
        combing=_zero_combing(3, "Chang-Wang-Zhai Figure 3 framing f1"),
        lower=tuple(Curve(curve, theta2=1, crossings=order) for curve, order in lower_orders.items()),
        upper=tuple(Curve(curve, theta2=-1, crossings=order) for curve, order in upper_orders.items()),
        crossings=tuple(
            Crossing(
                crossing,
                lower_for[crossing],
                upper_for[crossing],
                antipode_power=powers[crossing],
            )
            for crossing in tuple(lower_for)
        ),
        local_labels_certified=True,
    )
