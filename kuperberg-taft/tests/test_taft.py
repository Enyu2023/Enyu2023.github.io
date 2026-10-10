import unittest

from kuperberg_taft import TaftAlgebra


class TaftAlgebraTests(unittest.TestCase):
    def test_cyclotomic_allocation_guard_can_be_raised_explicitly(self):
        with self.assertRaisesRegex(ValueError, "above max_ell=101"):
            TaftAlgebra(103)
        self.assertEqual(TaftAlgebra(103, max_ell=103).ell, 103)

    def test_defining_relations(self):
        for ell in (3, 5, 7):
            with self.subTest(ell=ell):
                algebra = TaftAlgebra(ell)
                self.assertEqual(
                    algebra.multiply(algebra.g, algebra.x),
                    algebra.scale(algebra.multiply(algebra.x, algebra.g), algebra.q),
                )
                self.assertEqual(algebra.power(algebra.x, ell), {})
                self.assertEqual(algebra.power(algebra.g, ell), algebra.unit)

    def test_left_integral_and_normalization(self):
        for ell in (3, 5, 7):
            with self.subTest(ell=ell):
                algebra = TaftAlgebra(ell)
                self.assertEqual(algebra.multiply(algebra.g, algebra.left_integral), algebra.left_integral)
                self.assertEqual(algebra.multiply(algebra.x, algebra.left_integral), {})
                self.assertEqual(algebra.cointegral(algebra.left_integral), algebra.field.one)
                self.assertEqual(algebra.cointegral(algebra.right_integral), algebra.field.one)

    def test_corrected_right_cointegral_identity(self):
        # (lambda tensor id) Delta(h) = lambda(h) 1.
        for ell in (3, 5, 7):
            algebra = TaftAlgebra(ell)
            for basis in algebra.all_basis():
                lhs = {}
                for (left, right), coefficient in algebra.coproduct_basis(basis, 2).items():
                    value = algebra.cointegral(algebra.basis_element(left))
                    if value:
                        lhs[right] = lhs.get(right, algebra.field.zero) + coefficient * value
                lhs = {key: value for key, value in lhs.items() if value}
                rhs_value = algebra.cointegral(algebra.basis_element(basis))
                rhs = {} if not rhs_value else {algebra.one_basis: rhs_value}
                self.assertEqual(lhs, rhs, (ell, basis))

    def test_antipode_axioms(self):
        for ell in (3, 5):
            algebra = TaftAlgebra(ell)
            for basis in algebra.all_basis():
                left_total = {}
                right_total = {}
                for (first, second), coefficient in algebra.coproduct_basis(basis, 2).items():
                    s_first, phase_first = algebra.antipode_basis(first)
                    s_second, phase_second = algebra.antipode_basis(second)
                    product_left, phase_left = algebra.multiply_basis(s_first, second)
                    product_right, phase_right = algebra.multiply_basis(first, s_second)
                    if product_left is not None:
                        value = coefficient * phase_first * phase_left
                        left_total[product_left] = left_total.get(product_left, algebra.field.zero) + value
                    if product_right is not None:
                        value = coefficient * phase_second * phase_right
                        right_total[product_right] = right_total.get(product_right, algebra.field.zero) + value
                left_total = {key: value for key, value in left_total.items() if value}
                right_total = {key: value for key, value in right_total.items() if value}
                expected = algebra.scalar(algebra.counit_basis(basis))
                self.assertEqual(left_total, expected, (ell, basis, "left"))
                self.assertEqual(right_total, expected, (ell, basis, "right"))

    def test_half_index_integrals_and_tilt(self):
        algebra = TaftAlgebra(5)
        self.assertEqual(algebra.integral_variant(1), algebra.left_integral)
        for basis in algebra.all_basis():
            element = algebra.basis_element(basis)
            self.assertEqual(algebra.tilt(element, 17), element)
            self.assertEqual(
                algebra.cointegral_variant(-1, element),
                algebra.cointegral(element),
            )

    def test_root_power_must_be_primitive(self):
        with self.assertRaisesRegex(ValueError, "coprime"):
            TaftAlgebra(9, root_power=3)
        algebra = TaftAlgebra(9, root_power=2)
        self.assertEqual(algebra.q, algebra.field.zeta_power(2))

    def test_invalid_basis_exponents_are_rejected(self):
        algebra = TaftAlgebra(5)
        for basis in ((5, 0), (-1, 0), (0, 5), (0, -1)):
            with self.subTest(basis=basis), self.assertRaisesRegex(ValueError, "0 <= a,b"):
                algebra.basis_element(basis)

    def test_public_sparse_values_do_not_expose_mutable_caches(self):
        algebra = TaftAlgebra(3)
        x = algebra.x
        x.clear()
        self.assertEqual(algebra.x, algebra.basis_element((1, 0)))

        integral = algebra.left_integral
        integral.clear()
        self.assertTrue(algebra.left_integral)

        coproduct = algebra.coproduct_basis((1, 0), 2)
        coproduct.clear()
        self.assertTrue(algebra.coproduct_basis((1, 0), 2))


if __name__ == "__main__":
    unittest.main()
