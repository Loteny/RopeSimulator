Renderer = {
    ctx: null,
    then: 0,

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

        Logic.loop(delta);
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
        let rope = Catalogue.add(new Rope(100, 100));
        rope.buildNext(30);
        rope.buildNext(30);
        rope.buildNext(40);
        rope.buildNext(60);
    },
};

Logic = {
    loop: function(dt) {
        let rope = Catalogue.getRope();
        rope.doPhysics();
    },

    keypress: function(e) {
        if (e.charCode === 32) {
            e.preventDefault();
            let p0 = Catalogue.getRope().points[0];
            p0.force(new Vector(10, 90));
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
    rectHeight: 4,
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

    doPhysics() {
        this.points.forEach(function(o) {
            o.doPhysics();
        });
    }
};

class Point {
    constructor(x, y, prev=null, next=null) {
        this.x = x;
        this.y = y;
        this.prev = prev;
        this.next = next;

        this.acceleration = 0;
        this.velocity = 0;

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

    doPhysics() {
        if (this.prev !== null) {
            //
        }
        if (this.next !== null) {
            //
        }
    }

    // "from" indicates where the force comes from
    // If it comes from the previous point, it's -1. From the next point, 1. External forces are 0.
    force(f, from=0) {
        let obj = this;
        let transfer = (pi, pf, new_from) => {
            const angle_between_points = Point.angleOfLine(pi, pf);
            const new_f = f;
            console.log(obj);
            console.log(new_f);
            pi.force(new_f, new_from);
        };
        if (from !== 1 && this.next !== null) {
            transfer(this.next, this, -1);
        }
        if (from !== -1 && this.prev !== null) {
            transfer(this.prev, this, 1);
        }
    }

    static angleOfLine(pi, pf) {
        return Math.atan2(pf.y - pi.y, pf.x - pi.x);
    }
}

class Vector {
    constructor(intensity, angle) {
        this.int = intensity;
        this.ang = angle * Math.PI / 180;
    }
}

window.addEventListener("load", () => {
    Renderer.initialize();
});