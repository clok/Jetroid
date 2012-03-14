ig.module(
    'game.main'
)
    .requires(
    'impact.game',
    'game.levels.template',
    'impact.font',
    'plugins.camera',
    // Entities that are dynamically spawned
    'game.entities.door',
    'game.entities.crate',
    'game.entities.outofbounds',
    // Remove this when done debugging
    'impact.debug.debug',
    'plugins.impact-storage',
    'plugins.tracking',
    'plugins.string-utils',
    'impact.sound',
    'game.menus.menu' ,
    'plugins.random-map',
    'plugins.minimap',
    'plugins.map-history'
)

    .defines(function () {

        MyGame = ig.Game.extend({

            gravity:360,
            statText:new ig.Font('media/04b03.font.png'),
            showStats:false,
            levelTimer:new ig.Timer(),
            levelExit:null,
            stats:null,
            lives:0,
            camera:null,
            player:null,
            lifeSprite:new ig.Image('media/life-sprite.png'),
            duration:1,
            strength:3,
            quakeTimer: null,
            quakeRunning: false,
            deathMessage:'You Died',
            sortBy:ig.Game.SORT.Z_INDEX,
            instructionsTimer:null,
            instructionDelay:2,
            instructionsText:"",
            isGameOver:false,
            activeMenu:null,
            buttonDelay:.3,
            buttonDelayTimer:null,
            useWeapons:true,
            playerStartPosition:{x:0, y:0},
            defaultInstructions:'',
            storage:null,
            currentLevelName:"template",
            levelCounter:0,
            tracking: null,

            /**
             * Main function
             */
            init:function () {

                //Setup Tracking
                this.tracking = new Tracking(trackingID);

                // Setup Local Storage
                this.storage = this.storage = new ig.Storage();

                // Setup Game Timers
                this.quakeTimer = new ig.Timer();
                this.instructionsTimer = new ig.Timer();
                this.buttonDelayTimer = new ig.Timer();

                // Setup camera
                this.camera = new Camera((ig.system.width - 100) * .5, ig.system.height / 3, 5);
                this.camera.trap.size.x = ig.system.width / 3;
                this.camera.trap.size.y = ig.system.height / 3;
                this.camera.lookAhead.x = 0;//ig.ua.mobile ? ig.system.width / 6 : 0;

                this.loadLevel(LevelTemplate);

                // Bind keys
                ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
                ig.input.bind(ig.KEY.UP_ARROW, 'jump');

                ig.input.bind(ig.KEY.A, 'left');
                ig.input.bind(ig.KEY.D, 'right');
                ig.input.bind(ig.KEY.W, 'jump');

                //ig.input.bind(ig.KEY.C, 'shoot');
                //ig.input.bind(ig.KEY.TAB, 'switch');
                ig.input.bind(ig.KEY.SPACE, 'continue');
                ig.input.bind(ig.KEY.Q, 'quit');
                ig.input.bind(ig.KEY.ESC, 'pause');

                ig.input.bind( ig.KEY.MOUSE1, 'move' );
                ig.input.bind( ig.KEY.MOUSE2, 'drag' );

                ig.input.mousemoveCallback = this.mousemove.bind(this);
                //TODO replace with this
                /*for( key in wm.config.binds ) {
                    ig.input.bind( ig.KEY[key], wm.config.binds[key] );
                }*/
                // Create Background Music
                ig.music.add('media/sounds/theme.*');
                ig.music.volume = 0.5;
                //ig.music.play();

                // Set game volume
                ig.Sound.volume = 0.5;

            },
            loadLevel:function (data) {

                var map = new RandomMap(10, data);


                // Merge main layer and collision layers

                /*data.layer[0].data = map.mainLayer;

                data.layer[1].data = map.collisionLayer;*/
                // Reset Default Values
                this.defaultInstructions = "Fly Out Of Exit To End The Game.";
                this.showStats = true;
                var defaultWeapon = 1;

                this.currentLevel = data;
                console.log("Level data", data);
                var cameraMinY = this.showStats ? -16 : 0;

                this.stats = {time:0, deaths:0, artifact:0, lifeform:0, treasure:0};
                this.parent(data);

                this.levelCounter++;

                // Track Level
                this.tracking.trackPage("/game/load/level/"+this.currentLevelName);

                // Looks for
                var settings = this.getEntityByName("settings");
                if (settings) {
                    // Set propetires supported by game engine if overriden by setting entity
                    if (settings.showStats)
                        this.showStats = settings.showStats == "true" ? true : false;

                    if (settings.defaultInstructions)
                        this.defaultInstructions = settings.defaultInstructions;

                    if (settings.defaultWeapon)
                        defaultWeapon = settings.defaultWeapon;

                    if (settings.cameraMinY)
                        cameraMinY = Number(settings.cameraMinY);

                    //TODO add default weapon settings
                }
                else {
                    // Reset value
                }

                //console.log("showStats", this.showStats, settings.showStats);
                this.player = this.getEntitiesByType(EntityPlayer)[0];

                //Set Player Values
                this.player.air = this.player.airMax = Math.floor((map.width * map.height) / 20) * 5;
                this.player.power = this.player.powerMax = Math.floor((map.width * map.height) / 20) * 5;

                console.log(this.player.air, this.player.airMax);
                this.playerStartPosition = {x:this.player.pos.x, y:this.player.pos.y};

                //If there are no stats make sure the player doesn't have a weapon
                if (this.showStats) {
                    //ig.game.stats.ammo = 10;
                    this.player.makeInvincible();

                    //for testing
                    defaultWeapon = 0;
                    this.player.equip(defaultWeapon, true);
                }

                this.levelTimer.reset();

                this.camera.max.x = this.collisionMap.width * this.collisionMap.tilesize - ig.system.width;
                this.camera.min.y = cameraMinY;
                this.camera.max.y = this.collisionMap.height * this.collisionMap.tilesize - ig.system.height;
                this.camera.set(this.player);

                if (this.defaultInstructions != "none")
                    this.displayInstructions(this.defaultInstructions, 7);


                // add mini map
                this.miniMap = new Minimap(data.layer[0]);

            },
            update:function () {
                // screen follows the player
                if (this.instructionsTimer.delta() > this.instructionDelay) {
                    this.showInstructionText = false;
                }

                if (this.paused) {
                    // only update some of the entities when paused:
                    for (var i = 0; i < this.entities.length; i++) {
                        if (this.entities[i].ignorePause) {
                            this.entities[i].update();
                        }
                    }

                    if (ig.input.state('quit')) {
                        ig.system.setGame(StartScreen);
                    }
                }
                else {
                    // call update() as normal when not paused
                    this.parent();
                    this.camera.follow(this.player);
                    var delta = this.quakeTimer.delta();
                    if (delta < -0.1) {
                        this.quakeRunning = true;
                        var s = this.strength * Math.pow(-delta / this.duration, 2);
                        if (s > 0.5) {
                            ig.game.screen.x += Math.random().map(0, 1, -s, s);
                            ig.game.screen.y += Math.random().map(0, 1, -s, s);
                        }
                    }
                    else
                    {
                        this.quakeRunning = false;
                    }
                    if(this.stats)
                        this.stats.score = (this.stats.artifact * 50) + (this.stats.lifeform * 100) + (this.stats.treasure * 150) + (this.stats.time * 10);


                }

                //TODO maybe this should be moved into the PauseMenu logic?
                if (ig.input.state('pause') && !this.isGameOver) {

                    if (this.buttonDelayTimer.delta() > this.buttonDelay) {

                        this.togglePause();

                        if (this.paused) {
                            this.showInstructionText = false;
                            //TODO need to save out how much longer instruction text should show before shutting it down
                            this.stats.time = Math.round(this.levelTimer.delta());
                            this.activeMenu = this.spawnEntity(EntityPauseMenu, 30, 10, this.showStats ? {stats:this.stats} : null);

                        } else {
                            //TODO restore instruction text if needed
                            //TODO just need to make sure this correctly resets time.
                            this.levelTimer.set(-this.stats.time);
                        }

                        this.buttonDelayTimer.reset();
                    }
                }

                if (ig.input.state('continue') && this.isGameOver) {
                    this.reloadLevel();
                }

            },
            togglePause:function () {
                this.paused = !this.paused;
                if (!this.paused && this.activeMenu)
                    this.activeMenu.kill();
                //TODO need to make sure anything that gets paused is killed or reactivated here
            },
            displayInstructions:function (value, delay) {
                this.instructionDelay = delay ? delay : 2;
                this.instructionsText = value;
                this.showInstructionText = true;
                this.instructionsTimer.reset();

                //console.log("Display New Text", value);
            },
            draw:function () {
                // Draw all entities and backgroundMaps
                this.parent();
                this.camera.draw();


                if (this.showStats && !this.isGameOver) {

                    var maxBarWidth = 40;
                    var nextX = 5;
                    var padding = 5;
                    var statusBars = [{name:"health", color:"256,0,0"}, {name:"power", color:"0,256,0"}, {name:"air", color:"0,0,256"}];

                    ig.system.context.fillStyle = 'rgba(0,0,0,0.9)';
                    ig.system.context.fillRect(0 * ig.system.scale, 0 * ig.system.scale, ig.system.width * ig.system.scale, 16 * ig.system.scale);

                    var currentBar;

                    for(var i = 0; i < statusBars.length; i++)
                    {

                        currentBar = statusBars[i];

                        var percent = this.player[currentBar.name]/this.player[currentBar.name+'Max'];

                        this.statText.draw(currentBar.name.toUpperCase(), nextX, 5);
                        nextX += this.statText.widthForString(currentBar.name.toUpperCase()) + padding;
                        ig.system.context.fillStyle = 'rgba('+currentBar.color+',0.9)';
                        ig.system.context.fillRect(nextX * ig.system.scale, 5 * ig.system.scale, (maxBarWidth * ig.system.scale) * percent, 5 * ig.system.scale);
                        nextX += maxBarWidth + padding*2;
                    }

                }

                if (this.showInstructionText) {
                    ig.system.context.fillStyle = 'rgba(0,0,0,0.8)';
                    ig.system.context.fillRect(0 * ig.system.scale, (ig.system.height - 16) * ig.system.scale, ig.system.width * ig.system.scale, ig.system.height * ig.system.scale);

                    var x = ig.system.width / 2,
                        y = ig.system.height - 10;
                    this.statText.draw(this.instructionsText, x, y, ig.Font.ALIGN.CENTER);
                }
            },
            gameOver:function () {
                this.showInstructionText = false;
                this.isGameOver = true;
                if(this.stats)
                    this.stats.time = Math.round(this.levelTimer.delta());
                //;
                if (this.showStats) {
                    this.paused = true;
                    this.activeMenu = this.spawnEntity(EntityGameOverMenu, 30, 10, this.showStats ? {stats:this.stats} : null);
                    if(this.stats)
                    {
                    // Save Stats
                    this.storage.set("totalScore", this.storage.getInt("totalScore") + this.stats.score);
                    this.storage.set("totalKills", this.storage.getInt("totalKills") + this.stats.kills);
                    this.storage.set("totalDoors", this.storage.getInt("totalDoors") + this.stats.doors);

                    // Tracking
                        this.tracking.trackPage("/game/escape");
                        this.tracking.trackEvent("game", "escape", "score:" + this.stats.score + ",kills" + this.stats.kills + ",doors" + this.stats.doors, null);
                    }
                    else
                    {
                        this.tracking.trackPage("/game/over");
                        this.tracking.trackEvent("game", "over");
                    }
                    //Also need to set stats around best for the level
                }
                else {
                    this.respawnPlayer();
                }
            },
            reloadLevel:function () {
                this.isGameOver = false;
                if (this.paused)
                    this.togglePause();
                this.loadLevelDeferred(this.currentLevel);
            },
            respawnPlayer:function () {
                this.player = this.spawnEntity(EntityPlayer, this.playerStartPosition.x, this.playerStartPosition.y);
            },
            shakeScreen:function () {
                //TODO this is to help with performance on mobile
                if (this.quakeRunning) {
                    return;
                }
                this.quakeTimer.set(this.duration);
            },
            setDeathMessage:function (value) {
                this.deathMessage = value;
            },
            //TODO need to look into how to fix this... use the level editor as a reference
            mousemove: function() {
                console.log("Mouse Move");
                if( ig.input.state('drag') ) {
                    this.screen.x -= ig.input.mouse.x - this.mouseLast.x;
                    this.screen.y -= ig.input.mouse.y - this.mouseLast.y;
                    this._rscreen.x = Math.round(this.screen.x * ig.system.scale)/ig.system.scale;
                    this._rscreen.y = Math.round(this.screen.y * ig.system.scale)/ig.system.scale;
                    for( var i = 0; i < this.layers.length; i++ ) {
                        this.layers[i].setScreenPos( this.screen.x, this.screen.y );
                    }
                }
            },
        });

        StartScreen = ig.Game.extend({
            instructText:new ig.Font('media/04b03.font.png'),
            background:new ig.Image('media/screen-bg.png'),
            mainCharacter:new ig.Image('media/screen-main-character.png'),
            title:new ig.Image('media/game-title.png'),
            storage:null,
            startSFX:new ig.Sound('media/sounds/StartGame.*'),
            tracking: null,

            init:function () {

                // Create tracking
                this.tracking = new Tracking(trackingID);

                this.storage = new ig.Storage();
                //this.resetLocalStorage(); // <- Use this for testing
                // Setup default game values for first time install
                this.setupLocalStorage();

                // Tracking
                this.tracking.trackPage("/game/new-game-screen");

                ig.input.bind(ig.KEY.SPACE, 'start');
            },
            setupLocalStorage:function () {
                if (!this.storage.isSet("level")) {
                    this.storage.set("level", 1);

                    // Tracking
                    this.tracking.trackEvent("game", "new", "new-install-version:" + version, null);
                }
                //Total Kills
                if (!this.storage.isSet("totalKills"))
                    this.storage.set("totalKills", 0);

                //Total Doors
                if (!this.storage.isSet("totalDoors"))
                    this.storage.set("totalDoors", 0);

                //Total Score
                if (!this.storage.isSet("totalScore"))
                    this.storage.set("totalScore", 0);

                if (!this.storage.isSet("version")) {
                    this.storage.set("version", version);
                }
                else {
                    var oldVer = this.storage.get("version");

                    // Tracking
                    if (oldVer != version)
                        this.tracking.trackEvent("game", "upgrade", oldVer + "->" + version, null);
                }
            },
            resetLocalStorage:function () {
                this.storage.clear();
            },
            update:function () {
                if (ig.input.pressed('start')) {
                    this.startSFX.play();
                    ig.system.setGame(MyGame);
                }
                this.parent();
            },
            draw:function () {
                this.parent();
                this.background.draw(0, 0);
                this.mainCharacter.draw(0, 0);
                this.title.draw(ig.system.width - this.title.width, 0);
                var x = ig.system.width / 2,
                    y = ig.system.height - 10;
                this.instructText.draw('Press Spacebar To Start', x + 40, y, ig.Font.ALIGN.CENTER);
            }
        });

        if (!ig.ua.mobile) {
            // Disable sound for all mobile devices
            ig.Sound.enabled = false;
        }

        ig.main('#canvas', MyGame , 60, 240, 160, 3);

        //Global Constants
        var version = "v0.2.0-alpha";
        var trackingID = "UA-18884514-10";
    });
