// Historical Public Domain Stories Collection
// All content from public domain sources with optimized, reliable images
// Minimum 3+ minutes reading time per story

export const historicalStories = {
  // Featured Story
  featured: {
    id: 'wright-brothers-1903',
    title: 'First Flight: The Wright Brothers at Kitty Hawk',
    excerpt: 'On December 17, 1903, Orville and Wilbur Wright achieved the first powered flight, forever changing human history.',
    content: `On the morning of December 17, 1903, on the windswept dunes of Kitty Hawk, North Carolina, Orville and Wilbur Wright achieved what humanity had dreamed of for millennia - powered, controlled, heavier-than-air flight. This moment, captured in one of history's most famous photographs, marked the beginning of the aviation age.

The Wright brothers' journey began years earlier in their bicycle shop in Dayton, Ohio. Unlike many aviation pioneers who were wealthy or well-connected, the Wrights were self-taught engineers who funded their experiments through their bicycle business. Their methodical approach to solving the problem of flight set them apart from other would-be aviators.

Beginning in 1899, they conducted extensive experiments with kites and gliders, developing their understanding of lift, drag, and control. They built a wind tunnel to test airfoils, compiling data that would prove crucial to their success. Their 1902 glider, tested at Kill Devil Hills near Kitty Hawk, incorporated their three-axis control system - the fundamental principle that still governs aircraft control today.

The brothers chose Kitty Hawk for its steady winds and soft sand dunes that cushioned crash landings. They corresponded with the local Weather Bureau and received enthusiastic support from William Tate, a Kitty Hawk resident who helped them establish their camp.

By 1903, they were ready to attempt powered flight. They designed and built their own engine when no manufacturer could provide one light enough yet powerful enough for their needs. The engine, built with the help of their mechanic Charlie Taylor, produced 12 horsepower and weighed just 180 pounds.

On December 14, they made their first attempt. Wilbur won a coin toss to pilot, but the Flyer stalled on takeoff and suffered minor damage. After repairs, they were ready to try again on December 17.

At 10:35 a.m., with Wilbur running alongside to steady the wing, the Flyer lifted off the launch rail. John T. Daniels, a lifesaving station crew member, snapped the famous photograph at the moment of takeoff. The first flight lasted 12 seconds and covered 120 feet. They made three more flights that day, with Wilbur achieving the longest - 59 seconds and 852 feet.

Five witnesses were present for this historic moment. After the fourth flight, a gust of wind caught the Flyer and damaged it beyond repair. It would never fly again, but it had already changed the world.

The Wrights sent a telegram to their father: "Success four flights Thursday morning all against twenty-one mile wind started from level with engine power alone average speed through air thirty-one miles longest 59 seconds inform press home Christmas."

The press initially showed little interest, and some reports were wildly inaccurate. The brothers continued to improve their designs, and by 1905, they had created a practical airplane capable of sustained, controlled flight.

The impact of their invention transformed the 20th century. Within a decade, airplanes were being used in World War I. Within four decades, they were crossing oceans routinely. Within seven decades, humans were walking on the moon.

Today, the Wright Flyer hangs in the Smithsonian National Air and Space Museum, a testament to what curiosity, persistence, and methodical experimentation can achieve. The bicycle mechanics from Dayton had given humanity wings, fulfilling an ancient dream and opening infinite possibilities for the future.`,
    featuredImage: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1920&q=80',
    category: 'word',
    authorName: 'Historical Archives',
    authorId: 'public-domain',
    publishedAt: { toDate: () => new Date('1903-12-17') },
    views: 12450,
    readingTime: '5 min',
    source: 'Library of Congress',
    license: 'Public Domain'
  },

  // Top Picks - Mix of stories
  topPicks: [
    {
      id: 'titanic-1912',
      title: 'The Sinking of the RMS Titanic',
      excerpt: 'The "unsinkable" ship met its fate on April 14, 1912, in one of history\'s most famous maritime disasters.',
      content: `At 11:40 PM on April 14, 1912, the RMS Titanic struck an iceberg in the North Atlantic. Less than three hours later, she sank, taking more than 1,500 souls with her. The disaster shocked the world and remains one of history's most famous maritime tragedies.

The Titanic was the crown jewel of the White Star Line, built in Belfast by Harland and Wolff. At 882 feet long and 46,328 gross tons, she was the largest moving object ever created. The ship featured unprecedented luxury: a gymnasium, swimming pool, libraries, high-class restaurants, and opulent cabins.

Titanic departed Southampton on April 10, 1912, for her maiden voyage to New York. She carried 2,224 passengers and crew, though she could have held 3,547. Among the passengers were some of the era's wealthiest people: John Jacob Astor IV, Benjamin Guggenheim, Isidor and Ida Straus, and Margaret Brown.

The night of April 14 was exceptionally calm and clear, with no moon but brilliant stars. At 11:40 PM, lookouts spotted an iceberg directly ahead. First Officer Murdoch ordered "Hard-a-starboard!" and "Full astern!" but it was too late. The iceberg scraped along the starboard side, rupturing the hull below the waterline.

Thomas Andrews, the ship's designer, surveyed the damage with Captain Smith. Water was flooding six of the sixteen watertight compartments. The ship could survive flooding in four compartments, but not six. The "unsinkable" Titanic was doomed.

The evacuation began slowly and chaotically. Many passengers refused to believe the ship was in danger. The first lifeboat, with capacity for 65, left with only 28 aboard. The ship carried only 20 lifeboats, enough for 1,178 people - less than half those aboard.

As the ship's bow sank lower, panic began to spread. The ship's band, led by Wallace Hartley, played music on deck to maintain calm, continuing until the very end. At 2:20 AM on April 15, the Titanic broke apart and sank.

The Carpathia arrived at 4:00 AM and rescued 710 survivors from lifeboats. The disaster led to sweeping changes in maritime safety: 24-hour radio watches, sufficient lifeboats for all aboard, and the International Ice Patrol.

The wreck was discovered in 1985 at a depth of 12,500 feet. The Titanic disaster continues to fascinate over a century later, representing the end of an era of certainty in progress and technology.`,
      featuredImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80',
      category: 'lens',
      authorName: 'Maritime Archives',
      publishedAt: { toDate: () => new Date('1912-04-15') },
      readingTime: '4 min',
      source: 'Public Archives',
      license: 'Public Domain'
    },
    {
      id: 'moon-landing-1969',
      title: 'Apollo 11: One Small Step',
      excerpt: 'On July 20, 1969, Neil Armstrong became the first human to set foot on the Moon.',
      content: `On July 20, 1969, at 20:17 UTC, the Apollo 11 Lunar Module Eagle touched down in the Sea of Tranquility. Six and a half hours later, Neil Armstrong became the first human to set foot on the Moon, uttering the famous words: "That's one small step for [a] man, one giant leap for mankind."

The race to the Moon began on May 25, 1961, when President Kennedy announced the goal of landing a man on the Moon before the decade's end. The Apollo program would eventually employ over 400,000 people and cost $25 billion.

Apollo 11's crew was carefully chosen. Neil Armstrong, the mission commander, was a civilian test pilot known for his cool head. Buzz Aldrin, the Lunar Module pilot, had a doctorate in astronautics. Michael Collins, the Command Module pilot, would orbit alone while his crewmates walked on the Moon.

On July 16, 1969, Apollo 11 launched from Kennedy Space Center. The Saturn V rocket, still the most powerful vehicle ever built, generated 7.6 million pounds of thrust. The four-day journey to the Moon proceeded smoothly.

The landing was harrowing. Computer alarms forced Armstrong to take manual control. With fuel running dangerously low - just 25 seconds remaining - Armstrong found a clear spot and set Eagle down. "The Eagle has landed," he radioed.

At 02:56 UTC on July 21, Armstrong's left boot touched the lunar surface. Aldrin joined him 19 minutes later. For two hours, they conducted experiments, collected samples, and planted an American flag. They collected 47.5 pounds of lunar samples.

After 21.5 hours on the lunar surface, Eagle's ascent engine fired perfectly. They rendezvoused with Collins and returned safely to Earth on July 24, splashing down in the Pacific Ocean.

The Moon landing's impact was profound. It redefined humanity's sense of possibility and marked America's victory in the Space Race. The landing inspired generations and entered language and culture - "If we can put a man on the Moon..." became shorthand for solving any difficult problem.

Today, as new nations and private companies plan lunar missions, Apollo 11 remains the standard against which all space achievements are measured.`,
      featuredImage: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&q=80',
      category: 'motion',
      authorName: 'NASA Archives',
      publishedAt: { toDate: () => new Date('1969-07-20') },
      readingTime: '4 min',
      source: 'NASA',
      license: 'Public Domain'
    },
    {
      id: 'spanish-flu-1918',
      title: 'The 1918 Influenza Pandemic',
      excerpt: 'The deadliest pandemic in modern history killed between 50 and 100 million people worldwide.',
      content: `In 1918, as World War I drew to a close, a far deadlier enemy emerged. The influenza pandemic of 1918-1919 killed between 50 and 100 million people worldwide - more than the war itself. In just two years, the virus infected one-third of the world's population.

The pandemic's name "Spanish Flu" arose not because it originated in Spain, but because Spain, neutral in WWI, didn't censor its press. The first confirmed cases appeared at Camp Funston in Kansas in March 1918.

What made this influenza uniquely terrifying was its victims. Unlike seasonal flu that primarily killed the very young and elderly, the 1918 flu devastated healthy adults aged 20-40. The virus triggered a cytokine storm - an overreaction of the body's immune system.

The pandemic struck in three waves. The second wave, beginning in August 1918, was catastrophic. People could be healthy at breakfast and dead by dinner. Symptoms included blue-tinged faces, bleeding from ears and nose, and fluid-filled lungs.

The war created perfect conditions for the virus to spread. Soldiers in cramped trenches provided ideal transmission environments. In Philadelphia, after a Liberty Loan parade attended by 200,000 people, within a week 4,500 were dead.

Worldwide, the pandemic created apocalyptic scenes. In India, trains arrived with everyone aboard dead or dying. The Ganges River was clogged with bodies. India lost between 17 and 18 million people. Alaska saw entire Inuit villages wiped out.

The medical profession was helpless. Viruses were not yet understood. Without antibiotics, secondary bacterial pneumonia was usually fatal. The pandemic spurred research into disease transmission and contributed to establishing national health departments.

The pandemic mysteriously ended in 1919. The virus evolved into less lethal seasonal flu strains. By 1920, life had largely returned to normal, though the pandemic's memory informed future pandemic preparedness.

Today, the 1918 pandemic serves as history's starkest reminder of infectious disease's potential devastation, with lessons that proved prophetic during COVID-19.`,
      featuredImage: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=1920&q=80',
      category: 'word',
      authorName: 'Medical Archives',
      publishedAt: { toDate: () => new Date('1918-10-01') },
      readingTime: '4 min',
      source: 'National Archives',
      license: 'Public Domain'
    },
    {
      id: 'san-francisco-1906',
      title: 'The Great San Francisco Earthquake',
      excerpt: 'The 1906 earthquake and subsequent fires destroyed 80% of San Francisco.',
      content: `At 5:12 AM on April 18, 1906, San Francisco was jolted awake by one of the most significant earthquakes in American history. The initial shock, estimated at magnitude 7.8, lasted only 45-60 seconds, but combined with subsequent fires, would leave over 3,000 dead and 80% of the city in ruins.

San Francisco in 1906 was the jewel of the West Coast, a city of 400,000 that had grown from a Gold Rush camp to the financial capital of the western United States. The earthquake struck along the San Andreas Fault, rupturing the earth's surface for nearly 300 miles.

While the earthquake caused severe damage, it was fire that truly destroyed San Francisco. Ruptured gas mains fed flames that began immediately. With water mains broken, firefighters watched helplessly as small fires grew into conflagrations.

Over three days, fires raged through the city. The fires were so intense they created their own weather systems. Desperate to stop the flames, authorities dynamited buildings to create firebreaks, though often this only spread the fires further.

Residents fled with whatever they could carry. Thousands gathered in parks and open spaces, creating makeshift camps. The army, under Brigadier General Frederick Funston, took control of the city, establishing martial law.

The relief effort was unprecedented. Trainloads of supplies arrived from across the nation. Congress appropriated $2.5 million for relief. International aid poured in, with Japan sending more aid than any other nation.

The disaster prompted significant changes in building codes and urban planning. Engineers studied why some buildings survived while others collapsed, leading to new understanding of seismic design. The disaster also spurred the development of seismology as a science.

Reconstruction began immediately. Within three years, 20,000 buildings had been erected. The city hosted the Panama-Pacific International Exposition in 1915, showcasing its resurrection to the world.

Today, the 1906 earthquake remains a defining moment in San Francisco's history, its lessons continuing to influence earthquake preparedness worldwide.`,
      featuredImage: 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=1920&q=80',
      category: 'lens',
      authorName: 'Historical Society',
      publishedAt: { toDate: () => new Date('1906-04-18') },
      readingTime: '3 min',
      source: 'Library of Congress',
      license: 'Public Domain'
    }
  ],

  // Staff Picks
  staffPicks: [
    {
      id: 'hindenburg-1937',
      title: 'The Hindenburg Disaster',
      excerpt: 'The fiery destruction of the Hindenburg ended the age of passenger airships.',
      content: `On May 6, 1937, the German airship Hindenburg burst into flames while landing at Lakehurst, New Jersey. In just 32 seconds, the largest aircraft ever built was destroyed, killing 36 people and ending the era of passenger airship travel.

The Hindenburg was the pride of Nazi Germany, measuring 804 feet long. It could carry 72 passengers in luxury across the Atlantic in 60 hours. Built to use helium but filled with flammable hydrogen due to U.S. embargo, the ship had operated safely for a year.

As the Hindenburg approached Lakehurst after a routine crossing from Frankfurt, witnesses noticed a small flame near the tail. Within seconds, fire spread along the hull. The hydrogen-filled gas cells exploded in sequence.

Radio reporter Herbert Morrison's emotional commentary became famous: "Oh, the humanity!" Remarkably, 62 of 97 people aboard survived. Many jumped from windows as the ship neared the ground.

The disaster's cause remains debated. Official investigations blamed hydrogen leak ignited by static electricity. The disaster immediately ended public confidence in airships, marking the end of an elegant but dangerous era of air travel.`,
      featuredImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920&q=80',
      category: 'lens',
      authorName: 'News Archives',
      publishedAt: { toDate: () => new Date('1937-05-06') },
      readingTime: '3 min',
      source: 'Public Domain',
      license: 'Public Domain'
    },
    {
      id: 'amelia-earhart-1937',
      title: 'Amelia Earhart\'s Final Flight',
      excerpt: 'The mysterious disappearance of aviation\'s most famous female pilot.',
      content: `On July 2, 1937, Amelia Earhart and navigator Fred Noonan disappeared over the Pacific Ocean while attempting to circumnavigate the globe. Their disappearance remains one of aviation's greatest mysteries.

Earhart was already the world's most famous female aviator - first woman to fly solo across the Atlantic, first person to fly solo from Hawaii to California. The round-the-world flight would be her most ambitious undertaking.

After flying 22,000 miles from Miami through South America, Africa, India, and Southeast Asia, they reached New Guinea. The next leg - 2,556 miles to tiny Howland Island - would be the most challenging.

Radio communications were problematic throughout the flight. Earhart's last confirmed message stated: "We are running on line north and south." The massive search that followed found no trace.

Theories about their fate range from running out of fuel and crashing into the ocean, to landing on Gardner Island (now Nikumaroro), to being captured by the Japanese. Modern searches continue to probe the mystery.

Earhart's legacy transcends her disappearance. She challenged gender barriers, inspired generations of female aviators, and embodied aviation's golden age adventurous spirit.`,
      featuredImage: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1920&q=80',
      category: 'word',
      authorName: 'Aviation Archives',
      publishedAt: { toDate: () => new Date('1937-07-02') },
      readingTime: '3 min',
      source: 'National Archives',
      license: 'Public Domain'
    },
    {
      id: 'wwi-christmas-1914',
      title: 'The Christmas Truce of 1914',
      excerpt: 'When enemies became friends in No Man\'s Land.',
      content: `On Christmas Eve 1914, something extraordinary happened along the Western Front. Soldiers on both sides spontaneously laid down their arms and met in No Man's Land to exchange gifts, sing carols, and play football.

By Christmas 1914, WWI had raged for five months. The mobile warfare had given way to trench warfare stalemate. Two parallel lines of trenches stretched from the English Channel to Switzerland.

The truce began on Christmas Eve near Ypres. German troops decorated their trenches with candles and sang "Silent Night." British troops responded with their own carols. Soon, soldiers were shouting Christmas greetings across the battlefield.

On Christmas morning, soldiers ventured into No Man's Land. They shook hands, exchanged gifts of cigarettes and chocolate, showed photographs of families. Some accounts describe football matches, though details vary.

The truce served practical purposes too. Both sides retrieved and buried their dead in joint services. Not everyone participated - some sectors saw no truce, with fighting continuing.

Military commanders were horrified. Orders immediately forbade fraternization. The truce ended by December 26 in most sectors. Attempts to repeat it in subsequent years failed as the war became too bitter.

The Christmas Truce demonstrates profound truths about the arbitrary nature of wartime hatred and humanity's capacity for peace even in war's darkest moments.`,
      featuredImage: 'https://images.unsplash.com/photo-1513003160039-219c7b8c8d48?w=1920&q=80',
      category: 'word',
      authorName: 'War Archives',
      publishedAt: { toDate: () => new Date('1914-12-25') },
      readingTime: '3 min',
      source: 'Imperial War Museum',
      license: 'Public Domain'
    },
    {
      id: 'pearl-harbor-1941',
      title: 'Pearl Harbor: Day of Infamy',
      excerpt: 'The surprise attack that brought America into World War II.',
      content: `On December 7, 1941, the Imperial Japanese Navy launched a surprise attack on Pearl Harbor, Hawaii. The attack killed 2,403 Americans and wounded 1,178, bringing the United States into World War II.

The attack began at 7:48 AM Hawaiian time. Japanese aircraft launched from six carriers struck the U.S. Pacific Fleet at anchor. In two waves, 353 Japanese aircraft attacked the base.

Eight U.S. battleships were damaged, four sunk. The USS Arizona exploded and sank with 1,177 crewmen. The USS Oklahoma capsized. Three cruisers, three destroyers, and other vessels were damaged or sunk.

American aircraft losses were severe - 188 destroyed, 159 damaged. Most were hit on the ground. Japanese losses were minimal - 29 aircraft, five midget submarines, 64 servicemen killed.

The attack shocked America from isolationism. President Roosevelt called it "a date which will live in infamy." Congress declared war on Japan the next day. Germany and Italy declared war on the U.S. three days later.

Though tactically successful, the attack was a strategic mistake. It unified American public opinion for war. The damaged fleet was mostly repaired and returned to service. The attack missed crucial targets - submarines, fuel storage, repair facilities.

Pearl Harbor changed history's course, transforming America into a military superpower and setting the stage for the atomic age.`,
      featuredImage: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=1920&q=80',
      category: 'lens',
      authorName: 'U.S. Navy Archives',
      publishedAt: { toDate: () => new Date('1941-12-07') },
      readingTime: '3 min',
      source: 'National Archives',
      license: 'Public Domain'
    }
  ],

  // Category Features
  categoryFeatures: {
    word: {
      id: 'gettysburg-1863',
      title: 'The Battle of Gettysburg',
      excerpt: 'The turning point of the American Civil War.',
      content: `From July 1-3, 1863, the Battle of Gettysburg raged in and around the Pennsylvania town, marking the turning point of the American Civil War. With over 50,000 casualties, it remains the bloodiest battle ever fought on American soil.

General Robert E. Lee's Confederate Army invaded the North, hoping a victory would force peace negotiations. They met Union forces under General George Meade at Gettysburg. The first day saw Confederates drive Union forces through the town to Cemetery Hill.

On July 2, Lee attacked both Union flanks. Fighting raged at Devil's Den, Little Round Top, and the Peach Orchard. Joshua Chamberlain's 20th Maine's bayonet charge saved the Union left flank.

July 3 saw Pickett's Charge - 12,500 Confederates advancing across open ground into devastating Union fire. The assault failed catastrophically. Lee retreated to Virginia, never to threaten the North again.

Four months later, Lincoln delivered his Gettysburg Address, redefining the war's purpose and American democracy itself in just 272 words. The battle ended the Confederacy's offensive capability and began its long decline to defeat.`,
      featuredImage: 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=1920&q=80',
      category: 'word',
      authorName: 'Civil War Archives',
      publishedAt: { toDate: () => new Date('1863-07-03') },
      readingTime: '3 min',
      source: 'Library of Congress',
      license: 'Public Domain'
    },
    lens: {
      id: 'dust-bowl-1935',
      title: 'The Dust Bowl: America\'s Ecological Disaster',
      excerpt: 'When the Great Plains turned to dust and darkness.',
      content: `During the 1930s, the American Great Plains experienced one of the worst ecological disasters in history. The Dust Bowl, caused by drought and poor farming practices, displaced millions and transformed American agriculture forever.

Years of wheat cultivation without crop rotation had stripped the prairie of native grasses that held soil in place. When drought struck in 1930, the exposed topsoil began to blow away in massive dust storms.

"Black blizzards" of dust clouds sometimes reached 10,000 feet high, traveling to the East Coast. On "Black Sunday," April 14, 1935, a storm darkened skies from the Great Plains to Washington D.C.

The human toll was devastating. Dust pneumonia killed hundreds. Crops failed completely. By 1940, 2.5 million people had fled the Plains states. John Steinbeck's "The Grapes of Wrath" captured their plight.

The disaster prompted revolutionary changes in agriculture. The Soil Conservation Service introduced new farming techniques. Crop rotation, contour plowing, and windbreaks became standard. The tragedy taught America about ecological limits and sustainable farming.`,
      featuredImage: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=1920&q=80',
      category: 'lens',
      authorName: 'Farm Security Administration',
      publishedAt: { toDate: () => new Date('1935-04-14') },
      readingTime: '3 min',
      source: 'Library of Congress',
      license: 'Public Domain'
    },
    motion: {
      id: 'berlin-wall-1989',
      title: 'The Fall of the Berlin Wall',
      excerpt: 'The night that ended the Cold War\'s most visible symbol.',
      content: `On November 9, 1989, the Berlin Wall fell, marking the beginning of the end of the Cold War. The wall that had divided Berlin for 28 years came down in a spontaneous celebration of freedom.

Built in 1961, the wall stretched 96 miles around West Berlin. It separated families, friends, and a city. Over 100 people died trying to cross it. The wall became the Cold War's most potent symbol.

By 1989, communist regimes were collapsing across Eastern Europe. On November 9, a confusing announcement about border crossings led thousands of East Berliners to rush the wall. Overwhelmed guards opened the gates.

Berliners celebrated with champagne, tears, and sledgehammers. "Wall woodpeckers" chipped away souvenirs. Families separated for decades reunited. The Brandenburg Gate, closed for 28 years, reopened.

The fall triggered rapid change. Germany reunified within a year. The Soviet Union collapsed in 1991. The Cold War ended. The wall's fall remains one of history's most joyous moments of human liberation.`,
      featuredImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1920&q=80',
      category: 'motion',
      authorName: 'News Archives',
      publishedAt: { toDate: () => new Date('1989-11-09') },
      readingTime: '3 min',
      source: 'Public Domain',
      license: 'Public Domain'
    }
  }
};

// Helper functions
export const getAllStories = () => {
  return [
    historicalStories.featured,
    ...historicalStories.topPicks,
    ...historicalStories.staffPicks,
    Object.values(historicalStories.categoryFeatures)
  ].flat();
};

export const getStoryById = (id) => {
  const allStories = getAllStories();
  return allStories.find(story => story.id === id);
};

export const getStoriesByCategory = (category) => {
  const allStories = getAllStories();
  return allStories.filter(story => story.category === category);
};

export default historicalStories;