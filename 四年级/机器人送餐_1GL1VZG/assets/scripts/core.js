(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RobotCore = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var serial = 0;
  var DIR = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function command(type, value, children) {
    var c = { id: 'c' + (++serial), type: type, value: value };
    if (type === 'loop') c.children = children || [];
    return c;
  }
  function count(program) {
    return program.reduce(function (n, c) { return n + 1 + (c.children ? count(c.children) : 0); }, 0);
  }
  function expand(program) {
    if (!program.length) throw new Error('先添加指令。');
    if (count(program) > 80) throw new Error('指令太多，请试着用循环简化。');
    var result = [];
    function add(list, loop, iteration, total) {
      list.forEach(function (c) {
        if (['move', 'left', 'right', 'loop'].indexOf(c.type) < 0) throw new Error('存在无法识别的指令。');
        if (!Number.isInteger(c.value)) throw new Error('请设置整数参数。');
        if (c.type === 'loop') {
          if (loop) throw new Error('循环里面不能再放循环。');
          if (c.value < 2 || c.value > 9 || !c.children || !c.children.length) throw new Error('循环需要2～9次，并放入指令。');
          for (var i = 1; i <= c.value; i++) add(c.children, c.id, i, c.value);
        } else {
          if (c.type === 'move' && (c.value < 1 || c.value > 6)) throw new Error('直行格数应为1～6。');
          if (c.type !== 'move' && [90, 180, 270].indexOf(c.value) < 0) throw new Error('转向角度应为90°、180°或270°。');
          result.push({ id: c.id, type: c.type, value: c.value, loopId: loop || null, iteration: iteration || 1, total: total || 1 });
          if (result.length > 320) throw new Error('展开后的指令超过320条，请简化。');
        }
      });
    }
    add(program);
    if (result.reduce(function (n, c) { return n + (c.type === 'move' ? c.value : 0); }, 0) > 700) throw new Error('行走路线太长，请简化。');
    return result;
  }
  function simulate(task, program) {
    var flat;
    try { flat = expand(program); } catch (e) { return { ok: false, structural: true, message: e.message, groups: [] }; }
    if (task.requireLoop && !program.some(function (c) { return c.type === 'loop'; })) return { ok: false, structural: true, message: '这道题需要使用循环指令。', groups: [] };
    var state = { x: task.start.x, y: task.start.y, d: task.start.d, served: [] };
    var groups = [], stopped = false, reason = '', failId = null;
    flat.forEach(function (c, index) {
      if (stopped) return;
      var g = { command: c, events: [] };
      if (index === 0) g.events.push({ type: 'pickup', x: state.x, y: state.y });
      if (c.type === 'move') {
        for (var k = 0; k < c.value; k++) {
          var nx = state.x + DIR[state.d][0], ny = state.y + DIR[state.d][1];
          if (nx < 0 || nx > task.width || ny < 0 || ny > task.height) {
            stopped = true; reason = '机器人走出地图了，检查直行格数或转向。'; failId = c.id;
            g.events.push({ type: 'error', message: reason }); break;
          }
          state.x = nx; state.y = ny;
          g.events.push({ type: 'move', x: nx, y: ny, d: state.d });
          var table = task.tables.find(function (t) { return t.x === nx && t.y === ny; });
          if (table && task.goals.indexOf(table.id) >= 0 && state.served.indexOf(table.id) < 0) {
            var next = task.goals[state.served.length];
            if (table.id !== next) {
              stopped = true; reason = '顺序不对：现在应该先送到' + circled(next) + '号桌。'; failId = c.id;
              g.events.push({ type: 'error', message: reason }); break;
            }
            state.served.push(table.id);
            g.events.push({ type: 'deliver', table: table.id, x: nx, y: ny, remaining: task.goals.length - state.served.length });
          }
        }
      } else {
        state.d = (state.d + (c.type === 'right' ? 1 : -1) * c.value / 90 + 8) % 4;
        g.events.push({ type: 'turn', d: state.d, angle: (c.type === 'right' ? 1 : -1) * c.value });
      }
      g.after = clone(state); groups.push(g);
    });
    if (!reason && state.served.length !== task.goals.length) reason = '还有餐桌没送到，请检查路线。';
    if (!reason && (state.x !== task.start.x || state.y !== task.start.y)) reason = '还没有回到取餐口。';
    if (!reason && state.d !== task.start.d) reason = '已经回到取餐口，再检查最后的朝向。';
    return { ok: !reason, structural: false, message: reason || (task.free ? '执行完成！' : '送餐成功！'), groups: groups, state: state, failId: failId };
  }
  function circled(n) { return String.fromCharCode(0x245f + n); }
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function integer(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function shuffle(list, r) {
    var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = integer(r, 0, i), v = a[i]; a[i] = a[j]; a[j] = v; } return a;
  }
  function turn(program, from, to) {
    var delta = (to - from + 4) % 4;
    if (delta) program.push(command(delta === 3 ? 'left' : 'right', delta === 3 ? 90 : delta * 90));
  }
  function pathToProgram(path, startDirection, finalDirection) {
    var p = [], d = startDirection, i = 1;
    while (i < path.length) {
      var dx = path[i].x - path[i - 1].x, dy = path[i].y - path[i - 1].y;
      var nd = dx === 1 ? 0 : dx === -1 ? 2 : dy === -1 ? 1 : 3;
      turn(p, d, nd); d = nd;
      var len = 0;
      while (i < path.length && path[i].x - path[i - 1].x === dx && path[i].y - path[i - 1].y === dy) { len++; i++; }
      while (len > 0) { p.push(command('move', Math.min(6, len))); len -= 6; }
    }
    turn(p, d, finalDirection);
    return p;
  }
  function bfs(task, from, to, blocked) {
    var key = function (p) { return p.x + ',' + p.y; };
    var queue = [{ x: from.x, y: from.y }], parent = {}, seen = {};
    seen[key(from)] = true;
    for (var i = 0; i < queue.length; i++) {
      var p = queue[i];
      if (p.x === to.x && p.y === to.y) {
        var path = [p], t = key(p);
        while (parent[t]) { path.unshift(parent[t]); t = key(parent[t]); }
        return path;
      }
      for (var j = 0; j < 4; j++) {
        var n = { x: p.x + DIR[j][0], y: p.y + DIR[j][1] }, nk = key(n);
        if (n.x < 0 || n.x > task.width || n.y < 0 || n.y > task.height || seen[nk] || blocked[nk]) continue;
        seen[nk] = true; parent[nk] = p; queue.push(n);
      }
    }
    return null;
  }
  function solve(task) {
    if (task.solution) return clone(task.solution).map(function renew(c) { c.id = 'c' + (++serial); if (c.children) c.children = c.children.map(renew); return c; });
    var path = [{ x: task.start.x, y: task.start.y }], current = path[0];
    for (var i = 0; i <= task.goals.length; i++) {
      var target = i === task.goals.length ? task.start : task.tables.find(function (t) { return t.id === task.goals[i]; });
      var blocked = {};
      task.goals.slice(i + 1).forEach(function (id) { var t = task.tables.find(function (v) { return v.id === id; }); blocked[t.x + ',' + t.y] = true; });
      var leg = bfs(task, current, target, blocked);
      if (!leg) return null;
      path = path.concat(leg.slice(1)); current = target;
    }
    return pathToProgram(path, task.start.d, task.start.d);
  }
  function textbook(n) {
    var t = { kind: 'textbook', number: n, width: 6, height: 3, start: { x: 0, y: 0, d: 0 }, tables: [{ id: 1, x: 3, y: 0 }, { id: 2, x: 6, y: 0 }, { id: 3, x: 6, y: 3 }, { id: 4, x: 3, y: 3 }, { id: 5, x: 0, y: 3 }], goals: n === 1 ? [1] : n === 2 ? [1, 4, 5] : [1, 2, 3, 4, 5] };
    if (n === 1) t.solution = [command('loop', 2, [command('move', 3), command('left', 180)])];
    if (n === 2) t.solution = [command('loop', 4, [command('move', 3), command('left', 90)])];
    if (n === 3) t.solution = [command('loop', 2, [command('move', 6), command('left', 90), command('move', 3), command('left', 90)])];
    return t;
  }
  function generate(seed, level) {
    var r = rng(seed), chosenLevel = level === 'mixed' ? ['basic', 'medium', 'advanced'][integer(r, 0, 2)] : level;
    if (['basic', 'medium', 'advanced'].indexOf(chosenLevel) < 0) chosenLevel = 'basic';
    var basic = chosenLevel === 'basic', advanced = chosenLevel === 'advanced';
    var cap = basic ? 5 : advanced ? 9 : 7;
    // Build a short complete route first. Targets and distractors never increase its command budget.
    var shape = basic ? 'line' : advanced ? (r() < 0.45 ? 'elbow' : 'rectangle') : (r() < 0.35 ? 'line' : 'rectangle');
    var w = integer(r, shape === 'line' && !basic ? 3 : 2, 4), h = integer(r, 2, 4);
    var square = shape === 'rectangle' && r() < 0.45; if (square) h = w;
    var vertices = shape === 'line' ? [[0, 0], [w, 0], [0, 0]] : shape === 'elbow' ? [[0, 0], [w, 0], [w, h], [w, 0], [0, 0]] : [[0, 0], [w, 0], [w, h], [0, h], [0, 0]];
    var rotation = basic ? 0 : integer(r, 0, 3), mirrored = !basic && r() < 0.5;
    vertices = vertices.map(function (v) {
      var x = v[0], y = mirrored ? -v[1] : v[1];
      for (var k = 0; k < rotation; k++) { var old = x; x = -y; y = old; }
      return { x: x, y: y };
    });
    var minX = Math.min.apply(null, vertices.map(function (v) { return v.x; })), minY = Math.min.apply(null, vertices.map(function (v) { return v.y; }));
    var extentX = Math.max.apply(null, vertices.map(function (v) { return v.x; })) - minX;
    var extentY = Math.max.apply(null, vertices.map(function (v) { return v.y; })) - minY;
    var width = Math.max(4, extentX + integer(r, 0, 2)), height = Math.max(3, extentY + integer(r, 0, 2));
    if (basic) { width = integer(r, 4, 6); height = integer(r, 3, 4); }
    var offsetX = integer(r, 0, width - extentX), offsetY = integer(r, 0, height - extentY);
    vertices.forEach(function (v) { v.x += offsetX - minX; v.y += offsetY - minY; });
    var path = [clone(vertices[0])];
    vertices.slice(1).forEach(function (v) {
      var last = path[path.length - 1], dx = Math.sign(v.x - last.x), dy = Math.sign(v.y - last.y);
      while (last.x !== v.x || last.y !== v.y) { last = { x: last.x + dx, y: last.y + dy }; path.push(last); }
    });
    var first = path[1], origin = path[0], firstD = first.x > origin.x ? 0 : first.x < origin.x ? 2 : first.y > origin.y ? 3 : 1;
    var looped = shape === 'rectangle' && (!advanced || r() < 0.7);
    var initialD = firstD;
    if (!basic && (shape === 'line' || (looped && (advanced || square)))) initialD = (firstD + integer(r, 1, 3)) % 4;
    var program;
    if (looped) {
      var turnType = mirrored ? 'right' : 'left', body = [command('move', w), command(turnType, 90)];
      if (!square) body.push(command('move', h), command(turnType, 90));
      program = []; turn(program, initialD, firstD); program.push(command('loop', square ? 4 : 2, body)); turn(program, firstD, initialD);
    } else program = pathToProgram(path, initialD, initialD);
    var unique = [], seen = {}; seen[origin.x + ',' + origin.y] = true;
    path.slice(1).forEach(function (v) { var key = v.x + ',' + v.y; if (!seen[key]) { seen[key] = true; unique.push(v); } });
    var goalCount = Math.min(unique.length - 1, basic ? (r() < 0.8 ? 1 : 2) : integer(r, advanced ? 3 : 2, advanced ? 4 : 3));
    // The first target must be at least two grid steps away, with room for later targets.
    var firstChoices = unique.map(function (v, i) { return i; }).filter(function (i) {
      return i <= unique.length - goalCount && Math.abs(unique[i].x - origin.x) + Math.abs(unique[i].y - origin.y) >= 2;
    });
    var firstIndex = firstChoices[integer(r, 0, firstChoices.length - 1)];
    var selected = [unique[firstIndex]].concat(shuffle(unique.slice(firstIndex + 1), r).slice(0, goalCount - 1)), candidates = [];
    for (var x = 0; x <= width; x++) for (var y = 0; y <= height; y++) {
      if ((x !== origin.x || y !== origin.y) && !selected.some(function (v) { return v.x === x && v.y === y; })) candidates.push({ x: x, y: y });
    }
    var distractorCount = advanced ? (r() < 0.15 ? 2 : integer(r, 0, 1)) : (r() < 0.45 ? 1 : 0);
    var tables = shuffle(selected.concat(shuffle(candidates, r).slice(0, distractorCount)), r).map(function (v, i) { return { id: i + 1, x: v.x, y: v.y }; });
    var goals = unique.filter(function (v) { return selected.some(function (s) { return s.x === v.x && s.y === v.y; }); }).map(function (v) { return tables.find(function (t) { return t.x === v.x && t.y === v.y; }).id; });
    var task = { kind: 'random', seed: seed, level: chosenLevel, width: width, height: height, start: { x: origin.x, y: origin.y, d: initialD }, tables: tables, goals: goals, requireLoop: advanced && looped, referenceCommands: cap, solution: program };
    if (count(program) > cap || !simulate(task, program).ok) throw new Error('随机题生成校验失败。');
    return task;
  }
  return { clone: clone, command: command, count: count, expand: expand, simulate: simulate, solve: solve, textbook: textbook, generate: generate, circled: circled, directions: DIR };
}));
