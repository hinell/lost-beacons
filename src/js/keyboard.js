w.down = {};
onkeydown = e => {
    w.down[e.keyCode] = true;
    w.down.alt      = e.altKey
    w.down.shift    = e.altKey
    
};
onkeyup = e => {
    w.down[e.keyCode] = false;
    w.down.alt      = e.altKey
    w.down.shift    = e.altKey
};
