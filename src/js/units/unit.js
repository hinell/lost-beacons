class Behaviour {
    constructor (){
        this.cycleInterval  = 1;
        this.cycleTimer     = 0;
    }
    attach(unit) {
        this.unit = unit;
    }
    
    cycle(e) {}
  
    render() {}

    reservedPosition() { return {'x': this.unit.x, 'y': this.unit.y} }

}

class Idle extends Behaviour {}

class Chase extends Behaviour {

    constructor(target, position, radius = 20) {
        super();
        this.target     = target;
        this.position   = position;
        this.radius     = radius;
    }

    attach(unit) {
        this.unit = unit;
        this.updateSubBehavior();
    }

    updateSubBehavior() {

        if (!this.target && !this.position) {
            this.subBehavior = new Idle();
            return
        }
        if (this.unit.distanceTo(this.target) < this.radius
            && !W.hasObstacleBetween(this.unit, this.target)) {
            // Target is visible, attack!
            
            this.subBehavior = new Idle();
            
            // Make sure we're focusing on this specific unit (to avoid having the unit auto-attack another target)
            this.unit.target   = this.target;
            this.unit.friendly = this.target.controller === this.unit.controller;
        } else {
            this.subBehavior = new Reach(this.target,this.position);
            // TODO: If no position provided then Reach is too expensive for performance
            this.position    = undefined; // if target moves then no need to keep this position
        }
        this.subBehavior.attach(this.unit);
    }

    cycle(e) {
        super.cycle(e);
        this.cycleTimer -= e;
        if (this.cycleTimer <= 0) {
            this.cycleTimer = this.cycleInterval;
            this.updateSubBehavior();
        }
        if (this.subBehavior) this.subBehavior.cycle(e);

    }

    render() {
        this.subBehavior.render();
    }

    reservedPosition() {
        return this.subBehavior.reservedPosition();
    }

}

class Reach extends Behaviour {

    constructor(target,position) {
        super();
        this.position = position; // allows to hint the unit with position outside
        this.target = target;
    }

    attach(unit) {
        
        this.unit = unit;
        
        // attempt to pick the first target position and construct path
        if (!this.path) {
          if(!this.position){
            let units;
            if(this.target instanceof Beacon && this.target.units.length ){
              units = this.target.units
            } else { units = W.units }
            
            this.position = units.sortByClosestTo(this.target)
            .freeCirclePositions(this.target,this.unit.radius)
            .filter(position => position.x !== this.target.x && position.y !== this.target.y )
            .sort((a,b) => {
              let visibleFromA = W.castRay(a,atan((this.target.y - a.y) / (this.target.x - a.x)),GRID_SIZE * 10) >= this.target.distanceTo(a);
              let visibleFromB = W.castRay(a,atan((this.target.y - b.y) / (this.target.x - b.x)),GRID_SIZE * 10) >= this.target.distanceTo(b);
              if (visibleFromA !== visibleFromB) {
                return visibleFromA ? -1 : 1;
              }
            // Both positions can see the target, so let's just pick whichever one is closer
            return this.target.distanceTo(a) - this.target.distanceTo(b);
          })[0]
          
          }

          this.position = this.position || this.target;
          this.subBehavior && (this.subBehavior = new Idle());
          this.path     = W.constructPath(this.unit, this.position, (position) => {
          return new Object_(position).distanceTo(this.position) <= GRID_SIZE;
          });
          this.path     = this.path  || [this.target]; // if no path of previous call, then go to the target anyway
        }
        
    }

    cycle(e) {
        if(this.path && !this.path.length) { return }
        const nextPosition = this.path[0];
        if (nextPosition) {
            const distance = this.unit.distanceTo(nextPosition);

            this.unit.moving = true;

            if (distance > 0) {
                // TODO: Here is the bug when unit is spawned on the map
                this.unit.angle = atan2(nextPosition.y - this.unit.y, nextPosition.x - this.unit.x);

                const appliedDistance = min(distance, this.unit.unitSpeed * e);
                // move unit
                this.unit.x += appliedDistance * cos(this.unit.angle);
                this.unit.y += appliedDistance * sin(this.unit.angle);
            } else {
                this.path.shift();
            }
        }
    }

    render() {
        if (DEBUG) {
            super.render();
        }
        if (this.unit.controller instanceof Human) {
            R.globalAlpha = 0.3;
            beginPath();
            R.strokeStyle = this.unit.controller.body;
            R.lineWidth = 2;
            moveTo(this.unit.x, this.unit.y);
            this.path.forEach(step => step && lineTo(step.x, step.y));
            stroke();
        }
    }

    reservedPosition() {
        const last = (this.path && this.path.length && this.path[this.path.length - 1]) || this.target;
        return {'x': last.x, 'y': last.y};
    }

}

const ALL_REPLIES   = [
            'our domination will last forever ... '
        ,   'the victory is coming'
        ,   'breath of freedom'
        ,   'unleash the power'
        ,   'control is found'
        ,   'conquer them all'
        ,   'beacon is our'
        ,   'keep going'
        ,   'well done'
        ,   'easy'
        ];

class Unit extends Object_ {
    constructor(cfg = {}){
        super(cfg);
        // shooting settings
        this.damageAmount = cfg.damageAmount    || 0.125;
        this.shotInterval = cfg.shotInterval    || 0.4;
        this.attackRadius = cfg.attackRadius    || 200;
        this.shotTimer    = this.shotInterval;
      
        // health settings
        this.healingInterval = cfg.healingInterval  || 1.5
        this.healTimer       = this.healingInterval;
        this.healingAmount   = cfg.healingAmount    || 0.05
        this.healRadius      = cfg.healRadius       || 100;
        this.healthSize      = this.health = 1;
        
        // motion settings
        this.unitSpeed    = cfg.unitSpeed || 150
        this.angularSpeed = cfg.angularSpeed || 0.1
        this.angle        = 0;
        this.angleSpeed   = 1;
        this.angleTurn    = Math.PI/180;
        this.moving       = false;
        
        // TODO: Replace behaviour system by task system
        // tasks
        this.tasks      = new Objects();
        this.task // current task
        this.setBehavior(new Idle());
        
        // entity settings
        this.radius           = cfg.radius || 20

        // cycles
        this.cycleTimer    = this.cycleInterval = 1;
        this.cacheInterval = this.cycleInterval = 2;
        this.cacheTimer    = 0; // fetch all units around immediately
        
        // beacons
        this.target          = null; // parental beacon, only available after spawn
        this.conqueringSpeed = 0.1;
        
        // objects around
        this.visibilityRadius   = Math.max(this.healRadius,this.attackRadius);
        
        this.nearbyUnits     = new Units();
        this.closestEnemies  = new Units();
        this.closestFriends  = new Units();
        this.closestBeacons
        this.conquering      // currently conquered by this unit beacon
        this.targetedBy      = new Units();
        
        // others settings
        this.indicator  = new Indicator(this);
        this.controller = cfg.controller; // set outside
        this.target;
        this.replies = cfg.replies || ALL_REPLIES
        
        // rendering settings
        this.pxsize = 3;
    }

    get dps () { return this.health }
    
    // TODO: Replace every this.controller == u.controller checks by this method
    isFriendly (unit) { return this.controller.isFriendly(unit.controller )}
    
    isHostile  (unit) { return this.controller.isHostile(unit.controller ) }
    
    // @return {Boolean}
    get isDead() { return !this.health; }
    
    get healthCap(){ return this.healthSize }
    
    get alive(){ return this }
    
    // @return {String}
    get name() {  return (this.constructor._name || this.constructor.name).toLocaleLowerCase() }
    
    // @return {Boolean}
    get isUnderAttack() { return !!this.targetedBy.length }
    
    // @return {Units}
    get enemiesAttacking(){ return this.targetedBy }
    
    // @return {Unit}
    get isEngaged(){ return this.firing }
    
    // @return {Boolean}
    get isWeak(){ return this.health < this.healthSize }
    
    // @return {Units}
    get enemiesAround(){ return this.closestEnemies }
    
    // @return {Boolean}
    get isMoving(){ return this.moving }
    
    get size(){ return 1 }
    
    hurt(amount) {
        if ((this.health -= amount) < 0.01) {
            this.health = 0;
        }
        
        this.controller.indicate(this.target,'unit under attack!','#a8211c');
        
        let particles = 1;
        
        if (this.isDead) {
            particles = 20;

            let k = 20;
            while (k--) {
                const d = rand(3, 4);
                let p = particle(0,this.controller.body,[
                    ['s', rand(4, 8), 0, 0.1, d],
                ]);
                p.x = this.x + rand(-15, 15);
                p.y = this.y + rand(-15, 15);
            }
        }

        const bloodDelay = rand(3, 4);
        let p = particle(0,this.controller.body,[
            ['s', rand(4, 8), 0, 0.1, bloodDelay],
        ]);
        p.x = this.x + rand(-15, 15);
        p.y = this.y + rand(-15, 15);

        while (particles--) {
            const d = rand(0.6, 1);
            particle(0,this.controller.body,[
                ['s', 10, 0, d],
                ['x', this.x + rand(-10, 10), this.x + rand(-50, 50), d],
                ['y', this.y + rand(-10, 10), this.y + rand(-50, 50), d]
            ]);
        }
    }
  
    enemyInRange() {
        // this.collection = currentMapSector
        return this.closestEnemies
            .filter(c => !W.hasObstacleBetween(this, c))
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b))
            [0];
    }
    
    heal(amount) {
        if (!this.isDead) {
            this.health = min(this.healthSize, this.health + amount);
        }
    }
    
    closestWeakFriend() {
      return this.closestFriends
        .at(this, this.healRadius)
        .filter(u => u.isWeak)
        .filter(unit => !W.hasObstacleBetween(this, unit))
        .sortByClosestTo(this)
        [0];
    }
    
    cycle(t) {
    
        this.moving = false;
        this.behaviour && this.behaviour.cycle(t);
        
        if ((this.cacheTimer-= t) <= 0) {
            this.cacheTimer     = this.cacheInterval;
            this.closestBeacons = W.beacons.sortByClosestTo(this);
            this.nearbyUnits    = this.closestBeacons.first && this.closestBeacons.first.units.at(this,this.attackRadius);
            if(!this.nearbyUnits || !this.nearbyUnits.length){ this.nearbyUnits = W.units.at(this,this.attackRadius) };
            
            let filtered        = this.nearbyUnits.filter(this.isFriendly,true,this);
            this.closestFriends = filtered[0];
            this.closestEnemies = filtered[1];

        }
        
        if (this.moving) { return }
        
        // main cycle
        if ((this.cycleTimer-= t) <= 0) {
     
            this.cycleTimer = this.cycleInterval;
             // the next target to be slaughtered or healed
             // TODO: Move this automatic behaviour into a separate module for task system
            if(!this.target){
                this.target = this.enemyInRange() || this.closestWeakFriend()
            }
        }
        if (this.target === this) { this.target = undefined; return }
        if(!this.target) { return }
        // TODO: Probably here is a bug. If no behaviour is set without having automatic  target behaviour is almost unpredictable
        // TODO: It should know nothing about Behavior instances
        if((this.distanceTo(this.target) > this.visibilityRadius) && this.behaviour instanceof Idle) {
            this.target = undefined;
            return
        }
      
        
        this.angle = this.angleTo(this.target)
        
        if (this.target && this.isFriendly(this.target)
            && (this.healTimer-= t) <= 0
            && !W.hasObstacleBetween(this,this.target)) {
            this.healTimer = this.healingInterval;
            
            if (this.target && this.target.isDead
                || this.target.health >= this.target.healthCap
                || this.distanceTo(this.target) > this.healRadius) {
                // stop healing, target is already at full health (and allows us to start shooting at another target)
                this.target  = undefined;
                this.healing = false
            }
            else {
                this.healing = true
                const target = this.target;

                const p = {
                    x : this.x,
                    y : this.y,
                    'progress': 0,
                    'postRender': () => {
                        translate(this.x + p.progress * (target.x - this.x), this.y + p.progress * (target.y - this.y));

                        R.fillStyle = this.controller.beacon;
                        fr(-2, -6, 4, 12);
                        fr(-6, -2, 12, 4);
                    }
                };

                W.add(p, RENDERABLE);

                interp(p,'progress',0,1, this.distanceTo(this.target) / 100,0,null,() => {
                    target.heal(this.healingAmount);
                    W.remove(p);
                });
            }

        }
        
        if (this.target && this.isHostile(this.target) && (this.shotTimer -= t) <= 0
            && !W.hasObstacleBetween(this,this.target)) {
            this.shotTimer = (this.shotInterval - 0.2).random(this.shotInterval);
            
            if ((this.target && this.target.isDead)
            || this.distanceTo(this.target) > this.attackRadius ) {
                this.target.targetedBy = new Units();
                this.target = void 0;
                this.firing = false
            } else {
                this.firing = true;
                let endPoint  = {x: this.target.x, y: this.target.y}
               // rays of fire
                const rays = {
                  x       : this.x,
                  y       : this.y,
                  'alpha' : 1,
                  'render': () => {
                    R.globalAlpha = rand(0.5,1);
                    R.strokeStyle = pick([
                        '#fffff9'
                        ,'#ff0'
                        ,'#ff7b00'
                        ,'#ff1f00'
                        ,'#ff0015'
                        ]);
                    R.lineWidth   = 0.5;
                    beginPath();
                    moveTo(this.x,this.y);
                    lineTo(endPoint.x,endPoint.y);
                    stroke();
                  }
                };
                W.add(rays,RENDERABLE);
                interp(rays,'alpha',0.5,0,0.1,0,null,() => W.remove(rays));
                !~this.target.targetedBy.indexOf(this) && this.target.targetedBy.push(this);
                this.target.hurt(this.damageAmount,this);
                this.controller.indicate(this.target,'engaging enemy!',this.controller.beacon)
            }

        }
    }

    render() {
        // TODO: Remove behaviour rendering
        this.behaviour && wrap(() => this.behaviour.render());
        let xx ,yy;
        wrap(() => {
            translate(xx = this.x.clip(GRID_SIZE),yy = this.y.clip(GRID_SIZE));
            // color of tales on the map
            R.globalAlpha = 0.1;
            R.fillStyle = this.controller.body;
            fr(0, 0, GRID_SIZE, GRID_SIZE);
        });
        
/*        R.beginPath();
        R.strokeStyle = '#949494';
        
        R.arc(this.x,this.y,this.radius, 0, Math.PI * 2);
        R.stroke();*/

        translate(this.x, this.y);
        rotate(this.angle);

        const sinusoidal = this.moving ? sin(G.t * PI * 4) : 0;
        const offset = sinusoidal * (this.pxsize / 2);

        translate(-this.pxsize * 1.5, -this.pxsize * 2.5);

        // Legs
        wrap(() => {
            translate(this.pxsize, 0);
            scale(sinusoidal, 1);
            R.fillStyle = this.controller.leg;
            fr(0, this.pxsize, this.pxsize * 3, this.pxsize); // left
            fr(0, this.pxsize * 3, -this.pxsize * 3, this.pxsize); // right
        });

        // Left arm
        wrap(() => {
            translate(offset, 0);
            R.fillStyle = this.controller.body;
            fr(this.pxsize, 0, this.pxsize * 2, this.pxsize);
            R.fillStyle = this.controller.leg;
            fr(this.pxsize * 2, this.pxsize, this.pxsize * 2, this.pxsize);
        });

        // Right arm
        wrap(() => {
            translate(-offset, 0);
            R.fillStyle = this.controller.body;
            fr(this.pxsize, this.pxsize * 4, this.pxsize * 2, this.pxsize);
            R.fillStyle = this.controller.leg;
            fr(this.pxsize * 2, this.pxsize * 3, this.pxsize * 2, this.pxsize);
        });

        // Main body
        R.fillStyle = this.controller.body;
        fr(0, this.pxsize, this.pxsize * 3, this.pxsize * 3);
      
        // Gun
        R.fillStyle = '#000';
        fr(this.pxsize * 3, this.pxsize * 2, this.pxsize * 3 * (this.damageAmount + 1), this.pxsize);
        
        // Head
        R.fillStyle = this.controller.head;
        fr(this.pxsize, this.pxsize, this.pxsize * 2, this.pxsize * 3)
      
    }

    postRender() {
        this.indicator.postRender();

        translate(this.x, this.y);
      
        // Second render pass, add health gauge
        R.fillStyle = '#000';
        fr(
            (-HEALTH_GAUGE_WIDTH / 2) - 1,
            -HEALTH_GAUGE_RADIUS - 1,
            (HEALTH_GAUGE_WIDTH + 2),
            (HEALTH_GAUGE_HEIGHT + 2)
        );
    let currentHealthGauge = ~~((this.health * HEALTH_GAUGE_WIDTH) / this.healthSize)
        
        R.fillStyle = currentHealthGauge > (HEALTH_GAUGE_WIDTH * .3)
        ? '#0f0'
        : '#f00';
        
        fr(
            (-HEALTH_GAUGE_WIDTH / 2),
            -HEALTH_GAUGE_RADIUS,
            currentHealthGauge,
            HEALTH_GAUGE_HEIGHT
        );
        // TODO: Move this out of the unit's render scope
        if (this.isSelected()) {
            R.fillStyle = '#fff';
            squareFocus(SELECTED_EFFECT_RADIUS, SELECTED_EFFECT_SIZE);
        }
    }
    
    setTask(task){ this.task = task }
    
    // behaviour
    setBehavior(b) {
        this.behaviour = b;
        this.behaviour.attach(this);
    }
    
    // motion
    move(position, sector){
        if(!position){ return };
    let notTheSamePosition, notWithinRadius;
        notTheSamePosition   = this.behaviour && this.behaviour.beacon !== position;
        notWithinRadius     = this.distanceTo(position) >= this.radius;
        if(notTheSamePosition || notWithinRadius) {
          this.setBehavior(new Reach(position,position))
        }
      return this
    }
    
    stop(){
      this.moving = false;
      this.setBehavior(new Idle())
    };
    
    // misceleneous
    isSelected() {
        // TODO: Move this out of the unit's render scope
        return G.selectionCursor.units.length && G.selectionCursor.units.indexOf(this) >= 0;
    }
    
    retreatPosition() {
        const positions = [];
        for (let i = 0 ; i < 8 ; i++) {
            const a = (i / 10) * Math.PI2;
            let position = {
                'x': this.x + Math.cos(a) * this.radius,
                'y': this.y + Math.sin(a) * this.radius
                }
            W.pointInObstacle(position) || W.isOut(position.x,position.y) || positions.push();
        }

        // Return a position that is available and not close to any enemy
        return new Object_(positions.random());
    }
}
Unit._name = 'uni'

class Destructor extends Unit {
    constructor(config = {}) {
        super()
        this.damageAmount *= 2;
        this.shotInterval = (this.shotInterval * 2) - 0.4;
        this.attackRadius *= 1.5;
        this.visibilityRadius = Math.max(this.healRadius,this.attackRadius);
        this.unitSpeed    =  ~~(this.unitSpeed / 2);
      
        this.moving = false;
        this.healthSize = this.health *= 0.9;
}
}
Destructor._name = 'destructor'

class Killer extends Unit {
    constructor (config) {
        super()
        this.damageAmount *= 3
        this.shotInterval;
        this.attackRadius *= 1.5
        this.unitSpeed    = ~~(this.unitSpeed * 1.5)
        this.visibilityRadius = Math.max(this.healRadius,this.attackRadius);
        this.moving = false;
        this.healthSize = this.health *= 0.5;
    }
}
Killer._name = 'killer'

class Beast extends Unit {
    constructor(config){
        super(config)
        this.shotInterval = this.shotInterval / 0.8
        this.unitSpeed    = ~~(this.unitSpeed * 1.15)
        this.visibilityRadius = Math.max(this.healRadius,this.attackRadius);
        this.moving = false;
        this.healthSize = this.health *= 0.9;
    }
}
Beast._name = 'beast'

class Mechanic extends Unit {}
class Shield extends Unit {}
class Disintegrator extends Unit {}
class Conqueror extends Unit {}
class Devastator extends Unit {}

class Harbinger extends Unit {
  constructor (cfg) {
    super(cfg)
    this.replies = [
            'I am assuming control of this form'
        ,   'Direct intervention is necessary'
        ,   'I AM ASSUMING DIRECT CONTROL'
        ,   'I was waiting too long ...'
        ]
  }
}
Harbinger._name = 'Harbinger';


class Units extends Objects {
    //@return {Number}
    get health(){ return this.reduce((total,unit) => total+unit.health,0) }
    
    //@return {Number}
    get healthCap(){ return this.reduce((total,unit) => total+unit.healthCap,0) }
    
    // @return {Boolean}
    get isEngaged(){ return this.some(unit => unit.isEngaged)}
    
    // @return {Boolean}
    get isUnderAttack(){ return this.some(unit => unit.isUnderAttack)}
    
    // @return {Units}
    get enemiesAttacking(){
        return this.reduce((enemies, unit) => {
        if(unit.isUnderAttack) { unit.enemiesAttacking.forEach(enemy => {
            if(!enemies.contains(enemy)){ enemies.push(enemy) }
        })}
        return enemies
        }, new Units())
    }
    
    // Check enemiesAroundSize before using this moethod
    // @return {Units}
    get enemiesAround(){
        return this.reduce((enemies,unit) => {
            unit.enemiesAround.forEach(enemy => {
                if(!enemies.contains(enemy)){ enemies.push(enemy) }
            })
            return enemies
        },new this.constructor)
    }
    
    // @return {Boolean}
    get isMoving(){return !!this.length && this.every(unit => unit.isMoving)}
    
    // @return {Boolean}
    get isDead(){ return !this.length || this.every(u => u.isDead) }
  
    // @return {Untis} - filtered
    get alive(){ return this.filter(u => !u.isDead) }
  
    // @return {Number}
    get size(){ return this.reduce((size, units) => size+units.size, 0) }
    
    get visibilityRadius(){
      if(!this.length){ return 0 }
      let r = this.random().visibilityRadius;
      return r
    }
  
    move(freePositions, obstacles){
      let unit;
      freePositions.forEach((position,i) => {
         unit = this[i];
         if(unit !== undefined) { unit.move(position) }
      });
      return freePositions
    }
    
    stop(){this.forEach(u => u.stop())}
}