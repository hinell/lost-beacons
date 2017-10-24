class Units extends Objects {
    totalHealth(){ return this.reduce((total,u) => total+u.health,0) }
}
class UnitsGroup extends Units {}

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
        ]

class Unit extends Object_ {
    constructor(cfg = {}){
        super(cfg);
        // shooting settings
        // 0.25/0.8 = x / 0.2
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
        
        // tasks
        this.tasks  = new Objects()
        this.setBehavior(new Idle());
        
        // entity settings
        this.radius           = cfg.radius || 20
        this.visibilityRadius = Math.max(this.healRadius,this.attackRadius);

        // cycles
        this.cycleTimer    = this.cycleInterval = 1;
        this.cacheInterval = this.cycleInterval = 2;
        this.cacheTimer    = 0; // fetch all units around immediately
        
        // beacons
        this.beacon          = null // parental beacon, only available after spawn
        this.conqueringSpeed = 0.1
        this.nearbyUnits     = new Units(); // cached units
        this.closestEnemies  = new Units();
        this.closestFriends  = new Units();
        this.closestBeacon
        
        // others settings
        this.indicator  = new Indicator(this);
        this.controller = cfg.controller || cfg.team;
        this.target;
        this.replies = cfg.replies || ALL_REPLIES
        
        // rendering settings
        this.pxsize = 3;
    }

    get dps () { return this.health }
    
    // TODO: Replace every this.team == u.team checks by this method
    isFriendly (unit) { return this.controller === unit.controller }
    
    isHostile  (unit) { return !this.isFriendly(unit) }
    
    get dead() { return !this.health; }
    
    get name() {  return (this.constructor._name || this.constructor.name).toLocaleLowerCase() }

    hurt(amount) {
        if ((this.health -= amount) < 0.01) {
            this.health = 0;
        }
        if (this.target) {
          if (this.target.controller === this.controller) {
            this.indicator.indicate('engaging enemy!',PLAYER_TEAM.beacon)
          } else {
            this.target.indicator.indicate('unit under attack!',ENEMY_TEAM.beacon);
          }
          
        }

        let particles = 1;
        
        if (this.dead) {
            W.remove(this);
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

    heal(amount) {
        if (!this.dead) {
            this.health = min(this.healthSize, this.health + amount);
        }
    }
    
    enemyInRange() {
        // this.collection = currentMapSector
        return this.closestEnemies
            .filter(c => !W.hasObstacleBetween(this, c))
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b))
            [0];
    }
    
    closestWeakFriend() {
      return this.closestFriends
        .at(this, this.healRadius)
        .filter(u => u.health < u.healthSize)
        .filter(unit => !W.hasObstacleBetween(this, unit))
        .closestTo(this)
        [0];
    }

    cycle(e) {

        this.moving = false;
        this.behaviour.cycle(e);

        if ((this.cacheTimer-= e) <= 0) {
            this.cacheTimer     = this.cacheInterval
            this.closestBeacon  = W.beacons.closestTo(this)[0];
            this.nearbyUnits    = this.closestBeacon && this.closestBeacon.units.at(this,this.attackRadius);
            if(!this.nearbyUnits || !this.nearbyUnits.length){ this.nearbyUnits = W.units.at(this,this.attackRadius) };
          
            // TODO: Optimize filtering
            let filtered        = this.nearbyUnits.filter(this.isFriendly,true,this);
            this.closestFriends = filtered[0];
            this.closestEnemies = filtered[1];

        }
        
        if (this.moving) { return }
        
        // main cycle
        if ((this.cycleTimer-= e) <= 0 && !this.target ) {
            this.cycleTimer = this.cycleInterval;
             // the next target to be slaughtered or healed
            this.target     = this.enemyInRange() || this.closestWeakFriend()
        }

        if (this.target === this) { this.target = undefined; return }
        if(!this.target) { return }
        // TODO: Probably here is a bug. If no behaviour is set the without having target behaviour is almost unpredictable
        // TODO: It should know nothing about Behavior instances
        if(this.distanceTo(this.target) > this.visibilityRadius && this.behaviour instanceof Idle) {
            return this.target = undefined;
        }
        
        if (this.target) { this.angle = this.angleTo(this.target) }
        
        this.friendly = this.target.controller === this.controller;
        
        if (this.friendly
            && (this.healTimer-= e) <= 0
            && !W.hasObstacleBetween(this,this.target)) {
            this.healTimer = this.healingInterval;
            
            if (this.target && this.target.dead
                || this.target.health >= this.target.healthSize
                || this.distanceTo(this.target) > this.healRadius) {
                // stop healing, target is already at full health (and allows us to start shooting at another target)
                this.target = undefined;
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

                interp(p, 'progress', 0, 1, this.distanceTo(this.target) / 100, 0, null, () => {
                    target.heal(this.healingAmount);
                    W.remove(p);
                });
            }

        }
        
        if (!this.friendly && (this.shotTimer -= e) <= 0
            && !W.hasObstacleBetween(this,this.target)) {
            this.shotTimer = rand(this.shotInterval - 0.2, this.shotInterval);
            
            if ((this.target && this.target.dead)
            || this.distanceTo(this.target) > this.attackRadius ) {
                this.target = undefined;
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
                this.target.hurt(this.damageAmount);
            }

        }
    }

    render() {
        
        wrap(() => this.behaviour.render());
        
        wrap(() => {
            translate(this.x.floorp(GRID_SIZE), this.y.floorp(GRID_SIZE));
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

        if (this.isSelected()) {
            R.fillStyle = '#fff';
            squareFocus(SELECTED_EFFECT_RADIUS, SELECTED_EFFECT_SIZE);
        }
    }

    setBehavior(b) {
        this.behaviour = b;
        this.behaviour.attach(this);
    }

    isSelected() {
        return G.selectionCursor.units.indexOf(this) >= 0;
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