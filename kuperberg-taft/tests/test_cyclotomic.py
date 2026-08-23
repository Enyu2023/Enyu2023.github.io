import unittest

from kuperberg_taft.cyclotomic import CyclotomicField, cyclotomic_polynomial


class CyclotomicTests(unittest.TestCase):
    def test_early_order_guard_can_be_raised_explicitly(self):
        with self.assertRaisesRegex(ValueError, "above max_n=101"):
            cyclotomic_polynomial(103)
        self.assertEqual(len(cyclotomic_polynomial(103, max_n=103)), 103)
        with self.assertRaisesRegex(ValueError, "above max_n=101"):
            CyclotomicField(103)
        self.assertEqual(CyclotomicField(103, max_n=103).n, 103)

    def test_cyclotomic_polynomials(self):
        self.assertEqual(cyclotomic_polynomial(3), (1, 1, 1))
        self.assertEqual(cyclotomic_polynomial(7), (1, 1, 1, 1, 1, 1, 1))
        self.assertEqual(cyclotomic_polynomial(9), (1, 0, 0, 1, 0, 0, 1))

    def test_sum_of_all_seventh_roots_is_zero(self):
        field = CyclotomicField(7)
        self.assertEqual(sum((field.zeta_power(i) for i in range(7)), field.zero), field.zero)

    def test_multiplication_reduces_mod_phi(self):
        field = CyclotomicField(5)
        self.assertEqual(field.zeta_power(3) * field.zeta_power(4), field.zeta_power(2))


if __name__ == "__main__":
    unittest.main()
