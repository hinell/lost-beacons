function linear(t, b, c, d) {
    return (t / d) * c + b;
}

function easeOutQuad(t, b, c, d) {
    return -c *(t/=d)*(t-2) + b;
}

function easeInQuint(t, b, c, d) {
    return c*(t/=d)*t*t*t*t + b;
}

function easeOutQuint(t, b, c, d) {
    return c*((t=t/d-1)*t*t*t*t + 1) + b;
}


// @func
// @param o - Object
// @param p - Property
// @param a - From
// @param b - To
// @param d - Duration
// @param l - Delay
// @param f - Easing function
// @param e - End callback
function interp(o, p, a, b, d, l, f, e) {
    var i = {
        o: o, // object
        p: p, // property
        a: a, // from
        b: b, // to
        d: d, // duration
        l: l || 0, // delay
        f: f || linear, // easing function
        e: e, // end callback
        t: 0,
        cycle: function(e){
            if (i.l > 0) {
                i.l -= e;
                i.o[i.p] = i.a;
            } else {
                i.t = min(i.d, i.t + e);
                i.o[i.p] = i.f(i.t, i.a, i.b - i.a, i.d);
                if(i.t == i.d){
                    if(i.e){
                        i.e();
                    }
                    W.remove(i);
                }
            }
        }
    };
    W.add(i, CYCLABLE);
}
