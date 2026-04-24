const KEYS = {
    SPACE: 32
};

let game = {
    running: true,
    ctx: null,
    platform: null,
    ball: null,
    blocks: [],
    effects: [], // Array to hold animation effects
    score: 0,
    rows: 4,
    cols: 8,
    width: 640,
    height: 360,
    sounds: {
        bump: null,
    },
    colors: {
        background: "#f0f0f0",
        ball: "#3498db",
        platform: "#2c3e50",
        text: "#333",
        blocks: ["#e74c3c", "#f1c40f", "#2ecc71", "#9b59b6"]
    },
    mouse: {
        x: 0
    },
    init() {
        this.ctx = document.getElementById("mycanvas").getContext("2d");
        this.setTextFont();
        this.setEvents();
    },
    setTextFont() {
        this.ctx.font = "20px Arial";
        this.ctx.fillStyle = this.colors.text;
    },
    setEvents() {
        window.addEventListener("keydown", e => {
            if (e.keyCode === KEYS.SPACE) {
                this.platform.fire();
            }
        });
        window.addEventListener("mousemove", e => {
            let canvasBounds = this.ctx.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - canvasBounds.left;
        });
    },
    preload(callback) {
        let loaded = 0;
        let required = Object.keys(this.sounds).length;

        if (required === 0) {
            callback();
            return;
        }
        
        let onResourceLoad = () => {
            ++loaded;
            if (loaded >= required) {
                callback();
            }
        };

        this.preloadAudio(onResourceLoad);
    },
    preloadAudio(onResourceLoad) {
        for (let key in this.sounds) {
            this.sounds[key] = new Audio("sounds/" + key + ".mp3");
            this.sounds[key].addEventListener("canplaythrough", onResourceLoad, {once: true});
        }
    },
    create() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.blocks.push({
                    active: true,
                    width: 60,
                    height: 20,
                    x: 64 * col + 65,
                    y: 24 * row + 35,
                    color: this.colors.blocks[row % this.colors.blocks.length]
                });
            }
        }
    },
    update() {
        this.collideBlocks();
        this.collidePlatform();
        this.ball.collideWorldBounds();
        this.platform.collideWorldBounds();
        this.platform.move();
        this.ball.move();
        this.updateEffects();
    },
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            let effect = this.effects[i];
            effect.alpha -= 0.05; // Fade out speed
            effect.scale += 0.05;  // Scale up speed

            if (effect.alpha <= 0) {
                this.effects.splice(i, 1);
            }
        }
    },
    addScore() {
        ++this.score;
        if (this.score >= this.blocks.length) {
            this.end("You Win!");
        }
    },
    collideBlocks() {
        for (let block of this.blocks) {
            if (block.active && this.ball.collide(block)) {
                this.ball.bumpBlock(block);
                this.addScore();
                this.sounds.bump.play();
            }
        }
    },
    collidePlatform() {
        if (this.ball.collide(this.platform)) {
            this.ball.bumpPlatform(this.platform);
            this.sounds.bump.play();
        }
    },
    run() {
        if (this.running) {
            window.requestAnimationFrame(() => {
                this.update();
                this.render();
                this.run();
            });
        }
    },
    render() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = this.colors.ball;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + this.ball.width / 2, this.ball.y + this.ball.height / 2, this.ball.width / 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = this.colors.platform;
        this.ctx.fillRect(this.platform.x, this.platform.y, this.platform.width, this.platform.height);

        this.renderBlocks();
        this.renderEffects();
        this.ctx.fillText("Score: " + this.score, 15, 20);
    },
    renderBlocks() {
        for (let block of this.blocks) {
            if (block.active) {
                this.ctx.fillStyle = block.color;
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
            }
        }
    },
    renderEffects() {
        this.ctx.save();
        for (let effect of this.effects) {
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.fillStyle = effect.color;

            let newWidth = effect.width * effect.scale;
            let newHeight = effect.height * effect.scale;
            let x = effect.x - (newWidth - effect.width) / 2;
            let y = effect.y - (newHeight - effect.height) / 2;

            this.ctx.fillRect(x, y, newWidth, newHeight);
        }
        this.ctx.restore();
    },
    start: function () {
        this.init();
        this.preload(() => {
            this.create();
            this.run();
        });
    },
    end(message) {
        this.running = false;
        alert(message);
        window.location.reload();
    },
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
};

game.ball = {
    dx: 0,
    dy: 0,
    velocity: 4,
    x: 320,
    y: 280,
    width: 12,
    height: 12,
    start() {
        this.dy = -this.velocity;
        this.dx = game.random(-this.velocity, this.velocity);
    },
    move() {
        if (this.dy) {
            this.y += this.dy;
        }
        if (this.dx) {
            this.x += this.dx;
        }
    },
    collide(element) {
        let x = this.x + this.dx;
        let y = this.y + this.dy;

        if (x + this.width > element.x &&
            x < element.x + element.width &&
            y + this.height > element.y &&
            y < element.y + element.height) {
            return true;
        }

        return false;
    },
    collideWorldBounds() {
        let x = this.x + this.dx;
        let y = this.y + this.dy;

        let ballLeft = x;
        let ballRight = ballLeft + this.width;
        let ballTop = y;
        let ballBottom = ballTop + this.height;

        let worldLeft = 0;
        let worldRight = game.width;
        let worldTop = 0;
        let worldBottom = game.height;

        if (ballLeft < worldLeft) {
            this.x = 0;
            this.dx = this.velocity;
            game.sounds.bump.play();
        } else if (ballRight > worldRight) {
            this.x = worldRight - this.width;
            this.dx = -this.velocity;
            game.sounds.bump.play();
        } else if (ballTop < worldTop) {
            this.y = 0;
            this.dy = this.velocity;
            game.sounds.bump.play();
        } else if (ballBottom > worldBottom) {
            game.end("Game Over");
        }
    },
    bumpBlock(block) {
        this.dy *= -1;
        block.active = false;
        // Create an effect for the block destruction
        game.effects.push({
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            color: block.color,
            alpha: 1,
            scale: 1
        });
    },
    bumpPlatform(platform) {
        if (this.dy > 0) {
            this.dy = -this.velocity;
            let touchX = this.x + this.width / 2;
            let newDx = (touchX - (platform.x + platform.width / 2)) / (platform.width / 2);
            this.dx = newDx * this.velocity;
        }
    }
};

game.platform = {
    dx: 0,
    x: 280,
    y: 300,
    width: 100,
    height: 14,
    ball: game.ball,
    fire() {
        if (this.ball) {
            this.ball.start();
            this.ball = null;
        }
    },
    move() {
        let targetX = game.mouse.x - this.width / 2;
        this.x += (targetX - this.x) * 0.1;

        if (this.ball) {
           this.ball.x = this.x + this.width / 2 - this.ball.width / 2;
        }
    },
    collideWorldBounds() {
        let x = this.x;
        let platformLeft = x;
        let platformRight = platformLeft + this.width;
        let worldLeft = 0;
        let worldRight = game.width;

        if (platformLeft < worldLeft) {
            this.x = worldLeft;
        } else if (platformRight > worldRight) {
            this.x = worldRight - this.width;
        }
    }
};

game.platform.ball = game.ball;

window.addEventListener("load", () => {
    game.start();
});