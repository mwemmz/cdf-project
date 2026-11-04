import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { termMonthsFor, totalDueFor, interestFor, finalDueDate } from '../modules/repayments/loanTerms';
import { computeRepaymentSchedule } from '../modules/repayments/repaymentSchedule';

// Pure tests: no database needed. Terms follow the draft CDF Guidelines (Table 3).
describe('CDF loan terms', () => {
  it('picks the repayment period from the loan size', () => {
    assert.equal(termMonthsFor(5_000), 12);
    assert.equal(termMonthsFor(10_000), 12);
    assert.equal(termMonthsFor(10_001), 18);
    assert.equal(termMonthsFor(50_000), 24);
    assert.equal(termMonthsFor(95_000), 30);
    assert.equal(termMonthsFor(200_000), 36);
  });

  it('adds 5% simple interest', () => {
    assert.equal(interestFor(10_000), 500);
    assert.equal(totalDueFor(10_000), 10_500);
  });

  it('first instalment is due 60 days after disbursement', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const before = computeRepaymentSchedule(10_000, 0, start, new Date('2026-02-28T00:00:00Z'))!;
    assert.equal(before.installmentsDue, 0);
    assert.equal(before.onTrack, true);
    const after = computeRepaymentSchedule(10_000, 0, start, new Date('2026-03-05T00:00:00Z'))!;
    assert.equal(after.installmentsDue, 1);
    assert.equal(after.monthlyPayment, 875); // 10,500 / 12
    assert.equal(after.onTrack, false);
    const paid = computeRepaymentSchedule(10_000, 875, start, new Date('2026-03-05T00:00:00Z'))!;
    assert.equal(paid.onTrack, true);
  });

  it('final due date is the last instalment', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const due = finalDueDate(start, 10_000);
    const sched = computeRepaymentSchedule(10_000, 0, start, due)!;
    assert.equal(sched.installmentsDue, 12);
    assert.equal(sched.nextDueDate, null);
  });
});
