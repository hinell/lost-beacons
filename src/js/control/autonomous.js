class BeaconConquest extends Task {

  constructor (beacon,controller,exec) {
    super(beacon,controller,exec);
    this.beacon = beacon;
    this.name = 'CONQUEST'
  }
  
  get done(){
  return this.beacon.controller === this.controller
    && this.beacon.nearbyEnemies.length === 0
  }
  
  get bad (){
    if(this.beacon.units.length === 0) { return false }
      let enemyUnitsHealth = this.beacon.units.filter(u => this.controller.isHostile(u.controller)).health;
      return enemyUnitsHealth > this.executor.health;
  }
}

class BeaconDefence extends Task {

  constructor (beacon,controller,executor) {
    super(beacon,controller,executor);
    this.beacon              = beacon;
    this.name                = 'DEFENCE'
  }
  // Done if no one is trying to conquer it anymore
  get done(){
  return this.beacon.controller === this.controller
    && !this.beacon.isConquered
    && !this.beacon.nearbyEnemies.length
  }
  
  get bad (){
    let frUnitsHp = 0;
    if(this.beacon.controller === this.controller) { frUnitsHp = this.beacon.readyUnitsHealth }
    return this.beacon.units.filter(u => this.controller.isHostile(u)).health > this.executor.health
  }
}

class SquadAssistence extends Task {
  constructor(squadTarget,controller){
    if(!squadTarget){throw new Error('Invalid argument: squadTarget is required!')}
    super(squadTarget,controller);
    this.squad        = squad;
    this.squadTarget  = squadTarget;
  }
  get done() { return !this.squadTarget.isEngaged.filter(u => u.beacon).length }
  get bad () { return this.squadTarget.enemiesAttacking.length > (this.squad.length / 2).roundp() }
}

class Reatret extends Task {

  constructor (position) {
    super(position);
    this.position = position;
  }
  
  get done(){return this.executor.distanceTo(this.position) <= (this.executor.random().visibilityRadius / 2).roundp() }
  
  get bad (){
    if(  this.position instanceof Squad
      || this.position instanceof Beacon
      || this.position instanceof Unit){
      return this.position.enemiesAroundHealth > this.executor.health
    }
    return true
  }
}

class AI extends Controller {

  constructor (cfg) {
    super(cfg);
    this.name = 'Old machine';
    this.reinforcementsInterval = 18;
    
    this.style.head   = '#850000',
    this.style.body   = '#ac0404',
    this.style.leg    = '#5d0505',
    this.style.beacon = '#ff645b',
    
    Object.assign(this,this.style);
    
    // timings
    this.cycleInterval = 3;
    this.cycleTimer    = 0; // cycle immediately
    
    this.cacheInterval = 6;
    this.cacheTimer    = 0;
    
    // targets for tasks
    
    this.conquerableBeacons = new Beacons();
    this.defensibleBeacons  = new Beacons();
    

    this.beaconsControlUnit = {};
    
    this.idleUnits    = new Squad();
    this.idleSquads   = new Platoon([],this); // all inactive squads
    this.idlePlatoons = new Infantry();
    
    this.unsupervisedSquads   = new Platoon();
  }
  
  // Call after this.beacons.spawnUnits
  mobilizeSquads(){
    this.unitsPerSquad    = 4..random(12).roundp();
    if(this.unsupervisedUnits.length > 0) {
      while (this.unsupervisedUnits.length > 0){
        // idleUntis are pused by a separate call on the beacons
        let lowUnitsSquad = this.squads.filter(s => s.length < this.unitsPerSquad).first;
        let squad  = lowUnitsSquad || new Squad();
        let amount = this.unitsPerSquad - squad.length;
        if(!amount) { continue }
        let units  = this.unsupervisedUnits.extract(amount);
        if(units.first.superviser){}
            squad.MOBILIZED = 'MOBILIZED'
            squad.assign(units.subgroup);
        this.control(squad);
        
        this.squads.push(squad);
        this.idleSquads.push(squad);
        this.unsupervisedSquads.push(squad);
        
        this.unitsPerSquad = 4..random(12).roundp();
      }
    }
  }
  
  mobilizePlatoons(){
    this.squadsPerPlatoon = 2..random(8).roundp();
    this.mobilizeSquads()
    // if(this.unsupervisedSquads.length <= this.squadsPerPlatoon){}
    if(this.unsupervisedSquads.length > 0) {
      while (this.unsupervisedSquads.length >= this.squadsPerPlatoon) {
        let uncrowdedPlatoon = this.platoons.filter(p => p.length < this.squadsPerPlatoon).random();
        let platoon          = uncrowdedPlatoon || new Platoon();
        let unsupervised     = this.unsupervisedSquads.extract(this.squadsPerPlatoon - platoon.length);
            platoon          = this.control(platoon);
            platoon.assign(unsupervised.subgroup);
            platoon.MOBILIZED = 'MOBILIZED'
            
        this.platoons.push(platoon);
        this.idlePlatoons.push(platoon);
        
        this.squadsPerPlatoon = 2..random(8).roundp();
      }
    }
  }
  
  idleTaskForce(){
    if(this.idlePlatoons.length === 1) { return this.idlePlatoons.first }
    if(this.idlePlatoons.length) {
      let start = 0..random(2)
      return this.idlePlatoons.slice(start,start.random(4))
    }
    
    if(this.idleSquads.length){
      return this.idleSquads.slice(0,1..random(8))
    }
    
    if(this.idleUnits.length){
      return this.idleUnits.slice(0,1..random(16))
    }
    
  }
  
  beaconDefence () {
    let beacon;
    let conqured = this.defensibleBeacons.conqured();
    if(conqured.length) { beacon = conqured.random() }
    else { beacon = this.defensibleBeacons.random() }
    if(!beacon){ return }
    this.beacons.readyToSpawn.spawnUnits()
    this.mobilizePlatoons();
    
    let unitsGroup = [
        this.idlePlatoons
      , this.idleSquads
      , this.idleUnits].filter(group => group.length).first
    let executor
    if(!(unitsGroup && unitsGroup.length)){ return }
    let startFrom = 0..random(5);
        executor = unitsGroup
          .sortByClosestTo(beacon)
          .slice(startFrom,startFrom.random(10));
          
    if(!executor || executor.task){ return }
    let task = new BeaconDefence(beacon,this,executor);
    if(task.feasible){
      executor.setTask(task);
      executor.move(task.target)
    }
  }
  
  beaconConquest () {
    if(this.platoons.length < W.beacons.length.random(W.beacons.length * 5).roundp()){
        this.beacons.readyToSpawn.spawnUnits();
        this.mobilizePlatoons();
    }
    
    let executor = this.idleTaskForce();
    if(!executor || executor.task){ return }
    
    let closest = this.conquerableBeacons
        .filter(b => b.nearbyEnemies.length < executor.size)
        .sortByClosestTo(executor);
        
    let beacon  = closest.at(executor,executor.visibilityRadius * 4).random();
    if(!beacon) { beacon = closest.slice(0,3).random() }
    if(!beacon) { return }
    let task     = new BeaconConquest(beacon,this,executor);
    if(task.feasible){
       executor.setTask(task);
       executor.move(beacon);
    }
  }
  
  cycle(t) {
    // console.log(['I\'m awake...','Assuming direct control.'].join('\n'));
    super.cycle(t);
    if ((this.cacheTimer -= t) <= 0) {
      this.cacheTimer = this.cacheInterval;
      let retaken = W.beacons.filter(b => this.isHostile(b.controller) && b.previousController === this)
      if(retaken.length){
        this.conquerableBeacons = retaken } else {
        this.conquerableBeacons = W.beacons.filter(b => this.isHostile(b.controller) );
      }
    }
    if ((this.cycleTimer -= t) <= 0) {
      this.cycleTimer = this.cycleInterval;
      
      this.idlePlatoons = this.platoons.idle();
      this.idleSquads   = this.squads.idle();
      this.idleUnits    = this.units.idle();
      
      this.defensibleBeacons  = this.beacons.filter(b => b.nearbyEnemies.length > b.nearbyFriends.length );
      if(this.platoons.length <= 128) {
        if(this.defensibleBeacons.length ){this.beaconDefence()}
        if(this.conquerableBeacons.length){this.beaconConquest()}
      }
    }
  }
  
  postRender(t,ctx,c){
    this.squads.forEach(squad => { squad.postRender(t,ctx,c)} )
  }
}

class Nemesis extends AI {

  constructor (cfg) {
    super(cfg)
    this.name                   = 'nemesis';
    this.body                   = '#661040';
    this.leg                    = '#191818';
    this.head                   = '#daaaff';
    this.beacon                 = '#ee61b1';
    this.reinforcementsInterval = 15
    
  }
  
  cycle(){}
}