class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
      )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
    )
  } 

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.id = key;

      //TODO: determine if this object should actually mount
      object.mount(this);

    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;

    //Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {
      this.startCutscene(match.talking[0].events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene( match[0].events )
    }
  }

  addWall(x,y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x,y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {x,y} = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x,y);
  }

}

window.OverworldMaps = {
  DemoRoom: {
    lowerSrc: "/images/maps/DemoLower.png",
    upperSrc: "/images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "up", time: 800 },
          { type: "stand",  direction: "right", time: 1200 },
          { type: "stand",  direction: "up", time: 300 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I'm busy...", faceHero: "npcA" },
              { type: "textMessage", text: "Go away!"},
              { who: "hero", type: "walk",  direction: "up" },
            ]
          }
        ]
      }),
      npcB: new Person({
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        src: "/images/characters/people/npc2.png",
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ]
      }),
    },
    walls: {
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(8,7)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7,4)]: [
        {
          events: [
            { who: "npcB", type: "walk",  direction: "left" },
            { who: "npcB", type: "stand",  direction: "up", time: 500 },
            { type: "textMessage", text:"You can't be in there!"},
            { type: "textMessage", text:"Out you come!"},
            { who: "npcB", type: "walk",  direction: "right" },
            { who: "hero", type: "walk",  direction: "down" },
            { who: "hero", type: "walk",  direction: "left" },
          ]
        }
      ],
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "changeMap", map: "Kitchen" }
          ]
        }
      ]
    }
  },
  Kitchen: {
    lowerSrc: "/images/maps/KitchenLower.png",
    upperSrc: "/images/maps/KitchenUpper.png",
    gameObjects: {
      erio: new Person({
        x: utils.withGrid(9),
        y: utils.withGrid(5),
        src: "/images/characters/people/deadErio.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "You: Frank? Frank? Why are you sleeping in the pizza sauce, I mean, I know it's good and all? And why did you put a knife in your back, that's.... Oh no, it looks as though there's been a murder!" },
              { who: "andy", type: "walk",  direction: "left" },
              { who: "andy", type: "stand",  direction: "up" },
              { type: "textMessage", text: "Andy: He's dead? And everyone will think you did it... Oh this is great! I'm so fed up of boxing pizzas, but with you in prison I'll be able to take your job." },
              { who: "hero", type: "stand",  direction: "down" },
              { type: "textMessage", text: "You: Not so fast, I'm going to prove it wasn't me by finding out who did this!" },
              { type: "textMessage", text: "Andy: Good luck with that, you're the one that went to fetch a bowl when you heard it was chilly outside! " },
              { who: "andy", type: "walk",  direction: "right" },
              { who: "andy", type: "stand",  direction: "down" },
              { type: "textMessage", text: "You: I'm going to prove it wasn't me by finding out who did this!" },
              { type: "textMessage", text: "You: Oh look, that's strange: the knife in Frank's back isn't a kitchen knife, it's a boating knife??? I wonder if I can find any more clues? ..." },
              { type: "textMessage", text: "You: ... and what's this on the floor? A VIP Ed Sheeran ticket for tomorrow night's show.... I wonder why the murderer didn't take it?" },
              { type: "textMessage", text: "You: ... and there's an open box of mints lying here, don't mind if I do! Mmmmmmm." },
              { type: "textMessage", text: "Help: Go to the arrow square at the bottom of the screen to continue your journey." },
            ]
          }
        ]
      }),
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(8),
      }),
      andy: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/images/characters/people/npc3.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Ha ha! You're in so much trouble. You should leave this room and go find out who did this.", faceHero:"andy" },
            ]
          }
        ]
      })
    },
    walls: {
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(1,5)] : true,
      [utils.asGridCoord(1,6)] : true,
      [utils.asGridCoord(1,7)] : true,
      [utils.asGridCoord(1,9)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(2,9)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(3,10)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(4,10)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(6,3)] : true,
      [utils.asGridCoord(6,7)] : true,
      [utils.asGridCoord(6,10)] : true,
      [utils.asGridCoord(7,3)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(8,3)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(9,3)] : true,
      [utils.asGridCoord(9,7)] : true,
      [utils.asGridCoord(9,9)] : true,
      [utils.asGridCoord(10,3)] : true,
      [utils.asGridCoord(10,7)] : true,
      [utils.asGridCoord(10,9)] : true,
      [utils.asGridCoord(11,4)] : true,
      [utils.asGridCoord(11,10)] : true,
      [utils.asGridCoord(12,4)] : true,
      [utils.asGridCoord(12,10)] : true,
      [utils.asGridCoord(13,6)] : true,
      [utils.asGridCoord(13,7)] : true,
      [utils.asGridCoord(13,8)] : true,
      [utils.asGridCoord(13,9)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "changeMap", map: "DiningRoom" }
          ]
        }
      ]
    }
  },
  DiningRoom: {
    lowerSrc: "/images/maps/DiningRoomLower.png",
    upperSrc: "/images/maps/DiningRoomUpper.png",
    gameObjects: {
      betty: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(4),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand",  direction: "up", time: 800 },
          { type: "stand",  direction: "right", time: 300 },
          { type: "stand",  direction: "down", time: 2000 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Betty: Have you seen Frank around? I'm gonna murder that scoundrel if he doesn't give me my Ed Sheeran tickets in time for tonight's gig!", faceHero:"betty" },
              { type: "textMessage", text: "You: Murder? Hmmmm, interesting... Acutally I have some bad news for you, Frank has pasta-way." },
              { who: "betty", type: "walk",  direction: "left" },
              { who: "betty", type: "walk",  direction: "left" },
              { who: "betty", type: "stand",  direction: "up", time: 500 },
              { who: "betty", type: "walk",  direction: "right" },
              { who: "betty", type: "walk",  direction: "right" },
              { type: "textMessage", text: "Betty: Oh no, that terrible news, we were supposed to go waterskiing together on my boat later today.", faceHero:"betty" },
              { type: "textMessage", text: "You: Oh, you have a boat? Here, have a mint, it will cheer you up." },
              { type: "textMessage", text: "Betty: That's OK thanks, I have a pack of my own... oh, where are they now? I seem to have lost them." },
              { type: "textMessage", text: "Betty: You should talk to Clive, he was really angry with Frank at the party last night." },
            ]
          }
        ]
      }),
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(3),
      }),
    },
    walls: {
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,6)] : true,
      [utils.asGridCoord(0,7)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(0,9)] : true,
      [utils.asGridCoord(0,10)] : true,
      [utils.asGridCoord(0,11)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(1,5)] : true,
      [utils.asGridCoord(1,12)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(2,5)] : true,
      [utils.asGridCoord(2,7)] : true,
      [utils.asGridCoord(2,10)] : true,
      [utils.asGridCoord(2,12)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(3,5)] : true,
      [utils.asGridCoord(3,7)] : true,
      [utils.asGridCoord(3,10)] : true,
      [utils.asGridCoord(3,12)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(4,5)] : true,
      [utils.asGridCoord(4,7)] : true,
      [utils.asGridCoord(4,10)] : true,
      [utils.asGridCoord(4,12)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(5,12)] : true,
      [utils.asGridCoord(6,3)] : true,
      [utils.asGridCoord(6,4)] : true,
      [utils.asGridCoord(6,5)] : true,
      [utils.asGridCoord(7,2)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(7,12)] : true,
      [utils.asGridCoord(8,3)] : true,
      [utils.asGridCoord(8,7)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(8,12)] : true,
      [utils.asGridCoord(9,4)] : true,
      [utils.asGridCoord(9,7)] : true,
      [utils.asGridCoord(9,10)] : true,
      [utils.asGridCoord(9,12)] : true,
      [utils.asGridCoord(10,5)] : true,
      [utils.asGridCoord(10,12)] : true,
      [utils.asGridCoord(11,5)] : true,
      [utils.asGridCoord(11,7)] : true,
      [utils.asGridCoord(11,12)] : true,
      [utils.asGridCoord(12,5)] : true,
      [utils.asGridCoord(12,7)] : true,
      [utils.asGridCoord(12,12)] : true,
      [utils.asGridCoord(13,6)] : true,
      [utils.asGridCoord(13,8)] : true,
      [utils.asGridCoord(13,9)] : true,
      [utils.asGridCoord(13,10)] : true,
      [utils.asGridCoord(13,11)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(6,12)]: [
        {
          events: [
            { type: "changeMap", map: "GreenKitchen" }
          ]
        }
      ]
    }
  },
  GreenKitchen: {
    lowerSrc: "/images/maps/GreenKitchenLower.png",
    upperSrc: "/images/maps/GreenKitchenUpper.png",
    gameObjects: {
      clive: new Person({
        x: utils.withGrid(8),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc2.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 2000 },
          { type: "stand",  direction: "down", time: 1000 },
          { type: "stand",  direction: "right", time: 1000 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "You: Hi Clive, I was wondering if I could talk to you about Frank?", faceHero:"clive"  },
              { type: "textMessage", text: "Clive: Frank? That low-life, trying to hit on Betty with the promise of Ed Sheeran tickets!" },
              { type: "textMessage", text: "You: Are you not a fan?" },
              { type: "textMessage", text: "Clive: What, that little orange goblin who steals Marvin Gaye tunes? No I'd much rather be out fishing on my boat than go to one of his lame sing-alongs." },
              { type: "textMessage", text: "You: Actually, I meant Frank." },
              { type: "textMessage", text: "Clive: Well Frank's a goblin who tries to get a piz-za other people's girlfriends. Oooh, you smell of mint. Can I have one? I seem to have left mine somewhere." },
              { type: "textMessage", text: "You: Well I just found Frank, he's been murdered." },
              { type: "textMessage", text: "Clive: Oh no, poor guy, and what a great friend he was. I'll really miss him. We were at school together, you know, lovely man. Who would do such a terrible thing? I bet it was Doris, I saw her slap him at the Party last night." },
              { type: "textMessage", text: "You: Doris you say. I'll go talk to her." },
            ]
          }
        ]
      }),
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(5),
      }),
    },
    walls: {
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,5)] : true,
      [utils.asGridCoord(0,7)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(0,9)] : true,
      [utils.asGridCoord(0,10)] : true,
      [utils.asGridCoord(0,11)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(1,6)] : true,
      [utils.asGridCoord(1,12)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(2,6)] : true,
      [utils.asGridCoord(2,9)] : true,
      [utils.asGridCoord(2,12)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(3,6)] : true,
      [utils.asGridCoord(3,7)] : true,
      [utils.asGridCoord(3,9)] : true,
      [utils.asGridCoord(3,12)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(4,6)] : true,
      [utils.asGridCoord(4,7)] : true,
      [utils.asGridCoord(4,9)] : true,
      [utils.asGridCoord(4,12)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(5,6)] : true,
      [utils.asGridCoord(6,3)] : true,
      [utils.asGridCoord(6,6)] : true,
      [utils.asGridCoord(6,7)] : true,
      [utils.asGridCoord(6,12)] : true,
      [utils.asGridCoord(7,3)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(7,12)] : true,
      [utils.asGridCoord(8,4)] : true,
      [utils.asGridCoord(8,5)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(8,12)] : true,
      [utils.asGridCoord(9,4)] : true,
      [utils.asGridCoord(9,10)] : true,
      [utils.asGridCoord(9,12)] : true,
      [utils.asGridCoord(10,5)] : true,
      [utils.asGridCoord(10,6)] : true,
      [utils.asGridCoord(10,7)] : true,
      [utils.asGridCoord(10,8)] : true,
      [utils.asGridCoord(10,9)] : true,
      [utils.asGridCoord(10,11)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,12)]: [
        {
          events: [
            { type: "changeMap", map: "PizzaShop" }
          ]
        }
      ]
    }
  },
  PizzaShop: {
    lowerSrc: "/images/maps/PizzaShopLower.png",
    upperSrc: "/images/maps/PizzaShopUpper.png",
    gameObjects: {
      doris: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(6),
        src: "/images/characters/people/npc4.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 2000 },
          { type: "stand",  direction: "down", time: 1000 },
          { type: "stand",  direction: "right", time: 1000 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "You: Hey Doris, I heard you were pretty angry with Frank last night?", faceHero:"doris"  },
              { type: "textMessage", text: "Doris: I don't want to talk about it." },
              { type: "textMessage", text: "Doris: I mean, what a slime-ball; buying tickets for that terrible crooner Sheeran, with my hard-earned dough and then offering to take Betty to the concert." },
              { type: "textMessage", text: "Doris: What a waste! His music's terrible and Nickelback are playing here next week." },
              { type: "textMessage", text: "Doris: And telling Betty he'll take her waterskiing when he knows my boat is faster. What a back-stabber!" },
              { type: "textMessage", text: "Doris: Well, I tell you, I'm goonna stab him in the back when I next see him." },
              { type: "textMessage", text: "You: Maybe you already did? Perhaps I should have mentioned it already, but he's been murdered." },
              { type: "textMessage", text: "Doris: Who Frank? Nooooooo, beautiful Frank, the love of my life. I miss him already. You didn't find the concert tickets on him by any chance? It would be a shame to waste them, maybe we could go together?" },
              { type: "textMessage", text: "You: Sorry, I have to work. Here, have a mint, it might take the edge off." },
              { type: "textMessage", text: "Doris: No thanks, I'm allergic." },
              { who: "hero", type: "walk",  direction: "left" },
              { who: "doris", type: "walk",  direction: "up" },
              { who: "doris", type: "walk",  direction: "right" },
            ]
          }
        ]
      }),
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(4),
      }),
      andy: new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(12),
        src: "/images/characters/people/npc3.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Andy: The police are outside, I told them you did it. I know you have no idea who the killer is... By the way, your IQ results came back this morning, they're negative!", faceHero:"andy" },
              { type: "textMessage", text: "You: But you're wrong Andy, I'm keeping my job, I know exactly who did this and I'm about to tell the world!" },
              { who: "hero", type: "walk",  direction: "left" },
              { who: "andy", type: "walk",  direction: "up" },
              { who: "andy", type: "walk",  direction: "right" },
            ]
          }
        ]
      })
    },
    walls: {
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,5)] : true,
      [utils.asGridCoord(0,6)] : true,
      [utils.asGridCoord(0,7)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(0,9)] : true,
      [utils.asGridCoord(0,10)] : true,
      [utils.asGridCoord(0,11)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(1,12)] : true,
      [utils.asGridCoord(2,4)] : true,
      [utils.asGridCoord(2,5)] : true,
      [utils.asGridCoord(2,6)] : true,
      [utils.asGridCoord(2,12)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(3,6)] : true,
      [utils.asGridCoord(3,8)] : true,
      [utils.asGridCoord(3,9)] : true,
      [utils.asGridCoord(3,12)] : true,
      [utils.asGridCoord(3,10)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(4,6)] : true,
      [utils.asGridCoord(4,8)] : true,
      [utils.asGridCoord(4,9)] : true,
      [utils.asGridCoord(4,10)] : true,     
      [utils.asGridCoord(4,12)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(5,6)] : true,
      [utils.asGridCoord(6,3)] : true,
      [utils.asGridCoord(6,12)] : true,
      [utils.asGridCoord(7,3)] : true,
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(7,8)] : true,
      [utils.asGridCoord(7,9)] : true,
      [utils.asGridCoord(7,12)] : true,
      [utils.asGridCoord(8,3)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(8,8)] : true,
      [utils.asGridCoord(8,9)] : true,
      [utils.asGridCoord(8,12)] : true,
      [utils.asGridCoord(9,4)] : true,
      [utils.asGridCoord(9,5)] : true,
      [utils.asGridCoord(9,6)] : true,
      [utils.asGridCoord(9,12)] : true,
      [utils.asGridCoord(10,3)] : true,
      [utils.asGridCoord(10,12)] : true,
      [utils.asGridCoord(11,4)] : true,
      [utils.asGridCoord(11,5)] : true,
      [utils.asGridCoord(11,6)] : true,
      [utils.asGridCoord(11,7)] : true,
      [utils.asGridCoord(11,8)] : true,
      [utils.asGridCoord(11,9)] : true,
      [utils.asGridCoord(11,10)] : true,
      [utils.asGridCoord(11,11)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,12)]: [
        {
          events: [
            { type: "textMessage", text: "This is end of the game, did you figure it out? Of course you did! I hope you enjoyed playing :D" },
            { type: "changeMap", map: "Street" }
          ]
        }
      ]
    }
  },
  Street: {
    lowerSrc: "/images/maps/StreetNorthLower.png",
    upperSrc: "/images/maps/StreetNorthUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(6),
      }),
      andy: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(15),
        src: "/images/characters/people/npc3.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "up", time: 800 },
          { type: "stand",  direction: "right", time: 1200 },
          { type: "stand",  direction: "up", time: 300 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Andy: The game's over, stop playing! I couldn't think of anything else to code, nothing to see here, please be on your way.", faceHero: "andy" },
            ]
          }
        ]
      }),
      betty: new Person({
        x: utils.withGrid(2),
        y: utils.withGrid(12),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand",  direction: "down", time: 800 },
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "right", time: 800 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Betty: I didn't do it, go check for fingerprints!", faceHero: "betty" },
            ]
          }
        ]
      }),
      clive: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/images/characters/people/npc2.png",
        behaviorLoop: [
          { type: "stand",  direction: "down", time: 800 },
          { type: "stand",  direction: "right", time: 800 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Clive: It wasn't me, Frank was a buddy. It was Betty, I saw her!", faceHero: "clive" },
            ]
          }
        ]
      }),
      doris: new Person({
        x: utils.withGrid(13),
        y: utils.withGrid(11),
        src: "/images/characters/people/npc4.png",
        behaviorLoop: [
          { type: "stand",  direction: "down", time: 300 },
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "up", time: 500 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Doris: I think it was Betty, or Clive, maybe Andy, perhaps you!", faceHero: "doris" },
            ]
          }
        ]
      }),
    },
    walls: {
      [utils.asGridCoord(1,8)] : true,
      [utils.asGridCoord(1,9)] : true,
      [utils.asGridCoord(1,10)] : true,
      [utils.asGridCoord(1,11)] : true,
      [utils.asGridCoord(1,12)] : true,
      [utils.asGridCoord(1,13)] : true,
      [utils.asGridCoord(1,14)] : true,
      [utils.asGridCoord(2,7)] : true,
      [utils.asGridCoord(2,15)] : true,
      [utils.asGridCoord(3,6)] : true,
      [utils.asGridCoord(3,7)] : true,
      [utils.asGridCoord(3,15)] : true,
      [utils.asGridCoord(4,5)] : true,
      [utils.asGridCoord(4,15)] : true,
      [utils.asGridCoord(5,5)] : true,
      [utils.asGridCoord(5,15)] : true,
      [utils.asGridCoord(6,5)] : true,
      [utils.asGridCoord(6,15)] : true,
      [utils.asGridCoord(7,5)] : true,
      [utils.asGridCoord(7,8)] : true,
      [utils.asGridCoord(7,9)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(8,5)] : true,
      [utils.asGridCoord(8,8)] : true,
      [utils.asGridCoord(8,9)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(8,15)] : true,
      [utils.asGridCoord(9,5)] : true,
      [utils.asGridCoord(9,10)] : true,
      [utils.asGridCoord(9,15)] : true,
      [utils.asGridCoord(10,5)] : true,
      [utils.asGridCoord(10,10)] : true,
      [utils.asGridCoord(10,15)] : true,
      [utils.asGridCoord(11,6)] : true,
      [utils.asGridCoord(11,15)] : true,
      [utils.asGridCoord(12,6)] : true,
      [utils.asGridCoord(12,15)] : true,
      [utils.asGridCoord(13,6)] : true,
      [utils.asGridCoord(13,15)] : true,
      [utils.asGridCoord(14,7)] : true,
      [utils.asGridCoord(14,8)] : true,
      [utils.asGridCoord(14,9)] : true,
      [utils.asGridCoord(14,10)] : true,
      [utils.asGridCoord(14,11)] : true,
      [utils.asGridCoord(14,12)] : true,
      [utils.asGridCoord(14,13)] : true,
      [utils.asGridCoord(14,14)] : true,

    },
  }
}