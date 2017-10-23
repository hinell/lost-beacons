var DEBUG = false,
    D = document,
    w = window,
    delayed = setTimeout,
    C, // canvas
    R, // canvas context
    G, // Game instance
    V, // Camera instance
    W, // World instance
    mobile = navigator.userAgent.match(/andro|ipho|ipa|ipo|windows ph/i),
    constants =
    
//
    // window['true ']   =  1;
    // window['false']   =  0;
    // window['const']   =  "let";
    
    CANVAS_WIDTH =  1400;
    CANVAS_HEIGHT =  1000;
    
    GRID_EMPTY_PADDING =  3;
    GRID_OBSTACLE_PADDING =  1;
    OBSTACLES =  80;
    OBSTACLE_EXPAND_ITERATIONS =  2;
    
    GRID_SIZE =  50;
    GRID_COLOR =  '#479';
    PERSPECTIVE =  400;
    
    CYCLABLE =  1;
    RENDERABLE =  2;
    FIRST =  4;
    UNIT =  8;
    BEACON =  16;
    
    HEALTH_GAUGE_WIDTH =  30;
    HEALTH_GAUGE_HEIGHT =  2;
    HEALTH_GAUGE_RADIUS =  20;
    
    SELECTED_EFFECT_RADIUS =  40;
    SELECTED_EFFECT_SIZE =  5;
    
    CHASE_CURSOR_RADIUS =  40;
    CHASE_CURSOR_SIZE =  8;
    CHASE_CURSOR_PERIOD =  0.4;
    
    CURSOR_MOVE_CAMERA_MARGIN =  50;
    
    SELECTION_MIN_SIZE =  5;
    ANNOUNCEMENT_CELL_SIZE =  8;

    
    NO_CLICK =  0;
    LEFT_CLICK =  1;
    RIGHT_CLICK =  2;
    CLICK_HIGHLIGHT_PERIOD =  1.8


Math.PI2 = Math.PI * 2
Math.PI3 = Math.PI * 3

Object.keys(constants).forEach(function (key){
    window[key] = constants[key];
});

// Highly optimized forEach loop
Array.prototype.forEach =
Array.prototype.each    = function (fn ,this_) {
  if(this.length <=0 || fn === undefined) {return};
  if (this_) fn = fn.bind(this_);
  for (let i = 0; i < this.length; i++) {
    fn(this[i],i,this)
  }
  
};

Array.prototype.remove = function(item) {
    const index = this.indexOf(item);
    if (index >= 0) {
        this.splice(index, 1);
        return true;
    }
};

Array.prototype.random = function () {
    return pick(this)
}

// TODO: REPLACE by Array.random
function pick (choices) {
    return choices.length <= 1
        ? choices[0]
        : choices[Math.round(rand(0.0001,choices.length - 1))]
}

Object.defineProperties(Array.prototype,{
  first: { get(){ return this[0] }            , configurable: true, enumerable: true},
  last : { get(){ return this[this.length-1] }, configurable: true, enumerable: true}
});

class Iterable {
  constructor (interable){
      this.interable = interable
  }
  toArray(){
  let a = [], kv;
  while(!(kv = this.interable.next()).done) { a.push(kv.value) }
  return a
  }
}

Map.prototype._keys = Map.prototype.keys;
Map.prototype.keys = function (array){
  if (!array) { return this._keys() }
  return new Iterable(this._keys()).toArray()
}

Map.prototype._values = Map.prototype.values;
Map.prototype.values = function (array){
  if (!array) { return this._values() }
  return new Iterable(this._values()).toArray()
}

Number.prototype.range = function(){
  return this ? Array.apply(null, {length: this}).map((e,i) => i) : []
}

Number.prototype.roundp = function(p = 2){ return ~~(this*Math.pow(10,p))/Math.pow(10,p) }

Number.prototype.floorp = function (p = 1){ return ~~(this / p) * p; }

Number.prototype.isBetween = function(a,b){
    return (a <= this && this <= b) || (a >= this && this >= b)
}

class Canvas {constructor(){return document.createElement('canvas')}}

// @param w - canvas width
// @param h - canvas height
// @param c - canvas context or callback
// @param cb - callback called with context anc canvas parameters (context, canvas instance) =>
// @return {HTMLCanvasElement} - return canvas
HTMLCanvasElement.prototype.render = function(w,h,c,cb){
  this.width = w; this.height = h;
  if(c.call) {
    cb = c;
    c = void 0
  }
  return cb(this.getContext(c || '2d'),this) || this
}

function between(a, b, c) {
    if (b < a) {
        return a;
    }
    if (b > c) {
        return c;
    }
    return b;
}

function zeroes(x) {
    x = '' + x;
    while (x.length < 2) {
        x = '0' + x;
    }
    return x;
}

function formatTime(t) {
    t = ~~t;

    return zeroes(~~(t / 60)) + ':' + zeroes(t % 60);
}
