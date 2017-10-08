class HealCursor extends ChaseCursor {

    constructor (){ super(); this.color = '#f4fff5' }

    get label() {
        return ( this.target ? this.target.name.toLocaleUpperCase() + ':' : '')+'HEAL()';
    }
    
    rightDown() {
        if (this.target) {
        let radius      = G.selectionCursor.units.first.radius;
        let positions   = W.units.freeCirclePositions(this.target,radius);
            G.selectionCursor.units.forEach((unit,i) => {
            let position = positions[i];
            if(unit === this.target                 ) { return unit.setBehavior(new Idle()) }
            if(unit.behavior.target === unit        ) { return }
                unit.setBehavior(new Chase(this.target,position,unit.healRadius))
                this.drawPositionCircles(unit.behavior.reservedPosition())
            });
            positions = null
        }
    }
}
