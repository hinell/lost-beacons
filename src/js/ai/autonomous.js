class Autonomous extends Behavior {

    constructor() {
        super();
        this.currentDecision = null;
        
        this.cycleInterval = 6;
        this.cycleTimer    = 0; // cycle immediately
        
        this.cacheInterval = 3;
        this.cacheTimer    = 0; // update cache immediately
        
        this.ourBeacons    = new Beacons();
        this.enemyBeacons  = new Beacons();
    }
    // cache of units
    fetchBeaconPositions(){
        let filtered            = W.beacons.filter(beacon => beacon.controller === this.unit.team,true);
        this.ourBeacons         = filtered[0];
        this.enemyBeacons       = filtered[1];
        this.defendableBeacons  = this.ourBeacons
            .closestTo(this.unit)
            .filter(b => b.conquered)
    }
    
    attach(unit) {
        super.attach(unit);
    }
    // too slow don't used it
    
    retreatPosition() {
        const positions = [];
        for (let i = 0 ; i < 5 ; i++) {
            const a = (i / 10) * PI * 2;
            let position = {
                'x': this.unit.x + cos(a) * this.unit.attackRadius,
                'y': this.unit.y + sin(a) * this.unit.attackRadius
                }
            W.pointInObstacle(position) || positions.push();
        }

        // Return a position that is available and not close to any enemy
        return new Object_(pick(positions));
    }
    
    weakFridnlyUnit(){
        // TODO: implement
        this.closestFriends().closestTo(this.unit);
    }
    
    updateSubBehavior() {
        if (this.currentDecision
            && !this.currentDecision.done()
            && !this.currentDecision.bad()
        ) {return}

        let decisions = [];
        
        let retreatPosition;
        if (this.unit.health < this.unit.healthSize) { retreatPosition = this.retreatPosition() }
        if (retreatPosition) {
            const retreatBehavior = new Reach(retreatPosition);
            const retreatDecision = {
                'behavior': retreatBehavior,
                'done': () => {
                    return this.unit.health < this.unit.healthSize && retreatPosition.distanceTo(this.unit) <= this.unit.radius
                },
                'bad': () => {
                    return this.unit.health === this.unit.healthSize && this.unit.closestEnemies.at(retreatPosition).length
                }
            };
            retreatDecision.label = 'retreatPosition';
            decisions.push(retreatDecision);
        }
        
        // enemy units that are near to this unit
        const attackedUnit = this.unit.closestEnemies.closestTo(this.unit)[0];
        if (attackedUnit) {
            const attackBehavior = new Chase(attackedUnit, null, attackedUnit.attackRadius);
            const attackDecision = {
                'behavior': attackBehavior,
                'done': () => {
                    return attackedUnit.dead;
                },
                'bad': () => {
                    let enemyHealth     = attackedUnit.closestFriends.totalHealth();
                    let friendsHealth   = this.unit.closestFriends.totalHealth();
                    return  enemyHealth > friendsHealth;
                }
            };
            attackDecision.label = 'attackedUnit';
            decisions.push(attackDecision);
        }

        const friend = this.unit.closestFriends.closestTo(this.unit)[0];
        if (friend && friend.firing) {
            const regroupBehavior = new Chase(friend, null, friend.healRadius);
            const regroupDecision = {
                'behavior': regroupBehavior,
                'done': () => {
                    return friend.distanceTo(this.unit) < friend.healRadius;
                },
                'bad': () => {
                    let enemyHealth     = friend.closestEnemies.totalHealth();
                    let friendsHealth   = friend.closestFriends.totalHealth();
                    return  !friend.firing && enemyHealth >= friendsHealth;
                }
            };
            decisions.push(regroupDecision);
        }

        const conquerableBeacon = pick(this.enemyBeacons);
        if (conquerableBeacon) {
            const conquerBehavior = new Reach(conquerableBeacon);
            const conquerDecision = {
                beacon: conquerableBeacon,
                'behavior': conquerBehavior,
                'done': () => {
                    return conquerableBeacon.controller === this.unit.team;
                },
                'bad': () => {
                 let enemyHealth     = conquerableBeacon.units.filter(u => this.unit.team !== u.team ).totalHealth();
                 let friendsHealth   = conquerableBeacon.units.filter(u => this.unit.team === u.team ).totalHealth();
                    return  enemyHealth > friendsHealth
                }
            };
            conquerDecision.label = 'conquerableBeacon';
            decisions.push(conquerDecision);
        }
        const defendableBeacon = this.defendableBeacons[0];
        if (defendableBeacon) {
            const defendBehavior = new Reach(defendableBeacon);
            const defendDecision = {
                beacon: defendableBeacon,
                'behavior': defendBehavior,
                'done': () => {
                    // Done if no one is trying to conquer it anymore
                    return !defendableBeacon.units.filter(u => u.team !== this.unit.team).length
                },
                'bad': () => {
                 let filtered        = defendableBeacon.units.filter(this.unit.isFriendly,true,this)
                 let enemyHealth     = filtered[0].totalHealth();
                 let friendsHealth   = filtered[1].totalHealth();
                    return  enemyHealth > friendsHealth
                }
            };
            defendableBeacon.label = 'defendableBeacon';
            decisions.push(defendDecision);
        }

        
        if (!decisions.length) { return }
        let goodDecisions;
            goodDecisions = decisions.filter(decision => !decision.done() && !decision.bad());
        let decision;
        if( goodDecisions.length === 1) { decision = goodDecisions[0]}
        if(!decision) {  decision = pick(goodDecisions) } // try again
        if(!decision && goodDecisions.length > 1) {  decision = pick(goodDecisions) } // and again
        
        if(!decision) { return }
        this.currentDecision = decision;
        this.subBehavior = this.currentDecision.behavior;
        this.subBehavior.attach(this.unit);
    }
  
    cycle(e) {
        // super.cycle(e); temporary workaround for performance gain

        if ((this.cacheTimer -= e) <= 0) { this.cacheTimer = this.cacheInterval; this.fetchBeaconPositions() }
        if ((this.cycleTimer -= e) <= 0) {
           this.cycleTimer = this.cycleInterval;
           this.ourBeacons.length && this.ourBeacons
            .filter(b => b.readyUnits.length )
            .forEach(b => b.spawnUnits())
            
            this.updateSubBehavior();
        }
        
        if (this.subBehavior) this.subBehavior.cycle(e);
    }

    reconsider() {
        return this; // never change the AI
    }

    render() {
        
        if (DEBUG && this.currentDecision) {
            if(this.currentDecision.beacon) { this.currentDecision.beacon.debug('#ff0000') }
            R.fillStyle = '#fdfff1';
            R.font = '14px "Calibri Light",system-ui';
            R.textAlign = 'center';
            if (this.currentDecision) {
                fillText(this.currentDecision.label, this.unit.x, this.unit.y + 35);
            }
        }

        if (this.subBehavior) {
            this.subBehavior.render();
        }
    }

    reservedPosition() {
        return this.subBehavior ? this.subBehavior.reservedPosition() : this.unit;
    }

}
