import { describe, expect, it } from "vitest";
import { getAccuracy, getLevel, loadProgress, recordAnswer, DEFAULT_PROGRESS } from "@/lib/progress";

describe("skor game dan progres lokal", () => {
  it("menambahkan XP dan mencatat statistik jawaban benar", () => {
    const now = new Date(2026, 9, 12, 12);
    const progress = recordAnswer(DEFAULT_PROGRESS, { correct: true, questionId: "q-1", category: "konversi", now });
    expect(progress.xp).toBe(10);
    expect(progress.answered).toBe(1);
    expect(progress.correct).toBe(1);
    expect(progress.earnedBadges).toContain("first-quiz");
    expect(progress.categoryStats.konversi).toEqual({ answered: 1, correct: 1 });
  });
  it("memasukkan soal salah ke daftar ulang dan menghapus setelah benar", () => {
    const wrong = recordAnswer(DEFAULT_PROGRESS, { correct: false, questionId: "q-repeat", category: "sekrup", now: new Date(2026, 9, 12) });
    expect(wrong.wrongQuestionIds).toContain("q-repeat");
    const fixed = recordAnswer(wrong, { correct: true, questionId: "q-repeat", category: "sekrup", now: new Date(2026, 9, 12) });
    expect(fixed.wrongQuestionIds).not.toContain("q-repeat");
    expect(getAccuracy(fixed)).toBe(50);
  });
  it("menghitung streak sekali per hari", () => {
    const first = recordAnswer(DEFAULT_PROGRESS, { correct: true, questionId: "a", category: "x", now: new Date(2026, 9, 11, 8) });
    const sameDay = recordAnswer(first, { correct: true, questionId: "b", category: "x", now: new Date(2026, 9, 11, 18) });
    const nextDay = recordAnswer(sameDay, { correct: true, questionId: "c", category: "x", now: new Date(2026, 9, 12, 8) });
    expect(sameDay.streak).toBe(1);
    expect(nextDay.streak).toBe(2);
  });
  it("menentukan level berdasarkan XP", () => {
    expect(getLevel(0).name).toBe("Pemula");
    expect(getLevel(300).name).toBe("Ahli Pecahan");
    expect(getLevel(300).next?.xp).toBe(650);
  });
  it("menormalkan progres lokal yang rusak agar tidak merusak UI", () => {
    const storage = { getItem: () => JSON.stringify({ xp: -50, answered: 2, correct: 99, wrongQuestionIds: "bukan-array", categoryStats: null, dailyCompleted: "yes" }) } as unknown as Storage;
    const progress = loadProgress(storage);
    expect(progress.xp).toBe(0);
    expect(progress.correct).toBe(2);
    expect(progress.wrongQuestionIds).toEqual([]);
    expect(progress.categoryStats).toEqual({});
    expect(progress.dailyCompleted).toBe(false);
  });
});
