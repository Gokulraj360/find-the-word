/**
 * Fun Fact Service
 * Provides educational, bite-sized facts about entities in Cognitor's knowledge base,
 * with graceful fallback synthesis for dynamically learned entities.
 */

export const CURATED_FUN_FACTS: Record<number, string> = {
  // Characters (1 - 50)
  1: "Einstein's Nobel Prize in 1921 was awarded for his explanation of the photoelectric effect, not for the theory of relativity.",
  2: "Leonardo da Vinci was ambidextrous and frequently wrote in reverse mirror script from right to left.",
  3: "Ronaldo can jump higher than the average NBA player, generating up to 5G of takeoff force.",
  4: "Messi's first contract with FC Barcelona was famously drafted and signed on a paper napkin in 2000.",
  5: "Taylor Swift wrote her entire third studio album, 'Speak Now', completely on her own without co-writers.",
  6: "Elon Musk taught himself computer programming at age 10 and sold his first video game, Blastar, at age 12.",
  7: "Shakespeare introduced more than 1,700 words into the English language, including 'eyeball', 'lonely', and 'swagger'.",
  8: "Gandhi walked an estimated 79,000 kilometers in his lifetime, equivalent to circling the Earth nearly twice.",
  9: "Obama won two Grammy Awards for Best Spoken Word Album for the audio versions of his memoirs.",
  10: "Michael Jackson co-invented and patented a specialized shoe heel hitch that enabled his famous 45-degree anti-gravity lean.",
  11: "Marie Curie remains the only person in history to win Nobel Prizes in two different scientific fields (Physics and Chemistry).",
  12: "Steve Jobs audited a calligraphy class at Reed College after dropping out, which later inspired the typography and fonts in the original Macintosh.",
  13: "Queen Elizabeth II trained as a military truck mechanic and driver during World War II.",
  14: "Beethoven composed his monumental Ninth Symphony, including 'Ode to Joy', while completely deaf.",
  15: "Marilyn Monroe had a personal library containing more than 400 books, including works by Joyce, Whitman, and Dostoevsky.",
  16: "Van Gogh produced more than 2,100 artworks in just a single decade, but sold only one documented painting during his lifetime.",
  17: "Stephen Hawking was born on the 300th anniversary of Galileo's death and passed away on Einstein's birthday (Pi Day).",
  18: "Serena Williams won the 2017 Australian Open while eight weeks pregnant with her daughter.",
  19: "Keanu Reeves quietly donated the majority of his earnings from 'The Matrix' sequels to leukemia research and cancer charities.",
  20: "Gordon Ramsay originally trained as an aspiring professional footballer with Rangers FC before a knee injury led him to culinary school.",
  21: "Armstrong's famous 'One small step' moonwalk was watched live by an estimated 650 million television viewers worldwide.",
  22: "Walt Disney holds the all-time Academy Award record with 22 Oscars won from 59 nominations.",
  23: "Rowling conceived the idea for Harry Potter while stuck on a delayed four-hour train journey from Manchester to London in 1990.",
  24: "Bill Gates scored 1590 out of 1600 on his SATs and wrote his first computer program, a tic-tac-toe game, at age 13.",
  25: "Freddie Mercury designed Queen's famous heraldic crest logo himself, utilizing his degree in art and graphic design.",
  26: "In the novels, Harry's distinctive lightning bolt scar was chosen simply because Rowling found the shape cool and striking.",
  27: "Arthur Conan Doyle never actually had Holmes say the exact phrase 'Elementary, my dear Watson' in any of his original stories.",
  28: "Batman first appeared in Detective Comics #27 in May 1939, originally carrying a handgun in early stories.",
  29: "Superman was originally created by Jerry Siegel and Joe Shuster in 1933 as a telepathic villain seeking world domination.",
  30: "Stan Lee's publisher originally rejected Spider-Man because he believed audiences hated spiders and teenagers couldn't be heroes.",
  31: "Vader's iconic respirator breathing sound was created by sound designer Ben Burtt breathing through a scuba regulator.",
  32: "In George Lucas's early script drafts, the hero's name was Luke Starkiller rather than Luke Skywalker.",
  33: "Mario first debuted in Donkey Kong (1981) under the name 'Jumpman' before being named after Nintendo's warehouse landlord, Mario Segale.",
  34: "Pikachu's name is an onomatopoeia combining 'pika' (the Japanese sound of an electric spark) and 'chu' (the squeak of a mouse).",
  35: "Sonic was made blue specifically to match Sega's corporate logo color.",
  36: "Walt Disney originally wanted to name the character Mortimer Mouse until his wife Lillian suggested Mickey.",
  37: "Stan Lee created Tony Stark as a challenge to make a wealthy weapons industrialist hero that audiences would still love.",
  38: "J.R.R. Tolkien borrowed the name 'Gandalf' and the names of all the dwarves in The Hobbit directly from the Old Norse Poetic Edda.",
  39: "Tolkien's earliest working draft had Frodo named 'Bingo Bolger-Baggins'.",
  40: "Ian Fleming named James Bond after an American ornithologist and author of the field guide 'Birds of the West Indies'.",
  41: "The Joker's visual appearance was inspired by actor Conrad Veidt's character in the 1928 silent film 'The Man Who Laughs'.",
  42: "J.K. Rowling chose the rare name Hermione from Shakespeare's 'The Winter's Tale' so few girls would be teased with it.",
  43: "Stuart Freeborn modeled Yoda's facial features partly on his own face and partly on Albert Einstein's wrinkles to convey profound wisdom.",
  44: "SpongeBob's creator Stephen Hillenburg was a marine biologist who originally taught marine biology at Orange County Marine Institute.",
  45: "Goku was inspired by Sun Wukong, the Monkey King from the classic 16th-century Chinese novel 'Journey to the West'.",
  46: "Naruto's name comes from 'narutomaki', the cured fish-paste cake with a pink spiral design commonly served atop ramen.",
  47: "The name 'Shrek' comes from the German and Yiddish word 'Schreck' or 'Shrek', which literally translates to 'fear' or 'terror'.",
  48: "Elsa was originally written as a pure villain in early drafts of Frozen, until the song 'Let It Go' transformed her into an empathetic protagonist.",
  49: "Conan Doyle named Watson after a real-life colleague in Southsea, Dr. James Watson, though he accidentally called him John in stories.",
  50: "Voldemort's name is derived from the French phrase 'vol de mort', which can translate to 'flight of death' or 'theft of death'.",

  // Objects (51 - 103)
  51: "The average modern smartphone has millions of times more computing power than the guidance computers that navigated Apollo 11 to the Moon.",
  52: "The first commercially available portable laptop was the Osborne 1, released in 1981, weighing 24.5 pounds (11.1 kg).",
  53: "A bicycle is the most energy-efficient vehicle ever invented: traveling by bicycle requires less energy per kilometer than walking or driving.",
  54: "The first modern automobile was patented by Karl Benz in Germany in 1886 with a single-cylinder four-stroke engine.",
  55: "Ceramic coffee mugs keep beverages warm primarily through trapped microscopic air pockets in the ceramic wall structure.",
  56: "The earliest bristle toothbrushes were made in 15th-century China using coarse hairs harvested from Siberian cold-climate boars.",
  57: "The resonant acoustic soundboard amplifies string vibrations over 100 times louder than strings vibrating in open air.",
  58: "The microwave oven was discovered accidentally in 1945 by Percy Spencer when a military radar magnetron melted a peanut candy bar in his pocket.",
  59: "Wristwatches were originally worn almost exclusively by women as jewelry until World War I soldiers proved their military value over pocket watches.",
  60: "The word umbrella originates from the Latin 'umbra', meaning shade or shadow, because the earliest umbrellas were parasols for sunlight.",
  61: "The modern zippered nylon backpack was invented in 1967 by Gerry Outdoors, revolutionizing how students carried textbooks.",
  62: "The pin tumbler lock and key system used in most front doors was first patented by Linus Yale Sr. in 1848 based on ancient Egyptian designs.",
  63: "Japanese chef knives often have asymmetric bevels (such as 70/30) honed specifically for clean slicing without bruising delicate food cells.",
  64: "The first handheld digital camera was built in 1975 by Kodak engineer Steven Sasson; it weighed 8 pounds and recorded 0.01-megapixel photos onto a cassette tape.",
  65: "The world's oldest dated printed book is the Diamond Sutra, printed using wooden block carving in China in 868 AD.",
  66: "Wearable corrective eyeglasses were invented in northern Italy in the late 13th century, initially held up by hand or balanced on the nose.",
  67: "The curved claw on a carpenter's hammer uses mechanical advantage to exert up to 10 times more pulling force than the human arm alone.",
  68: "In ancient Mesopotamia and dynastic China, wealthy citizens often rested their heads on carved stone, wood, or ceramic pillows to preserve elaborate hairstyles.",
  69: "Before artificial refrigeration, 'ice harvesting' from frozen northern lakes was one of the largest export industries in North America.",
  70: "The electronic cathode-ray television was demonstrated by 21-year-old inventor Philo Farnsworth in 1927 in San Francisco.",
  71: "The first over-ear stereo headphones were created by John Koss in 1958 in Milwaukee, originally designed for listening to vinyl records.",
  72: "The iconic articulated spring-balanced desk lamp was invented in 1932 by British automotive engineer George Carwardine.",
  73: "Naturalist Charles Darwin added wheels to his study armchair in the 1840s so he could glide between specimen tables faster.",
  74: "A standard HB cedar pencil contains enough graphite to draw a continuous line approximately 56 kilometers (35 miles) long.",
  75: "Nike co-founder Bill Bowerman created the original modern waffle running shoe sole by pouring molten urethane rubber into his wife's waffle iron.",
  76: "Pendulum clocks invented by Christiaan Huygens in 1656 improved timekeeping accuracy from 15 minutes of drift per day to under 15 seconds.",
  77: "Flashlights were called 'flash-lights' in 1899 because early carbon-filament batteries could only sustain light in brief intermittent flashes.",
  78: "Pivoting crossed-blade bronze scissors were invented by the ancient Romans around 100 AD, improving upon ancient spring-shear designs.",
  79: "The modern silvered glass mirror was developed in 1835 by German chemist Justus von Liebig using a thin chemical layer of metallic silver.",
  80: "Using one durable reusable water bottle can save an estimated 150 single-use plastic bottles from landfills each year.",
  81: "The first commercially produced solid-body electric guitar, the Fender Broadcaster (later renamed Telecaster), debuted in 1950.",
  82: "The pop-up electric bread toaster was invented in 1919 by Charles Strite, who grew frustrated with burnt toast in factory cafeterias.",
  83: "Early 1900s motorized vacuum cleaners were so massive they had to be transported on horse-drawn carts with long hoses threaded through house windows.",
  84: "The earliest historical reference to a passport-like travel document appears in the Hebrew Bible's Book of Nehemiah around 450 BC.",
  85: "The modern universal charge card was born in 1949 when businessman Frank McNamara forgot his wallet at a Manhattan restaurant, creating Diners Club.",
  86: "Bone sewing needles crafted with carved eyes by early Homo sapiens have been discovered dating back more than 50,000 years.",
  87: "The first wheeled baby carriage was designed in 1733 by architect William Kent for the 3rd Duke of Devonshire's children, pulled by a goat or miniature pony.",
  88: "Modern quadcopter camera drones achieve stable flight by micro-adjusting the speed of four independent motors hundreds of times per second.",
  89: "Skateboards were invented in California during the 1950s by surfers who attached roller-skate wheels to wooden boards for 'sidewalk surfing' when waves were flat.",
  90: "Basketball was invented in December 1891 by Dr. James Naismith in Springfield, Massachusetts, originally played using two peach baskets and a soccer ball.",
  91: "The earliest beeswax candles were developed by ancient Egyptians and Romans; beeswax burns cleanly without the acrid smoke of animal tallow.",
  92: "The first handheld domestic electric hair dryer was invented in 1920, but it was made of heavy zinc, weighed over two pounds, and frequently overheated.",
  93: "The electric kitchen blender was invented in 1922 by Stephen Poplawski to mix soda-fountain malted milk shakes.",
  94: "The novelty umbrella hat was patented in 1880 by Robert W. Patten, an eccentric Civil War veteran known in Seattle as the 'Umbrella Man'.",
  95: "Digital thermometers use a semiconductor component called a thermistor whose electrical resistance changes predictably with exact temperature shifts.",
  96: "A regulation men's cricket ball is hand-stitched with 71 to 85 stitches through genuine leather wrapped around a cork and worsted core.",
  97: "The classic black-and-white 32-panel truncated icosahedron soccer ball design (the Telstar) debuted in 1970 to make the ball visible on black-and-white TVs.",
  98: "Tennis balls were originally white or black until 1972, when research proved optic yellow balls were dramatically easier for color television viewers to track.",
  99: "Volleyball was invented in 1895 by William G. Morgan as a less strenuous indoor sport for older YMCA members, originally called 'Mintonette'.",
  100: "László Bíró patented the ballpoint pen in 1938 using quick-drying newspaper printing ink and a tiny rotating tungsten carbide ball bearing.",
  101: "If you planted the seeds from a single apple, every resulting tree would produce completely unique apples with different flavor and appearance, due to genetic heterozygosity.",
  102: "Tomatoes were legally classified as vegetables by the US Supreme Court in Nix v. Hedden (1893) for taxation purposes, despite being botanical berries.",
  103: "The first computer mouse was invented in 1964 by Douglas Engelbart at Stanford Research Institute, carved from wood with two perpendicular wheels."
};

/**
 * Returns a fun fact for an entity by ID, entity details, or intelligent fallback.
 */
export function getFunFactForEntity(
  entityId: number,
  entityName?: string,
  category?: string,
  description?: string
): string {
  // Check curated database
  if (CURATED_FUN_FACTS[entityId]) {
    return CURATED_FUN_FACTS[entityId];
  }

  // Fallback synthesis based on name and category
  const cleanName = entityName ? entityName.trim() : "This entry";
  const cat = category || "item";

  if (description && description.trim().length > 10) {
    return `${cleanName} is documented as: ${description.trim()}.`;
  }

  if (cat === "character") {
    return `${cleanName} is one of the notable figures preserved in Cognitor's deduction database.`;
  }

  return `${cleanName} is uniquely identified across Cognitor's probability matrix by its distinctive features.`;
}
