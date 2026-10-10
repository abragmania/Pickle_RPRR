/* Node tests for logic.js. Run from the project folder: node --test tests/
   Every game object is hand-built and every expected value is worked out by hand in the comments. */
var test = require('node:test');
var assert = require('node:assert');
var PBRR = require('../logic.js');

/* a blank game in the saved shape; overrides replace whole fields */
function game(over) {
  var g = {
    names: ['Ann', 'Ben', 'Cal', 'Dee', 'Eve', 'Fay', 'Gus', 'Hal'],
    scores: {},
    tb: PBRR.DEF_ORDER.slice(),
    off: PBRR.DEF_OFF.slice(),
    settle: [],
    po: { fmt: 'pick', pick: null, pay: 'wta', buyin: '' },
    fin: { fmt: 3, g: [['', ''], ['', ''], ['', ''], ['', ''], ['', '']] }
  };
  Object.keys(over || {}).forEach(function (k) { g[k] = over[k]; });
  return g;
}

/* hand-made season totals (computeRank only reads these fields plus g.tb/off/settle/scores):
   i0 5-2 lp15 pf70 pa50 diff+20
   i1 5-2 lp18 pf65 pa60 diff+5
   i2 4-3 lp20 pf60 pa55 diff+5
   i3 4-3 lp20 pf60 pa55 diff+5   (identical to i2)
   i4 4-3 lp20 pf58 pa50 diff+8
   i5 3-4, i6 2-5, i7 1-6 (each alone on its record) */
function stats() {
  return [
    { i: 0, w: 5, l: 2, lp: 15, pf: 70, pa: 50 },
    { i: 1, w: 5, l: 2, lp: 18, pf: 65, pa: 60 },
    { i: 2, w: 4, l: 3, lp: 20, pf: 60, pa: 55 },
    { i: 3, w: 4, l: 3, lp: 20, pf: 60, pa: 55 },
    { i: 4, w: 4, l: 3, lp: 20, pf: 58, pa: 50 },
    { i: 5, w: 3, l: 4, lp: 25, pf: 55, pa: 60 },
    { i: 6, w: 2, l: 5, lp: 30, pf: 50, pa: 65 },
    { i: 7, w: 1, l: 6, lp: 35, pf: 45, pa: 70 }
  ];
}
function ids(P) { return P.map(function (p) { return p.i; }); }

test('validScore table', function () {
  assert.strictEqual(PBRR.validScore('11', '0'), true);
  assert.strictEqual(PBRR.validScore('9', '5'), true);   // cut short, leader under 11
  assert.strictEqual(PBRR.validScore('11', '10'), true);
  assert.strictEqual(PBRR.validScore('12', '5'), false); // leader above 11
  assert.strictEqual(PBRR.validScore('99', '3'), false);
  assert.strictEqual(PBRR.validScore('5', '5'), false);  // tie
  assert.strictEqual(PBRR.validScore('', '3'), false);   // blank
  assert.strictEqual(PBRR.validScore('3', '11'), true);  // either side may lead
});

test('decided ignores 99-3 and counts 9-5', function () {
  var g = game({ scores: { '0-0': ['99', '3'], '0-1': ['9', '5'] } });
  assert.strictEqual(PBRR.decided(g, 0, 0), false);
  assert.strictEqual(PBRR.decided(g, 0, 1), true);
  assert.strictEqual(PBRR.decided(g, 3, 0), false); // missing key
});

test('compute totals for a small known game', function () {
  /* round 1: court 1 is seats 0,1 vs 2,3 -> 11-7; court 2 is 4,5 vs 6,7 -> 9-5 (cut short).
     round 2 court 1 (0,2 vs 4,6) has 99-3, which is invalid and must not count. */
  var g = game({ scores: { '0-0': ['11', '7'], '0-1': ['9', '5'], '1-0': ['99', '3'] } });
  var c = PBRR.compute(g);
  assert.strictEqual(c.done, 2);
  // seat 0: one win 11-7 -> w1 l0 pf11 pa7 lp0
  assert.deepStrictEqual(c.P[0], { i: 0, w: 1, l: 0, pf: 11, pa: 7, lp: 0 });
  // seat 3: one loss 7-11 -> lp7
  assert.deepStrictEqual(c.P[3], { i: 3, w: 0, l: 1, pf: 7, pa: 11, lp: 7 });
  // seat 4: win 9-5
  assert.deepStrictEqual(c.P[4], { i: 4, w: 1, l: 0, pf: 9, pa: 5, lp: 0 });
  // seat 6: loss 5-9 -> lp5 (the invalid 99-3 adds nothing)
  assert.deepStrictEqual(c.P[6], { i: 6, w: 0, l: 1, pf: 5, pa: 9, lp: 5 });
});

test('default ranking, and changing the criteria order changes it', function () {
  /* default (record, points in losses, differential, points scored):
     5-2 group: i1 lp18 beats i0 lp15 -> 1, 0
     4-3 group: lp all 20; differential i4 +8, then i2/i3 +5; pf 60/60; settle empty -> i2, i3 level
     -> 1, 0, 4, then i2 and i3 tied (kept in input order), 5, 6, 7 */
  var g = game();
  var rk = PBRR.computeRank(g, stats());
  assert.deepStrictEqual(ids(rk.P), [1, 0, 4, 2, 3, 5, 6, 7]);
  assert.strictEqual(rk.first, 'w');
  assert.strictEqual(rk.P[0].how, 'tb');
  assert.strictEqual(rk.P[2].how, 'tb');

  /* differential before points in losses: i0 +20 beats i1 +5 -> 0, 1 */
  var g2 = game({ tb: ['w', 'diff', 'lp', 'pf', 'pa', 'h2h'] });
  assert.deepStrictEqual(ids(PBRR.computeRank(g2, stats()).P).slice(0, 2), [0, 1]);
});

test('an unresolved tie stays tied, then a settle list resolves it', function () {
  var rk = PBRR.computeRank(game(), stats());
  var p2 = rk.P[3];
  var p3 = rk.P[4];
  // i2 and i3 are level on everything: first (and only) unresolved tier -> 't1', marked 'tie'
  assert.strictEqual(p2.tier, 't1');
  assert.strictEqual(p3.tier, 't1');
  assert.strictEqual(p2.how, 'tie');
  var tie = rk.ties[1]; // ties[0] is the 5-2 group, ties[1] the 4-3 group starting at index 2
  assert.strictEqual(tie.start, 2);
  assert.strictEqual(tie.end, 4);
  assert.deepStrictEqual(tie.tiers.map(ids), [[4], [2, 3]]);

  /* settle [3, 2]: i3 tapped first, so i3 finishes ahead; both marked 'po' and no tier */
  var rk2 = PBRR.computeRank(game({ settle: [3, 2] }), stats());
  assert.deepStrictEqual(ids(rk2.P), [1, 0, 4, 3, 2, 5, 6, 7]);
  assert.strictEqual(rk2.P[3].how, 'po');
  assert.strictEqual(rk2.P[4].how, 'po');
  assert.strictEqual(rk2.P[3].tier, null);
});

test('head-to-head turned on splits the tie', function () {
  /* seats 2 and 3 face each other in round 4 court 2 (2,6 vs 3,7); 11-4 there means
     i2 net +1 and i3 net -1 among the tied pair, so i2 goes ahead with mark 'tb'. */
  var scores = { '3-1': ['11', '4'] };
  var on = game({ scores: scores, off: ['pa'] });
  var rk = PBRR.computeRank(on, stats());
  assert.deepStrictEqual(ids(rk.P), [1, 0, 4, 2, 3, 5, 6, 7]);
  assert.strictEqual(rk.P[3].how, 'tb');
  assert.strictEqual(rk.P[3].tier, null);
  // and with head-to-head off (default) the same scores leave them tied
  var off = PBRR.computeRank(game({ scores: scores }), stats());
  assert.strictEqual(off.P[3].how, 'tie');
  // reversed result flips the order
  var rev = PBRR.computeRank(game({ scores: { '3-1': ['4', '11'] }, off: ['pa'] }), stats());
  assert.deepStrictEqual(ids(rev.P).slice(3, 5), [3, 2]);
});

test('payouts for winner-takes-all and buy-in back, 8 and 6 paid', function () {
  // $20 x 8 = 160; wta: each winner 80
  assert.deepStrictEqual(PBRR.payouts({ pay: 'wta', buyin: '20' }, 8), { np: 8, pot: 160, winner: 80, runnerUp: null });
  // back: (160 - 40) / 2 = 60 each winner, runner-ups get 20 back
  assert.deepStrictEqual(PBRR.payouts({ pay: 'back', buyin: '20' }, 8), { np: 8, pot: 160, winner: 60, runnerUp: 20 });
  // $20 x 6 = 120; wta 60; back (120 - 40) / 2 = 40
  assert.deepStrictEqual(PBRR.payouts({ pay: 'wta', buyin: '20' }, 6), { np: 6, pot: 120, winner: 60, runnerUp: null });
  assert.deepStrictEqual(PBRR.payouts({ pay: 'back', buyin: '20' }, 6), { np: 6, pot: 120, winner: 40, runnerUp: 20 });
  // nobody marked paid counts as 8
  assert.strictEqual(PBRR.payouts({ pay: 'wta', buyin: '10' }, 0).np, 8);
  // no buy-in -> null
  assert.strictEqual(PBRR.payouts({ pay: 'wta', buyin: '' }, 8), null);
  assert.strictEqual(PBRR.payouts({ pay: 'wta', buyin: '0' }, 8), null);
});

test('finState picks a champion in a best-of-3 and ignores an invalid final score', function () {
  /* seeds in order: i5, i2, i7, i0; '#1 & #4 vs #2 & #3' -> Team A = [5, 0], Team B = [2, 7] */
  var P = [{ i: 5 }, { i: 2 }, { i: 7 }, { i: 0 }, { i: 1 }, { i: 3 }, { i: 4 }, { i: 6 }];
  var po = { fmt: 'p14', pick: null, pay: 'wta', buyin: '' };
  var blank = ['', ''];

  // A 11-8, B 11-6, A 11-9 -> A wins 2-1 in game 3
  var g = game({ po: po, fin: { fmt: 3, g: [['11', '8'], ['6', '11'], ['11', '9'], blank, blank] } });
  var fs = PBRR.finState(g, P, true);
  assert.deepStrictEqual(fs.tm, { A: [5, 0], B: [2, 7] });
  assert.strictEqual(fs.need, 2);
  assert.strictEqual(fs.wa, 2);
  assert.strictEqual(fs.wb, 1);
  assert.strictEqual(fs.over, 3);
  assert.deepStrictEqual(fs.champ, [5, 0]);
  assert.deepStrictEqual(fs.rows, [0, 1, 2]);

  // A wins the first two -> over after game 2, game 3 not needed
  var g2 = game({ po: po, fin: { fmt: 3, g: [['11', '8'], ['11', '5'], blank, blank, blank] } });
  var fs2 = PBRR.finState(g2, P, true);
  assert.strictEqual(fs2.over, 2);
  assert.deepStrictEqual(fs2.champ, [5, 0]);

  // game 2 entered as 15-3 is invalid: it does not count and stops the series at 1-0, no champion
  var g3 = game({ po: po, fin: { fmt: 3, g: [['11', '8'], ['15', '3'], ['11', '9'], blank, blank] } });
  var fs3 = PBRR.finState(g3, P, true);
  assert.strictEqual(fs3.wa, 1);
  assert.strictEqual(fs3.wb, 0);
  assert.strictEqual(fs3.champ, null);
  assert.strictEqual(fs3.over, 3);

  // round robin not complete -> hidden, no rows
  var fs4 = PBRR.finState(g, P, false);
  assert.strictEqual(fs4.show, false);
  assert.deepStrictEqual(fs4.rows, []);
});
