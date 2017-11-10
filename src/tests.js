class Test {
 constructor (description,fn){
  if(description && description.bind) {
    fn = description;
    description = ''
  }
   this.fn = fn;
   this.d = description;
 }
 run(){
  this._sucful = this.r = this.fn();
  this._failed = !this._sucful;
  return this
 }
 
 isSucful(){ return this._sucful }
 isFailed(){ return this._failed }
 
 report(pad){
  return pad+(this._failed ? '✖ ' :  '✔ ')+this.d
 }
}

class Tests {
  constructor (description, tests) {
    if(description instanceof Array || description instanceof Tests) {
      tests       = description;
      description = ''
    }
    this.d     = description;
    this.tests = tests;
    this.fn    = void 0;
  }
  
  new(tests){
    let i = new this.constructor(this.d, tests || []);
        i._sucful = this._sucful;
        i._failed = this._failed;
        i._run    = this._run
    return i
  }
  
  isSucful(){ return this._sucful }
  
  isFailed(){ return this._failed }
  
  run(){
    this._run = true;
    this.tests.forEach(t => t.run())
    this._sucful = this.tests.every(t => t.isSucful())
    this._failed = !this._sucful;
    return this
  }
  
  forEach(fn){ this.tests.forEach(fn) }
  
  filter(fn){ return this.new(this.tests.filter(fn)) }
  
  reduce(fn,init){
    if(init === undefined){ init = this.new() }
    return this.tests.reduce(fn, init) }
  
  push(t){ return this.tests.push(t) }
  
  failed(){
    if(!this._run){ return };
    let rrr = this.reduce((ts,t) => {
      if(t.isFailed()){
        ts.push( t.failed ? t.failed() : t) }
      return ts
    })
    return rrr
  }
  
  sucful(){
    if(!this._run){ return };
    return this.reduce((ts,t) => {
      if(t.isSucful()){ ts.push(t.failed()) }
      return ts
    }, this.new())
  }
  
  report(pad='',i = 0){
    let m = '';
    if(this._failed){
      pad+=' ';
      m+=pad+'✖ '+this.d+'\n';
      let failed = this.failed();
      m+=failed.reduce((str,t) => str+=(pad+i++)+t.report(pad,i)+'\n','')
    }
    if(this._sucful) {m = '✔ '+this.d+' All tests are succesfull!'}
    return m
  }
}

let testsReport = new Tests(UnitsGroup.name,[
      /*new Test('assign()', function (){
        let units = 10..range().map(n => new Unit())
        let squad = new Squad();
            squad.assign(units);
        return squad.length === units.length
      })
     ,*/new Test('Platoon.assign(Platoon.subgroup)', function (){
        let s  = new Squad([new Unit()]);
        let p1 = new Platoon([s])
        let p2 = new Platoon();
            p2.assign(p1.subgroup);
        return p2.first === s
      })
  ]).run().report();
  
  
console.log(testsReport)