import { describe, expect, it } from "vitest";
import { convert, displayConversion, formatConvertedValue, formatInches, parseExactScalar, parseMeasurement, parseScalar, toMillimetres } from "@/lib/conversion";

describe("konversi satuan eksak", () => {
  it("menggunakan faktor 1 inch = 25,4 mm = 2,54 cm", () => {
    expect(convert(1, "in", "mm")).toBeCloseTo(25.4, 10);
    expect(convert(1, "in", "cm")).toBeCloseTo(2.54, 10);
  });
  it.each([[0.75, 19.05], [1.25, 31.75], [1.5, 38.1], [2, 50.8], [3, 76.2]])("%s inch tepat menjadi %s mm", (inches, mm) => {
    expect(convert(inches, "in", "mm")).toBeCloseTo(mm, 10);
  });
  it("mengubah 1 ft menjadi 304,8 mm", () => expect(convert(1, "ft", "mm")).toBeCloseTo(304.8, 10));
  it("konversi meter, sentimeter, dan milimeter konsisten", () => {
    expect(convert(1, "m", "cm")).toBe(100);
    expect(convert(1, "cm", "mm")).toBe(10);
    expect(convert(25.4, "mm", "in")).toBeCloseTo(1, 10);
  });
});

describe("parser ukuran", () => {
  it.each([["3/4", 0.75], ["0.75", 0.75], ["0,75", 0.75], ["1 1/4", 1.25], ["1-1/4", 1.25], ["2 1/2 inch", 2.5], ["¾", 0.75], ["1½", 1.5]])("membaca input %s", (input, expected) => {
    expect(parseMeasurement(input, "in")?.value).toBeCloseTo(expected, 10);
  });
  it("mengenali unit eksplisit", () => {
    expect(parseMeasurement("25 mm")?.unit).toBe("mm");
    expect(parseMeasurement("3 cm")?.unit).toBe("cm");
    expect(parseMeasurement("1 ft")?.unit).toBe("ft");
    expect(parseMeasurement("1 meter")?.unit).toBe("m");
  });
  it("menolak input tidak valid dan pecahan berpenyebut nol", () => {
    expect(parseScalar("1/0")).toBeNull();
    expect(parseMeasurement("abc")).toBeNull();
    expect(parseMeasurement("-1 inch")).toBeNull();
  });
  it("menampilkan hasil praktis dan nilai akurat dengan simbol yang tepat", () => {
    expect(displayConversion(0.75, "in", "easy").cm).toBe("1,9");
    expect(displayConversion(0.75, "in", "accurate").symbol).toBe("=");
    expect(displayConversion(0.75, "in", "accurate").mm).toBe("19,05");
    expect(displayConversion(0.75, "in", "easy").symbol).toBe("≈");
  });
  it("mempertahankan pecahan rasional dan membedakan desimal eksak dari berulang", () => {
    const quarter = parseMeasurement("3/4 inch");
    expect(quarter?.exactValue).toEqual({ numerator: "3", denominator: "4" });
    expect(formatConvertedValue(quarter!.value, "in", "mm", quarter!.exactValue)).toEqual({ text: "19,05", symbol: "=" });
    const third = parseMeasurement("1/3 inch");
    expect(formatConvertedValue(third!.value, "in", "mm", third!.exactValue)).toEqual({ text: "8,466666666667", symbol: "≈" });
    expect(formatConvertedValue(1, "mm", "in")).toEqual({ text: "0,03937007874", symbol: "≈" });
  });
  it.each([["0,75", { numerator: "3", denominator: "4" }], ["1½", { numerator: "3", denominator: "2" }], ["1 1/4", { numerator: "5", denominator: "4" }]])("mempertahankan nilai rasional input %s", (input, expected) => {
    expect(parseExactScalar(input)).toEqual(expected);
  });
  it("memformat pecahan inci", () => {
    expect(formatInches(1.25)).toBe("1 1/4");
    expect(toMillimetres(1.25, "in")).toBeCloseTo(31.75, 10);
  });
});
