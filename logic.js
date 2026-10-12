/* Pickle RR pure logic: schedule, score validity, standings, tiebreaks, finals and payouts.
   No DOM and no globals: every function takes the game object explicitly.
   Loaded by index.html as a classic script (window.PBRR) and by the Node tests (module.exports). */
var PBRR = (function () {

  /* Balanced schedule (verified by computer): every pair partners once and opposes twice. Numbers are seat slots 0-7. */
  var SCHED = [
    [[[0, 1], [2, 3]], [[4, 5], [6, 7]]],
    [[[0, 2], [4, 6]], [[1, 3], [5, 7]]],
    [[[0, 3], [4, 7]], [[1, 2], [5, 6]]],
    [[[0, 4], [1, 5]], [[2, 6], [3, 7]]],
    [[[0, 5], [2, 7]], [[1, 4], [3, 6]]],
    [[[0, 6], [3, 5]], [[1, 7], [2, 4]]],
    [[[0, 7], [1, 6]], [[2, 5], [3, 4]]]
  ];

  var CRIT = {
    w: { name: 'Record (wins)', f: function (p) { return p.w; } },
    lp: { name: 'Points in losses', f: function (p) { return p.lp; } },
    diff: { name: 'Point differential', f: function (p) { return p.pf - p.pa; } },
    pf: { name: 'Total points scored', f: function (p) { return p.pf; } },
    pa: { name: 'Fewest points allowed', f: function (p) { return -p.pa; } },
    h2h: { name: 'Head-to-head', f: function (p) { return 0; } }
  };

  var DEF_ORDER = ['w', 'lp', 'diff', 'pf', 'pa', 'h2h'];
  var DEF_OFF = ['pa', 'h2h'];

  /* A score pair counts only when both are digit strings, someone leads, and the leader has at most 11
     (games go to 11; a cut-short game such as 9-5 still counts). */
  function validScore(a, b) {
    var sa = a == null ? '' : String(a);
    var sb = b == null ? '' : String(b);
    if (!/^\d+$/.test(sa) || !/^\d+$/.test(sb)) {
      return false;
    }
    var x = +sa;
    var y = +sb;
    var hi = Math.max(x, y);
    var lo = Math.min(x, y);
    return hi > lo && hi <= 11;
  }

  function getScore(g, r, m) {
    return g.scores[r + '-' + m] || ['', ''];
  }

  function decided(g, r, m) {
    var s = getScore(g, r, m);
    return validScore(s[0], s[1]);
  }

  function compute(g) {
    var P = [];
    for (var i = 0; i < 8; i++) {
      P.push({ i: i, w: 0, l: 0, pf: 0, pa: 0, lp: 0 });
    }
    var done = 0;
    SCHED.forEach(function (rd, r) {
      rd.forEach(function (mt, m) {
        if (!decided(g, r, m)) {
          return;
        }
        done++;
        var sc = getScore(g, r, m).map(Number);
        [0, 1].forEach(function (t) {
          var ts = sc[t];
          var os = sc[1 - t];
          mt[t].forEach(function (p) {
            var o = P[p];
            o.pf += ts;
            o.pa += os;
            if (ts > os) {
              o.w++;
            } else {
              o.l++;
              o.lp += ts;
            }
          });
        });
      });
    });
    return { P: P, done: done };
  }

  function activeCrit(g) {
    return g.tb.filter(function (k) { return g.off.indexOf(k) < 0; });
  }

  /* among the listed players: wins minus losses in games where they faced each other as opponents */
  function h2hNet(g, list) {
    var set = {};
    var net = {};
    list.forEach(function (p) {
      set[p.i] = 1;
      net[p.i] = 0;
    });
    SCHED.forEach(function (rd, r) {
      rd.forEach(function (mt, m) {
        if (!decided(g, r, m)) {
          return;
        }
        var sc = getScore(g, r, m).map(Number);
        for (var t = 0; t < 2; t++) {
          var w = sc[t] > sc[1 - t];
          mt[t].forEach(function (x) {
            if (!set[x]) {
              return;
            }
            mt[1 - t].forEach(function (y) {
              if (set[y]) {
                net[x] += w ? 1 : -1;
              }
            });
          });
        }
      });
    });
    return net;
  }

  function keyFnFor(g, c, list) {
    if (c === 'h2h') {
      var net = h2hNet(g, list);
      return function (p) { return net[p.i]; };
    }
    if (c === 'manual') {
      return function (p) {
        var ix = g.settle.indexOf(p.i);
        return ix < 0 ? -1000 : -ix;
      };
    }
    return CRIT[c].f;
  }

  /* split a list by one criterion at a time; whatever stays level moves on to the next criterion */
  function resolveGroup(g, list, crits, steps) {
    if (list.length <= 1 || !crits.length) {
      return [list];
    }
    var c = crits[0];
    var f = keyFnFor(g, c, list);
    var scored = list.map(function (p) { return { p: p, k: f(p) }; }).sort(function (a, b) { return b.k - a.k; });
    var groups = [];
    scored.forEach(function (x) {
      var last = groups[groups.length - 1];
      if (last && last.k === x.k) {
        last.ps.push(x.p);
      } else {
        groups.push({ k: x.k, ps: [x.p] });
      }
    });
    var distinct = groups.length > 1;
    if (c !== 'manual' || distinct) {
      steps.push({ crit: c, vals: scored, distinct: distinct });
    }
    if (c === 'manual' && distinct) {
      list.forEach(function (p) { p.man = true; });
    }
    if (!distinct) {
      return resolveGroup(g, list, crits.slice(1), steps);
    }
    var out = [];
    groups.forEach(function (grp) {
      out = out.concat(grp.ps.length > 1 ? resolveGroup(g, grp.ps, crits.slice(1), steps) : [grp.ps]);
    });
    return out;
  }

  /* full ranking: groups by the first criterion (record), then breaks each tie and notes how.
     Sets p.tier, p.how and p.man on the player objects. */
  function computeRank(g, Pobj) {
    var crits = activeCrit(g).concat(['manual']);
    var first = crits[0];
    var f0 = keyFnFor(g, first, Pobj);
    Pobj.forEach(function (p) {
      p.tier = null;
      p.how = '';
      p.man = false;
    });
    var scored = Pobj.map(function (p) { return { p: p, k: f0(p) }; }).sort(function (a, b) { return b.k - a.k; });
    var groups = [];
    scored.forEach(function (x) {
      var last = groups[groups.length - 1];
      if (last && last.k === x.k) {
        last.ps.push(x.p);
      } else {
        groups.push({ k: x.k, ps: [x.p] });
      }
    });
    var order = [];
    var ties = [];
    var tid = 0;
    groups.forEach(function (grp) {
      if (grp.ps.length === 1) {
        order.push(grp.ps[0]);
        return;
      }
      var steps = [];
      var tiers = resolveGroup(g, grp.ps, crits.slice(1), steps);
      var flat = [];
      tiers.forEach(function (t) {
        flat = flat.concat(t);
        if (t.length > 1) {
          tid++;
          t.forEach(function (p) { p.tier = 't' + tid; });
        }
      });
      flat.forEach(function (p) {
        p.how = p.tier ? 'tie' : (p.man ? 'po' : 'tb');
      });
      ties.push({ players: flat, start: order.length, end: order.length + flat.length - 1, steps: steps, tiers: tiers });
      order = order.concat(flat);
    });
    return { P: order, ties: ties, first: first };
  }

  /* finals teams from the top 4 seeds S and the playoff choice; null until the teams are known */
  function finTeams(g, S) {
    var po = g.po;
    if (po.fmt === 'p14') {
      return { A: [S[0].i, S[3].i], B: [S[1].i, S[2].i] };
    }
    if (po.pick) {
      var o = [1, 2, 3].filter(function (k) { return k !== po.pick; });
      return { A: [S[0].i, S[po.pick].i], B: [S[o[0]].i, S[o[1]].i] };
    }
    return null;
  }

  /* finals series state; expects g.fin to be present (index.html runs ensureFin first). No DOM, no writes. */
  function finState(g, P, complete) {
    var out = { show: complete, tm: null, rows: [], wa: 0, wb: 0, champ: null, need: Math.ceil(g.fin.fmt / 2) };
    if (!complete) {
      return out;
    }
    out.tm = finTeams(g, P.slice(0, 4));
    if (!out.tm) {
      return out;
    }
    out.over = g.fin.fmt;
    var stopped = false;
    for (var k = 0; k < g.fin.fmt; k++) {
      out.rows.push(k);
      if (stopped || out.over < g.fin.fmt) {
        continue;
      }
      var s = g.fin.g[k];
      if (validScore(s[0], s[1])) {
        if (+s[0] > +s[1]) {
          out.wa++;
        } else {
          out.wb++;
        }
        if (out.wa >= out.need || out.wb >= out.need) {
          out.over = k + 1;
        }
      } else {
        stopped = true;
      }
    }
    if (out.wa >= out.need) {
      out.champ = out.tm.A;
    } else if (out.wb >= out.need) {
      out.champ = out.tm.B;
    }
    return out;
  }

  /* tie tiers still level on every tiebreak whose first player sits in the top 4 positions of a ranking.
     Returns [{ s: start position (0-based), tr: [players] }]; the finals wait until this is empty. */
  function unresolvedTop4(rank) {
    var out = [];
    rank.ties.forEach(function (t) {
      t.tiers.forEach(function (tr) {
        if (tr.length > 1) {
          var st = rank.P.indexOf(tr[0]);
          if (st < 4) {
            out.push({ s: st, tr: tr });
          }
        }
      });
    });
    return out;
  }

  var EN_DASH = String.fromCharCode(0x2013);

  function playerName(g, i) {
    var n = ((g.names && g.names[i]) || '').trim();
    return n || ('Player ' + (i + 1));
  }

  /* the champions of a game, or null: needs all 14 matches, no unresolved top-4 tie, and a decided finals series.
     text is what the app stores in g.champ: 'Name & Name' plus ' (wins-losses)', en dash, when the final is longer than 1 game. */
  function champion(g) {
    if (!g || !g.fin || !g.po) {
      return null;
    }
    var c = compute(g);
    if (c.done !== 14) {
      return null;
    }
    var rk = computeRank(g, c.P);
    if (unresolvedTop4(rk).length) {
      return null;
    }
    var fs = finState(g, rk.P, true);
    if (!fs.champ) {
      return null;
    }
    var isA = fs.champ === fs.tm.A;
    var wins = isA ? fs.wa : fs.wb;
    var losses = isA ? fs.wb : fs.wa;
    var series = wins + EN_DASH + losses;
    var text = playerName(g, fs.champ[0]) + ' & ' + playerName(g, fs.champ[1]);
    if (g.fin.fmt > 1) {
      text += ' (' + series + ')';
    }
    return { team: fs.champ.slice(), wins: wins, losses: losses, series: series, text: text };
  }

  /* pot and per-player payouts; null when the buy-in is not a positive number */
  function payouts(po, paidCount) {
    var b = parseFloat(po && po.buyin);
    if (!(b > 0)) {
      return null;
    }
    var np = paidCount || 8;
    var pot = b * np;
    return {
      np: np,
      pot: pot,
      winner: po.pay === 'wta' ? pot / 2 : (pot - 2 * b) / 2,
      runnerUp: po.pay === 'back' ? b : null
    };
  }

  return {
    /* bump together with the ?v= on index.html's logic.js tag and its load guard */
    version: 3,
    SCHED: SCHED,
    CRIT: CRIT,
    DEF_ORDER: DEF_ORDER,
    DEF_OFF: DEF_OFF,
    validScore: validScore,
    decided: decided,
    compute: compute,
    activeCrit: activeCrit,
    h2hNet: h2hNet,
    keyFnFor: keyFnFor,
    resolveGroup: resolveGroup,
    computeRank: computeRank,
    finTeams: finTeams,
    finState: finState,
    unresolvedTop4: unresolvedTop4,
    champion: champion,
    payouts: payouts
  };
})();

if (typeof module !== 'undefined') module.exports = PBRR; else window.PBRR = PBRR;
