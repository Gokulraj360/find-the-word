export interface SeedEntity {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  popularity: number;
  status: "active";
}

export interface SeedQuestion {
  id: number;
  text: string;
  source: "wikidata";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  { id: 1, text: "Is your character fictional?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 2, text: "Is your character male?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 3, text: "Is your character currently alive?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 4, text: "Is your character known for science, technology, or mathematics?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 5, text: "Is your character a professional athlete or sports figure?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 6, text: "Is your character a singer or musician?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 7, text: "Is your character an actor or film personality?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 8, text: "Is your character a politician or world leader?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 9, text: "Is your character an artist, painter, or sculptor?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 10, text: "Is your character an author or writer?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 11, text: "Is your character from or primarily associated with North America (USA/Canada)?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 12, text: "Is your character from Europe or the United Kingdom?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 13, text: "Is your character from Asia?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 14, text: "Did your character live before the 20th century (before 1900)?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 15, text: "Has your character won a Nobel Prize?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 16, text: "Is your character a billionaire or major tech entrepreneur?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 17, text: "Does your character have supernatural powers or magic?", source: "wikidata", qualityScore: 1.0, timesAsked: 0, isActive: true },
  { id: 18, text: "Is your character a superhero or comic book protagonist?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 19, text: "Is your character a villain, criminal, or antagonist?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 20, text: "Is your character from a video game franchise?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 21, text: "Is your character an animated, cartoon, or anime character?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 22, text: "Is your character non-human (animal, alien, creature, or robot)?", source: "wikidata", qualityScore: 0.95, timesAsked: 0, isActive: true },
  { id: 23, text: "Is your character from the Star Wars universe?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 24, text: "Is your character from the Harry Potter universe?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 25, text: "Is your character from Marvel or DC Comics universes?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 26, text: "Is your character a detective, spy, or investigator?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 27, text: "Is your character known for football / soccer?", source: "wikidata", qualityScore: 0.9, timesAsked: 0, isActive: true },
  { id: 28, text: "Is your character a monarch, king, queen, or emperor?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 29, text: "Has your character traveled to outer space or was born off Earth?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 30, text: "Is your character famous for a yellow or golden color appearance?", source: "wikidata", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 31, text: "Does your character wear a mask or helmet covering their face?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 32, text: "Is your character known for martial arts or sword/lightsaber combat?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 33, text: "Is your character associated with computers, smartphones, or software?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 34, text: "Is your character a chef, restaurant owner, or known for food/cooking?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 35, text: "Is your character known for classical music composition?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 36, text: "Is your character a ninja or from Japanese anime/manga?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 37, text: "Is your character a green ogre who lives in a swamp?", source: "wikidata", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 38, text: "Does your character have ice or snow powers?", source: "wikidata", qualityScore: 0.8, timesAsked: 0, isActive: true },
  { id: 39, text: "Is your character a wizard or witch with a wand?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true },
  { id: 40, text: "Is your character known for extreme wealth or a high-tech armored suit?", source: "wikidata", qualityScore: 0.85, timesAsked: 0, isActive: true }
];

export const SEED_ENTITIES: SeedEntity[] = [
  // 1-25: Real historical & modern figures
  { id: 1, name: "Albert Einstein", description: "Theoretical physicist who developed the theory of relativity", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/220px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg", popularity: 45000, status: "active" },
  { id: 2, name: "Leonardo da Vinci", description: "Italian polymath of the Renaissance, painter of Mona Lisa", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self.jpg/220px-Leonardo_self.jpg", popularity: 38000, status: "active" },
  { id: 3, name: "Cristiano Ronaldo", description: "Portuguese professional footballer, all-time leading international goalscorer", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/220px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg", popularity: 50000, status: "active" },
  { id: 4, name: "Lionel Messi", description: "Argentine football legend, 8-time Ballon d'Or winner and World Cup champion", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg", popularity: 49000, status: "active" },
  { id: 5, name: "Taylor Swift", description: "Global pop and country music icon, multi-Grammy Album of the Year winner", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png/220px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png", popularity: 48000, status: "active" },
  { id: 6, name: "Elon Musk", description: "CEO of Tesla, SpaceX founder, and tech billionaire", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg", popularity: 47000, status: "active" },
  { id: 7, name: "William Shakespeare", description: "English playwright and poet, author of Hamlet and Romeo & Juliet", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/220px-Shakespeare.jpg", popularity: 35000, status: "active" },
  { id: 8, name: "Mahatma Gandhi", description: "Leader of Indian independence movement through non-violent resistance", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/220px-Mahatma-Gandhi%2C_studio%2C_1931.jpg", popularity: 40000, status: "active" },
  { id: 9, name: "Barack Obama", description: "44th President of the United States and Nobel Peace Prize laureate", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/220px-President_Barack_Obama.jpg", popularity: 42000, status: "active" },
  { id: 10, name: "Michael Jackson", description: "King of Pop, legendary singer, dancer, and entertainer", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Michael_Jackson_in_1988.jpg/220px-Michael_Jackson_in_1988.jpg", popularity: 46000, status: "active" },
  { id: 11, name: "Marie Curie", description: "Pioneering physicist and chemist, first person to win two Nobel Prizes", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/220px-Marie_Curie_c._1920s.jpg", popularity: 32000, status: "active" },
  { id: 12, name: "Steve Jobs", description: "Co-founder of Apple Inc., visionary behind iPhone, Mac, and Pixar", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/220px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg", popularity: 39000, status: "active" },
  { id: 13, name: "Queen Elizabeth II", description: "Longest-reigning British monarch in history (1952–2022)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Queen_Elizabeth_II_March_2015.jpg/220px-Queen_Elizabeth_II_March_2015.jpg", popularity: 43000, status: "active" },
  { id: 14, name: "Ludwig van Beethoven", description: "German composer and pianist, renowned for 9 symphonies and Moonlight Sonata", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/220px-Beethoven.jpg", popularity: 31000, status: "active" },
  { id: 15, name: "Marilyn Monroe", description: "Iconic American actress, model, and 1950s Hollywood star", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Marilyn_Monroe_photo_pose_sitting_cropped.jpg/220px-Marilyn_Monroe_photo_pose_sitting_cropped.jpg", popularity: 34000, status: "active" },
  { id: 16, name: "Vincent van Gogh", description: "Dutch Post-Impressionist painter of The Starry Night and Sunflowers", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%284bzkMmKAAWeTrg%29.jpg/220px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%284bzkMmKAAWeTrg%29.jpg", popularity: 36000, status: "active" },
  { id: 17, name: "Stephen Hawking", description: "Theoretical physicist and cosmologist, author of A Brief History of Time", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Stephen_Hawking.StarChild.jpg/220px-Stephen_Hawking.StarChild.jpg", popularity: 33000, status: "active" },
  { id: 18, name: "Serena Williams", description: "American tennis legend, winner of 23 Grand Slam singles titles", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Serena_Williams_at_2013_US_Open.jpg/220px-Serena_Williams_at_2013_US_Open.jpg", popularity: 29000, status: "active" },
  { id: 19, name: "Keanu Reeves", description: "Beloved Canadian-American actor, star of The Matrix and John Wick", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Spike_TV%27s_Guys_Choice_Awards_-_Keanu_Reeves_%28cropped%29.jpg/220px-Spike_TV%27s_Guys_Choice_Awards_-_Keanu_Reeves_%28cropped%29.jpg", popularity: 37000, status: "active" },
  { id: 20, name: "Gordon Ramsay", description: "World-renowned British celebrity chef and television host", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Gordon_Ramsay_cropped.jpg/220px-Gordon_Ramsay_cropped.jpg", popularity: 30000, status: "active" },
  { id: 21, name: "Neil Armstrong", description: "American astronaut and aeronautical engineer, first person on the Moon", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Neil_Armstrong_pose.jpg/220px-Neil_Armstrong_pose.jpg", popularity: 28000, status: "active" },
  { id: 22, name: "Walt Disney", description: "American animator, film producer, and creator of Mickey Mouse & Disneyland", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Walt_Disney_1946.JPG/220px-Walt_Disney_1946.JPG", popularity: 33000, status: "active" },
  { id: 23, name: "J.K. Rowling", description: "British author and creator of the Harry Potter fantasy series", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/220px-J._K._Rowling_2010.jpg", popularity: 31000, status: "active" },
  { id: 24, name: "Bill Gates", description: "Co-founder of Microsoft, computer pioneer, and philanthropist", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/220px-Bill_Gates_2018.jpg", popularity: 41000, status: "active" },
  { id: 25, name: "Freddie Mercury", description: "British musician and flamboyant lead vocalist of the rock band Queen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Freddie_Mercury_performing_in_New_Haven%2C_CT%2C_November_1977.jpg/220px-Freddie_Mercury_performing_in_New_Haven%2C_CT%2C_November_1977.jpg", popularity: 36000, status: "active" },

  // 26-50: Fictional characters across genres
  { id: 26, name: "Harry Potter", description: "The Boy Who Lived, wizard student at Hogwarts School of Witchcraft and Wizardry", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d7/Harry_Potter_character_poster.jpg", popularity: 48000, status: "active" },
  { id: 27, name: "Sherlock Holmes", description: "Consulting detective residing at 221B Baker Street, created by Arthur Conan Doyle", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Sherlock_Holmes_Portrait_Paget.jpg/220px-Sherlock_Holmes_Portrait_Paget.jpg", popularity: 44000, status: "active" },
  { id: 28, name: "Batman (Bruce Wayne)", description: "The Dark Knight, billionaire vigilante protector of Gotham City", imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c7/Batman_Infobox.jpg", popularity: 47000, status: "active" },
  { id: 29, name: "Superman (Clark Kent)", description: "The Man of Steel, superhero from the planet Krypton defending Metropolis", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/35/Supermanflying.png", popularity: 46000, status: "active" },
  { id: 30, name: "Spider-Man (Peter Parker)", description: "Friendly neighborhood superhero bitten by a radioactive spider", imageUrl: "https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png", popularity: 49000, status: "active" },
  { id: 31, name: "Darth Vader", description: "Sith Lord, formerly Jedi Knight Anakin Skywalker, commander in the Galactic Empire", imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/76/Darth_Vader.jpg", popularity: 47000, status: "active" },
  { id: 32, name: "Luke Skywalker", description: "Jedi Master from Tatooine who redeemed his father and restored freedom to the Galaxy", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Luke_Skywalker.png", popularity: 41000, status: "active" },
  { id: 33, name: "Mario", description: "Italian plumber and iconic Nintendo hero of the Mushroom Kingdom", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a9/MarioNSMBUDeluxe.png", popularity: 48000, status: "active" },
  { id: 34, name: "Pikachu", description: "Electric-type mouse Pokémon, mascot of the Pokémon franchise", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png", popularity: 49000, status: "active" },
  { id: 35, name: "Sonic the Hedgehog", description: "The Blue Blur, supersonic hedgehog and mascot of Sega", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/45/Sonic_the_Hedgehog_2019.png", popularity: 42000, status: "active" },
  { id: 36, name: "Mickey Mouse", description: "Cheerful cartoon mouse created by Walt Disney, global corporate mascot", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Mickey_Mouse.png", popularity: 45000, status: "active" },
  { id: 37, name: "Iron Man (Tony Stark)", description: "Genius, billionaire, playboy, philanthropist in high-tech powered armor", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/47/Iron_Man_%28circa_2018%29.png", popularity: 46000, status: "active" },
  { id: 38, name: "Gandalf", description: "Wise wizard and member of the Fellowship of the Ring in Middle-earth", imageUrl: "https://upload.wikimedia.org/wikipedia/en/e/e9/Gandalf600ppx.jpg", popularity: 39000, status: "active" },
  { id: 39, name: "Frodo Baggins", description: "Hobbit of the Shire who carried the One Ring to Mount Doom", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4e/Elijah_Wood_as_Frodo_Baggins.png", popularity: 36000, status: "active" },
  { id: 40, name: "James Bond (007)", description: "Legendary British Secret Service MI6 secret agent with a license to kill", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/30/James_Bond_007_logo.svg", popularity: 43000, status: "active" },
  { id: 41, name: "The Joker", description: "Criminal mastermind and psychopathic archenemy of Batman in Gotham City", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/98/Joker_%28DC_Comics_character%29.jpg", popularity: 45000, status: "active" },
  { id: 42, name: "Hermione Granger", description: "Brilliant Muggle-born witch and best friend of Harry Potter", imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d3/Hermione_Granger_poster.jpg", popularity: 40000, status: "active" },
  { id: 43, name: "Yoda", description: "Legendary diminutive 900-year-old Jedi Grand Master in Star Wars", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Yoda_Empire_Strikes_Back.png", popularity: 43000, status: "active" },
  { id: 44, name: "SpongeBob SquarePants", description: "Optimistic sea sponge who lives in a pineapple under the sea", imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/3b/SpongeBob_SquarePants_character.png", popularity: 44000, status: "active" },
  { id: 45, name: "Goku (Son Goku)", description: "Saiyan warrior raised on Earth, martial artist and hero of Dragon Ball", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/af/Son_Goku_Young_Adult.png", popularity: 46000, status: "active" },
  { id: 46, name: "Naruto Uzumaki", description: "Spirited ninja of the Hidden Leaf Village who became the Seventh Hokage", imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9a/Naruto_Uzumaki.png", popularity: 43000, status: "active" },
  { id: 47, name: "Shrek", description: "Loveable green ogre who loves his swamp and marries Princess Fiona", imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png", popularity: 41000, status: "active" },
  { id: 48, name: "Elsa", description: "Queen of Arendelle gifted with magical cryokinetic ice powers in Frozen", imageUrl: "https://upload.wikimedia.org/wikipedia/en/5/5e/Elsa_from_Disney%27s_Frozen.png", popularity: 42000, status: "active" },
  { id: 49, name: "Dr. John Watson", description: "Loyal friend, biographer, and partner in deduction of Sherlock Holmes", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/John_Watson_by_Sidney_Paget.jpg/220px-John_Watson_by_Sidney_Paget.jpg", popularity: 29000, status: "active" },
  { id: 50, name: "Lord Voldemort", description: "The Dark Lord, He-Who-Must-Not-Be-Named, darkest wizard in Harry Potter", imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a3/Lordvoldemort.jpg", popularity: 41000, status: "active" }
];

// Ground truth answers for (entityId, questionId)
// 1 = Yes, 0 = No, 0.75 = Probably, 0.25 = Probably not, 0.5 = Unknown
export const SEED_GROUND_TRUTH: Record<number, Record<number, number>> = {
  // Albert Einstein
  1: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0.25, 7: 0, 8: 0, 9: 0, 10: 0.25, 11: 0.75, 12: 1, 13: 0, 14: 1, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Leonardo da Vinci
  2: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0.25, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Cristiano Ronaldo
  3: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0.75, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 1, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Lionel Messi
  4: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0.75, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 1, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Taylor Swift
  5: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 1, 7: 0.25, 8: 0, 9: 0, 10: 0.75, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Elon Musk
  6: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0.25, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.75 },
  // William Shakespeare
  7: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.75, 8: 0, 9: 0, 10: 1, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Mahatma Gandhi
  8: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0.25, 11: 0, 12: 0, 13: 1, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Barack Obama
  9: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0.75, 11: 1, 12: 0, 13: 0, 14: 0, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Michael Jackson
  10: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0.25, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Marie Curie
  11: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 1, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Steve Jobs
  12: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Queen Elizabeth II
  13: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 1, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Ludwig van Beethoven
  14: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 1, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Marilyn Monroe
  15: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0.75, 7: 1, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Vincent van Gogh
  16: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Stephen Hawking
  17: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0.75, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Serena Williams
  18: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Keanu Reeves
  19: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0.25, 7: 1, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.75, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Gordon Ramsay
  20: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0.75, 8: 0, 9: 0, 10: 0.25, 11: 0.25, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.25, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 1, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Neil Armstrong
  21: { 1: 0, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0.75, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Walt Disney
  22: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.25, 8: 0, 9: 0.75, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // J.K. Rowling
  23: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 1, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0.75, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Bill Gates
  24: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Freddie Mercury
  25: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0.25, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0.25, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },

  // Fictional Characters:
  // Harry Potter
  26: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 1, 40: 0 },
  // Sherlock Holmes
  27: { 1: 1, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Batman
  28: { 1: 1, 2: 1, 3: 1, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 1, 19: 0, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 1, 32: 1, 33: 0.75, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.75 },
  // Superman
  29: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 1, 19: 0, 20: 0, 21: 0.75, 22: 1, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Spider-Man
  30: { 1: 1, 2: 1, 3: 1, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 1, 19: 0, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 1, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 0, 40: 0 },
  // Darth Vader
  31: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0.25, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 1, 20: 0.25, 21: 0, 22: 0.75, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 1, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0.25 },
  // Luke Skywalker
  32: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Mario
  33: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0.25, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0.75, 14: 0, 15: 0, 16: 0, 17: 0.75, 18: 0, 19: 0, 20: 1, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Pikachu
  34: { 1: 1, 2: 0.5, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 1, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 1, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0.75, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Sonic the Hedgehog
  35: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 1, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0.75, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Mickey Mouse
  36: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0.25, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0.25, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Iron Man
  37: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 1, 17: 0, 18: 1, 19: 0, 20: 0, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0.25, 30: 0.25, 31: 1, 32: 0, 33: 1, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 1 },
  // Gandalf
  38: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0, 14: 1, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 0, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 1, 40: 0 },
  // Frodo Baggins
  39: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0.75, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0.25, 18: 0, 19: 0, 20: 0, 21: 0, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.25, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // James Bond
  40: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 1, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0.25, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // The Joker
  41: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 1, 20: 0.25, 21: 0.75, 22: 0, 23: 0, 24: 0, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0.25, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Hermione Granger
  42: { 1: 1, 2: 0, 3: 1, 4: 0.25, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0.75, 39: 1, 40: 0 },
  // Yoda
  43: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 0.75, 22: 1, 23: 1, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // SpongeBob SquarePants
  44: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 1, 31: 0, 32: 0, 33: 0, 34: 1, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Goku
  45: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0.25, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0.75, 19: 0, 20: 0.75, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 1, 30: 0.25, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 1, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Naruto Uzumaki
  46: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0.75, 9: 0, 10: 0, 11: 0, 12: 0, 13: 1, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0.25, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0.75, 31: 0, 32: 1, 33: 0, 34: 0, 35: 0, 36: 1, 37: 0, 38: 0.75, 39: 0, 40: 0 },
  // Shrek
  47: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 1, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 1, 22: 1, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0.25, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 1, 38: 0, 39: 0, 40: 0 },
  // Elsa
  48: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0.75, 7: 0, 8: 1, 9: 0, 10: 0, 11: 1, 12: 0.75, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 0, 20: 0, 21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 1, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 1, 39: 0, 40: 0 },
  // Dr. John Watson
  49: { 1: 1, 2: 1, 3: 0, 4: 0.75, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0.75, 11: 0, 12: 1, 13: 0, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0.75, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
  // Lord Voldemort
  50: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 1, 18: 0, 19: 1, 20: 0, 21: 0, 22: 0.25, 23: 0, 24: 1, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 1, 40: 0 }
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
