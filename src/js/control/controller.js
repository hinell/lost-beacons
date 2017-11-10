// stub for units's tasks
// instead of behavoiur system
class Task {
  static get TARGET_MISSING(){ return new Error(Task.name + ' Invalid argument: target is required!') }
  
  constructor (target,controller,executor) {
    if(!target) { throw Task.TARGET_MISSING }
    this.target      = target;
    this.controller  = controller;
    this.executor    = executor;
    (!controller || !executor) && console.warn('Don\'t forget to set executor and controller!')
  }
  get done(){ /*implement in subclasses*/ }
  get bad (){ /*implement in subclasses*/ }
  get feasible(){ return !this.bad }
  cycle(){}
}

class Tasks extends Objects {
  constructor (arr) {
    super(arr);
  }
  
  //@return {Tasks}
  get targets(){ return this.map(task => task.target) }
  
  //@return {Tasks}
  sortByClosestTo(target){
    return this.sort((a,b) => target.distanceTo(a.target) - target.distanceTo(b.target))
  }
  
}

// Units formation group
// that contains subgroups of units
// e.g. UnitsGroup.subgroup = [UnitsGroup, UnitsGroup, ... ]
class UnitsGroup {

  constructor (arr,controller) {
    this.tasks = []; // tasks pool
    this.task // current task
    this.controller = controller;
    this.subgroup = new Units();
    if(arr instanceof Array && arr.length){
      arr.forEach(sub => this.push(sub))
    }
  }
  
  new(arr){
    let i = new this.constructor(arr)
    i.task = this.task;
    i.superviser = this.superviser;
    i.controller = this.controller;
    i.GENERIC = 'GENERIC '+this.constructor.name.toUpperCase()
    return i
  }
  
  get health(){ return this.subgroup.health }
  
  get healthCap(){ return this.subgroup.healthCap }
  
  get isDead(){ return !this.subgroup.health }

  get isEngaged(){ return this.subgroup.isEngaged }
  
  get isUnderAttack(){ return this.subgroup.isUnderAttack }
  
  get enemiesAround(){ return this.subgroup.enemiesAround }
  
  get enemiesAttacking(){ return this.subgroup.enemiesAttacking }
  
  // @return {Boolean}
  get isMoving(){ return this.subgroup.isMoving }
  
  // duplicate-un-proofed
  get size(){ return this.subgroup.size }
  
  get length(){ return this.subgroup.length }
  
  get first(){ return this.subgroup.first }
  
  get last(){ return this.subgroup.last }
  
  get isIdle(){
    if(!this.task){ return true } else
    if(this.task.done){
      this.setTask(this.task = void 0)
      return true
    }
    return false
  }
  
  // @return {UnitsGroup}
  idle(recursive = false){
    if(!recursive) { return this.filter(sub => sub.isIdle) }
    return this.reduce((group,sub) => {
      if(sub.isIdle){ group.push(sub.idle()) };
      return group
    })
  }
  
  addTask(task){if(!this.tasks.contains){ this.tasks.push(task) }}
  
  setTask(task){
    this.task = task
    if (this.subgroup.length) {
      this.subgroup.forEach(sub => {
        sub.task = task;
        sub.setTask && sub.setTask(task)
      })
    }
    return this
  }
  
  distanceTo(target){ return this.subgroup.distanceTo(target) }
  
  sortByClosestTo(target){
    if(target instanceof UnitsGroup){ target = target.randomUnit() }
    this.subgroup.sort((a,b) => {
      a.distanceTo(target) - b.distanceTo(target)
    })
    return this
  }

  // @param {Boolean} - filter subunits that aren't supervised by current SuperGroup
  cycle(supervisionCheck = true, taskCycle = false){
    if(taskCycle && !this.task && this.tasks.length) {
      this.task = this.tasks.shift();
      if(this.task.cycle){  }
    }
    
    if(this.subgroup.length){
      let prev = this.subgroup;
      this.subgroup = this.subgroup.filter(sub => {
        if(sub){
          if(sub.cycle){ sub.cycle(supervisionCheck) }
          if(supervisionCheck) { return sub.superviser === this && !sub.isDead }
          else { return !sub.isDead }
        }
      })
    }
    return this
  }
  
  unsupervised(){return this.subgroup.filter(sub => !sub.superviser)}
  
  // Set superviser to the internal or provided
  // units by the argument to the current Squad
  assign(arr){
    if(arr instanceof Array){ arr.forEach(e => this.assign(e)); return this }
    if(arr !== undefined){
      arr.superviser = this;
      this.push(arr);
    } else {
      this.subgroup.forEach(sub => {
        sub.superviser = this;
        sub.assign && sub.assign()
      })
    }
    return this;
  }
  
  random(){ return this.subgroup.random() }
  
  randomUnit(){
    let sub = this.subgroup.random()
    while(!(sub instanceof Unit)) { sub = sub.randomUnit() }
    return sub
  }
  
  push(sub){
    if(!sub) { return }
    if(sub instanceof Array) { return sub.forEach(u => this.push(u),this) }
    if(this.subgroup.contains(sub)) { return }
    if (this.task) { sub.task = this.task }
    return this.subgroup.push(sub)
  }
  
  extract(length){
    let i = this.new();
    i.push(this.subgroup.extract(length))
    return i
  }
  
  shift(){ return this.subgroup.shift() }
  
  contains(obj){ return this.subgroup.contains(obj) }
  
  filter(fn,rest,this_){
    return this.new(this.subgroup.filter(fn,rest,this_))
  }
  
  reduce(fn,init){
    if(!init){init = this.new()}
    return this.subgroup.reduce(fn,init)
  }
  
  map(fn,this_){ return this.new(this.subgroup.map(fn, this_)) }
  
  forEach(fn,this_){ this.subgroup.forEach(fn, this_) }
  
  slice(begin,end){ return this.new(this.subgroup.slice(begin,end)) }
  
  move(target){ this.subgroup.forEach(sub => sub.move(target)) }
  
  stop(){ this.subgroup.stop() };
  
  sub(deep = true){
    return this.subgroup.reduce((arr,sub) => {
      if(deep){ sub.sub().forEach(sub => arr.contains(sub) || arr.push(sub) ) }
      else { arr.contains(sub) || arr.push(sub) }
      return arr
    },[])
  }
  
}

class Squad extends UnitsGroup {
  // @param {Boolean} - filter subunits that aren't supervised by current Squad
  cycle(identityCheck = true){
    if(this.subgroup.length){
      this.subgroup = this.subgroup.filter(sub => {
        // TODO: Optimize
        if(identityCheck) { return sub.superviser === this && !sub.isDead }
        else { return !sub.isDead }
      })
    }
  }
  
  postRender(t,ctx,c){
    if (DEBUG) {

      let {x,y,r} = this.subgroup.coord;
      r && ctx.wrap(() => {
        ctx.beginPath()
        ctx.fillStyle = this.controller ? this.controller.body : 'yellow';
        ctx.arc(x,y,5,0,Math.PI2);
        ctx.fill()
        ctx.fillStyle = 'yellow';
        let text = 'NO TASK'
        if (this.task) { text = this.task.name }
        ctx.fillText(text,x,y + r + 20)
      })
    }
  }

  move(position){
    if(!(position instanceof Object_ || position instanceof Objects)) { throw TARGET_MISSING }
    if(!this.subgroup.length){ return }
    let radius = this.subgroup.first.radius; // minimal unit radius
    
    let closestBeacon = W.beacons.sortByClosestTo(position).first;
    let reachableUnits= position.distanceTo(closestBeacon) < closestBeacon.unitsDetectionRadius
      ? closestBeacon.units
      : W.units
      
    let positions = reachableUnits.freeCirclePositions(position, radius, null);
        this.subgroup.move(positions);
  }
  
  randomUnit(){ return this.subgroup.random() }
  
  idle(){ return this.filter(sub => !sub.task || sub.task.done   ) }
  
  sub(){ return this.subgroup }
}

class Platoon extends UnitsGroup {
  
  get enemiesAround(){ return this.subgroup.enemiesAround.unique() }
  
  get enemiesAttacking(){ return this.subgroup.enemiesAttacking }
  
  
  distanceTo(target){
    let distance = this.subgroup.reduce((distance,sub) => distance+sub.distanceTo(target),0)
        distance = (distance/this.subgroup.length).roundp();
    return distance
  }
  
}

class Infantry extends UnitsGroup {}

class Division extends UnitsGroup { }

class Controller {
  constructor (cfg = {}) {
    // units
    this.units             = new Squad(); // all units
    this.unsupervisedUnits = new Squad();
    this.squads            = new Platoon([],this); // all squads
    this.platoons          = new Infantry(); // all platoons
    // this.companies = new Division();
    // this.divisions = new Infantry();       // Strategic level
    
    // miscellaneous
    this.name
    
    // enemies & friends controllers
    this.enemies = new Objects();
    this.friends = new Objects();
    
    // beacons settings
    this.reinforcementsInterval = cfg.reinforcementsInterval || 10;
    this.beacons = new Beacons();
    
    // style settings
    this.style = {
          body      : '#ccc'
        , leg       : '#999'
        , head      : '#fff'
        , beacon    : '#ccc'
    }
    // timers & intervals
    this.mainSequence    = new Interval(1);
    this.mainSequence.cb = function() {
      // removing dead subunits
      this.units   .cycle(false);
      this.squads  .cycle(false);
      this.platoons.cycle(false).forEach(p => p.cycle(true));
      if(this.beacons.length ){ this.beacons  = this.beacons.filter((b,i,a) => this.isFriendly(b.controller) ) }
      
    }.bind(this)
  }
  
  cycle(t){this.mainSequence.cycle(t)}
  
  isHostile (cntrlr) { return !cntrlr || this.enemies.contains(cntrlr) }
  
  isFriendly(cntrlr) { return cntrlr === this || this.friends.contains(cntrlr) }
  
  addEnemy(enemy){
    if(enemy instanceof Array){ return enemy.forEach(e => this.addEnemy(e)) }
    if(enemy === this){ return }
    if(this.enemies.contains(enemy)){ return }
    this.enemies.push(enemy);
  }
  
  behaviour(){ return new Idle() }
  
  control(object){
       object.controller = this;
    if(object instanceof Beacon && !this.beacons.contains(object)) { this.beacons.push(object) }
    if(object instanceof Unit   && !this.units.contains(object)) {
      if(!object.task && !this.unsupervisedUnits.contains(object)){
        this.unsupervisedUnits.push(object)
      }
      this.units.push(object)
    }
    return object
  }
  
  stopControl(object){
    if(object instanceof Beacon) { this.beacons.remove(object) }
    if(object instanceof Unit  ) { this.units.remove(object) }
    return object
  }
  
  indicate(target,msg){}
  
  render(t){}
  
  postRender(t,ctx,c){}
}

class Human extends Controller {
  constructor (cfg) {
    super(cfg = {})
    this.name   = cfg.name || 'human';
    
    // style settings
    this.style.body   = 'hsla(115,80%,50%,1)';
    this.style.leg    = 'hsla(115,70%,30%,1)';
    this.style.head   = 'hsla(120,80%,70%,1)';
    this.style.beacon = 'hsla(120,80%,50%,1)';
    
    // TODO: remove this later
    Object.assign(this,this.style);
    // TODO: move camera instance here
    this.viewport = {};
    this.reinforcementsInterval = 15;
    this.viewport.indicators = new Objects();
  }
  
  indicate(target,msg,color,duration){
    let indicator = new Indicator(target);
        indicator.indicate(msg,color,duration);
    this.viewport.indicators.push(indicator);
    return this
  }
  // TODO: Replace by task system
  behaviour(target,position){ return new Reach(target,position) }
  
  pushIdleUnit(){}
  
  cycle(){}
}