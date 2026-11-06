import * as fs from "fs";
import { groundTruthToWeights } from "./data/seed_small_data.js";

interface EntityDef {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  popularity: number;
  status: string;
  category: "character" | "object";
}

interface QuestionDef {
  id: number;
  text: string;
  source: string;
  category: "character" | "object" | "common";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

const NEW_ENTITIES: EntityDef[] = [
  {
    id: 96,
    name: "Cricket Ball",
    description: "Hard leather solid ball with a raised stitched seam used in cricket matches",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cricket_ball.svg/500px-Cricket_ball.svg.png",
    popularity: 42000,
    status: "active",
    category: "object"
  },
  {
    id: 97,
    name: "Football (Soccer Ball)",
    description: "Spherical leather or synthetic ball with pentagonal panels kicked in association football",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/500px-Soccerball.svg.png",
    popularity: 50000,
    status: "active",
    category: "object"
  },
  {
    id: 98,
    name: "Tennis Ball",
    description: "Fuzzy optic yellow hollow rubber ball hit with rackets in tennis",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Tennis_ball_3.svg/500px-Tennis_ball_3.svg.png",
    popularity: 45000,
    status: "active",
    category: "object"
  },
  {
    id: 99,
    name: "Volleyball",
    description: "Inflatable synthetic leather ball hit over a high net in volleyball",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Volleyball.svg/500px-Volleyball.svg.png",
    popularity: 38000,
    status: "active",
    category: "object"
  },
  {
    id: 100,
    name: "Ballpoint Pen",
    description: "Handheld writing instrument that dispenses liquid or gel ink over a rolling ball",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Ballpoint-pen-parts.jpg/500px-Ballpoint-pen-parts.jpg",
    popularity: 48000,
    status: "active",
    category: "object"
  },
  {
    id: 101,
    name: "Apple",
    description: "Sweet, crunchy round edible fruit with red or green skin grown on fruit trees",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/500px-Red_Apple.jpg",
    popularity: 49000,
    status: "active",
    category: "object"
  },
  {
    id: 102,
    name: "Tomato",
    description: "Juicy red edible fruit commonly used in savory cooking, salads, and pasta sauces",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/500px-Tomato_je.jpg",
    popularity: 47000,
    status: "active",
    category: "object"
  },
  {
    id: 103,
    name: "Computer Mouse",
    description: "Handheld pointing device with buttons and scroll wheel used to control a computer cursor",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/3-Button-Mouse.jpg/500px-3-Button-Mouse.jpg",
    popularity: 46000,
    status: "active",
    category: "object"
  }
];

const NEW_QUESTIONS: QuestionDef[] = [
  {
    id: 171,
    text: "Does it write or mark using liquid or gel ink?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 172,
    text: "Can its markings be easily erased using a standard rubber eraser?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 173,
    text: "Is it covered in fuzzy felt or cloth-like material?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 174,
    text: "Is it hit over a high net using bare hands or arms?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 175,
    text: "Is it commonly used to make ketchup, pizza sauce, or pasta sauce?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 176,
    text: "Is it a sweet, crunchy fruit that typically grows on a fruit tree?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 177,
    text: "Is it used to control a cursor or click on a computer screen?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 178,
    text: "Is it an orange inflatable ball with black ribs thrown through a hoop?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 179,
    text: "Is it traditionally patterned with black and white pentagonal panels?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  },
  {
    id: 180,
    text: "Is it scored by shooting or throwing through an elevated circular hoop?",
    source: "user",
    category: "object",
    qualityScore: 1.0,
    timesAsked: 0,
    isActive: true
  }
];

export { NEW_ENTITIES, NEW_QUESTIONS };
