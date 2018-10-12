Renderer = {
    ctx: null,
    pause: false,
    then: 0,
    elapsed: 0,

    initialize: function() {
        window.addEventListener("keypress", Logic.keypress.bind(Logic), false);
        this.ctx = document.querySelector("canvas").getContext("2d");
        this.buildRope();
        requestAnimationFrame(this.loop.bind(this));
    },

    loop: function(now) {
        // Get timing in miliseconds
        let delta = now - this.then;
        this.then = now;

        this.elapsed += delta;
        Logic.second_tick = this.elapsed >= 200 ? (this.elapsed -= 200, true) : false;

        if (this.pause) {
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        Logic.loop(delta / 1000);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    },

    render: function() {
        const canvas = document.querySelector("canvas");
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.fillStyle = "rgb(240, 240, 240)";
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        let ctx = this.ctx;
        Catalogue.iterate(function(o) {
            o.render(ctx);
        });
    },

    buildRope: function() {
        let rope = Catalogue.add(new Rope(500, 100));
        rope.buildNext(30);
        rope.buildNext(30);
        rope.buildNext(40);
        rope.buildNext(60);
        rope.buildNext(60);
        rope.buildNext(60);
        rope.buildNext(60);
        rope.buildNext(60);
        rope.buildNext(60);
        rope.buildNext(60);
    },
};

Logic = {
    second_tick: false,

    loop: function(dt) {
        let rope = Catalogue.getRope();
        rope.doPhysics(dt);
        window.p1 = rope.points[0];
        window.p2 = rope.points[0];
    },

    keypress: function(e) {
        if (e.charCode === 32) {
            e.preventDefault();
            let p0 = Catalogue.getRope().points[0];
            p0.addForce(new Vector(Consts.forceAdded, 0));
        }
        if (e.charCode === 112) {
            Renderer.pause = !Renderer.pause;
        }
    }
};

Catalogue = {
    items: [],
    add: function(o) {
        this.items.push({
            "o": o,
        });
        return o;
    },

    iterate: function(f) {
        this.items.forEach(function(i) {
            f(i.o);
        });
    },

    getRope: function() {
        return this.items.find(function(o) {
            return o.o instanceof Rope;
        }).o;
    },
};

Consts = {
    pointOut: 13,
    pointIn: 10,
    pointDist: 60,
    pointDistAproxP: 60.001,
    pointDistAproxM: 59.999,
    rectHeight: 4,
    ropeConst: 3500,
    forceAdded: 10000,
    friction: 0.95,
    floatMin: 0.0001,
}

class Rope {
    constructor(x, y) {
        this.points = [new Point(x, y)];
    }

    buildNext(angle, distance=Consts.pointDist) {
        angle = angle * Math.PI / 180;
        const qty = this.points.length;
        let prev = this.points[qty - 1];
        this.points.push(new Point(prev.x + Math.cos(angle) * distance, prev.y + Math.sin(angle) * distance, prev));
        prev.next = this.points[qty];
    }

    render(ctx) {
        this.renderConnections(ctx);
        this.points.forEach(function(o) {
            o.render(ctx);
        });
    }

    renderConnections(ctx) {
        for (let i = 1; i < this.points.length; ++i) {
            const prev = this.points[i - 1];
            const next = this.points[i];
            const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
            ctx.translate((next.x + prev.x) / 2, (next.y + prev.y) / 2);
            ctx.rotate(angle);
            ctx.fillStyle = "rgb(10, 10, 200)";
            ctx.fillRect(-Consts.pointDist / 2, -Consts.rectHeight / 2, Consts.pointDist, Consts.rectHeight);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    doPhysics(dt) {
        this.points.forEach(function(o) {
            o.addForce(Vector.fromIntDeg(1000, 90));
        });
        this.points.forEach(function(o) {
            o.doPhysicsForces();
        });
        this.points.forEach(function(o) {
            o.doPhysics(dt);
        });
    }
};

class Point {
    constructor(x, y, prev=null, next=null) {
        this.x = x;
        this.y = y;
        this.prev = prev;
        this.next = next;

        this.force = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.velocity = new Vector(0, 0);

        this.mass = 1;
    }
    
    render(ctx) {
        // Outter line
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, Consts.pointOut, 0, 2 * Math.PI, false);
        ctx.fill();
        // Fill
        ctx.fillStyle = "rgb(40, 40, 200)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, Consts.pointIn, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    doPhysicsForces() {
        const counterForces = function(pf, pi) {
            const dist = Vector.fromCoords(pf.x - pi.x, pf.y - pi.y);
            if (dist.int > Consts.pointDistAproxP) {
                pf.addForce(new Vector((dist.int - Consts.pointDist) * Consts.ropeConst, dist.ang + Math.PI));
                pi.addForce(new Vector((dist.int - Consts.pointDist) * Consts.ropeConst, dist.ang));
            }
        }
        if (this.prev !== null) {
            counterForces(this, this.prev);
        }
    }

    doPhysics(dt) {
        if (this.prev === null) {
            return;
        }

        this.acceleration = new Vector(this.force.int / this.mass, this.force.ang);
        this.force = new Vector(0, 0);

        // Friction
        this.velocity.mag(1 - (Consts.friction * dt));
        this.velocity.add(new Vector(dt * this.acceleration.int, this.acceleration.ang));

        const pos = Vector.fromCoords(this.x, this.y).add(new Vector(dt * this.velocity.int, this.velocity.ang));
        this.move(pos);
    }

    move(pos) {
        // Make it so that it loses all velocity in direction of a neighbor if the spring would compress
        const noCompress = function(vi, vf) {
            const dist = Vector.fromCoords(vf.x - vi.x, vf.y - vi.y);
            if (dist.int < Consts.pointDistAproxM) {
                // Returns the correct position
                return Vector.fromCoords(vi.x, vi.y).add(new Vector(Consts.pointDist, dist.ang));
            }
            return vf;
        }

        // Moves this point checking for compression with the previous
        if (this.prev !== null) {
            let new_pos = noCompress(Vector.fromCoords(this.prev.x, this.prev.y), pos);
            this.x = new_pos.x;
            this.y = new_pos.y;
        } else {
            this.x = pos.x;
            this.y = pos.y;
        }
    }

    addForce(f) {
        this.force.add(f);
    }
}

class Vector {
    constructor(intensity, angle) {
        this.int = intensity;
        this.ang = angle;
        this.calculateFromIntAng();
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.calculateFromXY();
        return this;
    }

    mag(x) {
        this.int *= x;
        this.calculateFromIntAng();
        return this;
    }

    calculateFromIntAng() {
        this.x = this.int * Math.cos(this.ang);
        this.y = this.int * Math.sin(this.ang);
        return this;
    }

    calculateFromXY() {
        this.int = Math.sqrt(this.x * this.x + this.y * this.y);
        this.ang = Math.atan2(this.y, this.x);
        return this;
    }

    static fromCoords(x, y) {
        let v = new Vector(0, 0);
        v.x = x;
        v.y = y;
        v.calculateFromXY();
        return v;
    }

    static angleOfLine(pi, pf) {
        return Math.atan2(pf.y - pi.y, pf.x - pi.x);
    }

    static fromIntDeg(int, deg) {
        return new Vector(int, deg * Math.PI / 180);
    }
}

window.addEventListener("load", () => {
    Renderer.initialize();
});