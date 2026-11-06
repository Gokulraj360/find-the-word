import * as fs from "fs";
import {
  SEED_ENTITIES,
  SEED_QUESTIONS,
  SEED_GROUND_TRUTH
} from "./data/seed_small_data.js";

// 1. Map of updated questions
const QUESTION_UPDATES: Record<number, string> = {
  106: "Is it a handheld computer input device used to move a cursor and click on a screen?",
  108: "Is it an input device with many labeled keys used primarily for typing text into a computer?",
  109: "Is it a computer monitor or external display screen used to view desktop visuals?",
  113: "Is it a flat touchscreen tablet device larger than a phone but smaller than a laptop?",
  114: "Is it a small thumb-sized portable memory stick plugged into a USB port to transfer files?",
  115: "Is it a handheld wireless remote control with buttons used to operate a TV from a distance?",
  116: "Is it a handheld video game controller or gamepad with joysticks and buttons?",
  118: "Is it an in-ear audio listening device (earbuds or AirPods) placed inside your ear canals?",
  119: "Is it a computerized digital watch worn around the wrist that tracks fitness or notifications?",
  120: "Is it a piece of furniture with a mattress that you sleep on under blankets at night?",
  121: "Is it an upholstered sofa or couch designed for two or more people to sit together?",
  123: "Is it a large electrical household appliance used specifically to wash laundry and clothes?",
  124: "Is it an appliance with spinning blades that blows air to cool down a room?",
  125: "Is it a wall-mounted or window electrical system that chills and conditions indoor air?",
  126: "Is it an electric countertop kettle used specifically to boil water rapidly?",
  127: "Is it an electrical countertop machine used to brew hot coffee or espresso?",
  128: "Is it a pocket-sized foldable leather or fabric wallet used to carry paper cash and credit cards?",
  129: "Is it dark-tinted eyewear worn outdoors to protect your eyes from the sun?",
  130: "Is it a paste or gel squeezed from a tube onto a brush to clean teeth?",
  131: "Is it an eating utensil with sharp prongs or tines used to spear and lift solid food?",
  133: "Is it an eating utensil with a small shallow oval bowl used for soup, cereal, or stirring?",
  134: "Is it a flat or shallow circular dish used to serve and hold food during a meal?"
};

// 2. New Entities
const NEW_ENTITIES = [
  {
    id: 96,
    name: "Computer Mouse",
    description: "Handheld pointing device that detects motion relative to a surface to control a GUI cursor",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300",
    popularity: 49000,
    category: "object",
    status: "active"
  },
  {
    id: 97,
    name: "Computer Keyboard",
    description: "Typewriter-style input device with keys used to type text and commands into computers",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300",
    popularity: 48000,
    category: "object",
    status: "active"
  },
  {
    id: 98,
    name: "Computer Monitor",
    description: "Electronic visual display screen for desktop computers and workstations",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300",
    popularity: 45000,
    category: "object",
    status: "active"
  },
  {
    id: 99,
    name: "Tablet Computer (iPad)",
    description: "Portable touchscreen computing device larger than a smartphone but smaller than a notebook",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300",
    popularity: 47000,
    category: "object",
    status: "active"
  },
  {
    id: 100,
    name: "USB Flash Drive",
    description: "Thumb-sized portable data storage stick with integrated USB plug",
    imageUrl: "https://images.unsplash.com/photo-1624823183493-2782163b45e2?w=300",
    popularity: 43000,
    category: "object",
    status: "active"
  },
  {
    id: 101,
    name: "Television Remote Control",
    description: "Handheld electronic device with buttons used to operate a television from a distance",
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=300",
    popularity: 44000,
    category: "object",
    status: "active"
  },
  {
    id: 102,
    name: "Video Game Controller",
    description: "Handheld gaming gamepad with analog sticks and buttons for consoles and PCs",
    imageUrl: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=300",
    popularity: 46000,
    category: "object",
    status: "active"
  },
  {
    id: 103,
    name: "In-Ear Earbuds (AirPods)",
    description: "Small portable wireless audio listening earphones worn directly inside the ear canals",
    imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300",
    popularity: 48000,
    category: "object",
    status: "active"
  },
  {
    id: 104,
    name: "Smartwatch",
    description: "Wearable touchscreen computer worn around the wrist that tracks activity and alerts",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
    popularity: 47000,
    category: "object",
    status: "active"
  },
  {
    id: 105,
    name: "Electric Fan",
    description: "Appliance with rotating blades that circulates cooling air in a room",
    imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300",
    popularity: 41000,
    category: "object",
    status: "active"
  },
  {
    id: 106,
    name: "Air Conditioner",
    description: "Appliance system that cools, dehumidifies, and circulates indoor room air",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300",
    popularity: 43000,
    category: "object",
    status: "active"
  },
  {
    id: 107,
    name: "Washing Machine",
    description: "Large electrical household appliance used to clean and spin laundry and clothes",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
    popularity: 44000,
    category: "object",
    status: "active"
  },
  {
    id: 108,
    name: "Electric Kettle",
    description: "Countertop electrical jug appliance used to boil water rapidly for tea and coffee",
    imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300",
    popularity: 40000,
    category: "object",
    status: "active"
  },
  {
    id: 109,
    name: "Coffee Maker",
    description: "Countertop brewing appliance designed to automatically brew fresh coffee",
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300",
    popularity: 42000,
    category: "object",
    status: "active"
  },
  {
    id: 110,
    name: "Dining Table",
    description: "Flat horizontal surface elevated on legs where food is served and eaten",
    imageUrl: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=300",
    popularity: 43000,
    category: "object",
    status: "active"
  },
  {
    id: 111,
    name: "Bed / Mattress",
    description: "Piece of furniture with a mattress manufactured for sleeping under blankets",
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300",
    popularity: 46000,
    category: "object",
    status: "active"
  },
  {
    id: 112,
    name: "Sofa / Couch",
    description: "Long upholstered living room seating furniture for two or more people",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300",
    popularity: 45000,
    category: "object",
    status: "active"
  },
  {
    id: 113,
    name: "Ballpoint Pen",
    description: "Everyday handheld writing instrument that dispenses ink over a metal sphere",
    imageUrl: "https://images.unsplash.com/photo-1585336261026-c24151a66ff5?w=300",
    popularity: 47000,
    category: "object",
    status: "active"
  },
  {
    id: 114,
    name: "Wallet",
    description: "Small pocket-sized folding pouch used to carry paper cash, credit cards, and IDs",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300",
    popularity: 46000,
    category: "object",
    status: "active"
  },
  {
    id: 115,
    name: "Sunglasses",
    description: "Dark-tinted protective eyewear designed to block ultraviolet rays and glare",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300",
    popularity: 45000,
    category: "object",
    status: "active"
  },
  {
    id: 116,
    name: "Toothpaste",
    description: "Gel or paste substance squeezed onto a toothbrush to clean teeth and freshen breath",
    imageUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300",
    popularity: 44000,
    category: "object",
    status: "active"
  },
  {
    id: 117,
    name: "Hairbrush",
    description: "Handle brush with rigid or flexible bristles used for detangling and styling hair",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300",
    popularity: 39000,
    category: "object",
    status: "active"
  },
  {
    id: 118,
    name: "Kitchen Fork",
    description: "Table utensil with two or more sharp prongs used to spear and lift solid food",
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300",
    popularity: 42000,
    category: "object",
    status: "active"
  },
  {
    id: 119,
    name: "Kitchen Spoon",
    description: "Table utensil with a small shallow oval bowl used for soups, cereals, and liquids",
    imageUrl: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=300",
    popularity: 42000,
    category: "object",
    status: "active"
  },
  {
    id: 120,
    name: "Dinner Plate",
    description: "Broad, flat vessel from which food is served and eaten during a meal",
    imageUrl: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=300",
    popularity: 43000,
    category: "object",
    status: "active"
  },
  {
    id: 121,
    name: "House Mouse",
    description: "Small furry rodent mammal with a pointed snout, large ears, and long tail",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/House_mouse.jpg/220px-House_mouse.jpg",
    popularity: 44000,
    category: "character",
    status: "active"
  },
  {
    id: 122,
    name: "Domestic Dog",
    description: "Loyal domesticated canine mammal commonly kept as a family pet or working animal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Huskiesatrest.jpg/220px-Huskiesatrest.jpg",
    popularity: 50000,
    category: "character",
    status: "active"
  },
  {
    id: 123,
    name: "Domestic Cat",
    description: "Small carnivorous domesticated feline mammal with soft fur, whiskers, and a purr",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/220px-Cat03.jpg",
    popularity: 50000,
    category: "character",
    status: "active"
  }
];

console.log(`Defined ${NEW_ENTITIES.length} new entities.`);
