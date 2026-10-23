const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { connectDB } = require('../config/db');

dotenv.config();

const seedData = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    console.log('[Seeder] Clearing old collections...');
    await User.deleteMany();
    await Product.deleteMany();
    await Brand.deleteMany();
    await Category.deleteMany();
    await Coupon.deleteMany();
    await Review.deleteMany();
    await Order.deleteMany();

    console.log('[Seeder] Creating admin & customer accounts...');
    const adminUser = await User.create({
      name: 'TICKING OWNER (Master Admin)',
      email: 'admin@ticking.com',
      password: 'adminpassword123',
      phone: '+91 98765 43210',
      role: 'admin',
      isActive: true,
      deletedAt: null,
      addresses: [
        {
          fullName: 'TICKING OWNER',
          phone: '+91 98765 43210',
          address: '74 Prestige High Street, Level 14',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          isDefault: true
        }
      ]
    });

    const demoUser = await User.create({
      name: 'Dhruv Savani',
      email: 'dhruv@ticking.com',
      password: 'userpassword123',
      phone: '+91 99887 76655',
      role: 'customer',
      isActive: true,
      deletedAt: null,
      addresses: [
        {
          fullName: 'Dhruv Savani',
          phone: '+91 99887 76655',
          address: 'Villa 12, Golden Palms Boulevard',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          isDefault: true
        }
      ]
    });

    console.log('[Seeder] Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Luxury Watches',
        slug: 'luxury-watches',
        description: 'Haute horlogerie masterpieces created with precious metals and timeless artistry.',
        image: '/images/watches/nautilus.jpg'
      },
      {
        name: 'Classic Watches',
        slug: 'classic-watches',
        description: 'Timeless silhouettes and dress watch aesthetics that never go out of style.',
        image: '/images/watches/datejust.jpg'
      },
      {
        name: 'Sports Watches',
        slug: 'sports-watches',
        description: 'Engineered for high performance, deep water resistance, and chronometric endurance.',
        image: '/images/watches/submariner.jpg'
      },
      {
        name: 'Smart Watches',
        slug: 'smart-watches',
        description: 'Luxury connected timepieces combining heritage engineering with digital intellect.',
        image: '/images/watches/tag_connected.jpg'
      },
      {
        name: 'Heritage Watches',
        slug: 'heritage-watches',
        description: 'Vintage-inspired historic references celebrating centuries of horological breakthroughs.',
        image: '/images/watches/speedmaster.jpg'
      },
      {
        name: 'Limited Editions',
        slug: 'limited-editions',
        description: 'Extremely rare, numbered references for discerning collectors and connoisseurs.',
        image: '/images/watches/lange_1815.jpg'
      }
    ]);

    console.log('[Seeder] Creating prestigious brands from reference images...');
    const brands = await Brand.insertMany([
      {
        name: 'Rolex',
        slug: 'rolex',
        number: '01',
        tagline: 'A Crown for Every Achievement',
        description: 'A symbol of prestige and performance. Defining excellence through precision, innovation, and timeless design. Since 1905, Rolex has set the standard for excellence in watchmaking and continues to lead the industry.',
        foundedYear: 1905,
        country: 'Switzerland',
        headquarters: 'Geneva, Switzerland',
        founder: 'Hans Wilsdorf & Alfred Davis',
        presence: 'Worldwide',
        bannerImage: '/images/watches/submariner.jpg',
        stats: [
          { value: '118+', label: 'YEARS OF EXCELLENCE', subtext: 'Pioneering the future of watchmaking' },
          { value: '500+', label: 'PATENTS', subtext: 'Innovations that have shaped the industry' },
          { value: '100%', label: 'SWISS MADE', subtext: 'Crafted with the highest Swiss standards' },
          { value: '#1', label: 'WATCH BRAND', subtext: 'Consistently ranked among the best in the world' }
        ],
        heritageTitle: 'Built on Vision. Driven by Excellence.',
        heritageStory: 'From the invention of the Oyster case to the development of the Perpetual rotor, Rolex has been at the forefront of watchmaking innovation. Our commitment to quality, reliability, and timeless elegance defines every Rolex timepiece.',
        promises: [
          { title: 'PRECISION', description: 'Unrivaled accuracy through rigorous testing and innovation.', icon: 'CheckCircle' },
          { title: 'RELIABILITY', description: 'Built to perform in the most demanding conditions.', icon: 'ShieldCheck' },
          { title: 'CRAFTSMANSHIP', description: 'Exceptional attention to detail in every timepiece.', icon: 'Gem' },
          { title: 'LEGACY', description: 'A timeless legacy passed down through generations.', icon: 'Infinity' }
        ],
        iconicCollections: [
          { name: 'DATEJUST', description: 'The quintessential classic of watchmaking.' },
          { name: 'SUBMARINER', description: 'The original diving watch, unmatched performance.' },
          { name: 'DAYTONA', description: 'Born for endurance, designed for champions.' },
          { name: 'GMT-MASTER II', description: 'Designed for world travelers and explorers.' },
          { name: 'EXPLORER', description: 'Built for exploration, crafted for adventure.' },
          { name: 'YACHT-MASTER', description: 'The perfect companion for the open seas.' }
        ]
      },
      {
        name: 'Patek Philippe',
        slug: 'patek-philippe',
        number: '02',
        tagline: 'You never actually own a Patek Philippe. You merely look after it for the next generation.',
        description: 'A legendary Swiss watchmaker celebrated for exceptional craftsmanship, innovation, and timeless elegance since 1839.',
        foundedYear: 1839,
        country: 'Switzerland',
        headquarters: 'Geneva, Switzerland',
        founder: 'Antoni Patek & Adrien Philippe',
        presence: 'Worldwide',
        stats: [
          { value: '185+', label: 'YEARS OF ARTISTRY', subtext: 'Independent family-owned manufacture' },
          { value: '100+', label: 'COMPLICATIONS', subtext: 'World records in horological mastery' },
          { value: '100%', label: 'SEAL CERTIFIED', subtext: 'Exceeds standard Geneva Seal standards' },
          { value: 'Pinnacle', label: 'AUCTION STATUS', subtext: 'Most coveted timepieces on Earth' }
        ],
        heritageTitle: 'The Purest Expression of Haute Horlogerie.',
        heritageStory: 'Patek Philippe has uninterruptedly produced timepieces since 1839. With over 100 patents to its name, it reigns supreme as the apex of hand-finished classical watchmaking.',
        promises: [
          { title: 'INDEPENDENCE', description: 'Total creative freedom guided by horological integrity.', icon: 'ShieldCheck' },
          { title: 'TRADITION', description: 'Generations of master artisans sculpting gold and enamel.', icon: 'Infinity' },
          { title: 'INNOVATION', description: 'Groundbreaking silicon escapements and astronomical dials.', icon: 'CheckCircle' },
          { title: 'RARITY', description: 'Strictly limited annual production numbers.', icon: 'Gem' }
        ],
        iconicCollections: [
          { name: 'NAUTILUS', description: 'The pinnacle of luxury sports horology with porthole bezel.' },
          { name: 'AQUANAUT', description: 'Modern, sporty, dynamic elegance for active connoisseurs.' },
          { name: 'CALATRAVA', description: 'The definitive round dress watch archetype.' },
          { name: 'GRAND COMPLICATIONS', description: 'Perpetual calendars, minute repeaters, and celestial charts.' }
        ]
      },
      {
        name: 'Omega',
        slug: 'omega',
        number: '03',
        tagline: 'Exact Time for Life',
        description: 'Pioneers in precision and innovation, creating legendary timepieces built for exploration and adventure since 1848.',
        foundedYear: 1848,
        country: 'Switzerland',
        headquarters: 'Biel/Bienne, Switzerland',
        founder: 'Louis Brandt',
        presence: 'Worldwide',
        stats: [
          { value: '176+', label: 'YEARS OF PRECISION', subtext: 'From the ocean depths to the lunar surface' },
          { value: '15,000', label: 'GAUSS RESISTANCE', subtext: 'Master Chronometer anti-magnetic standard' },
          { value: '6x', label: 'MOON LANDINGS', subtext: 'The only watch flight-qualified by NASA' },
          { value: '30+', label: 'OLYMPIC GAMES', subtext: 'Official timekeeper of world records' }
        ],
        heritageTitle: 'First on the Moon. Master of the Deep.',
        heritageStory: 'Omega has accompanied humankind to the extremes of exploration — worn on the Moon during the Apollo missions and plunging to Mariana Trench depth records.',
        promises: [
          { title: 'CO-AXIAL', description: 'Frictionless escapement revolutionized modern precision.', icon: 'CheckCircle' },
          { title: 'MAGNETIC IMMUNITY', description: 'Withstands up to 15,000 Gauss magnetic fields.', icon: 'ShieldCheck' },
          { title: 'EXPLORATION', description: 'Tested in the vacuum of space and ocean trenches.', icon: 'Infinity' },
          { title: 'METAS CERTIFIED', description: 'Dual-certified chronometer excellence.', icon: 'Gem' }
        ],
        iconicCollections: [
          { name: 'SPEEDMASTER', description: 'The legendary Moonwatch worn by Apollo astronauts.' },
          { name: 'SEAMASTER', description: 'James Bond choice diver with helium escape valve.' },
          { name: 'CONSTELLATION', description: 'Iconic griffes claws and star insignia.' },
          { name: 'DE VILLE', description: 'Refined classical Swiss dress aesthetics.' }
        ]
      },
      {
        name: 'Cartier',
        slug: 'cartier',
        number: '04',
        tagline: 'The Jeweller of Kings and the King of Jewellers',
        description: 'Where timeless design meets unparalleled craftsmanship and distinctive design since 1847 in France.',
        foundedYear: 1847,
        country: 'France',
        headquarters: 'Paris, France',
        founder: 'Louis-François Cartier',
        presence: 'Worldwide',
        stats: [
          { value: '179+', label: 'YEARS OF MAJESTY', subtext: 'Royal warrants across European dynasties' },
          { value: '1904', label: 'FIRST WRISTWATCH', subtext: 'Invented for aviator Alberto Santos-Dumont' },
          { value: '100%', label: 'ICONIC SILHOUETTES', subtext: 'Unmistakable Roman numerals and cabochon crown' },
          { value: 'Top 3', label: 'GLOBAL PRESTIGE', subtext: 'Renowned worldwide for design symmetry' }
        ],
        heritageTitle: 'Sculptors of Geometric Beauty.',
        heritageStory: 'Cartier transformed wristwatches into works of art. From the Santos to the Tank, its geometric harmony and blue sapphire cabochons are unmistakable.',
        promises: [
          { title: 'SHAPE ARCHITECTURE', description: 'Square, curved, and asymmetric silhouettes.', icon: 'Gem' },
          { title: 'SAPPHIRE CABOCHON', description: 'Signature blue gemstone embedded in every winding crown.', icon: 'ShieldCheck' },
          { title: 'PARISIAN CHIC', description: 'Uncompromising refinement and elegance.', icon: 'CheckCircle' },
          { title: 'ENDURING BEAUTY', description: 'Forms that transcend trends across centuries.', icon: 'Infinity' }
        ],
        iconicCollections: [
          { name: 'SANTOS DE CARTIER', description: 'The world first purpose-built pilot watch.' },
          { name: 'TANK', description: 'Inspired by Renault combat tank lines, pure Art Deco.' },
          { name: 'BALLON BLEU', description: 'Rounded bubble silhouette with guarded crown.' },
          { name: 'PANTHÈRE', description: 'Liquid-link bracelet and jewellery timekeeping.' }
        ]
      },
      {
        name: 'Audemars Piguet',
        slug: 'audemars-piguet',
        number: '05',
        tagline: 'To Break the Rules, You Must First Master Them',
        description: 'A celebrated Swiss manufacturer known for innovative complications, iconic designs, and fine craftsmanship in Le Brassus since 1875.',
        foundedYear: 1875,
        country: 'Switzerland',
        headquarters: 'Le Brassus, Switzerland',
        founder: 'Jules Louis Audemars & Edward Auguste Piguet',
        presence: 'Worldwide',
        stats: [
          { value: '150+', label: 'YEARS IN JOUX VALLEY', subtext: 'Continuously owned by founding families' },
          { value: '1972', label: 'ROYAL OAK DEBUT', subtext: 'Created luxury steel sports watch genre' },
          { value: '100%', label: 'HAND FINISHED', subtext: 'Petite tapisserie dial hand guilloche' },
          { value: '#1', label: 'AVANT-GARDE', subtext: 'Architectural ceramic and forged carbon' }
        ],
        heritageTitle: 'Disrupting Tradition with Masterful Haute Horlogerie.',
        heritageStory: 'Audemars Piguet revolutionized modern watch design in 1972 by collaborating with Gérald Genta to birth the octagonal Royal Oak, forever changing horological luxury.',
        promises: [
          { title: 'OCTAGONAL BEZEL', description: 'Eight exposed hexagonal screws in satin-brushed gold.', icon: 'ShieldCheck' },
          { title: 'TAPISSERIE PATTERN', description: 'Hand-turned dial guilloché motifs.', icon: 'Gem' },
          { title: 'INNOVATION', description: 'Material mastery including ceramic and Frosted Gold.', icon: 'CheckCircle' },
          { title: 'INDEPENDENCE', description: 'Family owned since inception in Vallée de Joux.', icon: 'Infinity' }
        ],
        iconicCollections: [
          { name: 'ROYAL OAK', description: 'The definitive octagonal luxury sports timepiece.' },
          { name: 'ROYAL OAK OFFSHORE', description: 'Bolder, larger chronograph with extreme shock resistance.' },
          { name: 'CODE 11.59', description: 'Curved sapphire crystal and complex octagonal midcase.' },
          { name: 'ROYAL OAK CONCEPT', description: 'Futuristic tourbillons and high-tech alloy experimentation.' }
        ]
      },
      {
        name: 'Vacheron Constantin',
        slug: 'vacheron-constantin',
        number: '06',
        tagline: 'Do Better If Possible, And That Is Always Possible',
        description: 'One of the world oldest watch manufacturers, renowned for haute horlogerie and uninterrupted production since 1755.',
        foundedYear: 1755,
        country: 'Switzerland',
        headquarters: 'Geneva, Switzerland',
        founder: 'Jean-Marc Vacheron',
        presence: 'Worldwide',
        stats: [
          { value: '270+', label: 'YEARS UNINTERRUPTED', subtext: 'The oldest watch manufacture in continuous history' },
          { value: '57', label: 'COMPLICATIONS', subtext: 'Created Ref 57260, the most complex watch ever made' },
          { value: '100%', label: 'GENEVA HALLMARK', subtext: 'Poinçon de Genève certified horology' },
          { value: 'Holy Trinity', label: 'WATCHMAKING TRIO', subtext: 'Revered founding pillar of haute horlogerie' }
        ],
        heritageTitle: '270 Years of Relentless Horological Artistry.',
        heritageStory: 'Founded in Geneva in 1755, Vacheron Constantin has crafted bespoke timepieces for kings, queens, and emperors, maintaining an unbroken tradition of handcrafted excellence.',
        promises: [
          { title: 'MALTESE CROSS', description: 'The historic emblem of barrel precision and dignity.', icon: 'ShieldCheck' },
          { title: 'GENEVA SEAL', description: 'Stringent standard of provenance and finishing.', icon: 'Gem' },
          { title: 'BESPOKE ART', description: 'Les Cabinotiers custom one-of-a-kind commissions.', icon: 'CheckCircle' },
          { title: 'ENDURING VALUE', description: 'Over two centuries of museum-grade mechanical legacy.', icon: 'Infinity' }
        ],
        iconicCollections: [
          { name: 'OVERSEAS', description: 'High-performance travel watch with interchangeable strap system.' },
          { name: 'PATRIMONY', description: 'Pure circular minimalism inspired by 1950s golden age.' },
          { name: 'TRADITIONNELLE', description: 'Classical step-bezel architecture housing complex calibers.' },
          { name: 'HISTORIQUES', description: 'Legendary icons revived from 20th century archives.' }
        ]
      },
      {
        name: 'IWC Schaffhausen',
        slug: 'iwc-schaffhausen',
        number: '07',
        tagline: 'Probus Scafusia — Good, Solid Craftsmanship from Schaffhausen',
        description: 'Engineering beyond time. Designed for those who value precision and technical excellence since 1868.',
        foundedYear: 1868,
        country: 'Switzerland',
        headquarters: 'Schaffhausen, Switzerland',
        founder: 'Florentine Ariosto Jones',
        presence: 'Worldwide',
        stats: [
          { value: '156+', label: 'YEARS OF ENGINEERING', subtext: 'Blending American industrial spirit with Swiss mastery' },
          { value: '7-Day', label: 'POWER RESERVE', subtext: 'Pellaton automatic winding system' },
          { value: '100%', label: 'PILOT STANDARD', subtext: 'Magnetic protection soft-iron inner case' },
          { value: 'Pioneer', label: 'CERATANIUM', subtext: 'Proprietary titanium and ceramic fusion' }
        ],
        heritageTitle: 'Engineered for Performance. Refined for Connoisseurs.',
        heritageStory: 'Founded on the banks of the Rhine in northeastern Switzerland, IWC pioneered the Big Pilot and Portugieser collections for navigators and engineers.',
        promises: [
          { title: 'PELLATON WINDING', description: 'Ultra-efficient bi-directional pawl winding system.', icon: 'CheckCircle' },
          { title: 'PILOT HERITAGE', description: 'Legible cock-pit instrument gauges for aviators.', icon: 'ShieldCheck' },
          { title: 'PERPETUAL CALENDAR', description: 'Kurt Klaus legendary synchronized 4-digit calendar.', icon: 'Infinity' },
          { title: 'SUSTAINABILITY', description: 'Ethically sourced gold and recycled packaging.', icon: 'Gem' }
        ],
        iconicCollections: [
          { name: 'PORTUGIESER', description: 'Iconic marine pocket-watch precision on the wrist.' },
          { name: 'PILOT WATCHES', description: 'Authentic cockpit utility from Mark XX to Big Pilot.' },
          { name: 'PORTOFINO', description: 'Mediterranean relaxed elegance and roman numerals.' },
          { name: 'INGENIEUR', description: 'Gérald Genta integrated sports watch with grid dial.' }
        ]
      },
      {
        name: 'Breitling',
        slug: 'breitling',
        number: '08',
        tagline: 'Instruments for Professionals',
        description: 'Built for adventure. Engineered for performance and precision since 1884 in Saint-Imier.',
        foundedYear: 1884,
        country: 'Switzerland',
        headquarters: 'Grenchen, Switzerland',
        founder: 'Léon Breitling',
        presence: 'Worldwide',
        stats: [
          { value: '140+', label: 'YEARS OF CHRONOGRAPHS', subtext: 'Invented independent chronograph pushers' },
          { value: '1952', label: 'CIRCULAR SLIDE RULE', subtext: 'Navitimer flight computer on the wrist' },
          { value: '100%', label: 'COSC CERTIFIED', subtext: 'Every movement independently tested' },
          { value: '#1', label: 'AVIATION ICON', subtext: 'Official supplier to worldwide air forces' }
        ],
        heritageTitle: 'The Master of the Modern Chronograph.',
        heritageStory: 'Léon Breitling dedicated his life to measuring short time spans. Breitling invented the separate stop/start pusher and the 4 o clock reset button.',
        promises: [
          { title: 'SLIDE RULE', description: 'Circular aviation calculation bezel for flight plans.', icon: 'CheckCircle' },
          { title: 'MANUFACTURE CALIBRE', description: 'In-house B01 chronograph with column wheel.', icon: 'ShieldCheck' },
          { title: 'CHRONOMETER', description: '100% certified by Swiss COSC testing.', icon: 'Gem' },
          { title: 'SEA, AIR & LAND', description: 'High versatility across oceans and skies.', icon: 'Infinity' }
        ],
        iconicCollections: [
          { name: 'NAVITIMER', description: 'The definitive aviation chronograph since 1952.' },
          { name: 'SUPEROCEAN', description: 'High-visibility vintage dive watch with bold hands.' },
          { name: 'CHRONOMAT', description: 'Rouleaux bracelet and rider tabs on bezel.' },
          { name: 'PREMIER', description: 'Sophisticated dress chronographs honoring founder legacy.' }
        ]
      }
    ]);

    console.log('[Seeder] Creating luxury watch products with INR pricing...');
    const productsData = [
      {
        name: 'Rolex Submariner Date 41mm',
        slug: 'rolex-submariner-date-41mm',
        brand: 'Rolex',
        collectionName: 'Submariner',
        category: 'Sports Watches',
        price: 1245000,
        originalPrice: 1380000,
        stock: 12,
        sku: 'TCK-RLX-SUB01',
        images: [
          '/images/watches/submariner.jpg',
          '/images/watches/hero_chronograph.jpg'
        ],
        description: 'The Rolex Submariner Date in Oystersteel with a Cerachrom bezel insert in black ceramic and a black dial with large luminescent hour markers. An absolute reference among diving watches.',
        shortDescription: 'Oystersteel, 41 mm, Cerachrom bezel, Waterproof to 300 metres.',
        rating: 4.9,
        numReviews: 28,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        specifications: {
          caseMaterial: 'Oystersteel 904L',
          strapMaterial: 'Oyster, flat three-piece links with Glidelock',
          movement: 'Calibre 3235, Manufacture Rolex, Automatic',
          waterResistance: '300 metres / 1,000 feet',
          dialColor: 'Intense Black Dial',
          caseSize: '41 mm',
          warranty: '5 Years International Rolex Guarantee',
          gender: "Men's"
        }
      },
      {
        name: 'Rolex Cosmograph Daytona 40mm Gold',
        slug: 'rolex-cosmograph-daytona-40mm-gold',
        brand: 'Rolex',
        collectionName: 'Daytona',
        category: 'Luxury Watches',
        price: 3480000,
        originalPrice: 3750000,
        stock: 4,
        sku: 'TCK-RLX-DAY02',
        images: [
          '/images/watches/daytona.jpg',
          '/images/watches/hero_chronograph.jpg'
        ],
        description: 'The Rolex Cosmograph Daytona in 18 ct yellow gold with a golden dial and an Oysterflex bracelet, featuring a black Cerachrom bezel with tachymetric scale.',
        shortDescription: '18 ct Yellow Gold, Oysterflex bracelet, Black Cerachrom tachymetric bezel.',
        rating: 5.0,
        numReviews: 19,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        specifications: {
          caseMaterial: '18 ct Yellow Gold',
          strapMaterial: 'Oysterflex flexible metal blades overmoulded with elastomer',
          movement: 'Calibre 4131, Chronograph Automatic',
          waterResistance: '100 metres / 330 feet',
          dialColor: 'Sunray Champagne Gold',
          caseSize: '40 mm',
          warranty: '5 Years International Warranty',
          gender: "Men's"
        }
      },
      {
        name: 'Rolex Datejust 41 Fluted Bezel',
        slug: 'rolex-datejust-41-fluted-bezel',
        brand: 'Rolex',
        collectionName: 'Datejust',
        category: 'Classic Watches',
        price: 1120000,
        originalPrice: 1200000,
        stock: 15,
        sku: 'TCK-RLX-DJ03',
        images: [
          '/images/watches/datejust.jpg',
          '/images/watches/submariner.jpg'
        ],
        description: 'The archetype of the modern watch. The Oyster Perpetual Datejust 41 in White Rolesor with a slate dial, fluted bezel, and a Jubilee bracelet.',
        shortDescription: 'White Rolesor (Oystersteel and White Gold), Jubilee bracelet, Slate dial.',
        rating: 4.8,
        numReviews: 34,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: 'White Rolesor (Oystersteel & 18 ct White Gold)',
          strapMaterial: 'Jubilee, five-piece links',
          movement: 'Calibre 3235, Manufacture Rolex',
          waterResistance: '100 metres / 330 feet',
          dialColor: 'Wimbledon Slate Grey',
          caseSize: '41 mm',
          warranty: '5 Years International Warranty',
          gender: "Unisex"
        }
      },
      {
        name: 'Patek Philippe Nautilus 5711/1R',
        slug: 'patek-philippe-nautilus-5711-1r',
        brand: 'Patek Philippe',
        collectionName: 'Nautilus',
        category: 'Luxury Watches',
        price: 9450000,
        originalPrice: 9900000,
        stock: 2,
        sku: 'TCK-PP-NAUT01',
        images: [
          '/images/watches/nautilus.jpg',
          '/images/watches/daytona.jpg'
        ],
        description: 'With the rounded octagonal shape of its bezel and the ingenious porthole construction of its case, the Nautilus has epitomized the elegant sports watch since 1976. Hand-finished 18K rose gold with warm brown sunburst dial.',
        shortDescription: '18K Rose Gold, Self-winding Caliber 26-330 S C, Sapphire crystal case back.',
        rating: 5.0,
        numReviews: 14,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        specifications: {
          caseMaterial: '18K Rose Gold',
          strapMaterial: 'Integrated 18K Rose Gold with Nautilus fold-over clasp',
          movement: 'Caliber 26-330 S C Self-winding mechanical',
          waterResistance: '120 metres / 400 feet',
          dialColor: 'Light/Dark Brown Gradated Sunburst',
          caseSize: '40 mm',
          warranty: 'Patek Philippe Seal Lifetime Heritage Registry',
          gender: "Men's"
        }
      },
      {
        name: 'Audemars Piguet Royal Oak Offshore Diver',
        slug: 'audemars-piguet-royal-oak-offshore-diver',
        brand: 'Audemars Piguet',
        collectionName: 'Royal Oak Offshore',
        category: 'Sports Watches',
        price: 2890000,
        originalPrice: 3100000,
        stock: 6,
        sku: 'TCK-AP-DIV01',
        images: [
          '/images/watches/ap_diver.jpg',
          '/images/watches/submariner.jpg'
        ],
        description: 'The Royal Oak Offshore Diver features a Méga Tapisserie black dial with luminescent white gold hour-markers and hands, rotating inner bezel for diving duration, and interchangeable strap system.',
        shortDescription: 'Stainless Steel 42 mm, Méga Tapisserie dial, 300m dive resistance.',
        rating: 4.9,
        numReviews: 22,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: 'Stainless Steel with black ceramic screw-locked crowns',
          strapMaterial: 'Interchangeable black rubber strap with AP pin buckle',
          movement: 'Manufacture Calibre 4308 Automatic',
          waterResistance: '300 metres / 1,000 feet',
          dialColor: 'Black Méga Tapisserie',
          caseSize: '42 mm',
          warranty: '5 Years Extended Warranty',
          gender: "Men's"
        }
      },
      {
        name: 'Omega Speedmaster Professional Moonwatch',
        slug: 'omega-speedmaster-professional-moonwatch',
        brand: 'Omega',
        collectionName: 'Speedmaster',
        category: 'Heritage Watches',
        price: 760000,
        originalPrice: 820000,
        stock: 18,
        sku: 'TCK-OMG-MOON01',
        images: [
          '/images/watches/speedmaster.jpg',
          '/images/watches/navitimer.jpg'
        ],
        description: 'The Speedmaster Moonwatch is one of the world most iconic timepieces. Having been a part of all six moon landings, this legendary chronograph is an impressive representation of Omega adventurous pioneering spirit.',
        shortDescription: 'Co-Axial Master Chronometer Calibre 3861, Hesalite glass, Black step dial.',
        rating: 4.9,
        numReviews: 45,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        specifications: {
          caseMaterial: 'Stainless Steel with anodised aluminium bezel ring',
          strapMaterial: 'Brushed-and-polished five-arched-links per row bracelet',
          movement: 'Manual-winding Calibre 3861, Co-Axial Master Chronometer',
          waterResistance: '50 metres / 167 feet',
          dialColor: 'Matte Step Black',
          caseSize: '42 mm',
          warranty: '5 Years International Warranty',
          gender: "Men's"
        }
      },
      {
        name: 'Cartier Santos de Cartier Large Steel',
        slug: 'cartier-santos-de-cartier-large-steel',
        brand: 'Cartier',
        collectionName: 'Santos de Cartier',
        category: 'Classic Watches',
        price: 785000,
        originalPrice: 840000,
        stock: 9,
        sku: 'TCK-CRT-SANT01',
        images: [
          '/images/watches/santos.jpg',
          '/images/watches/datejust.jpg'
        ],
        description: 'Santos watch, large model, mechanical movement with automatic winding 1847 MC. Steel case, 7-sided crown set with a faceted synthetic spinel, silvered opaline dial, blued-steel sword-shaped hands.',
        shortDescription: 'QuickSwitch interchangeable bracelet system and SmartLink sizing.',
        rating: 4.8,
        numReviews: 18,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: 'Steel case, 7-sided crown with synthetic blue faceted spinel',
          strapMaterial: 'Steel bracelet with SmartLink adjustment & calfskin strap',
          movement: 'Manufacture Calibre 1847 MC Automatic',
          waterResistance: '100 metres / 330 feet',
          dialColor: 'Silvered Opaline Dial with Roman Numerals',
          caseSize: '39.8 mm',
          warranty: 'Up to 8 Years with Cartier Care',
          gender: "Unisex"
        }
      },
      {
        name: 'Vacheron Constantin Overseas Dual Time',
        slug: 'vacheron-constantin-overseas-dual-time',
        brand: 'Vacheron Constantin',
        collectionName: 'Overseas',
        category: 'Luxury Watches',
        price: 3450000,
        originalPrice: 3800000,
        stock: 3,
        sku: 'TCK-VC-OVER01',
        images: [
          '/images/watches/overseas.jpg',
          '/images/watches/nautilus.jpg'
        ],
        description: 'Dedicated to the spirit of travel, this steel watch houses an automatic movement with a 54-hour power reserve and a dual time zone complication combined with day-night indication.',
        shortDescription: 'Geneva Seal certified, interchangeable 3 straps included (steel, rubber, leather).',
        rating: 5.0,
        numReviews: 11,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: 'Stainless Steel with Maltese cross bezel motif',
          strapMaterial: 'Triple interchangeable system: Steel, Blue Rubber, Mississippiensis Alligator',
          movement: 'Calibre 5110 DT Automatic, Hallmark of Geneva',
          waterResistance: '150 metres / 500 feet',
          dialColor: 'Translucent Blue Lacquered Dial',
          caseSize: '41 mm',
          warranty: 'Vacheron Constantin International Guarantee',
          gender: "Men's"
        }
      },
      {
        name: 'IWC Portugieser Chronograph Gold',
        slug: 'iwc-portugieser-chronograph-gold',
        brand: 'IWC Schaffhausen',
        collectionName: 'Portugieser',
        category: 'Classic Watches',
        price: 1840000,
        originalPrice: 1980000,
        stock: 5,
        sku: 'TCK-IWC-PORT01',
        images: [
          '/images/watches/hero_chronograph.jpg',
          '/images/watches/lange_1815.jpg'
        ],
        description: 'An open, clear and functional dial with two recessed totalizers, appliqué Arabic numerals and slim feuille hands. The Portugieser Chronograph is one of IWC most coveted icons.',
        shortDescription: '18 ct 5N Gold case, IWC-manufactured 69355 calibre, Santoni alligator strap.',
        rating: 4.8,
        numReviews: 16,
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: '18 ct 5N Gold with see-through sapphire-glass back',
          strapMaterial: 'Brown alligator leather strap by Santoni',
          movement: '69355 Calibre, IWC-manufactured Automatic Chronograph',
          waterResistance: '30 metres / 100 feet',
          dialColor: 'Silver-plated with golden hands',
          caseSize: '41 mm',
          warranty: '8 Years with My IWC Registration',
          gender: "Men's"
        }
      },
      {
        name: 'Breitling Navitimer B01 Chronograph 43',
        slug: 'breitling-navitimer-b01-chronograph-43',
        brand: 'Breitling',
        collectionName: 'Navitimer',
        category: 'Sports Watches',
        price: 890000,
        originalPrice: 950000,
        stock: 8,
        sku: 'TCK-BRT-NAVI01',
        images: [
          '/images/watches/navitimer.jpg',
          '/images/watches/speedmaster.jpg'
        ],
        description: 'Breitling iconic pilot watch for the journey. For 70 years, the Navitimer has been beloved by aviators and tastemakers alike. Features the legendary circular slide rule and manufacture B01 column-wheel movement.',
        shortDescription: 'Breitling 01 Manufacture movement, 70-hour power reserve, COSC certified.',
        rating: 4.9,
        numReviews: 25,
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: false,
        specifications: {
          caseMaterial: 'Stainless Steel with bidirectional slide rule bezel',
          strapMaterial: 'Stainless steel 7-row Navitimer bracelet',
          movement: 'Breitling 01 (Manufacture) Self-winding mechanical',
          waterResistance: '30 metres / 100 feet',
          dialColor: 'Emerald Green with Black Subdials',
          caseSize: '43 mm',
          warranty: '5 Years International Breitling Warranty',
          gender: "Men's"
        }
      },
      {
        name: 'TAG Heuer Connected Calibre E4 Luxury Smartwatch',
        slug: 'tag-heuer-connected-calibre-e4',
        brand: 'TAG Heuer',
        collectionName: 'Connected',
        category: 'Smart Watches',
        price: 245000,
        originalPrice: 280000,
        stock: 14,
        sku: 'TCK-TAG-CONN01',
        images: [
          '/images/watches/tag_connected.jpg',
          '/images/watches/ap_diver.jpg'
        ],
        description: 'Luxury meets high-tech performance. Titanium Grade 2 case with DLC coating, high-definition OLED display, sports biometric sensors, and exclusive luxury digital watch faces.',
        shortDescription: 'Grade 2 Titanium, OLED touchscreen, Wear OS by Google, Heart rate & GPS.',
        rating: 4.7,
        numReviews: 31,
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        specifications: {
          caseMaterial: 'Titanium Grade 2 Black DLC with Ceramic Bezel',
          strapMaterial: 'Black perforated rubber strap with titanium folding clasp',
          movement: 'Wear OS / Qualcomm Snapdragon Wear 4100+',
          waterResistance: '50 metres / 167 feet',
          dialColor: 'Ultra-crisp Full Color OLED Screen',
          caseSize: '45 mm',
          warranty: '2 Years Manufacturer Warranty',
          gender: "Unisex"
        }
      },
      {
        name: 'A. Lange & Söhne 1815 Up/Down Platinum',
        slug: 'a-lange-soehne-1815-up-down',
        brand: 'A. Lange & Söhne',
        collectionName: '1815',
        category: 'Limited Editions',
        price: 4250000,
        originalPrice: 4600000,
        stock: 1,
        sku: 'TCK-ALS-181501',
        images: [
          '/images/watches/lange_1815.jpg',
          '/images/watches/santos.jpg'
        ],
        description: 'A tribute to Ferdinand Adolph Lange, who was born in 1815. Solid platinum case with solid silver dial, blued steel hands, railway-track minute scale, and traditional AUF/AB power-reserve indicator.',
        shortDescription: '950 Platinum, Glashütte three-quarter plate in untreated German silver.',
        rating: 5.0,
        numReviews: 8,
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: false,
        specifications: {
          caseMaterial: '950 Platinum',
          strapMaterial: 'Hand-stitched black alligator leather with platinum buckle',
          movement: 'Lange manufacture calibre L051.2, manually wound',
          waterResistance: '30 metres / 100 feet',
          dialColor: 'Solid Silver Argenté',
          caseSize: '39 mm',
          warranty: 'Lifetime Glashütte Archive Provenance Certificate',
          gender: "Men's"
        }
      }
    ];

    const insertedProducts = await Product.insertMany(productsData);

    console.log('[Seeder] Creating promotional coupons...');
    await Coupon.insertMany([
      {
        code: 'ROYAL10',
        discountType: 'percentage',
        discountAmount: 10,
        minOrderAmount: 200000,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'TIMELESS50K',
        discountType: 'fixed',
        discountAmount: 50000,
        minOrderAmount: 500000,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'WELCOME5',
        discountType: 'percentage',
        discountAmount: 5,
        minOrderAmount: 50000,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      }
    ]);

    console.log('[Seeder] Creating sample customer reviews...');
    await Review.insertMany([
      {
        product: insertedProducts[0]._id,
        user: demoUser._id,
        userName: 'Dhruv Savani',
        rating: 5,
        comment: 'An absolute grail watch. The craftsmanship of TICKING and the delivery experience in Geneva bespoke packaging was beyond exceptional.',
        verifiedPurchase: true,
        status: 'Approved'
      },
      {
        product: insertedProducts[1]._id,
        user: adminUser._id,
        userName: 'TICKING OWNER',
        rating: 5,
        comment: 'The yellow gold Daytona has unmatched presence. Chronometer accuracy is pinpoint to within 1 second per day.',
        verifiedPurchase: true,
        status: 'Approved'
      },
      {
        product: insertedProducts[5]._id,
        user: demoUser._id,
        userName: 'Dhruv Savani',
        rating: 5,
        comment: 'Wearing the Moonwatch is holding a piece of history. Solid build, timeless design.',
        verifiedPurchase: true,
        status: 'Approved'
      }
    ]);

    console.log('[Seeder] Creating sample orders...');
    await Order.create({
      orderId: 'TCK-2026-88192',
      user: demoUser._id,
      items: [
        {
          product: insertedProducts[0]._id,
          name: insertedProducts[0].name,
          brand: insertedProducts[0].brand,
          image: insertedProducts[0].images[0],
          price: insertedProducts[0].price,
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: 'Dhruv Savani',
        email: 'dhruv@ticking.com',
        phone: '+91 99887 76655',
        address: 'Villa 12, Golden Palms Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      paymentMethod: 'Online Payment',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      subtotal: 1245000,
      discount: 50000,
      shippingFee: 0,
      tax: 59750,
      grandTotal: 1254750,
      couponCode: 'TIMELESS50K',
      trackingNumber: 'TCK-EXP-992144',
      notes: 'Bespoke insured white-glove delivery'
    });

    console.log('[Seeder] Database successfully seeded with luxury catalog!');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seeder] Failed to seed database:', error);
    if (shouldExit) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };

