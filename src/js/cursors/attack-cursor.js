class AttackCursor extends ChaseCursor {

    constructor (){ super(); this.color = '#ff0300' }
    get label() {
        return ( this.target ? this.target.name.toLocaleUpperCase() + ':' : '') + 'ATTACK()';
    }
    
    rightDown() {
        if (this.target) {
        let unit      = G.selectionCursor.units.sort((ua, ub) => ua.attackRadius - ub.attackRadius )[0];
        let positions = W.units.freeCirclePositions(this.target,unit.radius,unit.attackRadius, G.selectionCursor.units.length, unit.attackRadius)
        
            G.selectionCursor.units.forEach((unit,i) => {
            if (unit.behavior.target === this.target ) { return }
            if (unit === this.target || !positions[i]) { return unit.setBehavior(new Idle())}
            else {
                this.drawPositionCircles(positions[i])
                unit.setBehavior(new Chase(this.target, positions[i], unit.attackRadius ));
            }



            });
        //    positions = null
        }
    }
    
}
