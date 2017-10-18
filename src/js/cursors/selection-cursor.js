class SelectionCursor extends Cursor {

    constructor() {
        super();
        this.selection = new Objects();
    }

    postRender() {
      
        if (this.downPosition && this.distanceTo(this.downPosition)) {
            R.strokeStyle = '#33a12d';
            R.fillStyle = 'rgba(108,161,95,0.1)';
            
            R.lineWidth = 1;
            fr(
                this.downPosition.x,
                this.downPosition.y,
                this.x - this.downPosition.x,
                this.y - this.downPosition.y
            );
            strokeRect(
                this.downPosition.x,
                this.downPosition.y,
                this.x - this.downPosition.x,
                this.y - this.downPosition.y
            );
          
        if(this.units.length){
            R.beginPath();
            R.font = '14px bold Arial, sans-serif'
            R.fillStyle = '#ffffff';
            R.fillText(this.units.length,this.x + 15 ,this.y + 30)
        }
        
        }
    }

    move(p) {
        // Not calling super cause otherwise it will try to revert to this cursor
        this.x = p.x;
        this.y = p.y;
        if(this.downPosition) {
            this.selection = W.units
             .filter(unit => unit.team === PLAYER_TEAM)
             .filter(unit => {
                if (this.distanceTo(this.downPosition) < 5) {
                    return unit.distanceTo(this.downPosition) < 20;
                }
                
                return unit.x.isBetween(this.downPosition.x, this.x)
                    && unit.y.isBetween(this.downPosition.y, this.y);
                });
        }
    }

    get units() {
        return this.selection.filter(unit => !unit.dead);
    }

}
