// multiplier - get it by subtraction of 'to' from 'from' value see below

Number.prototype.linear = function (start = 0, end = 1, duration = 1){ return ((this / duration) * (end - start)) + start; }

Number.prototype.smoothStep = function (start = 0, end = 1,duration = 1){
  return ((this*this*this*(this*(this*6 - 15) + 10))/duration) * (end - start) + start
}

Number.prototype.easeOutQuad = function(start = 0, end = 1, duration = 1) {
    let t = this / duration;
    return t*(t-2) * -(end - start) + start;
}

Number.prototype.easeInQuint = function (start = 0, end = 1, duration = 1) {
    let t = this / duration;
    return t*t*t*t*t * (end - start) + start;
}

Number.prototype.easeOutQuint = function (start, end, duration = 1) {
    let t = this / duration-1;
    return ((t)*t*t*t*t + 1) * (end - start) + start;
}


// @func
// @param o - Object
// @param p - Property
// @param a - From
// @param b - To
// @param d - Duration
// @param l - Delay
// @param f - Easing function
// @param e - End callback
function interp(object, property, from, to, duration, delay, easingFnName, onEnd, return_) {
    let i = {
        obj   : object, // object
        key   : property, // property
        from  : from, // from
        to    : to, // to
        dur   : duration, // duration
        delay : delay || 0, // delay
        fn    : easingFnName || 'linear', // easing function
        onEnd : onEnd, // end callback
        t     : 0,
        cycle(t){
            if (i.delay > 0) {
                i.delay = i.delay -t;
                i.obj[i.key] = i.from;
            } else {
                i.t          = min(i.dur, i.t + t);
                i.obj[i.key] = i.t[i.fn](i.from, i.to ,i.dur);
                if(i.t >= i.dur){
                    i.t = 0;
                    if(i.onEnd){
                        i.onEnd(t,i);
                    }
                    W.remove(i);
                }
            }
            return i
        }
        };
    W.add(i);
}



class Timer {
  constructor (duration, speed, callback) {
    
    if(speed && speed.call && speed.apply) {
      callback = speed;
      speed = undefined
    }
    this.speed    = speed || (speed === false ? 0 : 0.1);
    this.duration = duration;
    this.counter  = 0;
    this.cb       = callback;
    this.reset();
  }
  
  reset(){
    this.t        = 0;
    this.done     = false;
    this.started  = true;
  }
  
  cycle(t) {
    if(this.done) { return }
    if(this.t >= this.duration) {
      this.done = true; // single call time callback
      if(this.cb){ this.cb.call(this,this) }
    } else if(this.cb) {
      this.counter = Math.abs(this.t * (1 / (this.duration))); // counter to 1
      this.cb.call(this,this);
      if(this.started){ this.started = false }
    }
    this.t += (this.speed || t);
  }
}

class Interval  {
  constructor (duration,speed,cb) {
    if(speed && speed.call) {
      cb = speed;
      speed = void 0;
    }
  
    this.s = speed === false ? void 0 : (speed || 0.1);
    this.d = duration
    this.cb= cb
    this.t = 0;
  }
  cycle(t,ctx,c){
    this.s = this.s || t
    if((this.t += this.s) >= this.d){ this.t = 0; this.cb.apply(this,arguments); }
    
  }
}

class Interp extends Timer {
  constructor (duration, from, to, target, key, speed, callback) {
    if(speed && speed.call && speed.apply){ callback = speed; speed = void 0 }
    super(duration, speed);
    this.f = from;
    this.to= to;
    this.o = target;
    this.k = key;
    this.cb= callback;
    this.easing = 'linear';
  }
  

  
  cycle(t) {
    if(this.done) { return }
    if(this.t >= this.duration) {
      this.done = true; // single call time callback
      if(this.cb){ this.cb.call(this,this) }
      this.o[this.k] = this.to;
    } else {
      this.counter = Math.abs(this.t * (1 / (this.duration))); // counter to 1
      if(this.cb) { this.cb.call(this,this) }
      this.o[this.k] = Math.abs(this.counter[this.easing](this.f,this.to));
      if(this.started){ this.started = false }
    }
    this.t += (this.speed || t);
    
  }
  
}

class Timers {
    constructor (loop,array){
      if(loop instanceof Array) {
        array = loop;
        loop = undefined
      }
      this.timers = array || [];
      this.loop   = loop;
      this.paused = false;
      this.done   = false;
    }
    
    toggle(){ this.paused = !this.paused  }
    
    reset(){
      this.done = false;
      this.timers.forEach(function(t){t.reset()})
    }
    
    cycle(){
      // cycle over timers here
    }
}

class Sequence extends Timers {
  constructor (loop,array) {
    super([],loop)
    if(loop instanceof Array) {
      array = loop;
    }
      array.forEach(t => this.add(t));
    this.loop = loop;
    this.current;
  }
  reset(){
    this.current = this.timers.first;
    super.reset()
  }
  
  add(timer){
      if(timer instanceof Array) { timer = new Synchronous(timer) }
      this.timers.push(timer);
      if(this.timers.length === 1) { this.current = timer }
      if(this.timers.length >= 2) {
        this.timers[this.timers.length-2].next = timer;
      }
      return this
  }
  cycle(t = 0){
    if(!this.done){
      if(this.paused) { return }
      if(this.current.done){
      let next = this.current.next;
        if(next){ this.current = next }
        else {
          this.done = true;
          if(this.loop ) { this.reset() }
        }
      } else {
        this.current.cycle(t)
      }
    }
  
  }
}

class Synchronous extends Timers {
  constructor (loop,array) {
    super(loop,array);
    this.timers = this.timers.map(function (t){
      if(t instanceof Array){ return new Sequence(t,loop) }
      return t
    })
  }
  
  cycle(t = 0){
    if(!this.done){
      if(this.paused) { return }
      if(this.timers.every(t => t.done)) {
        this.done = true;
        if(this.loop) { this.reset() }
      } else {
        this.timers.forEach(t => t.cycle(t) )
      }
    }
  }
}