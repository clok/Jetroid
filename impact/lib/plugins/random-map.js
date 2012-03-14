///////////////////////////////////////////////////////////////////////////////
// iPhone RPG, (c) 2007 Chris Knight, Creative Commons license
// See license.txt
// http://creativecommons.org/licenses/by-nc-sa/3.0/us/
///////////////////////////////////////////////////////////////////////////////
// $Revision: 1.1 $

/**
 * This is modified from Chris Knight's iPhoen RPG under Creative Commons license
 * http://creativecommons.org/licenses/by-nc-sa/3.0/us/
 */
ig.module(
    'plugins.random-map'
)
    .requires(
    'impact.map'
)
    .defines(function () {
        RandomMap = ig.Class.extend({
            mapsize:0,
            dirs:[
                {x:-1, y:0},
                {x:0, y:1},
                {x:1, y:0},
                {x:0, y:-1}
            ],
            mainLayer:[],
            collisionLayer:[],
            paths:[],
            rooms:[],
            mapData: null,
            width: 0,
            height: 0,
            emptyRoomTiles: [],
            //TODO need to be able to pass in a set of data
            init:function (size, mapData) {
                this.mapsize = size;
                this.mapData = mapData;

                this.mainLayer = mapData.layer[0].data;
                this.mainLayer.length = 0;

                this.collisionLayer = mapData.layer[1].data;
                this.collisionLayer.length = 0;

                this.wallSets = [[1,2],
                                 [3,4],
                                 [5,6],
                                 [7,8]];
                this.currentWallSet = this.wallSets.random();
                this.roomSets = [
                                 [13,14,15,16],
                                 [17,18,19,20],
                                 [21,22,23,24]];
                this.hallwaySet = [[9,10,11,12]];

                this.enemies = [["EntityZombie",.5, {spriteOffset: 0, speed: 10}],
                                ["EntityZombie",.2, {spriteOffset: 1, speed: 28}]]
                /*
                 seed
                 settings
                 monsters - List of entities to spawn in the level. ["EntityZombie", "EntityZombieDog", EntityZombieBoss"]
                 monsterDistribution - should match monsters, length and be percent of each to fill level [.3,.2,.1]
                 level


                 */

                // Generate Map before passing up to super

                this.randomMap(this.mapsize);
                this.genMaze();
                this.genRooms(1,3);
                this.makeDoors();

                this.clearJunk();

                //this.parent(tileSize, mapsize);
            },
            randomMap:function (mapsize) {
                this.mapsize = mapsize;

                //TODO look into why this is multiplied by 2 + 3
                this.width = this.height = mapsize * 2 + 3;
                //this.mainLayer = [];
                this.paths = [];
                this.rooms = [];
                for (var i = 0; i < this.height; i++) {
                    var a = [];
                    var b = [];
                    for (var j = 0; j < this.width; j++) {
                        a.push('#');
                        b.push("0");
                    }
                    this.mainLayer.push(a);
                    this.collisionLayer.push(b);
                }
                return this;
            },
            genMaze:function () {
                var x = 1, y = 1;
                this.mainLayer[x][y] = ' ';
                while (1) {
                    var dir = Math.floor(Math.random() * 4);
                    for (var i = 0; i < 4; i++) {
                        var testdir = (dir + i) % 4;
                        var newx = x + this.dirs[testdir].x * 2, newy = y + this.dirs[testdir].y * 2;
                        if (newx > 0 && newx < this.width
                            && newy > 0 && newy < this.height
                            && this.mainLayer[newx][newy] == '#')
                            break;
                    }
                    if (i < 4) {
                        x += this.dirs[testdir].x;
                        y += this.dirs[testdir].y;
                        this.mainLayer[x][y] = ' ';
                        x += this.dirs[testdir].x;
                        y += this.dirs[testdir].y;
                        this.mainLayer[x][y] = '' + testdir;
                    } else { //backup
                        if (x == 1 && y == 1) break;
                        else {
                            dir = this.mainLayer[x][y];
                            this.mainLayer[x][y] = ' ';
                            x -= this.dirs[dir].x * 2;
                            y -= this.dirs[dir].y * 2;
                        }
                    }
                }
            },
            genRooms:function (min, max) {
                var trycount = 0;
                while (1) {
                    if (trycount > 10) break;
                    var width = Math.floor(Math.random() * max) + min,
                        height = Math.floor(Math.random() * max) + min,
                        x1 = Math.floor(Math.random() * (this.mapsize - width)) * 2 + 1,
                        y1 = Math.floor(Math.random() * (this.mapsize - height)) * 2 + 1,
                        x2 = x1 + width * 2, y2 = y1 + height * 2;
                    room = new MapRoom(x1, y1, x2, y2);
                    for (var i = 0; i < this.rooms.length; i++) {
                        if (room.intersects(this.rooms[i])) break;
                    }
                    if (i == this.rooms.length) {
                        this.rooms.push(room);
                        trycount = 0;
                    } else {
                        trycount++;
                    }
                }
                for (var i = 0; i < this.rooms.length; i++) {
                    var room = this.rooms[i];
                    var roomSet = this.roomSets.random();
                    for (var x = room.x1; x <= room.x2; x++) {
                        for (var y = room.y1; y <= room.y2; y++) {
                            this.mainLayer[x][y] = roomSet.random().toString();
                            this.emptyRoomTiles.push({x:x,y:y});
                        }
                    }
                }

                //TODO need to add random platforms in rooms
            },
            findOtherEnd:function (room, x, y, dir) {
                // could probably optimize this by taking steps two at a time
                var path = [];
                var d = 0;
                while (1) {
                    if (d >= 4) { // out of options, back up
                        if (path.length < 2) return null;
                        var back = path.pop();
                        x = back.x;
                        y = back.y;
                        dir = back.dir;
                        d = back.nextdir + 1;
                        continue;
                    }

                    if (d == 2) d++; // don't look "back"

                    var tmpdir = (dir + d) % 4,
                        tmpx = x + this.dirs[tmpdir].x, tmpy = y + this.dirs[tmpdir].y;
                    if (this.mainLayer[tmpx][tmpy] == ' ') {
                        path.push({x:x, y:y, dir:dir, nextdir:d});
                        x = tmpx + this.dirs[tmpdir].x;
                        y = tmpy + this.dirs[tmpdir].y;
                        dir = tmpdir;
                        d = 0;
                        if (this.mainLayer[x][y] == 'R') {
                            for (var rn = 0; rn < this.rooms.length; rn++) {
                                if (this.rooms[rn].contains(x, y)) break;
                            }
                            if (this.rooms[rn] != room) {
                                path.push({x:x, y:y, dir:dir, nextdir:d});
                                return { end:this.rooms[rn], path:path };
                            }

                            d = 5; // force a "back up"
                        }
                    }
                    else d++;
                }
                return { end:null, path:null };
            },
            checkPath:function (room, path) {
                if (path == null || path.path == null || path.end == null) return;

                if (room.connected(path.end) && Math.floor(Math.random() * 5)) return;

                room.connectedRooms[path.end] = path.end;
                path.end.connectedRooms[room] = room;
                this.paths.push(path);

                var newpath = [];
                // fill in the missing steps
                for (var i = 1; i < path.path.length; i++) {
                    var step = path.path[i];
                    newpath.push({
                        x:step.x - this.dirs[step.dir].x,
                        y:step.y - this.dirs[step.dir].y,
                        dir:step.dir
                    });
                    newpath.push({x:step.x, y:step.y, dir:step.dir});
                }
                newpath.pop();
                path.path = newpath;

                // proper path, draw it in
                for (var i = 0; i < path.path.length; i++) {
                    this.mainLayer[path.path[i].x][path.path[i].y] = 'P';
                }


            },
            genPaths:function () {
                for (var i = 0; i < this.rooms.length; i++) {
                    var room = this.rooms[i], edges = room.edges();
                    for (var e = 0; e < edges.length; e++) {
                        var edge = edges[e];
                        if (this.mainLayer[edge.x + this.dirs[edge.dir].x]
                            [edge.y + this.dirs[edge.dir].y] == ' ')
                            this.checkPath(room,
                                this.findOtherEnd(room, edge.x, edge.y, edge.dir));
                    }
                }
            },

            clearJunk:function () {
                this.openSpaces = [];

                //TODO need to clean this up to customize the level tiles and generate collision map from
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (this.mainLayer[x][y] == ' ')
                        {
                            this.mainLayer[x][y] = this.hallwaySet.random().random();
                            this.openSpaces.push({x:x,y:y});
                        }

                        //TODO need to figure out a way to capture open spaces in rooms
                        /*if(this.mainLayer[x][y] == 'R')
                        {
                            this.mainLayer[x][y] = this.hallwaySet.random().random();
                            this.openSpaces.push({x:x,y:y});
                        }*/
                        //if (this.mainLayer[x][y] != '#') this.mainLayer[x][y] = '7';
                        if (this.mainLayer[x][y] == '#')
                        {
                            this.mainLayer[x][y] = this.currentWallSet.random();
                            this.collisionLayer[x][y] = '1';
                        }
                    }
                }

                // Adjust map width
                this.mapData.layer[0].width = this.mapData.layer[1].width = this.width;
                this.mapData.layer[0].height = this.mapData.layer[1].height = this.height;
                // Add entrance

                //

                var entities = this.mapData.entities;
                entities.length = 0;

                var openSpace = this.openSpaces.splice(0,1)[0];

                console.log("start pos "+ (openSpace.x-1), openSpace.y);


                var exit = {x:(openSpace.x-1),y: openSpace.y};
                console.log("exit", exit.x, exit.y);
                this.mainLayer[exit.x][exit.y] = this.hallwaySet.random().random();
                this.collisionLayer[exit.x][exit.y] = '0';
                entities.push({type:"EntityOutofbounds", x:exit.y*20, y:exit.x*20, settings: {size: {x:20,y:2}, name:"outofbounds"}});

                /*this.mainLayer.setTile((openSpace.x-1), openSpace.y, 0);
                this.collisionLayer.setTile((openSpace.x-1), openSpace.y, 0);*/
                entities.push({type:"EntityPlayer", x:(openSpace.x * 20)+5, y:openSpace.y*20, settings: {name:"player"}});
                var randomID;

                //console.log("rooms",this.rooms);
                var totalItems = this.openSpaces.length * .10;

                for(var i = 0; i < totalItems; i++)
                {
                    randomID = Math.floor(Math.random() * this.openSpaces.length);
                    randomID = Math.floor(Math.random() * this.openSpaces.length);
                    randomID = Math.floor(Math.random() * this.openSpaces.length);

                    openSpace = this.openSpaces.splice(randomID,1)[0];
                    entities.push({type:"EntityCrate", x:openSpace.x * 20, y:openSpace.y * 20, settings: {name:"crate"+1, spriteOffset: Math.floor(Math.random() * 5)}});
                }
                //Spawn monsters


            },

            randomDoor:function () {
                var d = Math.random();
                if (d < .3) return ' ';
                if (d < .7) return '|';
                if (d < .9) return '=';
                return '+';
            },

            makeDoors:function () {
                for (var i = 0; i < this.paths.length; i++) {
                    var path = this.paths[i].path;
                    if (Math.random() < .05) {
                        this.mainLayer[path[0].x][path[0].y] = 'S';
                        this.mainLayer[path[path.length - 1].x][path[path.length - 1].y] = 'S';
                    } else {
                        this.mainLayer[path[0].x][path[0].y] = this.randomDoor();
                        this.mainLayer[path[path.length - 1].x][path[path.length - 1].y] =
                            this.randomDoor();
                    }

                    while (Math.random() < .04) { // collapse(s)
                        var i = Math.floor(Math.random() * path.length);
                        this.mainLayer[path[i].x][path[i].y] = '0';
                    }
                }
            },
            toString:function () {
                var stringMap = "";
                var total = this.collisionLayer.length;
                var i;
                // Render Map
                for (i = 0; i < total; i++) {
                    stringMap = stringMap + this.collisionLayer[i].join() + "\n";
                }

                return stringMap;
            }
        });

        MapRoom = ig.Class.extend({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            init:function (x1, y1, x2, y2) {

                if (x1 > x2) {
                    var x = x1;
                    x1 = x2;
                    x2 = x;
                }
                if (y1 > y2) {
                    var y = y1;
                    y1 = y2;
                    y2 = y;
                }
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;

                this.__defineGetter__('width',
                    function () {
                        return this.x2 - this.x1;
                    });
                this.__defineGetter__('height',
                    function () {
                        return this.y2 - this.y1;
                    });
                this.__defineGetter__('top', function () {
                    return this.y1;
                });
                this.__defineGetter__('left', function () {
                    return this.x1;
                });

                this.connectedRooms = new Object();


                return this;
            },

            toString:function () {
                return '[room ' + this.x1 + ', ' + this.y1 + ', '
                    + this.x2 + ', ' + this.y2 + ']';
            },

            intersects:function (room) {
                return this.x1 <= room.x2 && this.x2 >= room.x1
                    && this.y1 <= room.y2 && this.y2 >= room.y1;
            },

            contains:function (x, y) {
                return x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2;
            },
            connected:function (otherroom, seenlist) {
                if (this.connectedRooms[otherroom]) return true;
                var that = this;
                if (!seenlist) seenlist = {that:true};
                if (seenlist[otherroom]) return false;
                seenlist[otherroom] = true;
                for (var i in otherroom.connectedRooms) {
                    if (this.connected(otherroom.connectedRooms[i], seenlist)) return true;
                }
                return false;
            },

            edges:function () {
                var e = [];
                for (var x = this.x1; x <= this.x2; x++) {
                    e.push({x:x, y:this.y1, dir:3});
                    e.push({x:x, y:this.y2, dir:1});
                }
                for (var y = this.y1; y <= this.y2; y++) {
                    e.push({x:this.x1, y:y, dir:0});
                    e.push({x:this.x2, y:y, dir:2});
                }
                return e;
            }
        });
    });

