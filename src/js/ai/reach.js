
REACH_CURSOR_RADIUS =  GRID_SIZE || 20;
REACH_CURSOR_PERIOD =  0.4;

class Reach extends Behavior {

    constructor(target,position) {
        super();
        this.position = position; // allows to hint the unit with position outside
        this.target = target;
    }
    

    attach(unit) {
        
        this.unit = unit;
        
        // attempt to pick the first target position and construct path
        if (!this.path) {
          this.position = this.position
          || (this.target instanceof Beacon
            ? new Objects([this.target].concat(this.target.units))
            : W.units)
            .closestTo(this.target)
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
          })[0];
          
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
        if (this.unit.controller === PLAYER_TEAM) {
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
