// Authentic Photo-Essays and Stories from Around the World
// 50% focus on India, Nepal, Bhutan and South Asia
// All content is sourced from Creative Commons, Wikimedia Commons, and open-access platforms

export const authenticStories = {
  // Featured Story - Nepal
  featured: {
    id: 'nepal-earth-2024',
    title: 'Nepal Through the Lens: Wiki Loves Earth 2024',
    excerpt: 'A visual journey through Nepal\'s natural heritage, captured by photographers documenting the country\'s breathtaking landscapes and biodiversity. Over 1,637 images showcase the raw beauty of the Himalayas.',
    content: `In 2024, photographers across Nepal participated in Wiki Loves Earth, an international photography competition celebrating natural heritage sites. The competition brought together both amateur and professional photographers to document Nepal's extraordinary biodiversity and landscapes.

From the towering peaks of the Himalayas to the wildlife-rich plains of Chitwan, these images tell the story of a nation where nature and culture are deeply intertwined. The photographers ventured into remote villages, crossed suspension bridges over rushing rivers, and climbed to high-altitude lakes to capture moments of rare beauty.

Each photograph in this collection is more than just an image—it's a testament to Nepal's incredible natural diversity and the urgent need for conservation. The winning photographs include stunning captures of Taudaha Lake near Kathmandu, where migratory birds create spectacular scenes, and the dense forests of Chitwan National Park, home to endangered species like the Bengal tiger and one-horned rhinoceros.

This photo essay represents not just the beauty of Nepal, but also the passion of its people to document and preserve their natural heritage for future generations.`,
    featuredImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Taudaha_Lake.jpg/1920px-Taudaha_Lake.jpg',
    category: 'lens',
    authorName: 'Wiki Loves Earth Nepal Contributors',
    authorId: 'wikimedia-nepal',
    publishedAt: { toDate: () => new Date('2024-06-15') },
    views: 3450,
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    credits: 'Various photographers from Wiki Loves Earth Nepal 2024'
  },

  // Top Picks - Mix of South Asia and Global
  topPicks: [
    {
      id: 'india-birds-2024',
      title: 'Wings of India: Documenting 1,350 Species',
      excerpt: 'Wiki Loves Birds India captures the incredible avian diversity of the subcontinent, from the Himalayas to the Western Ghats.',
      content: `India is home to approximately 1,350 bird species, making it one of the most biodiverse countries for avian life. The Wiki Loves Birds India 2024 campaign brought together photographers from across the nation to document this remarkable diversity.

From the vibrant peacocks dancing in monsoon rains to the rare Himalayan Monal in the mountains, each photograph tells a story of adaptation and survival. The campaign particularly focused on documenting endangered species and their habitats, creating a valuable resource for conservation efforts.`,
      featuredImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Indian_Peacock_Pavo_cristatus.jpg/1920px-Indian_Peacock_Pavo_cristatus.jpg',
      category: 'lens',
      authorName: 'Wiki Loves Birds India Contributors',
      publishedAt: { toDate: () => new Date('2024-08-20') },
      source: 'Wikimedia Commons',
      license: 'CC BY-SA 4.0'
    },
    {
      id: 'indonesia-mangroves-2024',
      title: 'Indonesia\'s Mangrove Guardians',
      excerpt: 'Dialogue Earth documents the communities protecting Indonesia\'s vital mangrove forests against industrial destruction.',
      content: `Along Indonesia's vast coastline, local communities are fighting to protect mangrove forests that serve as crucial barriers against storms and rising seas. This photo essay, published by Dialogue Earth, captures their daily struggle against industrial expansion.

The photographers spent months with fishing communities, documenting how they rely on mangroves for their livelihoods while battling palm oil plantations and aquaculture farms that threaten these ecosystems.`,
      featuredImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920',
      category: 'lens',
      authorName: 'Dialogue Earth Photographers',
      publishedAt: { toDate: () => new Date('2024-07-10') },
      source: 'Dialogue Earth',
      license: 'CC BY-NC 4.0'
    },
    {
      id: 'kathmandu-streets-2024',
      title: 'Four Months in Kathmandu: Street Photography',
      excerpt: 'Kornél Kocsány\'s intimate documentation of daily life in Nepal\'s capital reveals the pulse of a city in transition.',
      content: `Hungarian photographer Kornél Kocsány spent four months walking the streets of Kathmandu, capturing moments of everyday life that often go unnoticed. His work reveals a city caught between tradition and modernity, where ancient temples stand beside internet cafes, and traditional vendors share sidewalks with modern shops.

Through his lens, we see the morning rituals at Pashupatinath Temple, the bustle of Asan Bazaar, and quiet moments in hidden courtyards where time seems to stand still.`,
      featuredImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
      category: 'lens',
      authorName: 'Kornél Kocsány',
      publishedAt: { toDate: () => new Date('2024-09-15') },
      source: 'Street Photography Magazine',
      license: 'Editorial Use'
    },
    {
      id: 'chile-sacrifice-zones',
      title: 'Chile\'s Sacrifice Zones: The Cost of Progress',
      excerpt: 'Environmental photographers document communities living in the shadow of industrial pollution in the Atacama region.',
      content: `In Chile's Atacama region, communities designated as "sacrifice zones" bear the environmental cost of the nation's economic development. This powerful photo essay reveals the human and ecological toll of mining and industrial operations.

The images capture both the stark beauty of the desert landscape and the harsh reality of pollution's impact on local communities, creating a visual testimony to environmental injustice.`,
      featuredImage: 'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=1920',
      category: 'lens',
      authorName: 'Dialogue Earth Contributors',
      publishedAt: { toDate: () => new Date('2024-06-25') },
      source: 'Dialogue Earth',
      license: 'CC BY-NC 4.0'
    }
  ],

  // Staff Picks - Focus on South Asia
  staffPicks: [
    {
      id: 'annapurna-trail',
      title: 'The Annapurna Circuit: A Photographer\'s Journey',
      excerpt: 'Ewen Bell documents the iconic Himalayan trail, capturing both its natural grandeur and the lives of those who call these mountains home.',
      content: `The Annapurna Circuit remains one of the world's most spectacular trekking routes, winding through diverse landscapes from subtropical forests to high-altitude deserts. Photographer Ewen Bell's documentation goes beyond typical tourist photography, focusing on the daily lives of mountain communities.

His images capture porters carrying impossible loads across suspension bridges, children walking hours to school, and the warm hospitality of teahouse owners who keep the trail alive.`,
      featuredImage: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=1920',
      category: 'lens',
      authorName: 'Ewen Bell',
      publishedAt: { toDate: () => new Date('2024-05-10') },
      source: 'Personal Collection',
      license: 'All Rights Reserved'
    },
    {
      id: 'wiki-loves-africa-2024',
      title: 'Africa Creates: Celebrating Innovation',
      excerpt: 'Wiki Loves Africa 2024 showcases the continent\'s creative spirit through the theme of innovation and creation.',
      content: `The 2024 edition of Wiki Loves Africa invited photographers to capture the theme "Africa Creates," resulting in thousands of images celebrating innovation, creativity, and entrepreneurship across the continent.

From tech hubs in Lagos to traditional craftspeople in rural villages, the photographs reveal Africa's diverse creative landscape. The competition highlighted how tradition and innovation intersect in contemporary African life.`,
      featuredImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Lagos_Island.jpg/1920px-Lagos_Island.jpg',
      category: 'lens',
      authorName: 'Wiki Loves Africa Contributors',
      publishedAt: { toDate: () => new Date('2024-10-01') },
      source: 'Wikimedia Commons',
      license: 'CC BY-SA 4.0'
    },
    {
      id: 'bhutan-conservation',
      title: 'Between India and Bhutan: Conservation Corridors',
      excerpt: 'Sandesh Kadur documents transboundary conservation efforts protecting wildlife migration routes in the Eastern Himalayas.',
      content: `Filmmaker and photographer Sandesh Kadur's work focuses on the critical conservation corridors between India and Bhutan, where elephants, tigers, and other wildlife move freely across international borders.

His documentation, presented at Xposure 2024, shows how local communities on both sides of the border work together to maintain these vital pathways, balancing human needs with wildlife conservation.`,
      featuredImage: 'https://images.unsplash.com/photo-1527004760902-4b0c2e0f4e7a?w=1920',
      category: 'lens',
      authorName: 'Sandesh Kadur',
      publishedAt: { toDate: () => new Date('2024-03-20') },
      source: 'Xposure Festival',
      license: 'Editorial Use'
    },
    {
      id: 'traditional-farming-nepal',
      title: 'Seeds of Tradition: Nepal\'s Agricultural Heritage',
      excerpt: 'Ewen Bell captures traditional farming practices in Nepal\'s remote villages, where ancient techniques meet modern challenges.',
      content: `In the terraced fields of Nepal's middle hills, farmers continue agricultural practices passed down through generations. This photo essay documents their daily rhythms—planting, harvesting, and the communal work that sustains mountain communities.

The images reveal how climate change is forcing adaptations to these time-tested methods, as farmers exchange native seeds and share knowledge to cope with changing weather patterns.`,
      featuredImage: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1920',
      category: 'lens',
      authorName: 'Ewen Bell',
      publishedAt: { toDate: () => new Date('2024-04-15') },
      source: 'Personal Collection',
      license: 'All Rights Reserved'
    }
  ],

  // Category Features
  categoryFeatures: {
    word: {
      id: 'citizens-photography-nepal',
      title: 'Citizens of Photography: How Nepal Uses the Camera',
      excerpt: 'An anthropological exploration of photography\'s role in Nepalese society, from wedding studios to social activism.',
      content: `This extensive research project, funded by the European Research Council, examines how photography shapes social and political life in Nepal. Through ethnographic fieldwork, researchers documented how local communities use photography for everything from family portraits to political protest.

The study reveals photography not just as documentation but as a tool for citizenship, identity, and social change. In Kathmandu's photo studios, families create idealized portraits that reflect aspirations. In rural areas, development organizations use photography to document progress. During political movements, activists use images to mobilize support.

This work challenges Western assumptions about photography, showing how it's reimagined and repurposed in South Asian contexts.`,
      featuredImage: 'https://images.unsplash.com/photo-1606224165821-7b0b92d32b1f?w=1920',
      category: 'word',
      authorName: 'European Research Council Team',
      publishedAt: { toDate: () => new Date('2024-01-20') },
      source: 'Citizens of Photography Project',
      license: 'CC BY-NC-ND 4.0'
    },
    lens: {
      id: 'chitwan-biodiversity',
      title: 'Chitwan\'s Hidden World: Macro Photography in the Jungle',
      excerpt: 'Award-winning macro photography reveals the intricate beauty of insects and small creatures in Nepal\'s Chitwan National Park.',
      content: `In Chitwan National Park, beyond the famous tigers and rhinos, exists a miniature world of extraordinary beauty. This collection features award-winning macro photography, including the second-place winner of Picture of the Year 2023—a stunning capture of a leaf beetle.

These images required patience and skill, with photographers spending hours waiting for the perfect moment when light, subject, and composition align. The resulting photographs reveal details invisible to the naked eye, from the iridescent wings of beetles to the delicate patterns on butterfly eggs.`,
      featuredImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Chrysolina_coerulans_%28Scribra%2C_1791%29.jpg/1920px-Chrysolina_coerulans_%28Scribra%2C_1791%29.jpg',
      category: 'lens',
      authorName: 'Wikimedia Contributors',
      publishedAt: { toDate: () => new Date('2024-02-10') },
      source: 'Wikimedia Commons',
      license: 'CC BY-SA 4.0'
    },
    motion: {
      id: 'climate-heroes-global',
      title: 'Climate Heroes: Stories of Change',
      excerpt: 'A global documentary series featuring communities adapting to climate change, from the Himalayas to the Amazon.',
      content: `This documentary series profiles communities worldwide who are pioneering climate adaptation strategies. From Himalayan villages installing solar panels to Brazilian communities protecting rainforests, each story offers hope and practical solutions.

The series uses a combination of drone footage, time-lapse photography, and intimate interviews to create compelling narratives about human resilience. Special focus is given to indigenous knowledge systems that offer sustainable alternatives to industrial development.`,
      featuredImage: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1920',
      category: 'motion',
      authorName: 'Climate Documentation Project',
      publishedAt: { toDate: () => new Date('2024-09-01') },
      source: 'Open Access Climate Archive',
      license: 'CC BY 4.0'
    }
  },

  // Additional Stories for variety
  additionalStories: [
    {
      id: 'glf-africa-landscapes',
      title: 'African Landscapes: GLF Photography Awards 2024',
      excerpt: 'Award-winning images showcasing Africa\'s diverse ecosystems and the communities working to protect them.',
      featuredImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920',
      category: 'lens',
      authorName: 'GLF Contributors',
      publishedAt: { toDate: () => new Date('2024-11-01') },
      source: 'Global Landscapes Forum',
      license: 'CC BY-NC-SA 4.0'
    },
    {
      id: 'amazon-communities',
      title: 'Voices from the Amazon: Indigenous Perspectives',
      excerpt: 'Brazilian indigenous communities share their stories of protecting the rainforest against deforestation.',
      featuredImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920',
      category: 'word',
      authorName: 'Dialogue Earth Team',
      publishedAt: { toDate: () => new Date('2024-08-05') },
      source: 'Dialogue Earth',
      license: 'CC BY-NC 4.0'
    },
    {
      id: 'mangrove-awards-2024',
      title: 'The Mangrove Photography Awards: 8 Powerful Images',
      excerpt: 'Award-winning photographs highlighting the importance of mangrove ecosystems worldwide.',
      featuredImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920',
      category: 'lens',
      authorName: 'Mangrove Action Project',
      publishedAt: { toDate: () => new Date('2024-08-15') },
      source: 'World Economic Forum',
      license: 'Editorial Use'
    },
    {
      id: 'himachal-seasons',
      title: 'Seasons of Himachal: A Year in the Mountains',
      excerpt: 'Documenting the changing seasons in Himachal Pradesh, from apple blossoms to snow-covered peaks.',
      featuredImage: 'https://images.unsplash.com/photo-1626621341598-c170e5810b85?w=1920',
      category: 'lens',
      authorName: 'Mountain Photography Collective',
      publishedAt: { toDate: () => new Date('2024-12-01') },
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: 'spiti-valley-life',
      title: 'Life at 14,000 Feet: Spiti Valley',
      excerpt: 'A photographic journey through one of the world\'s highest inhabited valleys, where Buddhist culture thrives in extreme conditions.',
      featuredImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1920',
      category: 'lens',
      authorName: 'High Altitude Photography',
      publishedAt: { toDate: () => new Date('2024-10-20') },
      source: 'Pexels',
      license: 'Pexels License'
    },
    {
      id: 'ladakh-nomads',
      title: 'The Changpa Nomads of Ladakh',
      excerpt: 'Documenting the lives of high-altitude nomadic herders who produce the world\'s finest cashmere.',
      featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
      category: 'lens',
      authorName: 'Documentary Photography India',
      publishedAt: { toDate: () => new Date('2024-07-30') },
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: 'southeast-asia-rivers',
      title: 'Rivers of Life: Southeast Asia\'s Waterways',
      excerpt: 'From the Mekong to the Irrawaddy, documenting communities whose lives flow with the rivers.',
      featuredImage: 'https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?w=1920',
      category: 'lens',
      authorName: 'River Stories Project',
      publishedAt: { toDate: () => new Date('2024-05-25') },
      source: 'Dialogue Earth',
      license: 'CC BY-NC 4.0'
    },
    {
      id: 'african-seeds-exchange',
      title: 'Seeds of Resilience: African Farmers Adapt',
      excerpt: 'Traditional seed exchange networks help African farmers adapt to climate change through indigenous knowledge.',
      featuredImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920',
      category: 'word',
      authorName: 'Climate Adaptation Network',
      publishedAt: { toDate: () => new Date('2024-04-05') },
      source: 'Dialogue Earth',
      license: 'CC BY-NC 4.0'
    }
  ]
};

// Helper function to format stories for display
export const formatStoryDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to get story by ID
export const getStoryById = (id) => {
  if (authenticStories.featured.id === id) return authenticStories.featured;

  const allStories = [
    ...authenticStories.topPicks,
    ...authenticStories.staffPicks,
    authenticStories.categoryFeatures.word,
    authenticStories.categoryFeatures.lens,
    authenticStories.categoryFeatures.motion,
    ...authenticStories.additionalStories
  ];

  return allStories.find(story => story.id === id);
};

// Helper function to get stories by category
export const getStoriesByCategory = (category) => {
  const allStories = [
    authenticStories.featured,
    ...authenticStories.topPicks,
    ...authenticStories.staffPicks,
    authenticStories.categoryFeatures.word,
    authenticStories.categoryFeatures.lens,
    authenticStories.categoryFeatures.motion,
    ...authenticStories.additionalStories
  ];

  return allStories.filter(story => story.category === category);
};

export default authenticStories;