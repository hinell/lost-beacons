class ChaseCursor extends Cursor {
    
    constructor (){
        super();
        this.color = '#0f0'
        this.target // only set when the unit is selected
    }
    
    postRender() {
        const s = 1 - (G.t % CHASE_CURSOR_PERIOD) / CHASE_CURSOR_PERIOD;

        translate(this.target.x, this.target.y);

        const corner = a => () => {
            translate(cos(a) * CHASE_CURSOR_RADIUS, sin(a) * CHASE_CURSOR_RADIUS);
            rotate(a);

            beginPath();
            moveTo(-CHASE_CURSOR_SIZE, 0);
            lineTo(0, CHASE_CURSOR_SIZE);
            lineTo(0, -CHASE_CURSOR_SIZE);
            fill();
        };

        R.fillStyle = this.color;

        wrap(() => {
            R.globalAlpha = s;
            scale(s, s);
            let i = 4;
            while (i--) {
                wrap(corner((i / 4) * PI * 2 + PI / 4));
            }
        });

        this.renderLabel(this.label);
    }

    drawPositionCircles (target, duration, transparency){
        if(this.circlesDrawing) { return }
        this.circlesDrawing = true;
        // Quick effect to show where we're going
        let circle = {
            a       : duration || 2,
            'render': (e) => {
                // no render if canvas is going to be saved
                if((circle.a -= 0.1)  <= 0.1) {  R.globalAlpha = 1; W.remove(circle); return }
                // R.translate(target.x, target.y);
                // R.scale(circle.a + 0.1,circle.a + 0.1);
                R.globalAlpha = transparency || circle.a
                R.strokeStyle = this.color;
                
                R.lineWidth = 0.5;
                R.beginPath();
                R.arc(target.x, target.y, circle.a.linear(6,0,2) , 0, Math.PI2, true);
                // R.arc(0, 0, 5, 0, PI * 2, true);
                R.stroke();

            }
        };
        W.add(circle , RENDERABLE);
        
        // interp(circle, 'a', 1, 0, .6, 0, 0, i => W.remove(circle));
        this.circlesDrawing = false
    }

    setTarget(target) {
        this.target = target;
        this.x = target.x;
        this.y = target.y;
    }
    
    rightDown() { /*implement in subclasses*/ }
    
}

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

class AttackCursor extends ChaseCursor {

    constructor (){ super(); this.color = '#ff0300' }
    
    get label() {
        return ( this.target ? this.target.name.toLocaleUpperCase() + ':' : '') + 'ATTACK()';
    }
    
    rightDown() {
        if (this.target) {
        let unit      = G.selectionCursor.units.sort((ua, ub) => ua.attackRadius - ub.attackRadius - 1 )[0];
        let angleForPosition = new Object_(this.target).angleTo(unit);
        let positions = W.units.freeCirclePositions(this.target,unit.radius,unit.attackRadius
            , G.selectionCursor.units.length
            , unit.attackRadius * 0.95
            , angleForPosition)
        
            G.selectionCursor.units.forEach((unit,i) => {
            if (unit.behavior.target === this.target ) { return }
            if (unit === this.target || !positions[i] || unit.distanceTo(this.target) < unit.attackRadius ) {
                return unit.setBehavior(new Idle())
            }
            else {
                this.drawPositionCircles(positions[i]);
                unit.setBehavior(new Chase(this.target, positions[i], unit.attackRadius ));
            }
            });
            positions = null
        }
    }
    
}

class ReachCursor extends ChaseCursor {

    constructor (){
        super();
        this.color = '#0f0'
        this.squareBlinkingInterval = 0.5;
    }
    
    postRender() {
        const arrowRadius = 10;

        function arrow(x, y, alpha) {
            wrap(() => {
                R.globalAlpha = alpha;
                translate(x, y);
                beginPath();
                moveTo(0, 0);
                lineTo(arrowRadius, -arrowRadius);
                lineTo(-arrowRadius, -arrowRadius);
                fill();
            });
        }

        const beacon = W.beacons.closestTo(this)[0];

        if (beacon) {
            const offset = (G.t * 1 % 1) * arrowRadius;
            R.fillStyle = PLAYER_TEAM.beacon;
            arrow(beacon.x, offset + beacon.y - 50, 1 - offset / arrowRadius);
            arrow(beacon.x, offset + beacon.y - arrowRadius - 50, 1);
            arrow(beacon.x, offset + beacon.y - arrowRadius * 2 - 50, offset / arrowRadius);
        }

        translate(this.x, this.y);

        const s = (G.t % this.squareBlinkingInterval) / this.squareBlinkingInterval;

        R.fillStyle = this.color;
        R.globalAlpha = 1 - s;
        squareFocus(20, 4);

        R.globalAlpha = 1;
        const cursorScale = min(1, max(0, (G.t - this.timeOnPosition - 0.5) * 10));
        scale(cursorScale, cursorScale);
        let text = 'REACH()', target;
        if(beacon && this.distanceTo(beacon) < beacon.conquerRadius){
            target = beacon
            text = beacon.controller === PLAYER_TEAM ? 'DEFEND()' : 'CAPTURE()'
        }
        
        this.renderLabel(text,target);
    }

    move(p) {
        if (!this || p.x != this.x || p.y != this.y) {
            this.timeOnPosition = G.t;
        }
        super.move(p);
    }
    
    rightDown({x,y},e) {
      let positionAtPointer = new Object_({x,y});
      
      let radius = G.selectionCursor.units.first.radius; // minimal unit radius
      
      let nearestBeacon = W.beacons.closestTo(positionAtPointer).first;
      let reachableUnits= nearestBeacon.units.length
        ? nearestBeacon.units
        : W.units

      let positions = w.down.alt
        ? reachableUnits.freeRectanglePositions(this,radius)
        : reachableUnits.freeCirclePositions(this, radius, null);
          G.selectionCursor.units.forEach((unit,i,arr) => {
              let position = positions[i];
              if(position) {
                  unit.setBehavior(new Reach(positionAtPointer, position));
                  this.drawPositionCircles(position)
              } else {
              //stay still if no position is available
                unit.setBehavior(new Idle())
              }
              this.sentUnits = true;
          });
          positions = null
    }

}
