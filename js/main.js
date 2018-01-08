'use strict';

var startNode = 1,
    arc = false;

var canvasCont = canvas.getContext('2d');
var canvasPath = canvaspath.getContext('2d');

var up,
    v = {
        numNodes: 0
    },
    defGraph = {
        1: {
            3: {
                dir: "both"
            },
            4: {
                dir: "both"
            },
            adjs: ["4", "3"],
            visited: true,
            x: 357,
            y: 79
        },
        2: {
            1: {
                dir: "to"
            },
            5: {
                dir: "both"
            },
            adjs: ["1", "5"],
            visited: true,
            x: 521,
            y: 72
        },
        3: {
            1: {
                dir: "both"
            },
            5: {
                dir: "to"
            },
            adjs: ["5", "1"],
            visited: true,
            x: 636,
            y: 203
        },
        4: {
            1: {
                dir: "both"
            },
            3: {
                dir: "to"
            },
            6: {
                dir: "to"
            },
            adjs: ["1", "6", "3"],
            visited: true,
            x: 490,
            y: 353
        },
        5: {
            1: {
                dir: "to"
            },
            2: {
                dir: "both"
            },
            adjs: ["1", "2"],
            visited: true,
            x: 300,
            y: 292
        },
        6: {
            3: {
                dir: 'to'
            },
            adjs: [3],
            visited: true,
            x: 692,
            y: 378
        },
        numNodes: 6
    },
    path = [],
    pathStates = [],
    adjs = [startNode],
    f, secFlag = false,
    drag,
    timer, nTimer;

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight + 4;
canvaspath.width = canvas.width;
canvaspath.height = canvas.height;

document.addEventListener('mousedown', function (e) {
    if (e.target.className != 'node') return 1;
    let move, up, el = e.target,
        offsetx = e.pageX - el.offsetLeft,
        offsety = e.pageY - el.offsetTop;
    drag = false;
    toInitState();
    document.addEventListener('mousemove', move = function (e) {
        drag = true;
        let x = e.pageX - offsetx;
        let y = e.pageY - offsety;
        el.style = 'left: ' + x + 'px; top: ' + y + 'px';
        v[el.innerHTML].x = x;
        v[el.innerHTML].y = y;
        canvasCont.clearRect(0, 0, 2000, 2000);
        let nodes = document.querySelectorAll('.node');
        for (var i = 1; i <= nodes.length; i++)
            redrawLines(v, i);
    });
    document.addEventListener('mouseup', up = function () {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
    });
});

document.addEventListener('click', function (e) {
    if (e.target.className != 'node' || drag) return 1;
    if (!secFlag) {
        f = e.target;
        f.setAttribute('selected', '');
    } else {
        if (e.target != f) {
            delete v[e.target.innerHTML][f.innerHTML];
            v[e.target.innerHTML].adjs.find(function (el, index, arr) {
                if (el == f.innerHTML) {
                    delete arr[index];
                }
            })
            v[f.innerHTML][e.target.innerHTML] = {
                dir: (arc) ? "to" : "both"
            };
            v[f.innerHTML].adjs[v[f.innerHTML].adjs.length] = e.target.innerHTML;
            if (!arc) {
                v[e.target.innerHTML][f.innerHTML] = {
                    dir: "both"
                };
                v[e.target.innerHTML].adjs[v[e.target.innerHTML].adjs.length] = f.innerHTML;
            }
            let nodes = document.querySelectorAll('.node');
            canvasCont.clearRect(0, 0, 2000, 2000);
            for (var i = 1; i <= nodes.length; i++)
                redrawLines(v, i);
        }
        f.removeAttribute('selected');
        f = undefined;
        toInitState();
    }
    secFlag = !secFlag;
});

document.querySelector('.edge').addEventListener('click', function () {
    arc = !arc;
    if (arc) this.setAttribute('data-type', 'arrow');
    else this.setAttribute('data-type', 'line');
});

document.querySelector('.num').addEventListener('change', function (e) {
    startNode = +e.target.value;
    if (+e.target.value > v.numNodes) startNode = 1;
    toInitState();
});

canvaspath.addEventListener('mousedown', function (e) {
    timer = setTimeout(function () {
        putNode(e, true);
        clearTimeout(timer);
        canvas.removeEventListener('mouseup', up);
    }, 400);
    canvaspath.addEventListener('mouseup', up = function () {
        clearTimeout(timer);
        canvas.removeEventListener('mouseup', up);
    });
});

document.querySelector('.findTree').addEventListener('click', findPath);

document.querySelector('.graph').addEventListener('click', function () {
    buildGraph(defGraph);
});

document.querySelector('.steps').addEventListener('mouseover', function (e) {
    if (e.target.className != 'step' || e.target.dataset.state == -2) return 1;
    canvasPath.clearRect(0, 0, 2000, 2000);
    drawTree(e.target.dataset.state == -1 ? path : pathStates[e.target.dataset.state]);
});

function putNode(e, clear) {
    let node = document.createElement('div');
    let coords;
    node.innerHTML = ++v.numNodes;
    node.className = 'node';
    coords = area(canvas.width, canvas.height, e);
    node.setAttribute('style', 'top: ' + coords[1] + 'px; left: ' + coords[0] + 'px');
    document.body.appendChild(node);
    if (clear) v[v.numNodes] = {
        x: coords[0],
        y: coords[1],
        adjs: [],
        visited: false
    };
    if (clear) toInitState();
}

function drawLine(from, to, color, width, pathEl, ctx, force) {
    let fl = false,
        size = 5;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    if (force) {
        let a = from[1] - to[1];
        let b = from[0] - to[0];
        let c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
        let part = 25 / c;
        ctx.translate(to[0] + b * part, to[1] + a * part);
        ctx.rotate(getAngle(from, to) * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, 0);
        ctx.lineTo(0, size);
        ctx.fill();
    }
    ctx.restore();
}

function area(width, height, e) {
    let x, y;
    if (e.pageY + 20 > height) y = height - 40;
    else if (e.pageY - 20 < 0) y = 0;
    else y = e.pageY - 20;
    if (e.pageX + 20 > width) x = width - 40;
    else if (e.pageX - 20 < 0) x = 0;
    else x = e.pageX - 20;
    return [x, y];
}

function findPath() {
    if (!v[1]) {
        notifier("Граф не найден");
        return 3;
    }
    toInitState();
    let node, treeNodeCount = 1,
        arr;
    while (adjs.length != 0 && treeNodeCount < v.numNodes) {
        arr = [];
        node = adjs.shift();
        v[node].visited = true;
        for (var i = 0; i < v[node].adjs.length; i++) {
            if (v[node].adjs[i] == undefined) continue;
            if (!v[v[node].adjs[i]].visited && v[node][v[node].adjs[i]].dir != undefined) {
                adjs.push(v[node].adjs[i]);
                v[v[node].adjs[i]].visited = true;
                path.push(node, Number.parseInt(v[node].adjs[i]));
                treeNodeCount++;
                arr.push(v[node].adjs[i]);
            }
        }
        adjs = adjs.sort();
        setStep(node + " &#8594; " + arr.join(', ') + '<br>' + adjs.join(', '), adjs.length > 0 ? pathStates.length : -1);
        pathStates.push(path.slice());
    }
    if (adjs.length == 0 && treeNodeCount < v.numNodes)
        setStep('Невозможно найти дерево', -2);
    if (treeNodeCount == v.numNodes) {
        drawTree(path);
        setStep('Посещены все вершины', -1);
        return 1;
    }
}

function setStep(text, state) {
    let steps = document.querySelector('.steps');
    let step = document.createElement('div');
    step.innerHTML = text;
    step.className = 'step';
    step.setAttribute('data-state', state);
    steps.appendChild(step);
}

function drawTree(curpath) {
    let nodes = document.querySelectorAll('.node');
    for (var i = 0; i < nodes.length; i++)
        if (curpath.find(function (el, index, arr) {
                if (nodes[i].innerHTML == el) return el;
            }) == undefined) nodes[i].removeAttribute('path');
        else nodes[i].setAttribute('path', '');
    canvasPath.save();
    canvasPath.strokeStyle = "blue";
    canvasPath.lineWidth = 3;
    for (i = 0; i < curpath.length / 2; i++)
        drawLine([v[curpath[i * 2]].x + 20, v[curpath[i * 2]].y + 20], [v[curpath[i * 2 + 1]].x + 20, v[curpath[i * 2 + 1]].y + 20], "blue", 2, i * 2, canvasPath, v[curpath[i * 2]][curpath[i * 2 + 1]].dir == 'to' ? true : false);
    canvasPath.restore();
    hideNotifier();
}

function toInitState() {
    let nodes = document.querySelectorAll('.node');
    for (var i = 1; i <= v.numNodes; i++) {
        v[i].visited = false;
        nodes[i - 1].removeAttribute('path');
    }
    adjs = [];
    adjs[0] = startNode;
    path = [];
    pathStates = [];
    document.querySelector('.steps').innerHTML = '';
    canvasPath.clearRect(0, 0, 2000, 2000);
}

function notifier(text) {
    clearTimeout(nTimer);
    let n = document.querySelector('.notifier');
    n.innerHTML = text;
    n.setAttribute('active', '');
    nTimer = setTimeout(function () {
        n.removeAttribute('active');
    }, 5000);
}

function hideNotifier() {
    let n = document.querySelector('.notifier');
    clearTimeout(nTimer);
    n.removeAttribute('active');
}

function getAngle(from, to) {
    let a, b, c, alpha;
    a = from[1] - to[1];
    b = from[0] - to[0];
    c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    alpha = -Math.asin(a / c) / Math.PI * 180;
    if (from[0] < to[0])
        alpha = alpha + 180;
    else
        alpha = -alpha;
    return alpha;
}

function buildGraph(graph) {
    graph = JSON.parse(JSON.stringify(graph));
    let e;
    toInitState();
    let nodes = document.querySelectorAll('.node');
    for (var i = 0; i < v.numNodes; i++)
        document.body.removeChild(nodes[i]);
    canvasCont.clearRect(0, 0, 2000, 2000);
    v.numNodes = 0;
    for (var i = 1; i <= graph.numNodes; i++) {
        putNode(e = {
            pageX: graph[i].x + 20,
            pageY: graph[i].y + 20
        }, false);
        redrawLines(graph, i);
    }
    if (v != graph) v = graph;
}

function redrawLines(graph, i) {
    for (var j = 0; j < graph[i].adjs.length; j++)
        if (graph[i].adjs[j] != undefined) drawLine([graph[i].x + 20, graph[i].y + 20], [graph[graph[i].adjs[j]].x + 20, graph[graph[i].adjs[j]].y + 20], "black", 1, -1, canvasCont, graph[i][graph[i].adjs[j]].dir == 'to' ? true : false);
}