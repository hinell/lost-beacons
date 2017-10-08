class Object_ {
    constructor (cfg = {}) {
      // first things first
      this.x          = cfg.x || 0;
      this.y          = cfg.y || 0;
      this.collection = [];
    }
}
class Objects extends Array {
  constructor(arr){
    super()
    if(arr instanceof Array) { this.splice.apply(this, [this.length,0].concat(arr)) }
  }
  get first (){ return this[0] }
  
  push(obj){
    obj.collection = this;
    return super.push(obj)
  }
  unshift(obj){
    obj.collection = this;
    return super.unshift(obj)
  }
  
  nearestObjectsTo(targetPos){
    return this
    .filter(currentObj => currentObj !== targetPos )
    .sort((a, b) => dist(targetPos, a) - dist(targetPos, b))
  }

  at(targetPos,radius = GRID_SIZE){
        return this.filter(obj => dist(targetPos, obj) < radius )
  }
  
    // TODO: Move to Objects, create checking available position
    // finds available positions around
  allocateSingleCirclePositions(targetPosition,radBetweenPos = UNIT_RADIUS,radOffFromCenter /* distant from center */ ) {
    // if radOffFromCenter is not provided then only available
    // position is this object itself
      if (!radOffFromCenter) { return [targetPosition] }
      
      let perimeter     = 2 * PI * radOffFromCenter;
      let offsetLength  = ~~(perimeter / radBetweenPos);
      let angleOffset   = (2 * PI) / offsetLength; // angle offset to rotate position over
      let positions = new Objects();
      let position
      for (let i = 0 ; i < offsetLength ; i++) {
      
          position = new Object_({
              x : targetPosition.x + cos(angleOffset * i) * radOffFromCenter,
              y : targetPosition.y + sin(angleOffset * i) * radOffFromCenter
          });
          
          !W.hasObstacle(position.x, position.y, radBetweenPos / 2)
          &&  this.every(reservedPos => { return dist(reservedPos, position) > radBetweenPos; })
          && positions.push(position)
        
      }


      return positions;
  
    }
  
  allocateCirclePositions(position,radBetweenPos, withinRadius, requiredPositions = 0) {
      if(!(position instanceof Object_)){ position = new Object_(position) }
      let maxRadius = withinRadius;
      if(!withinRadius){ maxRadius = radBetweenPos * 3 } // default 3 times of radius between each point
          requiredPositions = requiredPositions || this.length;
          requiredPositions += ~~(requiredPositions * .10); // available positions + ten percent of possible
      let positions = new this.constructor();
      
      for ( let currentRadius = 0;
                maxRadius < withinRadius || positions.length <= requiredPositions;
                currentRadius += radBetweenPos
      ) {
        positions = positions.concat(this.allocateSingleCirclePositions(position,radBetweenPos,currentRadius))
        // position = positions[0] // change positation target dynamically
      }
      return positions
  }
  
  
  allocateRectanglePositions(position, offset = GRID_SIZE){

    let width   = ~~(Math.sqrt(this.length)) + 1
    let height  = ~~(Math.sqrt(this.length)) + 1
    
    let startX = position.x - ~~((width  * offset * 2)/ 2) - offset
    let startY = position.y - ~~((height * offset * 2)/ 2) - offset

    
        
    let positions = new this.constructor();
      let currentX = startX, currentY = startY;
      for (let i = 0; i < width; i++) {
        currentY += offset * 2
        currentX = startX
        for (let j = 0; j < height; j++) {
              currentX += (offset * 2);
          let position = { x: currentX, y: currentY};
          if(!W.hasObstacle(position.x, position.y, offset / 2)
            && this.every(reservedPos => { return dist(reservedPos, position) > offset; })){

            positions.push(position)
          }
        }
      }
      return positions
  }
}