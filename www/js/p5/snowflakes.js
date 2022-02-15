// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// Snowfall
// Edited Video: https://youtu.be/cl-mHFCGzYk


class Snowflake {
    constructor(sx, sy, img, p) {
        let x = sx || p.random(p.width);
        let y = sy || p.random(-100, -10);
        this.p = p;
        this.img = img;
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(0, 0);
        this.acc = p.createVector();
        this.angle = p.random(p.TWO_PI);
        this.dir = p.random(1) > 0.5 ? 1 : -1;
        this.xOff = 0;
        this.r = this.getRandomSize();
    }

    getRandomSize() {
        let r = this.p.pow(this.p.random(0, 1), 3);
        return this.p.constrain(r * 32, 2, 32);
    }

    applyForce(force) {
        // Parallax Effect hack
        let f = force.copy();
        f.mult(this.r);

        this.acc.add(f);
    }

    randomize() {
        let x = this.p.random(this.p.width);
        let y = this.p.random(-100, -10);
        this.pos = this.p.createVector(x, y);
        this.vel = this.p.createVector(0, 0);
        this.acc = this.p.createVector();
        this.r = this.getRandomSize();
    }

    update() {
        this.xOff = this.p.sin(this.angle * 2) * 2 * this.r;

        this.vel.add(this.acc);
        this.vel.limit(this.r * 0.2);

        if (this.vel.mag() < 1) {
            this.vel.normalize();
        }

        this.pos.add(this.vel);
        this.acc.mult(0);

        if (this.pos.y > this.p.height + this.r) {
            this.randomize();
        }

        // Wrapping Left and Right
        if (this.pos.x < -this.r) {
            this.pos.x = this.p.width + this.r;
        }
        if (this.pos.x > this.p.width + this.r) {
            this.pos.x = -this.r;
        }

        this.angle += (this.dir * this.vel.mag()) / 200;
    }

    render() {
        this.p.push();
        this.p.translate(this.pos.x + this.xOff, this.pos.y);
        this.p.rotate(this.angle);
        this.p.imageMode(this.p.CENTER);
        this.p.image(this.img, 0, 0, this.r, this.r);
        this.p.pop();
    }
}



function sketch_snowflakes(p) {

    p.snow = [];
    p.gravity;

    p.zOff = 0;

    p.spritesheet;
    p.textures = [];

    p.preload = function () {
        p.spritesheet = p.loadImage('images/flakes32.png');
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.gravity = p.createVector(0, 0.3);
        for (let x = 0; x < p.spritesheet.width; x += 32) {
            for (let y = 0; y < p.spritesheet.height; y += 32) {
                let img = p.spritesheet.get(x, y, 32, 32);
                p.image(img, x, y);
                p.textures.push(img);
            }
        }

        for (let i = 0; i < 200; i++) {
            let x = p.random(p.width);
            let y = p.random(p.height);
            let design = p.random(p.textures);
            p.snow.push(new Snowflake(x, y, design, p));
        }
    }

    p.draw = function () {

        p.clear();
        p.background(0, 0, 0, 0);

        p.zOff += 0.1;

        for (flake of p.snow) {
            let xOff = flake.pos.x / p.width;
            let yOff = flake.pos.y / p.height;
            let wAngle = p.noise(xOff, yOff, p.zOff) * p.TWO_PI;
            let wind = p5.Vector.fromAngle(wAngle);
            wind.mult(0.1);

            flake.applyForce(p.gravity);
            flake.applyForce(wind);
            flake.update();
            flake.render();
        }
    }


    p.windowResized = function() {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}
