// ==UserScript==
// @name        Twitch Video Rotation
// @description Adds buttons and keyboard shortcuts to rotate and flip the video on Twitch
// @version     1
// @author      Slooshi
// @namespace   Slooshi
// @match       https://www.twitch.tv/*
// @license     MIT
// @grant       GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/527067/Twitch%20Video%20Rotation.user.js
// @updateURL https://update.greasyfork.org/scripts/527067/Twitch%20Video%20Rotation.meta.js
// ==/UserScript==

GM_addStyle(`
#video-rotation-controls {
\tmargin-left: 15px;
}
#video-rotation-controls button {
\tfont-size: 20px;
\tbackground: #f5f5f5;
\tborder: 1px solid #d9d9d9;
\tcolor: #414141;
\tline-height: 22px;
\theight: 24px;
\twidth: 24px;
\toutline: 0;
}
#video-rotation-controls button:not(:last-child) {
\tmargin-right: 3px;
}
.vwplayer_vlivelive .videoBox {
    height: calc(100% - 4px);
    width: calc(100% - 4px);
}
`);

let directions = {
\tleft: 'r270',
\tup: 'r0',
\tright: 'r90',
\tdown: 'r180',
\tflipH: 'flipH',
\tflipV: 'flipV',
}
let rotations = {
\tr90: 'rotate(90deg)',
\tr180: 'rotate(180deg)',
\tr270: 'rotate(270deg)',
};
let scaling = {
\tflipH: 'scaleX(-1)',
\tflipV: 'scaleY(-1)',
\tportrait: 'scale(1.77777)',
\tlandscape: 'scale(0.5625)',
};

let attempts = 0;
let controlsID = 'video-rotation-controls';
let shortcutsEnabled = true;
let shortcuts = {
\t'Numpad8': directions.up,
\t'Numpad2': directions.down,
\t'Numpad4': directions.left,
\t'Numpad6': directions.right,
\t'Numpad9': directions.flipH,
\t'Numpad3': directions.flipV,
}
let stylesheet = null;
let timer = null;

(() => {
\tstylesheet = document.createElement('style');
\tdocument.head.appendChild(stylesheet);

\tlet getAllSubsets = arr => arr.reduce((subsets, value) => subsets.concat(subsets.map(set => [...set, value])), [[]]).slice(1);
\tlet scalings = getAllSubsets(Object.keys(scaling));

\tfor (let rule in rotations) {
\t\tstylesheet.sheet.insertRule(`video.${rule} { transform: ${rotations[rule]}; }`, stylesheet.sheet.cssRules.length);
\t\tfor (let scalingSet of scalings) {
\t\t\tstylesheet.sheet.insertRule(`video.${rule}.${scalingSet.reduce((s, v) => s+'.'+v)} { transform: ${rotations[rule] + scalingSet.reduce((s, v) => s+' '+scaling[v], '')}; }`, stylesheet.sheet.cssRules.length);
\t\t}
\t}

\tlet flips = getAllSubsets([directions.flipH, directions.flipV]);
\tfor (let flipSet of flips) {
\t\tstylesheet.sheet.insertRule(`video.${flipSet.reduce((s, v) => s+'.'+v)} { transform:${flipSet.reduce((s, v) => s+' '+scaling[v], '')}; }`, stylesheet.sheet.cssRules.length);
\t}

\taddButtons();

\t// Re-add buttons if page changes
\twindow.history.pushState = function() {
\t\tHistory.prototype.pushState.apply(history, arguments);
\t\tattempts = 0;
\t\tsetTimeout(addButtons, 2000);
\t}
})();

function addButtons() {
    clearTimeout(timer);
    let btnArea = document.querySelector('.player-controls__right-control-group');

    if (!btnArea) {
        if (++attempts < 10) {
            timer = setTimeout(addButtons, 500);
        }
        return;
    }
    else if (document.getElementById(controlsID)) {
        return;
    }

    let btnDirections = [
        [directions.left, '🠘'],
        [directions.up, '🠙'],
        [directions.right, '🠚'],
        [directions.down, '🠛'],
        [directions.flipV, '🡙'],
        [directions.flipH, '🡘'],
    ];

    let div = document.createElement('div');
    div.id = controlsID;
    div.style.marginLeft = '15px';
    div.style.display = 'inline-block';
    for (let entry of btnDirections) {
        let btn = document.createElement('button');
        btn.dataset.direction = entry[0];
        btn.textContent = entry[1];
        btn.style.fontSize = '20px';
        btn.style.background = '#f5f5f5';
        btn.style.border = '1px solid #d9d9d9';
        btn.style.color = '#414141';
        btn.style.lineHeight = '22px';
        btn.style.height = '24px';
        btn.style.width = '24px';
        btn.style.outline = '0';
        btn.style.marginRight = '3px';
        div.appendChild(btn);
    }

    //btnArea.parentNode.insertBefore(div, btnArea.nextSibling);
    btnArea.parentNode.insertBefore(div, btnArea);
}

function rotateVideo(direction) {
\tlet video = document.querySelector('video');
\tif (!video) return;
\tlet flip = [directions.flipH, directions.flipV].includes(direction);

\tif (flip) {
\t\tvideo.classList.toggle(direction);
\t}
\telse {
\t\tvideo.classList.remove(directions.left, directions.right, directions.down, 'portrait', 'landscape');
\t\tif (direction != directions.up) {
\t\t\tvideo.classList.add(direction);
\t\t\tif ([directions.left, directions.right].includes(direction)) {
\t\t\t\tvideo.classList.add(video.videoHeight > video.videoWidth ? 'portrait' : 'landscape');
\t\t\t}
\t\t}
\t}
}

window.addEventListener('click', function(e) {
\tif (e.target.parentNode.id != controlsID || e.target.tagName.toLowerCase() != 'button') {
\t\treturn;
\t}
\telse if (e.target.dataset.direction) {
\t\trotateVideo(e.target.dataset.direction);
\t}
}, true);

// Shortcuts
window.addEventListener('keydown', function(e) {
\tlet stopPropagation = false;
\tif (shortcuts[e.code] && shortcutsEnabled) {
\t\trotateVideo(shortcuts[e.code]);
\t\tstopPropagation = true;
\t}
\telse if (e.code == 'Pause') {
\t\tshortcutsEnabled = !shortcutsEnabled;
\t\tstopPropagation = true;
\t}

\tif (stopPropagation) {
\t\te.preventDefault();
\t\te.stopPropagation();
\t}
}, true);
