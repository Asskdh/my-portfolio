// BigNumber.js
// Hybrid version: unlimited add/multiply, safe caps only for pow and factorial.

class BigNumber {
  // This is ONLY used as a safety guideline for pow/factorial, not as a hard cap for add/mul.
  static MAX_SAFE_DIGITS = 10000;

  constructor(value = 0) {
    // internal: digits stored little-endian: [leastSignificant, ..., mostSignificant]
    this.digits = [];
    this.numDigits = 0;

    if (value instanceof BigNumber) {
      this.digits = value.digits.slice();
      this.numDigits = value.numDigits;
    } else if (typeof value === "number" || typeof value === "bigint") {
      this._fromNumber(value);
    } else if (typeof value === "string") {
      this._fromString(value);
    } else {
      this._fromNumber(0);
    }
  }

  // ---------- Constructors helpers ----------

  _fromNumber(n) {
    let x = BigInt(n);
    this.digits = [];
    if (x === 0n) {
      this.digits = [0];
      this.numDigits = 1;
      return;
    }
    while (x > 0n) {
      this.digits.push(Number(x % 10n));
      x /= 10n;
    }
    this.numDigits = this.digits.length;
    this._trim();
  }

  _fromString(s) {
    s = String(s).trim();

    // collect digits from right to left
    const digits = [];
    for (let i = s.length - 1; i >= 0; i--) {
      const ch = s[i];
      if (ch >= "0" && ch <= "9") {
        digits.push(ch.charCodeAt(0) - 48);
      }
    }

    if (digits.length === 0) {
      this.digits = [0];
      this.numDigits = 1;
    } else {
      // remove unnecessary leading zeros at the top end
      let last = digits.length - 1;
      while (last > 0 && digits[last] === 0) last--;
      this.digits = digits.slice(0, last + 1);
      this.numDigits = this.digits.length;
    }
  }

  static fromString(s) {
    return new BigNumber(s);
  }

  static zero() {
    return new BigNumber(0);
  }

  static one() {
    return new BigNumber(1);
  }

  // kept just in case you want a “max value” constant; not used by operations now
  static maxValue() {
    const len = BigNumber.MAX_SAFE_DIGITS;
    return new BigNumber("9".repeat(len));
  }

  // ---------- Utility ----------

  _trim() {
    // remove leading zeros at most significant side
    while (this.numDigits > 1 && this.digits[this.numDigits - 1] === 0) {
      this.numDigits--;
    }
    this.digits.length = this.numDigits;
    if (this.numDigits === 0) {
      this.digits = [0];
      this.numDigits = 1;
    }
  }

  toString() {
    if (this.numDigits === 0) return "0";
    let s = "";
    for (let i = this.numDigits - 1; i >= 0; i--) {
      s += this.digits[i].toString();
    }
    return s;
  }

  toDouble() {
    // Be careful: large values may lose precision, but OK for rough estimates
    let result = 0;
    for (let i = this.numDigits - 1; i >= 0; i--) {
      result = result * 10 + this.digits[i];
    }
    return result;
  }

  // ---------- Comparisons ----------

  _compare(other) {
    const b = other instanceof BigNumber ? other : new BigNumber(other);

    if (this.numDigits > b.numDigits) return 1;
    if (this.numDigits < b.numDigits) return -1;

    for (let i = this.numDigits - 1; i >= 0; i--) {
      if (this.digits[i] > b.digits[i]) return 1;
      if (this.digits[i] < b.digits[i]) return -1;
    }
    return 0;
  }

  gt(b) {
    return this._compare(b) > 0;
  }
  gte(b) {
    return this._compare(b) >= 0;
  }
  lt(b) {
    return this._compare(b) < 0;
  }
  lte(b) {
    return this._compare(b) <= 0;
  }
  eq(b) {
    return this._compare(b) === 0;
  }
  neq(b) {
    return this._compare(b) !== 0;
  }

  // ---------- Increment / Decrement ----------

  // prefix ++ (unlimited, no max cap)
  inc() {
    let i = 0;
    while (i < this.numDigits && this.digits[i] === 9) {
      this.digits[i] = 0;
      i++;
    }
    if (i === this.numDigits) {
      // extend with a new digit
      this.digits.push(1);
      this.numDigits++;
    } else {
      this.digits[i]++;
    }
    return this;
  }

  // prefix --
  dec() {
    // if already 0, do nothing
    if (this.numDigits === 1 && this.digits[0] === 0) return this;

    let i = 0;
    while (i < this.numDigits) {
      if (this.digits[i] > 0) {
        this.digits[i]--;
        break;
      } else {
        this.digits[i] = 9;
        i++;
      }
    }
    this._trim();
    return this;
  }

  // non-mutating versions
  incremented() {
    return new BigNumber(this).inc();
  }

  decremented() {
    return new BigNumber(this).dec();
  }

  // ---------- Addition (unlimited) ----------

  addInPlace(other) {
    const b = other instanceof BigNumber ? other : new BigNumber(other);
    let carry = 0;
    const maxLen = Math.max(this.numDigits, b.numDigits);

    for (let i = 0; i < maxLen || carry; i++) {
      if (i >= this.numDigits) {
        this.digits.push(0);
        this.numDigits++;
      }

      const aDigit = this.digits[i];
      const bDigit = i < b.numDigits ? b.digits[i] : 0;

      let sum = aDigit + bDigit + carry;
      this.digits[i] = sum % 10;
      carry = Math.floor(sum / 10);
    }

    this._trim();
    // no digit limit here
    return this;
  }

  add(other) {
    const result = new BigNumber(this);
    return result.addInPlace(other);
  }

  // ---------- Multiplication (unlimited) ----------

  multiply(other) {
    const b = other instanceof BigNumber ? other : new BigNumber(other);

    const result = new BigNumber(0);
    result.digits = new Array(this.numDigits + b.numDigits).fill(0);
    result.numDigits = result.digits.length;

    for (let i = 0; i < this.numDigits; i++) {
      let carry = 0;
      for (let j = 0; j < b.numDigits || carry; j++) {
        const cur =
          result.digits[i + j] +
          this.digits[i] * (j < b.numDigits ? b.digits[j] : 0) +
          carry;
        result.digits[i + j] = cur % 10;
        carry = Math.floor(cur / 10);
      }
    }

    result._trim();
    // no digit limit here
    return result;
  }

  multiplyInPlace(other) {
    const res = this.multiply(other);
    this.digits = res.digits.slice();
    this.numDigits = res.numDigits;
    return this;
  }

  // ---------- Power (this ^ exponent) with safety ----------

  pow(exponent) {
    let base = new BigNumber(this);
    let exp =
      exponent instanceof BigNumber
        ? new BigNumber(exponent)
        : new BigNumber(exponent);

    // If base is 0, result is 0 (for positive exponents)
    if (base.eq(BigNumber.zero())) {
      return BigNumber.zero();
    }

    // Rough estimate of digits: digits(base) * exponent
    const approxExp = exp.toDouble();
    const estimateDigits = approxExp * base.numDigits;
    if (estimateDigits > BigNumber.MAX_SAFE_DIGITS) {
      throw new Error(
        `Result would exceed safe digit limit (${BigNumber.MAX_SAFE_DIGITS} digits).`
      );
    }

    const one = BigNumber.one();
    let result = BigNumber.one();

    while (exp.gte(one)) {
      result.multiplyInPlace(base);

      // check after each multiplication
      if (result.numDigits > BigNumber.MAX_SAFE_DIGITS) {
        throw new Error(
          `Result exceeded safe digit limit (${BigNumber.MAX_SAFE_DIGITS} digits).`
        );
      }

      exp.dec();
    }

    return result;
  }

  // ---------- Factorial (this!) with safety ----------

  factorial() {
    let temp = new BigNumber(this);
    const one = BigNumber.one();
    let result = BigNumber.one();

    // We allow factorial to grow until it hits the safe digit limit.
    while (temp.gte(one)) {
      result.multiplyInPlace(temp);

      if (result.numDigits > BigNumber.MAX_SAFE_DIGITS) {
        throw new Error(
          `Factorial result exceeded safe digit limit (${BigNumber.MAX_SAFE_DIGITS} digits).`
        );
      }

      temp.dec();
    }

    return result;
  }
}

// For browser usage:
window.BigNumber = BigNumber;
// For modules (if you ever use bundlers):
// export default BigNumber;
