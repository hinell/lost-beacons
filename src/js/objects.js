OBJECT_NO_POSITION_IS_MISSING = new Error('Invalid argument: position {x,y} is missing!')
class Object_ {
    constructor (cfg = {}) {
      // first things first
      this.x          = cfg.x || 0;
      this.y          = cfg.y || 0;
      this.collection = [];
    }
    angleTo(targetObj) {
      return Math.PI + Math.atan2(this.y - targetObj.y,this.x - targetObj.x)
    }
    
    distanceTo(position){
      if(!position || !position.x || !position.y) { throw OBJECT_NO_POSITION_IS_MISSING }
      return hypot(this.y - position.y,this.x - position.x)
    }
}
class Objects extends Array {
  constructor(arr){
    super()
    if(arr instanceof Array) { this.splice.apply(this, [this.length,0].concat(arr)) }
  }
  get first (){ return this[0] }
  get last (){ return this[this.length] }
  
  // Highly efficient version of filter, allows to avoid doubling filtering the same array
  // @param {Function} - function
  // @param - return the rest of objects that aren't fit to the passed
  // @return { Objects | Objects<Objects,Objects>} - if second argument is provided, then return tuple [[],[]] or instance of the Objects otherwise
  filter(cb,returnRest, this_){
    let passed   = new this.constructor();
    if(returnRest){
      let filtered = new this.constructor();
      for (let i = 0; i < this.length; i++) { let obj = this[i]; if(cb.call(this_,obj,i,this)) { passed.push(obj) } else { filtered.push(obj) }  }
      return [passed,filtered]
    }
     for (let i = 0; i < this.length; i++) { let obj = this[i]; if(cb.call(this_,obj,i,this)) { passed.push(obj) }  }
     return passed
  }
  
  closestTo(targetPos){
    return this
    .filter(currentObj => currentObj !== targetPos )
    .sort((a, b) => dist(targetPos, a) - dist(targetPos, b))
  }

  at(targetPos,radius = GRID_SIZE){
        return this.filter(obj => dist(targetPos, obj) < radius )
  }
  // TODO: Move to Objects, create checking available position
  // finds available positions around
  freeSingleCirclePositions(startPosition, radiusBetween = 5, offSetCenter /* distant from center */, startAngle = 0) {
      // if offSetCenter is not provided then only available
      // position is this object itself
      if (!offSetCenter) { return this.some(e => e.x === startPosition.x && e.y === startPosition.y) ? [] : [startPosition] }
      if (radiusBetween <= 0) { throw new Error('Invalid argument: radius between positions cannot be zero or below!')}
      let perimeter     = 2 * PI * offSetCenter;
      let offsetLength  = ~~(perimeter / radiusBetween);
      let angleOffset   = (2 * PI) / offsetLength; // angle offset to rotate position over

      let positions = new Objects();
      let position
      for (let i = 0 ; i < offsetLength ; i++) {
      
          position = new Object_({
              x : startPosition.x + cos(angleOffset * i + startAngle) * offSetCenter,
              y : startPosition.y + sin(angleOffset * i + startAngle) * offSetCenter
          });
          
          !W.hasObstacle(position.x, position.y, radiusBetween / 2)
          && this.every(reservedPos => { return dist(reservedPos, position) > radiusBetween; })
          && positions.push(position)
        
      }
      return positions;
  
    }
  
  freeCirclePositions(position,radBetweenPos,maxRadius,requiredPositions, minRadius, startAngle) {
      if(!(position instanceof Object_)){ position = new Object_(position) }

      if(!maxRadius){ maxRadius = radBetweenPos * 3 } // default 3 times of radius between each point
          requiredPositions = requiredPositions || this.length;
          // requiredPositions += ~~(requiredPositions * .10); // available positions + ten percent of possible
      let positions = new Objects();
      // let angleForGroup = (2 * Math.PI * maxRadius)/radBetweenPos
      let stop = 0;
      for ( let currentRadius = minRadius || 0;
                currentRadius < maxRadius || stop < 350 && positions.length <= requiredPositions ;
                currentRadius += radBetweenPos
      ) {
        stop++;
        let nextFreePositions   = this.freeSingleCirclePositions(position, radBetweenPos, currentRadius, startAngle);
            positions = positions.concat(nextFreePositions)
            // nextFreePositions.forEach(p => positions.push(p) )
      }
      return positions
  }
  
  freeRectanglePositions(position,offset = GRID_SIZE){

    let width   = ~~(Math.sqrt(this.length)) + 2
    let height  = ~~(Math.sqrt(this.length)) + 2
    
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