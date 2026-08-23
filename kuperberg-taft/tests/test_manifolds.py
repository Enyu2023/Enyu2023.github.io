import unittest

from kuperberg_taft import TaftAlgebra, evaluate, lens_diagram, lens_l1_diagram, t3_diagram
from kuperberg_taft.reference_formulas import lens_l1_formula, t3_theorem3_formula


class ManifoldRegressionTests(unittest.TestCase):
    def test_stabilized_s3_is_one(self):
        result = evaluate(lens_l1_diagram(1), TaftAlgebra(3))
        self.assertEqual(result.value, result.value.field.one)

    def test_l7_1_published_taft_value(self):
        algebra = TaftAlgebra(7)
        result = evaluate(lens_diagram(7, 1, framing="fL"), algebra)
        self.assertEqual(result.value.as_coefficient_strings(), ["7", "-35", "-28", "-21", "-14", "-7"])
        self.assertEqual(result.states_evaluated, 6468)

    def test_l7_2_published_zero(self):
        result = evaluate(lens_diagram(7, 2, framing="fR"), TaftAlgebra(7))
        self.assertTrue(result.value.is_zero())

    def test_lens_preset_matches_separately_encoded_simplified_formula(self):
        algebra = TaftAlgebra(3)
        generic = evaluate(lens_l1_diagram(3), algebra).value
        self.assertEqual(generic, lens_l1_formula(3, algebra))

    def test_t3_matches_separately_encoded_theorem3_wiring(self):
        algebra = TaftAlgebra(3)
        generic = evaluate(t3_diagram(), algebra)
        direct = t3_theorem3_formula(algebra)
        self.assertEqual(generic.states_evaluated, 27_000)
        self.assertEqual(generic.value, direct)
        self.assertTrue(generic.value.is_zero())


if __name__ == "__main__":
    unittest.main()
