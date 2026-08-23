import unittest

from kuperberg_taft import DecoratedDiagram, TaftAlgebra, evaluate, lens_diagram, t3_diagram
from kuperberg_taft.evaluator import StateSpaceTooLarge


class DiagramTests(unittest.TestCase):
    def test_lens_generator_allocation_guard_runs_before_compilation(self):
        with self.assertRaisesRegex(ValueError, "above max_crossings=4096"):
            lens_diagram(4097, 1)

    def test_json_round_trip(self):
        diagram = t3_diagram()
        self.assertEqual(DecoratedDiagram.from_json(diagram.to_json()), diagram)
        self.assertEqual(len(diagram.combing.flat), 4 * diagram.genus)

    def test_nonzero_4g_coordinates_need_certification(self):
        value = t3_diagram().to_dict()
        value["combing"]["alpha"][0] = 1
        value["local_labels_certified"] = False
        with self.assertRaisesRegex(ValueError, "local_labels_certified"):
            DecoratedDiagram.from_dict(value)
        value["local_labels_certified"] = True
        self.assertEqual(DecoratedDiagram.from_dict(value).combing.alpha[0], 1)

    def test_certification_must_be_literal_true(self):
        value = t3_diagram().to_dict()
        for malformed in (False, "false", 1, None):
            with self.subTest(malformed=malformed):
                value["local_labels_certified"] = malformed
                with self.assertRaisesRegex(ValueError, "JSON boolean true"):
                    DecoratedDiagram.from_dict(value)

    def test_unknown_keys_are_rejected(self):
        value = t3_diagram().to_dict()
        value["crossings"][0]["antipode_powre"] = 1
        with self.assertRaisesRegex(ValueError, "extra"):
            DecoratedDiagram.from_dict(value)

    def test_state_space_guard(self):
        with self.assertRaises(StateSpaceTooLarge):
            evaluate(t3_diagram(), TaftAlgebra(3), max_states=1)

    def test_tensor_width_guard_runs_before_materialization(self):
        wide = lens_diagram(1000, 1, framing="fL")
        with self.assertRaisesRegex(StateSpaceTooLarge, "tensor cells"):
            evaluate(wide, TaftAlgebra(3), max_tensor_cells=1_000)

    def test_cyclotomic_storage_guard_runs_before_integral_construction(self):
        algebra = TaftAlgebra(101)
        with self.assertRaisesRegex(StateSpaceTooLarge, "cyclotomic cells"):
            evaluate(
                lens_diagram(1, 1, framing="fL"),
                algebra,
                max_coefficient_cells=1_000,
            )
        self.assertNotIn("_left_integral_value", algebra.__dict__)

    def test_malformed_nested_json_gets_a_value_error(self):
        value = t3_diagram().to_dict()
        for key in ("combing", "lower", "upper", "crossings"):
            malformed = dict(value)
            malformed[key] = 3
            with self.subTest(key=key), self.assertRaises(ValueError):
                DecoratedDiagram.from_dict(malformed)

    def test_l8_3_preset_recursions(self):
        left = lens_diagram(8, 3, framing="fL")
        self.assertEqual(
            [crossing.antipode_power for crossing in left.crossings],
            [1, 3, 1, 1, 3, 1, 1, 3],
        )
        self.assertEqual(
            list(left.upper[0].crossings),
            ["p1", "p4", "p7", "p2", "p5", "p8", "p3", "p6"],
        )
        self.assertEqual(left.upper[0].theta2, -1)

        right = lens_diagram(8, 3, framing="fR")
        self.assertEqual(
            [crossing.antipode_power for crossing in right.crossings],
            [-1, -1, 1, 1, 1, -1, -1, 1],
        )
        self.assertEqual(
            list(right.upper[0].crossings),
            ["p8", "p3", "p6", "p1", "p4", "p7", "p2", "p5"],
        )
        self.assertEqual(right.upper[0].theta2, 1)


if __name__ == "__main__":
    unittest.main()
