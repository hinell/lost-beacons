class Units extends Objects {}

UNIT_SPEED              =  150;
UNIT_ANGULAR_SPEED      =  Math.PI / 360;
UNIT_RADIUS             =  20;
UNIT_ATTACK_RADIUS      =  200;
UNIT_HEAL_RADIUS        =  100;
UNIT_PX_SIZE            =  3;
UNIT_SHOT_INTERVAL      =  0.8;
UNIT_SHOT_DAMAGE        =  0.25;

UNIT_HEALING_AMOUNT     =  0.05;
UNIT_HEALING_INTERVAL   =  1.5;

const ALL_REPLIES   = [
            'our domination will last forever'
        ,   'the victory is coming'
        ,   'beacon is our'
        ,   'conquer them all'
        ,   'well done'
        ,   'good job'
        ,   'keep going'
        ,   'unleash the power'
        ]

class Unit extends Object_ {
    constructor(cfg = {}) {
        super()
        // shooting settings
        this.damageAmount = cfg.damageAmount        || UNIT_SHOT_DAMAGE;
        this.shotInterval = cfg.shotInterval        || UNIT_SHOT_INTERVAL;
        this.attackRadius = cfg.attackRadius        || UNIT_ATTACK_RADIUS;
        this.shotTimer    = this.shotInterval;
        
        // healing settings
        this.healingInterval = cfg.healingInterval  || UNIT_HEALING_INTERVAL
        this.healTimer       = this.healingInterval;
        this.healingAmount= cfg.healingAmount|| UNIT_HEALING_AMOUNT
        this.healRadius   = cfg.healRadius   || UNIT_HEAL_RADIUS;
        
        this.unitSpeed    = cfg.unitSpeed    || UNIT_SPEED
        this.angularSpeed = cfg.angularSpeed || UNIT_ANGULAR_SPEED
        
        this.radius       = cfg.radius       || UNIT_RADIUS
        
        this.beacon       = null // parental beacon, only available after spawn
        
        this.visibilityRadius = Math.max(this.healRadius,this.attackRadius);
      

        // Might be able to gut these if they're set from the outside
        // this.team = PLAYER_TEAM;
        // this.target = null;

        this.angle = 0;
        this.moving = false;
        this.healthSize = this.health = 1;
      
        this.setBehavior(new Idle());

        this.shotTimer = rand(0.2,1);

        this.indicator = new Indicator(this);
        // rename to replies
        
      
        this.replies       = cfg.replies || ALL_REPLIES
        this.cycleTimer    = this.cycleInterval = 1;
        this.cacheTimer    = this.cacheInterval =this.cycleInterval * 2;
        this.closestUnits  = [] // cached units
    }

    get dps () { return this.health }
    
    get dead() {
        return !this.health;
    }
    
    get name() {  return this.constructor._name || this.constructor.name.toLocaleLowerCase() }

    hurt(amount) {
        if ((this.health -= amount) < 0.1) {
            this.health = 0;
        }
        if (this.target) {
          if (this.target.team === this.team) {
            this.indicator.indicate('engaging enemy!',PLAYER_TEAM.beacon)
          } else {
            this.target.indicator.indicate('unit under attack!',ENEMY_TEAM.beacon);
          }
          
        }

        let particles = 1
        
        if (this.dead) {
            W.remove(this);
            particles = 20;

            let k = 20;
            while (k--) {
                const d = rand(3, 4);
                let p = particle(0, this.team.body, [
                    ['s', rand(4, 8), 0, 0.1, d],
                ]);
                p.x = this.x + rand(-15, 15);
                p.y = this.y + rand(-15, 15);
            }
        }

        const bloodDelay = rand(3, 4);
        let p = particle(0, this.team.body, [
            ['s', rand(4, 8), 0, 0.1, bloodDelay],
        ]);
        p.x = this.x + rand(-15, 15);
        p.y = this.y + rand(-15, 15);

        while (particles--) {
            const d = rand(0.6, 1);
            particle(0, this.team.body, [
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
        // this.enemies ???
        // this.collection = currentMapSector
        return this.closestUnits
            .filter(c => c.team !== this.team)
            .at(this, this.attackRadius)
            .filter(c => !W.hasObstacleBetween(this, c))
            .sort((a, b) => dist(this, a) - dist(this, b))
            [0];
    }
    
    closestWeakFriend() {
      return this.closestUnits
        .filter(unit => unit.team === this.team) // this.controller
        .at(this, this.healRadius)
        .filter(u => u.health < u.healthSize)
        .filter(unit => !W.hasObstacleBetween(this, unit))
        .sort((a, b) => dist(this, a) - dist(this, b))
        [0];
    }

    cycle(e) {
        this.moving = false;
        this.behavior.cycle(e);
        

        if (this.moving) { return }
        // if no enemy then heal friend
        
        if (this.target === this) { this.target = null; return }
        
        if ((this.cacheTimer-= e) < this.cacheInterval) {
            this.cacheTimer = this.cacheInterval
            this.closestUnits = this.collection.at(this,this.attackRadius)
        }
        
        // main cycle
        if ((this.cycleTimer-= e) < this.cycleInterval && !this.target) {
            this.cycleTimer = this.cycleInterval;
             // the next target to be slaughtered or healed
            this.target     = this.enemyInRange() || this.closestWeakFriend()
            
        }
        
        // if still no target - return
        if(!this.target) { return }
        
        if (this.target) { this.angle = angleBetween(this, this.target) }
        
        this.friendly = this.target.team === this.team
        
        if (this.friendly
            && (this.healTimer-= e) <= 0
            && !W.hasObstacleBetween(this,this.target)
            && dist(this,this.target) < this.healRadius) {
            this.healTimer = this.healingInterval;
            // Healing a friendly unit
            if (this.target.health >= this.target.healthSize) {
                // stop healing, target is already at full health (and allows us to start shooting at another target)
                this.target = null;
            } else {
                const target = this.target;

                const p = {
                    x : this.x,
                    y : this.y,
                    'progress': 0,
                    'postRender': () => {
                        translate(this.x + p.progress * (target.x - this.x), this.y + p.progress * (target.y - this.y));

                        R.fillStyle = this.team.beacon;
                        fr(-2, -6, 4, 12);
                        fr(-6, -2, 12, 4);
                    }
                };

                W.add(p, RENDERABLE);

                interp(p, 'progress', 0, 1, dist(this, this.target) / 100, 0, null, () => {
                    target.heal(this.healingAmount);
                    W.remove(p);
                });
            }

        }
        if (!this.friendly && (this.shotTimer -= e) <= 0
            && !W.hasObstacleBetween(this,this.target)
            && dist(this,this.target) < this.attackRadius) {
            this.shotTimer = this.shotInterval;
            
            if (this.target && this.target.dead ) {
                this.target = null
            } else {

                let endPoint  = {x: this.target.x, y: this.target.y}
               // rays of fire
                const healthSign = {
                  x       : this.x,
                  y       : this.y,
                  'alpha' : 1,
                  'render': () => {
                    R.globalAlpha = rand(0.5,1);
                    R.strokeStyle = pick([
                        '#ff0'
                        ,'#ff6300'
                        ]);
                    R.lineWidth   = 0.5;
                    beginPath();
                    moveTo(this.x,this.y);
                    lineTo(endPoint.x,endPoint.y);
                    stroke();
                  }
                };
                W.add(healthSign,RENDERABLE);
                interp(healthSign,'alpha',0.5,0,0.1,0,null,() => W.remove(healthSign));
                this.target.hurt(this.damageAmount);
            }

        }
    }

    render() {
        wrap(() => this.behavior.render());

        wrap(() => {
            translate(floorP(this.x, GRID_SIZE), floorP(this.y, GRID_SIZE));

            R.globalAlpha = 0.1;
            R.fillStyle = this.team.body;
            fr(0, 0, GRID_SIZE, GRID_SIZE);
        });

        translate(this.x, this.y);
        rotate(this.angle);

        const sinusoidal = this.moving ? sin(G.t * PI * 4) : 0;
        const offset = sinusoidal * (UNIT_PX_SIZE / 2);

        translate(-UNIT_PX_SIZE * 1.5, -UNIT_PX_SIZE * 2.5);

        // Legs
        wrap(() => {
            translate(UNIT_PX_SIZE, 0);
            scale(sinusoidal, 1);
            R.fillStyle = this.team.leg;
            fr(0, UNIT_PX_SIZE, UNIT_PX_SIZE * 3, UNIT_PX_SIZE); // left
            fr(0, UNIT_PX_SIZE * 3, -UNIT_PX_SIZE * 3, UNIT_PX_SIZE); // right
        });

        // Left arm
        wrap(() => {
            translate(offset, 0);
            R.fillStyle = this.team.body;
            fr(UNIT_PX_SIZE, 0, UNIT_PX_SIZE * 2, UNIT_PX_SIZE);
            R.fillStyle = this.team.leg;
            fr(UNIT_PX_SIZE * 2, UNIT_PX_SIZE, UNIT_PX_SIZE * 2, UNIT_PX_SIZE);
        });

        // Right arm
        wrap(() => {
            translate(-offset, 0);
            R.fillStyle = this.team.body;
            fr(UNIT_PX_SIZE, UNIT_PX_SIZE * 4, UNIT_PX_SIZE * 2, UNIT_PX_SIZE);
            R.fillStyle = this.team.leg;
            fr(UNIT_PX_SIZE * 2, UNIT_PX_SIZE * 3, UNIT_PX_SIZE * 2, UNIT_PX_SIZE);
        });

        // Main body
        R.fillStyle = this.team.body;
        fr(0, UNIT_PX_SIZE, UNIT_PX_SIZE * 2, UNIT_PX_SIZE * 3);

        // Gun
        R.fillStyle = '#000';
        fr(UNIT_PX_SIZE * 3, UNIT_PX_SIZE * 2, UNIT_PX_SIZE * 3 * (this.damageAmount + 1), UNIT_PX_SIZE);
        
        // Head
        R.fillStyle = this.team.head;
        fr(UNIT_PX_SIZE, UNIT_PX_SIZE, UNIT_PX_SIZE * 2, UNIT_PX_SIZE * 3);
    }

    postRender() {
        this.indicator.postRender();

        translate(this.x, this.y);

        // Second render pass, add health gauge
        R.fillStyle = '#000';
        fr(
            evaluate(-HEALTH_GAUGE_WIDTH / 2) - 1,
            -HEALTH_GAUGE_RADIUS - 1,
            evaluate(HEALTH_GAUGE_WIDTH + 2),
            evaluate(HEALTH_GAUGE_HEIGHT + 2)
        );

    let currentHealthGauge = ~~((this.health * HEALTH_GAUGE_WIDTH) / this.healthSize)
        
        R.fillStyle = currentHealthGauge > (HEALTH_GAUGE_WIDTH * .3)
        ? '#0f0'
        : '#f00';
        
        fr(
            evaluate(-HEALTH_GAUGE_WIDTH / 2),
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
        this.behavior = b;
        this.behavior.attach(this);
    }

    isSelected() {
        return G.selectionCursor.units.indexOf(this) >= 0;
    }

}
Unit._name = 'yonit'

class Destructor extends Unit {
    constructor(config = {}) {
        super(config)
        this.damageAmount =  UNIT_SHOT_DAMAGE * 2;
        this.shotInterval = (UNIT_SHOT_INTERVAL * 2) - 0.4;
        this.attackRadius =  UNIT_ATTACK_RADIUS * 1.5;
        this.unitSpeed    =  ~~(UNIT_SPEED / 2);
      
        this.moving = false;
        this.healthSize = this.health *= 0.9;
}
}
Destructor._name = 'destructor'

class Killer extends Unit {
    constructor (config) {
        super(config)
        this.damageAmount *= 3
        this.shotInterval;
        this.attackRadius *= 2
        this.unitSpeed    = ~~(UNIT_SPEED * 1.5)
      
        this.moving = false;
        this.healthSize = this.health *= 0.5;
    }
}
Killer._name = 'killer'

class Beast extends Unit {
    constructor(config){
        super(config)
        this.shotInterval = UNIT_SHOT_INTERVAL / 1.5
        this.unitSpeed    = ~~(UNIT_SPEED * 1.15)
        
        this.moving = false;
        this.healthSize = this.health *= 0.9;
    }
}
Beast._name = 'beast'

class Helper extends Unit {}
class Shield extends Unit {}

UNITS_CLASSES = [Unit, Destructor, Beast]