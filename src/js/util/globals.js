var DEBUG = false,
    D = document,
    w = window,
    delayed = setTimeout,
    C, // canvas
    R, // canvas context
    G, // Game instance
    V, // Camera instance
    W, // World instance
    mobile = navigator.userAgent.match(/andro|ipho|ipa|ipo|windows ph/i),
    constants =
    
//
    // window['true ']   =  1;
    // window['false']   =  0;
    // window['const']   =  "let";
    
    CANVAS_WIDTH =  1400;
    CANVAS_HEIGHT =  1000;
    
    GRID_EMPTY_PADDING =  3;
    GRID_OBSTACLE_PADDING =  1;
    OBSTACLES =  80;
    OBSTACLE_EXPAND_ITERATIONS =  2;
    
    GRID_SIZE =  50;
    GRID_COLOR =  '#479';
    PERSPECTIVE =  400;
    
    CYCLABLE =  1;
    RENDERABLE =  2;
    FIRST =  4;
    UNIT =  8;
    BEACON =  16;
    
    HEALTH_GAUGE_WIDTH =  30;
    HEALTH_GAUGE_HEIGHT =  2;
    HEALTH_GAUGE_RADIUS =  20;
    
    SELECTED_EFFECT_RADIUS =  40;
    SELECTED_EFFECT_SIZE =  5;
    
    CHASE_CURSOR_RADIUS =  40;
    CHASE_CURSOR_SIZE =  8;
    CHASE_CURSOR_PERIOD =  0.4;
    
    CURSOR_MOVE_CAMERA_MARGIN =  50;
    
    SELECTION_MIN_SIZE =  5;
    ANNOUNCEMENT_CELL_SIZE =  8;
    
    
    SELECT_HELP_SIZE =  180;
    
    NO_CLICK =  0;
    LEFT_CLICK =  1;
    RIGHT_CLICK =  2;
    CLICK_HIGHLIGHT_PERIOD =  1.8


Object.keys(constants).forEach(function (key){
    window[key] = constants[key];
});

Number.prototype.range = function(){
  return this ? Array.apply(null, {length: this}).map((e,i) => i) : []
}

Number.prototype.roundp = function(p = 2){ return ~~(this*Math.pow(10,p))/Math.pow(10,p) }

Number.prototype.isBetween = function(a,b){
    return (a <= this && this <= b) || (a >= this && this >= b)
}