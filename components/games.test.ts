import { describe, expect, it } from "vitest";
import { FRACTION_ROWS, LEARNING_MODULES, PRODUCTS_DATA } from "@/lib/data";
import { GAMES, buildQuestion, deckForGame, normalizeAnswer, questionFromWrongId } from "@/components/games";

describe("permainan KayuUkur Pro", () => {
  it("menyediakan 12 mode dengan slug unik", () => {
    expect(GAMES).toHaveLength(12);
    expect(new Set(GAMES.map((game) => game.slug)).size).toBe(GAMES.length);
  });

  it("setiap pertanyaan konversi memiliki jawaban di pilihan dan pengecoh unik", () => {
    for (const index of [0, 7, 14, 25]) {
      const question = buildQuestion("guess-cm", index);
      expect(question.options).toContain(question.answer);
      expect(new Set(question.options.map((option) => option.toLowerCase())).size).toBe(question.options.length);
      expect(question.explanation).toContain(" = ");
    }
    expect(FRACTION_ROWS).toHaveLength(26);
  });

  it("pertanyaan penggaris membatasi penunjuk pada ilustrasi dan jawaban valid", () => {
    for (let index = 0; index < 8; index++) {
      const question = buildQuestion("image-ruler", index + 2);
      expect(question.visual).toBe("ruler");
      expect(question.visualValue).toBeGreaterThan(0);
      expect(question.visualValue).toBeLessThanOrEqual(80);
      expect(question.options).toContain(question.answer);
      expect(new Set(question.options).size).toBe(question.options.length);
    }
  });

  it("deck harian berisi tepat sepuluh soal dan speed deck dapat diteruskan", () => {
    expect(deckForGame("daily-challenge")).toHaveLength(10);
    expect(deckForGame("speed-quiz").length).toBeGreaterThanOrEqual(100);
    expect(deckForGame("store-simulation")).toHaveLength(6);
  });

  it("jawaban benar/salah menormalkan variasi huruf", () => {
    expect(normalizeAnswer("TRUE")).toBe("benar");
    expect(normalizeAnswer("Salah")).toBe("salah");
    const binary = deckForGame("true-false");
    expect(binary.length).toBeGreaterThanOrEqual(6);
    for (const question of binary) {
      expect(question.options).toEqual(["Benar", "Salah"]);
      expect(question.options.map(normalizeAnswer)).toContain(normalizeAnswer(question.answer));
    }
  });

  it("soal yang salah dapat direkonstruksi dengan id stabil, termasuk produk indeks nol dan materi", () => {
    const productQuestion = buildQuestion("guess-product", 0);
    expect(questionFromWrongId(productQuestion.id, 8)?.answer).toBe(productQuestion.answer);
    const fractionQuestion = buildQuestion("guess-cm", 7);
    expect(questionFromWrongId(fractionQuestion.id, 0)?.answer).toBe(fractionQuestion.answer);
    const module = LEARNING_MODULES[LEARNING_MODULES.length - 1];
    expect(questionFromWrongId(`learn-${module.slug}`, 0)?.answer).toBe(module.answer);
    const knownQuiz = questionFromWrongId("q-m8", 0);
    expect(knownQuiz?.answer).toBe("Diameter nominal ulir 8 mm");
    expect(PRODUCTS_DATA.length).toBeGreaterThan(150);
  });
});
