var D = document,
    w = window,
    delayed = setTimeout,
    C, // canvas
    R, // canvas context
    G, // Game instance
    V, // Camera instance
    W, // World instance
    mobile = navigator.userAgent.match(nomangle(/andro|ipho|ipa|ipo|windows ph/i));
