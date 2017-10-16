class Behavior {
    constructor (){
        this.cycleInterval  = 1;
        this.cycleTimer     = 0;
    }
    attach(unit) {
        this.unit = unit;
    }
    
    cycle(e) {}

    reconsider() {
        // implement in subclasses
        return this;
    }

    render() {}

    reservedPosition() { return {'x': this.unit.x, 'y': this.unit.y} }

}
