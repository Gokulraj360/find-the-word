export interface SeedEntity {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  popularity: number;
  category: "character" | "object";
  status: "active";
}

export interface SeedQuestion {
  id: number;
  text: string;
  source: "wikidata";
  category: "character" | "object" | "common";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  // -------------------------------------------------------------
  // CHARACTER QUESTIONS (1 - 40)
  // -------------------------------------------------------------
  { id: 1, text: "Is your character fictional?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 2, text: "Is your character male?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 3, text: "Is your character currently alive?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 4, text: "Is your character known for science, technology, or mathematics?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 5, text: "Is your character a professional athlete or sports figure?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 6, text: "Is your character a singer or musician?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 7, text: "Is your character an actor or film personality?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 8, text: "Is your character a politician or world leader?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 9, text: "Is your character an artist, painter, or sculptor?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 10, text: "Is your character an author or writer?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 11, text: "Is your character from or primarily associated with North America (USA/Canada)?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 12, text: "Is your character from Europe or the United Kingdom?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 13, text: "Is your character from Asia?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 14, didLiveBefore20th: true, text: "Did your character live before the 20th century (before 1900)?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true } as any,
  { id: 15, text: "Has your character won a Nobel Prize?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 16, text: "Is your character a billionaire or major tech entrepreneur?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 17, text: "Does your character have supernatural powers or magic?", source: "wikidata", category: "character", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 18, text: "Is your character a superhero or comic book protagonist?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 19, text: "Is your character a villain, criminal, or antagonist?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 20, text: "Is your character from a video game franchise?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 21, text: "Is your character an animated, cartoon, or anime character?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 22, text: "Is your character non-human (animal, alien, creature, or robot)?", source: "wikidata", category: "character", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 23, text: "Is your character from the Star Wars universe?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 24, text: "Is your character from the Harry Potter universe?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 25, text: "Is your character from Marvel or DC Comics universes?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 26, text: "Is your character a detective, spy, or investigator?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 27, text: "Is your character known for football / soccer?", source: "wikidata", category: "character", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 28, text: "Is your character a monarch, king, queen, or emperor?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 29, text: "Has your character traveled to outer space or was born off Earth?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 30, text: "Is your character famous for a yellow or golden color appearance?", source: "wikidata", category: "character", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 31, text: "Does your character wear a mask or helmet covering their face?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 32, text: "Is your character known for martial arts or sword/lightsaber combat?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 33, text: "Is your character associated with computers, smartphones, or software?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 34, text: "Is your character a chef, restaurant owner, or known for food/cooking?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 35, text: "Is your character known for classical music composition?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 36, text: "Is your character a ninja or from Japanese anime/manga?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 37, text: "Is your character a green ogre who lives in a swamp?", source: "wikidata", category: "character", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 38, text: "Does your character have ice or snow powers?", source: "wikidata", category: "character", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 39, text: "Is your character a wizard or witch with a wand?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 40, text: "Is your character known for extreme wealth or a high-tech armored suit?", source: "wikidata", category: "character", qualityScore: 0.85, timesAsked: 0, isActive: true },

  // -------------------------------------------------------------
  // OBJECT QUESTIONS (41 - 70)
  // -------------------------------------------------------------
  { id: 41, text: "Is it powered by electricity or batteries?", source: "wikidata", category: "object", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 42, text: "Can it easily fit inside a standard backpack or handbag?", source: "wikidata", category: "object", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 43, text: "Is it commonly found or used in the kitchen?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 44, text: "Is it made primarily of metal?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 45, text: "Is it worn or carried directly on the human body?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 46, text: "Does it produce sound, music, or audio?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 47, text: "Is it a vehicle or used for passenger transportation?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 48, text: "Does it have an electronic screen or visual display?", source: "wikidata", category: "object", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 49, text: "Is it used for cutting, slicing, or piercing?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 50, text: "Is it found in the bathroom for hygiene, grooming, or bathing?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 51, text: "Is it made primarily of paper, wood, or fabric?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 52, text: "Is it a musical instrument?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 53, text: "Is it used for sports, physical games, or outdoor exercise?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 54, text: "Does it emit light, flame, or heat?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 55, text: "Is it designed to hold or store liquids?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 56, text: "Is it a piece of furniture for sitting or sleeping?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 57, text: "Is it typically smaller than a credit card?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 58, text: "Does it have wheels or rotate on gears?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 59, text: "Is it used for writing, drawing, or reading?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 60, text: "Does it protect you from rain or cold weather?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 61, text: "Can it connect to the internet, Wi-Fi, or cellular network?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 62, text: "Is it generally expensive (typically costs over $100 USD)?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 63, text: "Is it made primarily of glass or ceramic?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 64, text: "Does it have physical buttons, dials, or a keyboard?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 65, text: "Is it used to tell or measure time?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 66, text: "Does it require a charger, wall plug, or power cord?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 67, text: "Is it made of soft, pliable, or plush material?", source: "wikidata", category: "object", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 68, text: "Is it used to lock, unlock, or secure doors or valuables?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 69, text: "Is it used for cleaning, washing, or vacuuming?", source: "wikidata", category: "object", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 70, text: "Is it an official identification or monetary payment card?", source: "wikidata", category: "object", qualityScore: 0.95, timesAsked: 0, isActive: true }
];

export const SEED_ENTITIES: SeedEntity[] = [
  // -------------------------------------------------------------
  // CHARACTERS & LIVING BEINGS (1 - 50)
  // -------------------------------------------------------------
  { id: 1, name: "Albert Einstein", description: "Theoretical physicist who developed the theory of relativity", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/220px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg", popularity: 45000, category: "character", status: "active" },
  { id: 2, name: "Leonardo da Vinci", description: "Italian polymath of the Renaissance, painter of Mona Lisa", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self.jpg/220px-Leonardo_self.jpg", popularity: 38000, category: "character", status: "active" },
  { id: 3, name: "Cristiano Ronaldo", description: "Portuguese professional footballer, all-time leading international goalscorer", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/220px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg", popularity: 50000, category: "character", status: "active" },
  { id: 4, name: "Lionel Messi", description: "Argentine football legend, 8-time Ballon d'Or winner and World Cup champion", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg", popularity: 49000, category: "character", status: "active" },
  { id: 5, name: "Taylor Swift", description: "Global pop and country music icon, multi-Grammy Album of the Year winner", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png/220px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png", popularity: 48000, category: "character", status: "active" },
  { id: 6, name: "Elon Musk", description: "CEO of Tesla, SpaceX founder, and tech billionaire", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg", popularity: 47000, category: "character", status: "active" },
  { id: 7, name: "William Shakespeare", description: "English playwright and poet, author of Hamlet and Romeo & Juliet", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/220px-Shakespeare.jpg", popularity: 35000, category: "character", status: "active" },
  { id: 8, name: "Mahatma Gandhi", description: "Leader of Indian independence movement through non-violent resistance", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/220px-Mahatma-Gandhi%2C_studio%2C_1931.jpg", popularity: 40000, category: "character", status: "active" },
  { id: 9, name: "Barack Obama", description: "44th President of the United States and Nobel Peace Prize laureate", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/220px-President_Barack_Obama.jpg", popularity: 42000, category: "character", status: "active" },
  { id: 10, name: "Michael Jackson", description: "King of Pop, legendary singer, dancer, and entertainer", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Michael_Jackson_in_1988.jpg/220px-Michael_Jackson_in_1988.jpg", popularity: 46000, category: "character", status: "active" },
  { id: 11, name: "Marie Curie", description: "Pioneering physicist and chemist, first person to win two Nobel Prizes", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/220px-Marie_Curie_c._1920s.jpg", popularity: 32000, category: "character", status: "active" },
  { id: 12, name: "Steve Jobs", description: "Co-founder of Apple Inc., visionary behind iPhone, Mac, and Pixar", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/220px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg", popularity: 39000, category: "character", status: "active" },
  { id: 13, name: "Queen Elizabeth II", description: "Longest-reigning British monarch in history (1952–2022)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Queen_Elizabeth_II_March_2015.jpg/220px-Queen_Elizabeth_II_March_2015.jpg", popularity: 43000, category: "character", status: "active" },
  { id: 14, name: "Ludwig van Beethoven", description: "German composer and pianist, renowned for 9 symphonies and Moonlight Sonata", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/220px-Beethoven.jpg", popularity: 31000, category: "character", status: "active" },
  { id: 15, name: "Marilyn Monroe", description: "Iconic American actress, model, and 1950s Hollywood star", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Marilyn_Monroe_photo_pose_sitting_cropped.jpg/220px-Marilyn_Monroe_photo_pose_sitting_cropped.jpg", popularity: 34000, category: "character", status: "active" },
  { id: 16, name: "Vincent van Gogh", description: "Dutch Post-Impressionist painter of The Starry Night and Sunflowers", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%284bzkMmKAAWeTrg%29.jpg/220px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%284bzkMmKAAWeTrg%29.jpg", popularity: 36000, category: "character", status: "active" },
  { id: 17, name: "Stephen Hawking", description: "Theoretical physicist and cosmologist, author of A Brief History of Time", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Stephen_Hawking.StarChild.jpg/220px-Stephen_Hawking.StarChild.jpg", popularity: 33000, category: "character", status: "active" },
  { id: 18, name: "Serena Williams", description: "American tennis legend, winner of 23 Grand Slam singles titles", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Serena_Williams_at_2013_US_Open.jpg/220px-Serena_Williams_at_2013_US_Open.jpg", popularity: 29000, category: "character", status: "active" },
  { id: 19, name: "Keanu Reeves", description: "Beloved Canadian-American actor, star of The Matrix and John Wick", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Spike_TV%27s_Guys_Choice_Awards_-_Keanu_Reeves_%28cropped%29.jpg/220px-Spike_TV%27s_Guys_Choice_Awards_-_Keanu_Reeves_%28cropped%29.jpg", popularity: 37000, category: "character", status: "active" },
  { id: 20, name: "Gordon Ramsay", description: "World-renowned British celebrity chef and television host", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Gordon_Ramsay_cropped.jpg/220px-Gordon_Ramsay_cropped.jpg", popularity: 30000, category: "character", status: "active" },
  { id: 21, name: "Neil Armstrong", description: "American astronaut and aeronautical engineer, first person on the Moon", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Neil_Armstrong_pose.jpg/220px-Neil_Armstrong_pose.jpg", popularity: 28000, category: "character", status: "active" },
  { id: 22, name: "Walt Disney", description: "American animator, film producer, and creator of Mickey Mouse & Disneyland", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Walt_Disney_1946.JPG/220px-Walt_Disney_1946.JPG", popularity: 33000, category: "character", status: "active" },
  { id: 23, name: "J.K. Rowling", description: "British author and creator of the Harry Potter fantasy series", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/220px-J._K._Rowling_2010.jpg", popularity: 31000, category: "character", status: "active" },
  { id: 24, name: "Bill Gates", description: "Co-founder of Microsoft, computer pioneer, and philanthropist", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/220px-Bill_Gates_2018.jpg", popularity: 41000, category: "character", status: "active" },
  { id: 25, name: "Freddie Mercury", description: "British musician and flamboyant lead vocalist of the rock band Queen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Freddie_Mercury_performing_in_New_Haven%2C_CT%2C_November_1977.jpg/220px-Freddie_Mercury_performing_in_New_Haven%2C_CT%2C_November_1977.jpg", popularity: 36000, category: "character", status: "active" },
  { id: 26, name: "Harry Potter", description: "The Boy Who Lived, wizard student at Hogwarts School of Witchcraft and Wizardry", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d7/Harry_Potter_character_poster.jpg", popularity: 48000, category: "character", status: "active" },
  { id: 27, name: "Sherlock Holmes", description: "Consulting detective residing at 221B Baker Street, created by Arthur Conan Doyle", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Sherlock_Holmes_Portrait_Paget.jpg/220px-Sherlock_Holmes_Portrait_Paget.jpg", popularity: 44000, category: "character", status: "active" },
  { id: 28, name: "Batman (Bruce Wayne)", description: "The Dark Knight, billionaire vigilante protector of Gotham City", imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c7/Batman_Infobox.jpg", popularity: 47000, category: "character", status: "active" },
  { id: 29, name: "Superman (Clark Kent)", description: "The Man of Steel, superhero from the planet Krypton defending Metropolis", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/35/Supermanflying.png", popularity: 46000, category: "character", status: "active" },
  { id: 30, name: "Spider-Man (Peter Parker)", description: "Friendly neighborhood superhero bitten by a radioactive spider", imageUrl: "https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png", popularity: 49000, category: "character", status: "active" },
  { id: 31, name: "Darth Vader", description: "Sith Lord, formerly Jedi Knight Anakin Skywalker, commander in the Galactic Empire", imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/76/Darth_Vader.jpg", popularity: 47000, category: "character", status: "active" },
  { id: 32, name: "Luke Skywalker", description: "Jedi Master from Tatooine who redeemed his father and restored freedom to the Galaxy", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png", popularity: 41000, category: "character", status: "active" },
  { id: 33, name: "Mario", description: "Italian plumber and iconic Nintendo hero of the Mushroom Kingdom", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png", popularity: 48000, category: "character", status: "active" },
  { id: 34, name: "Pikachu", description: "Electric-type mouse Pokémon, mascot of the Pokémon franchise", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png", popularity: 49000, category: "character", status: "active" },
  { id: 35, name: "Sonic the Hedgehog", description: "The Blue Blur, supersonic hedgehog and mascot of Sega", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/45/Sonic_the_Hedgehog_2019.png", popularity: 42000, category: "character", status: "active" },
  { id: 36, name: "Mickey Mouse", description: "Cheerful cartoon mouse created by Walt Disney, global corporate mascot", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Mickey_Mouse.png", popularity: 45000, category: "character", status: "active" },
  { id: 37, name: "Iron Man (Tony Stark)", description: "Genius, billionaire, playboy, philanthropist in high-tech powered armor", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/47/Iron_Man_%28circa_2018%29.png", popularity: 46000, category: "character", status: "active" },
  { id: 38, name: "Gandalf", description: "Wise wizard and member of the Fellowship of the Ring in Middle-earth", imageUrl: "https://upload.wikimedia.org/wikipedia/en/e/e9/Gandalf600ppx.jpg", popularity: 39000, category: "character", status: "active" },
  { id: 39, name: "Frodo Baggins", description: "Hobbit of the Shire who carried the One Ring to Mount Doom", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4e/Elijah_Wood_as_Frodo_Baggins.png", popularity: 36000, category: "character", status: "active" },
  { id: 40, name: "James Bond (007)", description: "Legendary British Secret Service MI6 secret agent with a license to kill", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/30/James_Bond_007_logo.svg", popularity: 43000, category: "character", status: "active" },
  { id: 41, name: "The Joker", description: "Criminal mastermind and psychopathic archenemy of Batman in Gotham City", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/98/Joker_%28DC_Comics_character%29.jpg", popularity: 45000, category: "character", status: "active" },
  { id: 42, name: "Hermione Granger", description: "Brilliant Muggle-born witch and best friend of Harry Potter", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d3/Hermione_Granger_poster.jpg", popularity: 40000, category: "character", status: "active" },
  { id: 43, name: "Yoda", description: "Legendary diminutive 900-year-old Jedi Grand Master in Star Wars", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Yoda_Empire_Strikes_Back.png", popularity: 43000, category: "character", status: "active" },
  { id: 44, name: "SpongeBob SquarePants", description: "Optimistic sea sponge who lives in a pineapple under the sea", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/3b/SpongeBob_SquarePants_character.png", popularity: 44000, category: "character", status: "active" },
  { id: 45, name: "Goku (Son Goku)", description: "Saiyan warrior raised on Earth, martial artist and hero of Dragon Ball", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/af/Son_Goku_Young_Adult.png", popularity: 46000, category: "character", status: "active" },
  { id: 46, name: "Naruto Uzumaki", description: "Spirited ninja of the Hidden Leaf Village who became the Seventh Hokage", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9a/Naruto_Uzumaki.png", popularity: 43000, category: "character", status: "active" },
  { id: 47, name: "Shrek", description: "Loveable green ogre who loves his swamp and marries Princess Fiona", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png", popularity: 41000, category: "character", status: "active" },
  { id: 48, name: "Elsa", description: "Queen of Arendelle gifted with magical cryokinetic ice powers in Frozen", imageUrl: "https://upload.wikimedia.org/wikipedia/en/5/5e/Elsa_from_Disney%27s_Frozen.png", popularity: 42000, category: "character", status: "active" },
  { id: 49, name: "Dr. John Watson", description: "Loyal friend, biographer, and partner in deduction of Sherlock Holmes", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/John_Watson_by_Sidney_Paget.jpg/220px-John_Watson_by_Sidney_Paget.jpg", popularity: 29000, category: "character", status: "active" },
  { id: 50, name: "Lord Voldemort", description: "The Dark Lord, He-Who-Must-Not-Be-Named, darkest wizard in Harry Potter", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a3/Lordvoldemort.jpg", popularity: 41000, category: "character", status: "active" },

  // -------------------------------------------------------------
  // OBJECTS & EVERYDAY ITEMS (51 - 95)
  // -------------------------------------------------------------
  { id: 51, name: "Smartphone", description: "Pocket-sized cellular telephone with touchscreen, internet, and camera", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300", popularity: 50000, category: "object", status: "active" },
  { id: 52, name: "Laptop Computer", description: "Portable personal computer with integrated display, keyboard, and battery", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300", popularity: 49000, category: "object", status: "active" },
  { id: 53, name: "Bicycle", description: "Two-wheeled pedal-driven passenger transportation vehicle", imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300", popularity: 46000, category: "object", status: "active" },
  { id: 54, name: "Automobile (Car)", description: "Four-wheeled motor vehicle used for passenger transport on roadways", imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300", popularity: 48000, category: "object", status: "active" },
  { id: 55, name: "Coffee Mug", description: "Ceramic cup with a handle used for drinking hot coffee or tea", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300", popularity: 42000, category: "object", status: "active" },
  { id: 56, name: "Toothbrush", description: "Handheld hygiene tool with bristles used to clean teeth and gums", imageUrl: "https://images.unsplash.com/photo-1559591937-e1058a9e4073?w=300", popularity: 43000, category: "object", status: "active" },
  { id: 57, name: "Acoustic Guitar", description: "Six-stringed wooden musical instrument played by plucking or strumming", imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300", popularity: 45000, category: "object", status: "active" },
  { id: 58, name: "Microwave Oven", description: "Kitchen appliance that heats and cooks food using electromagnetic radiation", imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300", popularity: 41000, category: "object", status: "active" },
  { id: 59, name: "Wristwatch", description: "Small timepiece worn strapped around the wrist", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300", popularity: 44000, category: "object", status: "active" },
  { id: 60, name: "Umbrella", description: "Folding canopy supported by metal ribs designed to protect against rain", imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=300", popularity: 40000, category: "object", status: "active" },
  { id: 61, name: "Backpack", description: "Fabric bag secured over the shoulders to carry gear and books", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300", popularity: 42000, category: "object", status: "active" },
  { id: 62, name: "House Key", description: "Small metal instrument used to operate a cylinder lock and secure a door", imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 63, name: "Kitchen Knife", description: "Sharp-edged cutting blade used for food preparation and culinary slicing", imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=300", popularity: 40000, category: "object", status: "active" },
  { id: 64, name: "Digital Camera", description: "Optical instrument used to capture still photographs and videos", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300", popularity: 43000, category: "object", status: "active" },
  { id: 65, name: "Printed Book", description: "Bound publication consisting of printed sheets of paper inside covers", imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300", popularity: 45000, category: "object", status: "active" },
  { id: 66, name: "Eyeglasses", description: "Frames bearing lenses worn in front of the eyes to correct vision", imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300", popularity: 42000, category: "object", status: "active" },
  { id: 67, name: "Claw Hammer", description: "Hand tool with a heavy metal head for driving nails and pulling them out", imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300", popularity: 38000, category: "object", status: "active" },
  { id: 68, name: "Bed Pillow", description: "Soft fabric cushion filled with down or foam used to support the head while sleeping", imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 69, name: "Refrigerator", description: "Large cooling appliance used to preserve food and beverages at low temperatures", imageUrl: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=300", popularity: 44000, category: "object", status: "active" },
  { id: 70, name: "Television", description: "Electronic display receiver used for broadcasting visual entertainment and news", imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300", popularity: 47000, category: "object", status: "active" },
  { id: 71, name: "Over-Ear Headphones", description: "Pair of padded audio speakers worn over the ears for listening to sound", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300", popularity: 46000, category: "object", status: "active" },
  { id: 72, name: "Desk Lamp", description: "Adjustable table luminaire providing focused task lighting for reading or work", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300", popularity: 37000, category: "object", status: "active" },
  { id: 73, name: "Office Chair", description: "Ergonomic wheeled swivel chair designed for sitting at a desk", imageUrl: "https://images.unsplash.com/photo-1580481077195-c22ae2b33924?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 74, name: "Wooden Pencil", description: "Slender wooden rod containing a core of graphite lead used for writing", imageUrl: "https://images.unsplash.com/photo-1585336261026-410a56828551?w=300", popularity: 38000, category: "object", status: "active" },
  { id: 75, name: "Running Shoes", description: "Footwear with cushioned rubber soles specifically designed for athletic running", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300", popularity: 45000, category: "object", status: "active" },
  { id: 76, name: "Wall Clock", description: "Timekeeping device mounted onto a wall displaying hours and minutes", imageUrl: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 77, name: "Pocket Flashlight", description: "Handheld portable electric light powered by battery cells", imageUrl: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=300", popularity: 36000, category: "object", status: "active" },
  { id: 78, name: "Pair of Scissors", description: "Hand-operated cutting instrument with two pivoted crossing metal blades", imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94801759?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 79, name: "Bathroom Mirror", description: "Reflective silvered glass surface mounted above a washbasin to view one's reflection", imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=300", popularity: 38000, category: "object", status: "active" },
  { id: 80, name: "Reusable Water Bottle", description: "Durable metal or plastic flask designed to carry drinking hydration on the go", imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300", popularity: 43000, category: "object", status: "active" },
  { id: 81, name: "Electric Guitar", description: "Solid-body guitar that uses electromagnetic pickups to convert string vibration to audio", imageUrl: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=300", popularity: 44000, category: "object", status: "active" },
  { id: 82, name: "Bread Toaster", description: "Electric tabletop kitchen appliance that browns sliced bread via radiant heat", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300", popularity: 38000, category: "object", status: "active" },
  { id: 83, name: "Vacuum Cleaner", description: "Household machine that creates suction to remove dirt and dust from floors", imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300", popularity: 41000, category: "object", status: "active" },
  { id: 84, name: "Passport", description: "Government-issued travel identity booklet permitting international border crossings", imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=300", popularity: 42000, category: "object", status: "active" },
  { id: 85, name: "Credit Card", description: "Plastic payment card issued by financial institutions allowing cardholders to borrow funds", imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=300", popularity: 45000, category: "object", status: "active" },
  { id: 86, name: "Sewing Needle", description: "Slender metal rod with an eye at one end and a sharp point for stitching fabric", imageUrl: "https://images.unsplash.com/photo-1597843786411-a7fa8ad44a95?w=300", popularity: 34000, category: "object", status: "active" },
  { id: 87, name: "Baby Stroller", description: "Wheeled carriage in which a baby or toddler is pushed along", imageUrl: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=300", popularity: 36000, category: "object", status: "active" },
  { id: 88, name: "Camera Drone", description: "Remote-controlled multirotor unmanned aerial vehicle fitted with an HD camera", imageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=300", popularity: 44000, category: "object", status: "active" },
  { id: 89, name: "Skateboard", description: "Narrow wooden board with four polyurethane wheels ridden by standing and gliding", imageUrl: "https://images.unsplash.com/photo-1520045892732-304bc3ac15a1?w=300", popularity: 42000, category: "object", status: "active" },
  { id: 90, name: "Basketball", description: "Spherical orange inflatable ball used in basketball matches and shooting hoops", imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300", popularity: 43000, category: "object", status: "active" },
  { id: 91, name: "Wax Candle", description: "Block of solid wax with an embedded wick that provides flame, illumination, and scent", imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300", popularity: 38000, category: "object", status: "active" },
  { id: 92, name: "Hair Dryer", description: "Electromechanical handheld bathroom tool that blows hot air to accelerate hair drying", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300", popularity: 39000, category: "object", status: "active" },
  { id: 93, name: "Kitchen Blender", description: "Electric appliance with rotating stainless blades used to puree and mix smoothies", imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300", popularity: 40000, category: "object", status: "active" },
  { id: 94, name: "Umbrella Hat", description: "Novelty headgear consisting of an umbrella canopy strapped to a headband", imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=300", popularity: 28000, category: "object", status: "active" },
  { id: 95, name: "Digital Thermometer", description: "Handheld instrument with digital readout used for measuring body temperature", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300", popularity: 37000, category: "object", status: "active" }
];

// Ground truth answers for (entityId, questionId)
// 1 = Yes, 0 = No, 0.75 = Probably, 0.25 = Probably not, 0.5 = Unknown
export const SEED_GROUND_TRUTH: Record<number, Record<number, number>> = {
  // Characters 1-50 vs Questions 1-40
  1: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0.25, 7: 0, 8: 0, 9: 0, 10: 0.25, 11: 0.75, 12: 1, 13: 0, 14: 1, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  2: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0.25, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  3: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0.75, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 1, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  4: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0.75, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 1, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  5: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 1, 7: 0.25, 8: 0, 9: 0, 10: 0.75, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  6: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0.25, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.75 },
  7: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.75, 8: 0, 9: 0, 10: 1, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  8: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0.25, 11: 0, 12: 0, 13: 1, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  9: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0.75, 11: 1, 12: 0, 13: 0, 14: 0, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  10: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0.25, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  11: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  12: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  13: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 1, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  14: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 1, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  15: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0.75, 7: 1, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  16: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  17: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0.75, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  18: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  19: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0.25, 7: 1, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.75, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  20: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0.75, 8: 0, 9: 0, 10: 0.25, 11: 0.25, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.25, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 1, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  21: { 1: 0, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0.75, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  22: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.25, 8: 0, 9: 0.75, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  23: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 1, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  24: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  25: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0.25, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0.25, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  26: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 1, 40: 0 },
  27: { 1: 1, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  28: { 1: 1, 2: 1, 3: 1, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 1, 19: 0, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 1, 32: 1, 33: 0.75, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.75 },
  29: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 1, 19: 0, 20: 0, 21: 0.75, 22: 1, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  30: { 1: 1, 2: 1, 3: 1, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 1, 19: 0, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 1, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 0, 40: 0 },
  31: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0.25, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 1, 20: 0.25, 21: 0, 22: 0.75, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 1, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.25 },
  32: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  33: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0.25, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0.75, 14: 0, 15: 0, 16: 0, 17: 0.75, 18: 0, 19: 0, 20: 1, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  34: { 1: 1, 2: 0.5, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 1, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 1, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0.75, 37: 0, 38: 0, 39: 0, 40: 0 },
  35: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 1, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0.75, 37: 0, 38: 0, 39: 0, 40: 0 },
  36: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0.25, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0.25, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  37: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 1, 19: 0, 20: 0, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0.25, 31: 1, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 1 },
  38: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0, 14: 1, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 0, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 1, 40: 0 },
  39: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0.25, 18: 0, 19: 0, 20: 0, 21: 0, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.25, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  40: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.25, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  41: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 1, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0.25, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  42: { 1: 1, 2: 0, 3: 1, 4: 0.25, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 1, 40: 0 },
  43: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0.75, 22: 1, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  44: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 1, 31: 0, 32: 0, 33: 0, 34: 1, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  45: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0.25, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0.75, 19: 0, 20: 0.75, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0.25, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 1, 37: 0, 38: 0, 39: 0, 40: 0 },
  46: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0.75, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0.75, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 1, 37: 0, 38: 0.75, 39: 0, 40: 0 },
  47: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0.25, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 1, 38: 0, 39: 0, 40: 0 },
  48: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0.75, 7: 0, 8: 1, 9: 0, 10: 0, 11: 1, 12: 0.75, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 1, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 1, 39: 0, 40: 0 },
  49: { 1: 1, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0.75, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0.75, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  50: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 1, 20: 0, 21: 0, 22: 0.25, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 1, 40: 0 },

  // Objects 51-95 vs Questions 41-70
  // 51: Smartphone
  51: { 41: 1, 42: 1, 43: 0, 44: 0.75, 45: 0.75, 46: 1, 47: 0, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0.75, 60: 0, 61: 1, 62: 1, 63: 0.75, 64: 0.25, 65: 1, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 52: Laptop
  52: { 41: 1, 42: 1, 43: 0, 44: 0.75, 45: 0, 46: 1, 47: 0, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 1, 60: 0, 61: 1, 62: 1, 63: 0.25, 64: 1, 65: 1, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 53: Bicycle
  53: { 41: 0, 42: 0, 43: 0, 44: 1, 45: 0, 46: 0, 47: 1, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 1, 59: 0, 60: 0, 61: 0, 62: 1, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 54: Car
  54: { 41: 0.75, 42: 0, 43: 0, 44: 1, 45: 0, 46: 1, 47: 1, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0.25, 57: 0, 58: 1, 59: 0, 60: 0.75, 61: 0.75, 62: 1, 63: 0.75, 64: 1, 65: 1, 66: 0.25, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 55: Coffee Mug
  55: { 41: 0, 42: 1, 43: 1, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 1, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 1, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 56: Toothbrush
  56: { 41: 0.25, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 1, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0.25, 65: 0, 66: 0.25, 67: 0, 68: 0, 69: 1, 70: 0 },
  // 57: Acoustic Guitar
  57: { 41: 0, 42: 0, 43: 0, 44: 0, 45: 0.25, 46: 1, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 1, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 1, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 58: Microwave
  58: { 41: 1, 42: 0, 43: 1, 44: 1, 45: 0, 46: 0.75, 47: 0, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0.75, 63: 0.25, 64: 1, 65: 1, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 59: Wristwatch
  59: { 41: 0.75, 42: 1, 43: 0, 44: 0.75, 45: 1, 46: 0.25, 47: 0, 48: 0.75, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0.25, 55: 0, 56: 0, 57: 1, 58: 0.75, 59: 0, 60: 0, 61: 0.5, 62: 0.5, 63: 0.25, 64: 0.75, 65: 1, 66: 0.5, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 60: Umbrella
  60: { 41: 0, 42: 1, 43: 0, 44: 0.75, 45: 0.75, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 1, 61: 0, 62: 0, 63: 0, 64: 0.25, 65: 0, 66: 0, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 61: Backpack
  61: { 41: 0, 42: 1, 43: 0, 44: 0, 45: 1, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0.25, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0.25, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 1, 68: 0, 69: 0, 70: 0 },
  // 62: House Key
  62: { 41: 0, 42: 1, 43: 0, 44: 1, 45: 0.75, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 1, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 1, 69: 0, 70: 0 },
  // 63: Kitchen Knife
  63: { 41: 0, 42: 1, 43: 1, 44: 1, 45: 0, 46: 0, 47: 0, 48: 0, 49: 1, 50: 0, 51: 0.25, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 64: Digital Camera
  64: { 41: 1, 42: 1, 43: 0, 44: 0.75, 45: 0.75, 46: 0.25, 47: 0, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0.75, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0.25, 60: 0, 61: 0.75, 62: 1, 63: 0.75, 64: 1, 65: 0.75, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 65: Printed Book
  65: { 41: 0, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 1, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.25, 68: 0, 69: 0, 70: 0 },
  // 66: Eyeglasses
  66: { 41: 0, 42: 1, 43: 0, 44: 0.75, 45: 1, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0.25, 60: 0, 61: 0, 62: 0.5, 63: 1, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 67: Hammer
  67: { 41: 0, 42: 1, 43: 0, 44: 1, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0.25, 50: 0, 51: 0.25, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 68: Pillow
  68: { 41: 0, 42: 0.25, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 1, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 1, 68: 0, 69: 0, 70: 0 },
  // 69: Refrigerator
  69: { 41: 1, 42: 0, 43: 1, 44: 1, 45: 0, 46: 0.25, 47: 0, 48: 0.25, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0.25, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0.25, 62: 1, 63: 0, 64: 0.25, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 70: Television
  70: { 41: 1, 42: 0, 43: 0, 44: 0.25, 45: 0, 46: 1, 47: 0, 48: 1, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 1, 62: 1, 63: 0.25, 64: 1, 65: 0.25, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 71: Headphones
  71: { 41: 1, 42: 1, 43: 0, 44: 0.25, 45: 1, 46: 1, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0.75, 62: 0.5, 63: 0, 64: 0.75, 65: 0, 66: 1, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 72: Desk Lamp
  72: { 41: 1, 42: 0.25, 43: 0, 44: 0.75, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0.25, 60: 0, 61: 0, 62: 0, 63: 0.25, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 73: Office Chair
  73: { 41: 0, 42: 0, 43: 0, 44: 0.75, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0.25, 52: 0, 53: 0, 54: 0, 55: 0, 56: 1, 57: 0, 58: 1, 59: 0, 60: 0, 61: 0, 62: 1, 63: 0, 64: 0.25, 65: 0, 66: 0, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 74: Pencil
  74: { 41: 0, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 1, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 75: Running Shoes
  75: { 41: 0, 42: 1, 43: 0, 44: 0, 45: 1, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0.25, 61: 0, 62: 0.5, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 76: Wall Clock
  76: { 41: 0.75, 42: 0.25, 43: 0.25, 44: 0.25, 45: 0, 46: 0.25, 47: 0, 48: 0.5, 49: 0, 50: 0, 51: 0.25, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0.75, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0.25, 64: 0, 65: 1, 66: 0.25, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 77: Flashlight
  77: { 41: 1, 42: 1, 43: 0, 44: 0.75, 45: 0.25, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0.25, 64: 0.75, 65: 0, 66: 0.75, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 78: Scissors
  78: { 41: 0, 42: 1, 43: 0.5, 44: 1, 45: 0, 46: 0, 47: 0, 48: 0, 49: 1, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 79: Mirror
  79: { 41: 0, 42: 0, 43: 0, 44: 0.25, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 1, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 1, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 80: Water Bottle
  80: { 41: 0, 42: 1, 43: 0.25, 44: 0.75, 45: 0.25, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0.75, 54: 0, 55: 1, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0.25, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 81: Electric Guitar
  81: { 41: 1, 42: 0, 43: 0, 44: 0.25, 45: 0.25, 46: 1, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 1, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 1, 63: 0, 64: 0.25, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 82: Toaster
  82: { 41: 1, 42: 0.25, 43: 1, 44: 1, 45: 0, 46: 0.25, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 83: Vacuum
  83: { 41: 1, 42: 0, 43: 0.25, 44: 0.25, 45: 0, 46: 1, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 1, 59: 0, 60: 0, 61: 0, 62: 0.75, 63: 0, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 1, 70: 0 },
  // 84: Passport
  84: { 41: 0, 42: 1, 43: 0, 44: 0, 45: 0.75, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 1, 58: 0, 59: 1, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 1 },
  // 85: Credit Card
  85: { 41: 0.25, 42: 1, 43: 0, 44: 0.25, 45: 0.75, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 1, 58: 0, 59: 0, 60: 0, 61: 0.25, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 1 },
  // 86: Sewing Needle
  86: { 41: 0, 42: 1, 43: 0, 44: 1, 45: 0, 46: 0, 47: 0, 48: 0, 49: 1, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 1, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 87: Stroller
  87: { 41: 0, 42: 0, 43: 0, 44: 0.75, 45: 0, 46: 0, 47: 1, 48: 0, 49: 0, 50: 0, 51: 0.75, 52: 0, 53: 0, 54: 0, 55: 0, 56: 1, 57: 0, 58: 1, 59: 0, 60: 0.25, 61: 0, 62: 0.75, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 88: Drone
  88: { 41: 1, 42: 0.75, 43: 0, 44: 0.25, 45: 0, 46: 1, 47: 0.25, 48: 0.75, 49: 0, 50: 0, 51: 0, 52: 0, 53: 0.25, 54: 0.25, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 1, 62: 1, 63: 0.25, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 89: Skateboard
  89: { 41: 0, 42: 0.25, 43: 0, 44: 0.25, 45: 0, 46: 0, 47: 1, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 1, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 90: Basketball
  90: { 41: 0, 42: 0.25, 43: 0, 44: 0, 45: 0, 46: 0.25, 47: 0, 48: 0, 49: 0, 50: 0, 51: 0, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.25, 68: 0, 69: 0, 70: 0 },
  // 91: Wax Candle
  91: { 41: 0, 42: 1, 43: 0.25, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0.25, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0.25, 64: 0, 65: 0, 66: 0, 67: 0.25, 68: 0, 69: 0, 70: 0 },
  // 92: Hair Dryer
  92: { 41: 1, 42: 0.75, 43: 0, 44: 0, 45: 0, 46: 1, 47: 0, 48: 0, 49: 0, 50: 1, 51: 0, 52: 0, 53: 0, 54: 1, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 93: Kitchen Blender
  93: { 41: 1, 42: 0, 43: 1, 44: 0.25, 45: 0, 46: 1, 47: 0, 48: 0, 49: 1, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 1, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0.75, 64: 0.75, 65: 0, 66: 1, 67: 0, 68: 0, 69: 0, 70: 0 },
  // 94: Umbrella Hat
  94: { 41: 0, 42: 1, 43: 0, 44: 0.25, 45: 1, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0, 51: 1, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 1, 61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.75, 68: 0, 69: 0, 70: 0 },
  // 95: Digital Thermometer
  95: { 41: 1, 42: 1, 43: 0.25, 44: 0.25, 45: 0.25, 46: 0.25, 47: 0, 48: 1, 49: 0, 50: 0.75, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 1, 58: 0, 59: 0, 60: 0, 61: 0, 62: 0, 63: 0, 64: 0.75, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0 }
};

/**
 * Converts ground-truth value (0..1) to soft weights (yes_w, no_w, unknown_w)
 * with initial high confidence (total weight = 12.0)
 */
export function groundTruthToWeights(val: number): { yesW: number; noW: number; unknownW: number } {
  if (val >= 0.95) {
    return { yesW: 12.0, noW: 0.0, unknownW: 0.0 };
  } else if (val <= 0.05) {
    return { yesW: 0.0, noW: 12.0, unknownW: 0.0 };
  } else if (val >= 0.7) {
    return { yesW: 9.0, noW: 2.0, unknownW: 1.0 };
  } else if (val <= 0.3) {
    return { yesW: 2.0, noW: 9.0, unknownW: 1.0 };
  } else {
    return { yesW: 3.0, noW: 3.0, unknownW: 6.0 };
  }
}
