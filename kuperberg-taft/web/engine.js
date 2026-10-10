(function attachKuperbergTaft(globalScope) {
  "use strict";

  const CONVENTION = "cnw-2025-corrected-right-cointegral";
  const DEFAULT_LIMIT = 10_000_000;
  const DEFAULT_MAX_ELL = 101;
  const DEFAULT_MAX_LENS_CROSSINGS = 4_096;
  const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

  class StateSpaceTooLarge extends Error {
    constructor(message) {
      super(message);
      this.name = "StateSpaceTooLarge";
    }
  }

  function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function safeInteger(value, context) {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`${context} must be a safe integer`);
    }
    return value;
  }

  function positiveSafeInteger(value, context) {
    safeInteger(value, context);
    if (value < 1) throw new RangeError(`${context} must be positive`);
    return value;
  }

  function nonEmptyString(value, context) {
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError(`${context} must be a non-empty string`);
    }
    return value;
  }

  function arrayValue(value, context) {
    if (!Array.isArray(value)) throw new TypeError(`${context} must be an array`);
    return value;
  }

  function objectValue(value, context) {
    if (!isPlainObject(value)) throw new TypeError(`${context} must be an object`);
    return value;
  }

  function checkKeys(value, required, optional, context) {
    objectValue(value, context);
    const allowed = new Set([...required, ...optional]);
    const missing = required.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
    const extra = Object.keys(value).filter((key) => !allowed.has(key));
    if (missing.length || extra.length) {
      throw new TypeError(
        `${context} keys are invalid; missing=[${missing.sort().join(", ")}], ` +
          `extra=[${extra.sort().join(", ")}]`,
      );
    }
  }

  function modulo(value, modulus) {
    if (typeof value === "bigint") {
      const m = BigInt(modulus);
      const reduced = value % m;
      return Number(reduced < 0n ? reduced + m : reduced);
    }
    const reduced = value % modulus;
    return reduced < 0 ? reduced + modulus : reduced;
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x;
  }

  function eulerPhi(n) {
    let value = n;
    let remainder = n;
    for (let p = 2; p * p <= remainder; p += 1) {
      if (remainder % p !== 0) continue;
      while (remainder % p === 0) remainder /= p;
      value -= value / p;
    }
    if (remainder > 1) value -= value / remainder;
    return value;
  }

  function trimPolynomial(polynomial) {
    while (polynomial.length > 1 && polynomial[polynomial.length - 1] === 0n) {
      polynomial.pop();
    }
    return polynomial;
  }

  function polynomialDivideExact(numerator, denominator) {
    const work = numerator.slice();
    const divisor = trimPolynomial(denominator.slice());
    if (divisor[divisor.length - 1] !== 1n) {
      throw new Error("exact polynomial division expects a monic denominator");
    }
    if (work.length < divisor.length) throw new Error("polynomial is not divisible");
    const quotient = Array(work.length - divisor.length + 1).fill(0n);
    trimPolynomial(work);
    while (work.length >= divisor.length) {
      const coefficient = work[work.length - 1];
      const shift = work.length - divisor.length;
      quotient[shift] = coefficient;
      for (let i = 0; i < divisor.length; i += 1) {
        work[i + shift] -= coefficient * divisor[i];
      }
      trimPolynomial(work);
    }
    if (work.some((coefficient) => coefficient !== 0n)) {
      throw new Error("non-exact cyclotomic polynomial division");
    }
    return trimPolynomial(quotient);
  }

  const cyclotomicCache = new Map();

  function cyclotomicPolynomialUnchecked(n) {
    positiveSafeInteger(n, "cyclotomic index");
    const cached = cyclotomicCache.get(n);
    if (cached) return cached.slice();
    let polynomial = Array(n + 1).fill(0n);
    polynomial[0] = -1n;
    polynomial[n] = 1n;
    for (let divisor = 1; divisor < n; divisor += 1) {
      if (n % divisor === 0) {
        polynomial = polynomialDivideExact(polynomial, cyclotomicPolynomialUnchecked(divisor));
      }
    }
    cyclotomicCache.set(n, Object.freeze(polynomial.slice()));
    return polynomial;
  }

  function cyclotomicPolynomial(n, options = {}) {
    positiveSafeInteger(n, "cyclotomic index");
    objectValue(options, "cyclotomic options");
    const allowed = new Set(["maxOrder", "max_order"]);
    const extra = Object.keys(options).filter((key) => !allowed.has(key));
    if (extra.length) {
      throw new TypeError(`cyclotomic options contain unknown keys: ${extra.join(", ")}`);
    }
    const maxOrder = parseLimit(
      optionValue(options, "maxOrder", "max_order", DEFAULT_MAX_ELL),
      "maxOrder",
    );
    guarded(
      BigInt(n),
      maxOrder,
      (estimate, limit) =>
        `cyclotomic order ${estimate} is above maxOrder=${limit}; ` +
        "raise maxOrder explicitly if this allocation is intended",
    );
    return cyclotomicPolynomialUnchecked(n);
  }

  function bigintScalar(value, context = "scalar") {
    if (typeof value === "bigint") return value;
    if (Number.isSafeInteger(value)) return BigInt(value);
    throw new TypeError(`${context} must be a BigInt or safe integer`);
  }

  class CyclotomicElement {
    constructor(field, coefficients, alreadyReduced = false) {
      if (!(field instanceof CyclotomicField)) throw new TypeError("field is invalid");
      this.field = field;
      const values = alreadyReduced
        ? coefficients.map((value) => bigintScalar(value, "coefficient"))
        : field.reduce(coefficients);
      if (values.length !== field.degree) {
        throw new Error("coefficient vector has the wrong cyclotomic degree");
      }
      this.coefficients = Object.freeze(values);
      Object.freeze(this);
    }

    coerce(other) {
      if (other instanceof CyclotomicElement) {
        if (other.field !== this.field) {
          throw new TypeError("cannot mix elements from different cyclotomic fields");
        }
        return other;
      }
      return this.field.scalar(other);
    }

    add(other) {
      const right = this.coerce(other);
      return new CyclotomicElement(
        this.field,
        this.coefficients.map((value, index) => value + right.coefficients[index]),
        true,
      );
    }

    negate() {
      return new CyclotomicElement(
        this.field,
        this.coefficients.map((value) => -value),
        true,
      );
    }

    subtract(other) {
      return this.add(this.coerce(other).negate());
    }

    multiply(other) {
      const right = this.coerce(other);
      const product = Array(2 * this.field.degree - 1).fill(0n);
      for (let i = 0; i < this.coefficients.length; i += 1) {
        const leftValue = this.coefficients[i];
        if (leftValue === 0n) continue;
        for (let j = 0; j < right.coefficients.length; j += 1) {
          const rightValue = right.coefficients[j];
          if (rightValue !== 0n) product[i + j] += leftValue * rightValue;
        }
      }
      return new CyclotomicElement(this.field, product);
    }

    power(exponent) {
      safeInteger(exponent, "field exponent");
      if (exponent < 0) throw new RangeError("negative field powers are not implemented");
      let result = this.field.one;
      let base = this;
      let remaining = exponent;
      while (remaining) {
        if (remaining % 2 === 1) result = result.multiply(base);
        remaining = Math.floor(remaining / 2);
        if (remaining) base = base.multiply(base);
      }
      return result;
    }

    isZero() {
      return this.coefficients.every((value) => value === 0n);
    }

    equals(other) {
      return (
        other instanceof CyclotomicElement &&
        other.field === this.field &&
        this.coefficients.every((value, index) => value === other.coefficients[index])
      );
    }

    asCoefficientStrings() {
      return this.coefficients.map((value) => value.toString());
    }

    approximate() {
      const angle = (2 * Math.PI) / this.field.n;
      let real = 0;
      let imag = 0;
      for (let exponent = 0; exponent < this.coefficients.length; exponent += 1) {
        const coefficient = Number(this.coefficients[exponent]);
        real += coefficient * Math.cos(angle * exponent);
        imag += coefficient * Math.sin(angle * exponent);
      }
      return {
        real: Number.isFinite(real) ? real : null,
        imag: Number.isFinite(imag) ? imag : null,
      };
    }

    toString() {
      const terms = [];
      for (let exponent = 0; exponent < this.coefficients.length; exponent += 1) {
        const coefficient = this.coefficients[exponent];
        if (coefficient === 0n) continue;
        const negative = coefficient < 0n;
        const magnitude = negative ? -coefficient : coefficient;
        let body;
        if (exponent === 0) {
          body = magnitude.toString();
        } else {
          const variable = exponent === 1 ? "zeta" : `zeta^${exponent}`;
          body = magnitude === 1n ? variable : `${magnitude}*${variable}`;
        }
        if (terms.length === 0) terms.push(negative ? `-${body}` : body);
        else terms.push(`${negative ? " - " : " + "}${body}`);
      }
      return terms.length ? terms.join("") : "0";
    }
  }

  class CyclotomicField {
    constructor(n, options = {}) {
      positiveSafeInteger(n, "n");
      if (n < 2) throw new RangeError("n must be at least 2");
      objectValue(options, "field options");
      const allowed = new Set(["maxOrder", "max_order"]);
      const extra = Object.keys(options).filter((key) => !allowed.has(key));
      if (extra.length) throw new TypeError(`field options contain unknown keys: ${extra.join(", ")}`);
      const maxOrder = parseLimit(
        optionValue(options, "maxOrder", "max_order", DEFAULT_MAX_ELL),
        "maxOrder",
      );
      guarded(
        BigInt(n),
        maxOrder,
        (estimate, limit) =>
          `cyclotomic order ${estimate} is above maxOrder=${limit}; ` +
          "raise maxOrder explicitly if this allocation is intended",
      );
      this.n = n;
      this.modulus = Object.freeze(cyclotomicPolynomialUnchecked(n));
      this.degree = this.modulus.length - 1;
      this.powerCache = new Map();
      this.zero = new CyclotomicElement(this, Array(this.degree).fill(0n), true);
      const oneCoefficients = Array(this.degree).fill(0n);
      oneCoefficients[0] = 1n;
      this.one = new CyclotomicElement(this, oneCoefficients, true);
    }

    reduce(coefficients) {
      const work = Array.from(coefficients, (value) => bigintScalar(value, "coefficient"));
      if (work.length === 0) work.push(0n);
      while (work.length > this.degree) {
        const leading = work[work.length - 1];
        if (leading !== 0n) {
          const shift = work.length - 1 - this.degree;
          for (let index = 0; index < this.degree; index += 1) {
            work[index + shift] -= leading * this.modulus[index];
          }
        }
        work.pop();
      }
      while (work.length < this.degree) work.push(0n);
      return work;
    }

    element(coefficients) {
      return new CyclotomicElement(this, Array.from(coefficients));
    }

    scalar(value) {
      const scalarValue = bigintScalar(value);
      if (scalarValue === 0n) return this.zero;
      if (scalarValue === 1n) return this.one;
      const coefficients = Array(this.degree).fill(0n);
      coefficients[0] = scalarValue;
      return new CyclotomicElement(this, coefficients, true);
    }

    zetaPower(exponent) {
      if (typeof exponent !== "bigint") safeInteger(exponent, "root exponent");
      const reduced = modulo(exponent, this.n);
      const cached = this.powerCache.get(reduced);
      if (cached) return cached;
      const monomial = Array(reduced + 1).fill(0n);
      monomial[reduced] = 1n;
      const result = new CyclotomicElement(this, monomial);
      this.powerCache.set(reduced, result);
      return result;
    }

    get zeta() {
      return this.zetaPower(1);
    }
  }

  function basisKey(basis) {
    return `${basis[0]},${basis[1]}`;
  }

  function tensorKey(bases) {
    return bases.map(basisKey).join("|");
  }

  function putTerm(target, key, basis, value, field) {
    if (value.isZero()) return;
    const previous = target.get(key);
    const updated = previous ? previous.coefficient.add(value) : value;
    if (updated.isZero()) target.delete(key);
    else target.set(key, { basis, coefficient: updated });
  }

  function freezeBasis(basis) {
    basis.forEach((entry) => {
      if (Array.isArray(entry)) freezeBasis(entry);
    });
    return Object.freeze(basis);
  }

  function freezeSparseTerms(value) {
    for (const term of value.values()) {
      freezeBasis(term.basis);
      Object.freeze(term);
    }
    return value;
  }

  function cloneSparse(value) {
    // Cached terms and their nested basis arrays are frozen before exposure,
    // so cloning the Map is both safe and substantially cheaper than copying
    // every tensor basis on every coproduct lookup.
    return new Map(value);
  }

  class TaftAlgebra {
    constructor(ell, rootPower = 1, options = {}) {
      positiveSafeInteger(ell, "ell");
      if (ell < 3 || ell % 2 === 0) {
        throw new RangeError("this implementation requires an odd ell >= 3");
      }
      safeInteger(rootPower, "rootPower");
      const normalizedRoot = modulo(rootPower, ell);
      if (gcd(normalizedRoot, ell) !== 1) {
        throw new RangeError(
          "rootPower must be coprime to ell so that zeta^rootPower is primitive",
        );
      }
      objectValue(options, "Taft options");
      const allowed = new Set(["maxEll", "max_ell"]);
      const extra = Object.keys(options).filter((key) => !allowed.has(key));
      if (extra.length) throw new TypeError(`Taft options contain unknown keys: ${extra.join(", ")}`);
      const maxEll = parseLimit(
        optionValue(options, "maxEll", "max_ell", DEFAULT_MAX_ELL),
        "maxEll",
      );
      guarded(
        BigInt(ell),
        maxEll,
        (estimate, limit) =>
          `Taft level ell=${estimate} is above maxEll=${limit}; ` +
          "raise maxEll explicitly if this cyclotomic allocation is intended",
      );
      this.ell = ell;
      this.rootPower = normalizedRoot;
      this.field = new CyclotomicField(ell, { maxOrder: maxEll });
      this.coproductCache = new Map();
      this.coproductXPowerCache = new Map();
      this.leftIntegralCache = null;
      this.rightIntegralCache = null;
    }

    get dimension() {
      return this.ell * this.ell;
    }

    get q() {
      return this.field.zetaPower(this.rootPower);
    }

    qPower(exponent) {
      const value = typeof exponent === "bigint" ? exponent : BigInt(safeInteger(exponent, "q exponent"));
      return this.field.zetaPower(BigInt(this.rootPower) * value);
    }

    validateBasis(basis, context = "basis") {
      if (!Array.isArray(basis) || basis.length !== 2) {
        throw new TypeError(`${context} must be a pair [a,b]`);
      }
      const a = safeInteger(basis[0], `${context}[0]`);
      const b = safeInteger(basis[1], `${context}[1]`);
      if (a < 0 || a >= this.ell || b < 0 || b >= this.ell) {
        throw new RangeError(`${context} must satisfy 0 <= a,b < ell=${this.ell}`);
      }
      return [a, b];
    }

    basisElement(basis, coefficient = 1) {
      const normalized = this.validateBasis(basis);
      const value =
        coefficient instanceof CyclotomicElement ? coefficient : this.field.scalar(coefficient);
      if (value.field !== this.field) throw new TypeError("coefficient belongs to another field");
      return value.isZero()
        ? new Map()
        : new Map([[basisKey(normalized), { basis: normalized, coefficient: value }]]);
    }

    scalar(value) {
      return this.basisElement([0, 0], value);
    }

    add(...elements) {
      const result = new Map();
      for (const element of elements) {
        for (const [key, term] of element) {
          putTerm(result, key, term.basis, term.coefficient, this.field);
        }
      }
      return result;
    }

    scale(element, scalar) {
      const value = scalar instanceof CyclotomicElement ? scalar : this.field.scalar(scalar);
      const result = new Map();
      for (const [key, term] of element) {
        const coefficient = term.coefficient.multiply(value);
        if (!coefficient.isZero()) result.set(key, { basis: term.basis, coefficient });
      }
      return result;
    }

    multiplyBasis(left, right) {
      const [a, b] = this.validateBasis(left, "left basis");
      const [c, d] = this.validateBasis(right, "right basis");
      if (a + c >= this.ell) return [null, this.field.zero];
      return [[a + c, modulo(b + d, this.ell)], this.qPower(BigInt(b) * BigInt(c))];
    }

    multiply(left, right) {
      const result = new Map();
      for (const leftTerm of left.values()) {
        for (const rightTerm of right.values()) {
          const [basis, phase] = this.multiplyBasis(leftTerm.basis, rightTerm.basis);
          if (basis !== null) {
            putTerm(
              result,
              basisKey(basis),
              basis,
              leftTerm.coefficient.multiply(rightTerm.coefficient).multiply(phase),
              this.field,
            );
          }
        }
      }
      return result;
    }

    power(element, exponent) {
      safeInteger(exponent, "algebra exponent");
      if (exponent < 0) throw new RangeError("negative algebra powers are not supported");
      let result = this.scalar(1);
      // Arithmetic treats sparse inputs as immutable; a shallow map copy is
      // sufficient internally. Public cache boundaries use cloneSparse.
      let base = new Map(element);
      let remaining = exponent;
      while (remaining) {
        if (remaining % 2 === 1) result = this.multiply(result, base);
        remaining = Math.floor(remaining / 2);
        if (remaining) base = this.multiply(base, base);
      }
      return result;
    }

    antipodeBasis(basis, exponent = 1) {
      const [a, b] = this.validateBasis(basis);
      safeInteger(exponent, "antipode exponent");
      const reduced = modulo(BigInt(exponent), 2 * this.ell);
      const half = Math.floor(reduced / 2);
      const odd = reduced % 2;
      let coefficient = this.qPower(BigInt(half) * BigInt(a));
      if (!odd) return [[a, b], coefficient];
      const sign = a % 2 ? -1 : 1;
      const phaseExponent = -BigInt(a) * BigInt(b) - (BigInt(a) * BigInt(a - 1)) / 2n;
      coefficient = coefficient.multiply(this.qPower(phaseExponent)).multiply(sign);
      return [[a, modulo(-a - b, this.ell)], coefficient];
    }

    antipode(element, exponent = 1) {
      const result = new Map();
      for (const term of element.values()) {
        const [basis, phase] = this.antipodeBasis(term.basis, exponent);
        putTerm(
          result,
          basisKey(basis),
          basis,
          term.coefficient.multiply(phase),
          this.field,
        );
      }
      return result;
    }

    tensorMultiply(left, right) {
      const result = new Map();
      for (const leftTerm of left.values()) {
        for (const rightTerm of right.values()) {
          if (leftTerm.basis.length !== rightTerm.basis.length) {
            throw new Error("tensor arities do not agree");
          }
          const output = [];
          let phase = this.field.one;
          let vanishes = false;
          for (let index = 0; index < leftTerm.basis.length; index += 1) {
            const [basis, localPhase] = this.multiplyBasis(
              leftTerm.basis[index],
              rightTerm.basis[index],
            );
            if (basis === null) {
              vanishes = true;
              break;
            }
            output.push(basis);
            phase = phase.multiply(localPhase);
          }
          if (!vanishes) {
            putTerm(
              result,
              tensorKey(output),
              output,
              leftTerm.coefficient.multiply(rightTerm.coefficient).multiply(phase),
              this.field,
            );
          }
        }
      }
      return result;
    }

    tensorPower(element, exponent, arity) {
      safeInteger(exponent, "tensor exponent");
      if (exponent < 0) throw new RangeError("negative tensor powers are not supported");
      positiveSafeInteger(arity, "tensor arity");
      const identity = Array.from({ length: arity }, () => [0, 0]);
      let result = new Map([
        [tensorKey(identity), { basis: identity, coefficient: this.field.one }],
      ]);
      let base = new Map(element);
      let remaining = exponent;
      while (remaining) {
        if (remaining % 2 === 1) result = this.tensorMultiply(result, base);
        remaining = Math.floor(remaining / 2);
        if (remaining) base = this.tensorMultiply(base, base);
      }
      return result;
    }

    coproductBasis(basis, arity) {
      positiveSafeInteger(arity, "coproduct arity");
      const normalized = this.validateBasis(basis);
      const cacheKey = `${basisKey(normalized)};${arity}`;
      const cached = this.coproductCache.get(cacheKey);
      if (cached) return cloneSparse(cached);
      const [a, b] = normalized;
      const deltaX = new Map();
      for (let position = 0; position < arity; position += 1) {
        const monomial = [];
        for (let index = 0; index < arity; index += 1) {
          monomial.push(index < position ? [0, 0] : index === position ? [1, 0] : [0, 1]);
        }
        deltaX.set(tensorKey(monomial), { basis: monomial, coefficient: this.field.one });
      }
      const xCacheKey = `${a};${arity}`;
      let xPower = this.coproductXPowerCache.get(xCacheKey);
      if (!xPower) {
        xPower = this.tensorPower(deltaX, a, arity);
        this.coproductXPowerCache.set(xCacheKey, xPower);
      }
      const deltaG = Array.from({ length: arity }, () => [0, 1]);
      const gPower = this.tensorPower(
        new Map([[tensorKey(deltaG), { basis: deltaG, coefficient: this.field.one }]]),
        b,
        arity,
      );
      const result = this.tensorMultiply(xPower, gPower);
      freezeSparseTerms(result);
      this.coproductCache.set(cacheKey, result);
      return cloneSparse(result);
    }

    iteratedCoproduct(element, arity) {
      positiveSafeInteger(arity, "coproduct arity");
      const result = new Map();
      for (const term of element.values()) {
        const expansion = this.coproductBasis(term.basis, arity);
        for (const expanded of expansion.values()) {
          putTerm(
            result,
            tensorKey(expanded.basis),
            expanded.basis,
            term.coefficient.multiply(expanded.coefficient),
            this.field,
          );
        }
      }
      return result;
    }

    get leftIntegral() {
      if (this.leftIntegralCache) return cloneSparse(this.leftIntegralCache);
      const xTop = this.power(this.basisElement([1, 0]), this.ell - 1);
      const terms = [];
      const g = this.basisElement([0, 1]);
      for (let exponent = 1; exponent <= this.ell; exponent += 1) {
        terms.push(this.multiply(this.power(g, exponent), xTop));
      }
      this.leftIntegralCache = freezeSparseTerms(this.add(...terms));
      return cloneSparse(this.leftIntegralCache);
    }

    get rightIntegral() {
      if (!this.rightIntegralCache) {
        this.rightIntegralCache = freezeSparseTerms(this.antipode(this.leftIntegral));
      }
      return cloneSparse(this.rightIntegralCache);
    }

    integralVariant(index2) {
      safeInteger(index2, "integral index");
      if (index2 % 2 === 0) {
        throw new RangeError("integral index must be a half-integer (odd doubled index)");
      }
      const n = (BigInt(index2) + 1n) / 2n;
      const result = new Map();
      for (const term of this.rightIntegral.values()) {
        const [a, b] = term.basis;
        const phase = this.qPower(-n * BigInt(a + b));
        putTerm(
          result,
          basisKey(term.basis),
          term.basis,
          term.coefficient.multiply(phase),
          this.field,
        );
      }
      return result;
    }

    cointegralVariantBasis(index2, basis) {
      safeInteger(index2, "cointegral index");
      if (index2 % 2 === 0) {
        throw new RangeError("cointegral index must be a half-integer (odd doubled index)");
      }
      const normalized = this.validateBasis(basis);
      const n = (BigInt(index2) + 1n) / 2n;
      const targetB = modulo(1n - n, this.ell);
      return normalized[0] === this.ell - 1 && normalized[1] === targetB
        ? this.q
        : this.field.zero;
    }
  }

  function validateCurve(value, context) {
    checkKeys(value, ["id", "theta2", "crossings"], [], context);
    const id = nonEmptyString(value.id, `${context}.id`);
    const theta2 = safeInteger(value.theta2, `${context}.theta2`);
    if (theta2 % 2 === 0) {
      throw new RangeError(`${context} ${JSON.stringify(id)}: theta2 must be an odd integer`);
    }
    const crossings = arrayValue(value.crossings, `${context}.crossings`).map((crossing, index) =>
      nonEmptyString(crossing, `${context}.crossings[${index}]`),
    );
    if (new Set(crossings).size !== crossings.length) {
      throw new TypeError(`${context} ${JSON.stringify(id)}: a crossing id occurs more than once`);
    }
    return { id, theta2, crossings };
  }

  function validateCrossing(value, context) {
    checkKeys(
      value,
      ["id", "lower", "upper", "antipode_power"],
      ["tilt_power"],
      context,
    );
    return {
      id: nonEmptyString(value.id, `${context}.id`),
      lower: nonEmptyString(value.lower, `${context}.lower`),
      upper: nonEmptyString(value.upper, `${context}.upper`),
      antipode_power: safeInteger(value.antipode_power, `${context}.antipode_power`),
      tilt_power: safeInteger(value.tilt_power ?? 0, `${context}.tilt_power`),
    };
  }

  function validateDiagram(input) {
    let value = input;
    if (typeof input === "string") {
      try {
        value = JSON.parse(input);
      } catch (error) {
        throw new SyntaxError(`diagram JSON is invalid: ${error.message}`);
      }
    }
    objectValue(value, "diagram");
    checkKeys(
      value,
      [
        "schema_version",
        "convention",
        "local_labels_certified",
        "name",
        "genus",
        "combing",
        "lower",
        "upper",
        "crossings",
      ],
      [],
      "diagram",
    );
    if (value.schema_version !== 1) {
      throw new RangeError(`unsupported schema_version ${String(value.schema_version)}; expected 1`);
    }
    if (value.convention !== CONVENTION) {
      throw new RangeError(`unsupported convention; expected ${JSON.stringify(CONVENTION)}`);
    }
    if (value.local_labels_certified !== true) {
      throw new TypeError(
        "local_labels_certified must be the JSON boolean true; this asserts that the " +
          "explicit local labels encode the stated diagram and combing",
      );
    }
    const name = nonEmptyString(value.name, "diagram.name");
    const genus = positiveSafeInteger(value.genus, "diagram.genus");
    const combingValue = objectValue(value.combing, "diagram.combing");
    checkKeys(
      combingValue,
      ["kind", "reference", "alpha", "beta", "nu", "mu"],
      [],
      "combing",
    );
    if (combingValue.kind !== "difference_to_reference") {
      throw new RangeError("combing.kind must be 'difference_to_reference'");
    }
    const combing = {
      kind: "difference_to_reference",
      reference: nonEmptyString(combingValue.reference, "combing.reference"),
    };
    for (const coordinate of ["alpha", "beta", "nu", "mu"]) {
      const entries = arrayValue(combingValue[coordinate], `combing.${coordinate}`);
      if (entries.length !== genus) {
        throw new RangeError(`combing.${coordinate} must contain exactly genus=${genus} integers`);
      }
      combing[coordinate] = entries.map((entry, index) =>
        safeInteger(entry, `combing.${coordinate}[${index}]`),
      );
    }
    const lowerValues = arrayValue(value.lower, "diagram.lower");
    const upperValues = arrayValue(value.upper, "diagram.upper");
    if (lowerValues.length !== genus || upperValues.length !== genus) {
      throw new RangeError("a genus-g diagram must have exactly g lower and g upper curves");
    }
    const lower = lowerValues.map((curve, index) =>
      validateCurve(objectValue(curve, `diagram.lower[${index}]`), `lower curve[${index}]`),
    );
    const upper = upperValues.map((curve, index) =>
      validateCurve(objectValue(curve, `diagram.upper[${index}]`), `upper curve[${index}]`),
    );
    const crossings = arrayValue(value.crossings, "diagram.crossings").map((crossing, index) =>
      validateCrossing(
        objectValue(crossing, `diagram.crossings[${index}]`),
        `crossing[${index}]`,
      ),
    );

    const lowerById = new Map(lower.map((curve) => [curve.id, curve]));
    const upperById = new Map(upper.map((curve) => [curve.id, curve]));
    const crossingById = new Map(crossings.map((crossing) => [crossing.id, crossing]));
    if (lowerById.size !== lower.length) throw new TypeError("lower curve ids must be unique");
    if (upperById.size !== upper.length) throw new TypeError("upper curve ids must be unique");
    if (crossingById.size !== crossings.length) throw new TypeError("crossing ids must be unique");

    const seenLower = new Map();
    const seenUpper = new Map();
    for (const curve of lower) {
      for (const crossingId of curve.crossings) {
        if (!crossingById.has(crossingId)) {
          throw new TypeError(`lower curve ${JSON.stringify(curve.id)} refers to unknown crossing ${JSON.stringify(crossingId)}`);
        }
        if (seenLower.has(crossingId)) {
          throw new TypeError(`crossing ${JSON.stringify(crossingId)} occurs on two lower curves`);
        }
        seenLower.set(crossingId, curve.id);
      }
    }
    for (const curve of upper) {
      for (const crossingId of curve.crossings) {
        if (!crossingById.has(crossingId)) {
          throw new TypeError(`upper curve ${JSON.stringify(curve.id)} refers to unknown crossing ${JSON.stringify(crossingId)}`);
        }
        if (seenUpper.has(crossingId)) {
          throw new TypeError(`crossing ${JSON.stringify(crossingId)} occurs on two upper curves`);
        }
        seenUpper.set(crossingId, curve.id);
      }
    }
    if (seenLower.size !== crossings.length || seenUpper.size !== crossings.length) {
      throw new TypeError(
        "every crossing must occur exactly once in a lower order and once in an upper order",
      );
    }
    for (const crossing of crossings) {
      if (!lowerById.has(crossing.lower) || !upperById.has(crossing.upper)) {
        throw new TypeError(`crossing ${JSON.stringify(crossing.id)} names an unknown incident curve`);
      }
      if (
        seenLower.get(crossing.id) !== crossing.lower ||
        seenUpper.get(crossing.id) !== crossing.upper
      ) {
        throw new TypeError(
          `crossing ${JSON.stringify(crossing.id)} incident-curve metadata disagrees with curve orders`,
        );
      }
    }
    return {
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: true,
      name,
      genus,
      combing,
      lower,
      upper,
      crossings,
    };
  }

  function zeroCombing(genus, reference) {
    const zeros = Array(genus).fill(0);
    return {
      kind: "difference_to_reference",
      reference,
      alpha: zeros.slice(),
      beta: zeros.slice(),
      nu: zeros.slice(),
      mu: zeros.slice(),
    };
  }

  function cyclicValues(n, step, start, initial, delta) {
    const values = Array(n + 1).fill(null);
    values[start] = initial;
    let current = start;
    for (let iteration = 0; iteration < n; iteration += 1) {
      const following = modulo(current + step - 1, n) + 1;
      const candidate = values[current] + delta(current);
      if (values[following] !== null && values[following] !== candidate) {
        throw new RangeError("inconsistent lens-space rotation recursion");
      }
      values[following] = candidate;
      current = following;
    }
    if (current !== start || values.slice(1).some((value) => value === null)) {
      throw new RangeError("lens-space rotation recursion did not form one cycle");
    }
    return values.slice(1);
  }

  function lensDiagram(n, k, options = {}) {
    positiveSafeInteger(n, "n");
    positiveSafeInteger(k, "k");
    objectValue(options, "lens options");
    const allowed = new Set(["framing", "maxCrossings", "max_crossings"]);
    const extra = Object.keys(options).filter((key) => !allowed.has(key));
    if (extra.length) throw new TypeError(`lens options contain unknown keys: ${extra.join(", ")}`);
    const maxCrossings = parseLimit(
      optionValue(
        options,
        "maxCrossings",
        "max_crossings",
        DEFAULT_MAX_LENS_CROSSINGS,
      ),
      "maxCrossings",
    );
    guarded(
      BigInt(n),
      maxCrossings,
      (estimate, limit) =>
        `lens diagram needs ${estimate} crossings, above maxCrossings=${limit}; ` +
        "raise the limit explicitly if this allocation is intended",
    );
    if (!((n > k && k > 0) || (n === 1 && k === 1)) || gcd(n, k) !== 1) {
      throw new RangeError("lens preset requires coprime n > k > 0, or the S^3 case (1,1)");
    }
    let framing = options.framing ?? "auto";
    if (framing === "auto") framing = k % 2 === 1 ? "fL" : "fR";
    if (framing !== "fL" && framing !== "fR") {
      throw new RangeError("framing must be 'auto', 'fL', or 'fR'");
    }

    let powers;
    let upperIndices;
    let upperTheta2;
    if (framing === "fL") {
      if (k % 2 === 0) throw new RangeError("the fL preset requires odd k");
      const k1 = (k - 1) / 2;
      powers = cyclicValues(n, k, 1, 1, (index) => {
        if (index <= n - k + 1) return 0;
        if (index <= n - k1) return 2;
        return -2;
      });
      upperIndices = [1];
      while (upperIndices.length < n) {
        upperIndices.push(modulo(upperIndices[upperIndices.length - 1] + k - 1, n) + 1);
      }
      upperTheta2 = -1;
    } else {
      if ((n - k) % 2 === 0) throw new RangeError("the fR preset requires odd n-k");
      const k0 = (n - k - 1) / 2;
      const cValues = cyclicValues(n, k, n, 0, (index) => {
        if (index <= k0) return 1;
        if (index <= 2 * k0) return -1;
        return 0;
      });
      powers = cValues.map((value) => 2 * value + 1);
      upperIndices = [n];
      while (upperIndices.length < n) {
        upperIndices.push(modulo(upperIndices[upperIndices.length - 1] + k - 1, n) + 1);
      }
      upperTheta2 = 1;
    }
    const ids = Array.from({ length: n }, (_, index) => `p${index + 1}`);
    const upperIds = upperIndices.map((index) => `p${index}`);
    const reference = `Chang-Ng-Wang L(${n},${k}) ${framing}`;
    return validateDiagram({
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: true,
      name: `L(${n},${k}), Chang-Ng-Wang ${framing} framing`,
      genus: 1,
      combing: zeroCombing(1, reference),
      lower: [{ id: "eta1", theta2: 1, crossings: ids }],
      upper: [{ id: "mu1", theta2: upperTheta2, crossings: upperIds }],
      crossings: ids.map((id, index) => ({
        id,
        lower: "eta1",
        upper: "mu1",
        antipode_power: powers[index],
        tilt_power: 0,
      })),
    });
  }

  function t3Diagram() {
    const lowerOrders = {
      eta1: ["p1", "p2", "p3", "p4"],
      eta2: ["q1", "q2", "q3", "q4"],
      eta3: ["r1", "r2", "r3", "r4"],
    };
    const upperOrders = {
      mu1: ["p1", "r4", "p3", "r2"],
      mu2: ["q1", "p2", "q3", "p4"],
      mu3: ["r1", "q2", "r3", "q4"],
    };
    const powers = {
      p1: 1,
      p2: 2,
      p3: 2,
      p4: 1,
      q1: 1,
      q2: 1,
      q3: 2,
      q4: 2,
      r1: 1,
      r2: 3,
      r3: 2,
      r4: 2,
    };
    const lowerFor = new Map();
    const upperFor = new Map();
    for (const [curve, order] of Object.entries(lowerOrders)) {
      for (const crossing of order) lowerFor.set(crossing, curve);
    }
    for (const [curve, order] of Object.entries(upperOrders)) {
      for (const crossing of order) upperFor.set(crossing, curve);
    }
    const reference = "Chang-Wang-Zhai Figure 3 framing f1";
    return validateDiagram({
      schema_version: 1,
      convention: CONVENTION,
      local_labels_certified: true,
      name: "T^3, Chang-Wang-Zhai Figure 3 framing f1",
      genus: 3,
      combing: zeroCombing(3, reference),
      lower: Object.entries(lowerOrders).map(([id, crossings]) => ({
        id,
        theta2: 1,
        crossings,
      })),
      upper: Object.entries(upperOrders).map(([id, crossings]) => ({
        id,
        theta2: -1,
        crossings,
      })),
      crossings: Array.from(lowerFor, ([id, lower]) => ({
        id,
        lower,
        upper: upperFor.get(id),
        antipode_power: powers[id],
        tilt_power: 0,
      })),
    });
  }

  function binomial(n, k) {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || k < 0 || k > n) {
      throw new RangeError("invalid binomial arguments");
    }
    const reducedK = Math.min(k, n - k);
    let value = 1n;
    for (let index = 1; index <= reducedK; index += 1) {
      value = (value * BigInt(n - reducedK + index)) / BigInt(index);
    }
    return value;
  }

  function productBigInt(values) {
    return values.reduce((product, value) => product * value, 1n);
  }

  function parseLimit(value, name) {
    if (value === null) return null;
    if (value === undefined) return BigInt(DEFAULT_LIMIT);
    if (typeof value === "bigint") {
      if (value < 1n) throw new RangeError(`${name} must be a positive integer or null`);
      return value;
    }
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`${name} must be a positive safe integer, BigInt, or null`);
    }
    return BigInt(value);
  }

  function guarded(estimate, limit, message) {
    if (limit !== null && estimate > limit) {
      throw new StateSpaceTooLarge(message(estimate, limit));
    }
  }

  function displayInteger(value) {
    return value <= MAX_SAFE_BIGINT ? Number(value) : value.toString();
  }

  function optionValue(options, camelName, snakeName, defaultValue) {
    const hasCamel = Object.prototype.hasOwnProperty.call(options, camelName);
    const hasSnake = Object.prototype.hasOwnProperty.call(options, snakeName);
    if (hasCamel && hasSnake && options[camelName] !== options[snakeName]) {
      throw new TypeError(`${camelName} and ${snakeName} cannot disagree`);
    }
    if (hasCamel) return options[camelName];
    if (hasSnake) return options[snakeName];
    return defaultValue;
  }

  function multiplyWord(algebra, factors) {
    let basis = [0, 0];
    let coefficient = algebra.field.one;
    for (const factor of factors) {
      const [output, phase] = algebra.multiplyBasis(basis, factor.basis);
      if (output === null) return [null, algebra.field.zero];
      basis = output;
      coefficient = coefficient.multiply(factor.coefficient).multiply(phase);
    }
    return [basis, coefficient];
  }

  function resultObject(value, metadata) {
    const coefficients = value.asCoefficientStrings();
    const approximate = value.approximate();
    const estimatedStates = displayInteger(metadata.estimatedStates);
    const estimatedTensorCells = displayInteger(metadata.estimatedTensorCells);
    const estimatedCoefficientCells = displayInteger(metadata.estimatedCoefficientCells);
    const estimatedWork = displayInteger(metadata.estimatedWork);
    return {
      diagram: metadata.diagramName,
      ell: metadata.ell,
      root_power: metadata.rootPower,
      rootPower: metadata.rootPower,
      root: `q = zeta^${metadata.rootPower}, with zeta a primitive ${metadata.ell}-th root`,
      exact: value.toString(),
      coefficients_mod_cyclotomic_polynomial: coefficients,
      coefficientsModCyclotomicPolynomial: coefficients.slice(),
      approximate,
      states_evaluated: metadata.statesEvaluated,
      statesEvaluated: metadata.statesEvaluated,
      estimated_states: estimatedStates,
      estimatedStates,
      estimated_tensor_cells: estimatedTensorCells,
      estimatedTensorCells,
      estimated_coefficient_cells: estimatedCoefficientCells,
      estimatedCoefficientCells,
      estimated_work: estimatedWork,
      estimatedWork,
    };
  }

  function evaluateDiagram(input, options = {}) {
    objectValue(options, "options");
    const allowedOptions = new Set([
      "ell",
      "rootPower",
      "root_power",
      "maxEll",
      "max_ell",
      "maxStates",
      "max_states",
      "maxTensorCells",
      "max_tensor_cells",
      "maxCoefficientCells",
      "max_coefficient_cells",
      "maxWork",
      "max_work",
    ]);
    const extraOptions = Object.keys(options).filter((key) => !allowedOptions.has(key));
    if (extraOptions.length) {
      throw new TypeError(`options contain unknown keys: ${extraOptions.sort().join(", ")}`);
    }
    const diagram = validateDiagram(input);
    const ell = Object.prototype.hasOwnProperty.call(options, "ell") ? options.ell : 3;
    const rootPower = optionValue(options, "rootPower", "root_power", 1);
    positiveSafeInteger(ell, "ell");
    if (ell < 3 || ell % 2 === 0) {
      throw new RangeError("this implementation requires an odd ell >= 3");
    }
    safeInteger(rootPower, "rootPower");
    const normalizedRoot = modulo(rootPower, ell);
    if (gcd(normalizedRoot, ell) !== 1) {
      throw new RangeError("rootPower must be coprime to ell");
    }
    const maxEll = parseLimit(
      optionValue(options, "maxEll", "max_ell", DEFAULT_MAX_ELL),
      "maxEll",
    );
    guarded(
      BigInt(ell),
      maxEll,
      (estimate, limit) =>
        `Taft level ell=${estimate} is above maxEll=${limit}; ` +
        "raise maxEll explicitly if this cyclotomic allocation is intended",
    );
    const maxStates = parseLimit(
      optionValue(options, "maxStates", "max_states", undefined),
      "maxStates",
    );
    const maxTensorCells = parseLimit(
      optionValue(options, "maxTensorCells", "max_tensor_cells", undefined),
      "maxTensorCells",
    );
    const maxCoefficientCells = parseLimit(
      optionValue(options, "maxCoefficientCells", "max_coefficient_cells", undefined),
      "maxCoefficientCells",
    );
    const maxWork = parseLimit(
      optionValue(options, "maxWork", "max_work", undefined),
      "maxWork",
    );

    const lowerTermCounts = diagram.lower.map((curve) =>
      curve.crossings.length === 0
        ? 1n
        : BigInt(ell) *
          binomial(ell + curve.crossings.length - 2, curve.crossings.length - 1),
    );
    const estimatedStates = productBigInt(lowerTermCounts);
    const estimatedTensorCells = diagram.lower.reduce(
      (total, curve, index) => total + lowerTermCounts[index] * BigInt(curve.crossings.length),
      0n,
    );
    const degree = eulerPhi(ell);
    const estimatedCoefficientCells =
      lowerTermCounts.reduce((total, count) => total + count, 0n) * BigInt(degree);
    const estimatedWork = estimatedStates * BigInt(diagram.crossings.length);

    const metadata = {
      diagramName: diagram.name,
      ell,
      rootPower: normalizedRoot,
      statesEvaluated: 0,
      estimatedStates,
      estimatedTensorCells,
      estimatedCoefficientCells,
      estimatedWork,
    };
    if ([...diagram.lower, ...diagram.upper].some((curve) => curve.crossings.length === 0)) {
      const algebra = new TaftAlgebra(ell, normalizedRoot, { maxEll });
      return resultObject(algebra.field.zero, metadata);
    }

    guarded(
      estimatedStates,
      maxStates,
      (estimate, limit) =>
        `diagram expands to ${estimate} states, above maxStates=${limit}; raise the limit explicitly if intended`,
    );
    guarded(
      estimatedTensorCells,
      maxTensorCells,
      (estimate, limit) =>
        `coproduct materialization needs about ${estimate} tensor cells, above maxTensorCells=${limit}`,
    );
    guarded(
      estimatedCoefficientCells,
      maxCoefficientCells,
      (estimate, limit) =>
        `coproduct coefficients need about ${estimate} cyclotomic cells, above maxCoefficientCells=${limit}`,
    );
    guarded(
      estimatedWork,
      maxWork,
      (estimate, limit) =>
        `contraction needs about ${estimate} crossing-state visits, above maxWork=${limit}`,
    );
    if (estimatedStates > MAX_SAFE_BIGINT) {
      throw new StateSpaceTooLarge(
        "the state count exceeds JavaScript's exact loop-counter range; provide a smaller diagram",
      );
    }

    const algebra = new TaftAlgebra(ell, normalizedRoot, { maxEll });

    const crossingMap = new Map(diagram.crossings.map((crossing) => [crossing.id, crossing]));
    const lowerExpansions = diagram.lower.map((curve) =>
      Array.from(algebra.iteratedCoproduct(algebra.integralVariant(curve.theta2), curve.crossings.length).values()),
    );
    const actualStates = lowerExpansions.reduce(
      (product, expansion) => product * BigInt(expansion.length),
      1n,
    );
    if (actualStates !== estimatedStates) {
      throw new Error(
        `internal Taft coproduct count mismatch: estimated ${estimatedStates}, got ${actualStates}`,
      );
    }

    let total = algebra.field.zero;
    let statesEvaluated = 0;
    const choices = Array(lowerExpansions.length);

    function contractState() {
      statesEvaluated += 1;
      let stateCoefficient = algebra.field.one;
      const atCrossing = new Map();
      for (let index = 0; index < choices.length; index += 1) {
        const curve = diagram.lower[index];
        const choice = choices[index];
        stateCoefficient = stateCoefficient.multiply(choice.coefficient);
        for (let position = 0; position < curve.crossings.length; position += 1) {
          atCrossing.set(curve.crossings[position], choice.basis[position]);
        }
      }
      if (stateCoefficient.isZero()) return;

      for (const curve of diagram.upper) {
        const factors = [];
        for (const crossingId of curve.crossings) {
          const crossing = crossingMap.get(crossingId);
          const [basis, coefficient] = algebra.antipodeBasis(
            atCrossing.get(crossingId),
            crossing.antipode_power,
          );
          // Kuperberg's tilt is the identity for this Taft convention.
          factors.push({ basis, coefficient });
        }
        const [wordBasis, wordCoefficient] = multiplyWord(algebra, factors);
        if (wordBasis === null) {
          stateCoefficient = algebra.field.zero;
          break;
        }
        stateCoefficient = stateCoefficient
          .multiply(wordCoefficient)
          .multiply(algebra.cointegralVariantBasis(-curve.theta2, wordBasis));
        if (stateCoefficient.isZero()) break;
      }
      total = total.add(stateCoefficient);
    }

    function visit(level) {
      if (level === lowerExpansions.length) {
        contractState();
        return;
      }
      for (const term of lowerExpansions[level]) {
        choices[level] = term;
        visit(level + 1);
      }
    }

    visit(0);
    metadata.statesEvaluated = statesEvaluated;
    return resultObject(total, metadata);
  }

  const api = Object.freeze({
    CONVENTION,
    DEFAULT_MAX_ELL,
    DEFAULT_MAX_LENS_CROSSINGS,
    StateSpaceTooLarge,
    CyclotomicField,
    CyclotomicElement,
    TaftAlgebra,
    cyclotomicPolynomial,
    validateDiagram,
    lensDiagram,
    t3Diagram,
    evaluateDiagram,
  });

  globalScope.KuperbergTaft = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
