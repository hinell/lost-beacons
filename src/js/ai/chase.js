class Chase extends Behavior {

    constructor(target, position, radius = UNIT_RADIUS) {
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
            this.unit.friendly = this.target.team === this.unit.team;
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
