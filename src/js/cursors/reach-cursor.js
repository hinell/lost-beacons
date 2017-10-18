class ReachCursor extends ChaseCursor {

    constructor (){
        super();
        this.color = '#0f0'
    
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

        const s = (G.t % REACH_CURSOR_PERIOD) / REACH_CURSOR_PERIOD;

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
        : reachableUnits.freeCirclePositions(this, 20, null);
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
