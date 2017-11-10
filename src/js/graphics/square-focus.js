let squareFocus_PI4fr = Math.PI/4;
const squareFocus     = (radius, s, width = 1 ) => {
    const corner = angle => () => {
        translate(cos(angle) * radius, sin(angle) * radius);
        rotate(angle + PI * 3 / 4);
        R.fillRect(0, 0, width, s);
        R.fillRect(0, 0, s, width);
    };

        wrap(corner(Math.PI2 + squareFocus_PI4fr));
        wrap(corner(0.75 * Math.PI2 + squareFocus_PI4fr));
        wrap(corner(0.5  * Math.PI2 + squareFocus_PI4fr));
        wrap(corner(0.25 * Math.PI2 + squareFocus_PI4fr));
};

class Corner{
  constructor (height = 1,width = 1) {
    this.height = height;
    this.width  = width;
  }
  
  render(){
    this.height = height;
    this.width  = width;
  }
}

class SquareFocus {
    constructor(pos){
        this.x = pos.x;
        this.y = pos.y;
    }
}