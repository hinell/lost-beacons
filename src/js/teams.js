const NEUTRAL_TEAM = {
    'name'    : 'neutral',
    'body': '#fff',
    'leg': '#fff',
    'head': '#fff',
    'beacon': '#fff',
    'behaviour': () => new Idle(),
    'reinforcementsInterval': 25
};

const NEMESIS_TEAM = {
    'name'    : 'nemesis',
    'body': '#661040',
    'leg': '#191818',
    'head': '#daaaff',
    'beacon': '#ee61b1',
    'behaviour': () => new Idle(),
    'reinforcementsInterval': 15
};


const PLAYER_TEAM = {
    'name'    : 'player',
    'body': '#4c2',
    'leg': '#381',
    'head': '#2f7',
    'beacon': '#65ff4e',
    'behaviour': (target,position) => new Reach(target,position),
    'reinforcementsInterval': 20
};

const ENEMY_TEAM = {
    'name'    : 'enemy',
    'head': '#850000',
    'body': '#ac0404',
    'leg': '#5d0505',
    'beacon': '#ff645b',
    'behaviour': () => new Autonomous(),
    'reinforcementsInterval': 20
};
