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

        const beacon = W.beacons
            .filter(beacon => dist(beacon, this) < BEACON_CONQUER_RADIUS)[0];

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
        this.renderLabel(beacon && dist(beacon, this) < BEACON_CONQUER_RADIUS ? (beacon.team === PLAYER_TEAM ? 'DEFEND()' : 'CAPTURE()') : 'REACH()');
    }

    move(p) {
        if (!this || p.x != this.x || p.y != this.y) {
            this.timeOnPosition = G.t;
        }

        super.move(p);
    }

    rightDown(e) {

      let radius = G.selectionCursor.units.first.radius;
      let amount = G.selectionCursor.units.length
      
      let positions = w.down.alt
      ? W.units.freeRectanglePositions(this,radius)
      : W.units.freeCirclePositions(this,radius ,radius ,amount)
      
      let position;
        // let reachBeahavior = new Reach(this);
          G.selectionCursor.units.forEach((unit,i) => {
              position = positions[i];
              if(position) {
                  unit.setBehavior(new Reach(this.target, positions[i]))
                  this.drawPositionCircles(positions[i])
              } else {
              // if no position available - stay still
                unit.setBehavior(new Idle())
              }
              this.sentUnits = true;
          });
          positions = null
    
    }

}
