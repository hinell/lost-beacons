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

Array.prototype.random = function (length = 1) {
  if(this.length <= 1){ return this[0]
  } else {
    if(typeof length !== 'number') { length = 0 };
    if(length > 1){
      let arr = new this.constructor();
      while(length) {
        let e = this.random();
        if(arr.contains(e)){ arr.push(e) }
        length--
      }
      return arr
    }
    return this[Math.round((0.0001).random(this.length - 1))]
  }
};

Array.prototype.contains = function (elem,startIndex){
  return !!~this.indexOf(elem,startIndex)
}

Array.prototype.extract = function (length,right) {
  let method = right ? 'pop' : 'shift';
  if(length <= 0) { return }
  if(length > 0){
    let arr = new this.constructor();
    if(length >= this.length) {
      this.forEach(e => arr.push(e));
      this.length = 0;
      return arr
    }
    while(arr.length < length) { arr.push(this[method]()) }
    return arr
  }
  return this[method]()
};

Array.prototype.unique = function (){
  return this.reduce((arr,e)=> {
    !arr.contains(e) && arr.push(e); return arr
  } ,new this.constructor)
}

Array.prototype.intersect = function (arr,fn){
  let intersected = new this.constructor();
  let condition   = fn || function (a,b){ return a === b }
  for (let i = 0; i < this.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if(condition(this[i],arr[j])){ intersected.push(this[i]) }
    }
  }
  return intersected
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

Map.prototype._keys = Map.prototype.keys;
Map.prototype.keys = function (array){
  if (!array) { return this._keys() }
  let arr = [];
  this.forEach(function (v,k){ arr.push(k) })
  return arr
}

Map.prototype._values = Map.prototype.values;
Set.prototype._values = Set.prototype.values;
Map.prototype.values =
Set.prototype.values = function (array) {
  if(!array) { return this._values() }
  let arr = [];
  this.forEach(v => arr.push(v));
  return arr
}

Number.prototype.range = function(fn){
  let arr = [];
  if(fn){
     for (let i = 0; i < this; i++) { arr.push(fn(i)) }
  } else {
    for (let i = 0; i < this; i++) { arr.push(i) }
  }
  return arr
}

Number.prototype.roundp = function(p = 0){ return ~~(this*Math.pow(10,p))/Math.pow(10,p) }

// Returns the number A of the B that has no remainder if divided by precision number:
// 153..clip(50) => 150, 279..clip(30) => 270
// The function has to possible implementations: B - (B % P) and ~~(B/P) * P  =>  A
// The latest is fastest
// @param {Number} - p - Precision
Number.prototype.clip = function (p = 1){ return ~~(this/p) * p }

Number.prototype.isBetween = function(a,b){
    return (a <= this && this <= b) || (a >= this && this >= b)
}

Number.prototype.random = function (b = 0){return Math.random() * (((this + 0) || 1) - b) + b}

class Canvas {constructor(){return document.createElement('canvas')}}

// @param w - canvas width
// @param h - canvas height
// @param c - canvas context or callback
// @param cb - callback called with context anc canvas parameters (context, canvas instance) =>
// @return {HTMLCanvasElement} - return canvas or what ever callback returns
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

function perf (n,fn){
    tt = performance.now();
    let r = fn(n)
    console.log(n,performance.now() - tt);
    return r
}