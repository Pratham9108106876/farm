import sql from "./db"

// Function to initialize the database schema
export async function initializeDatabase() {
  try {
    console.log("Checking database schema...")

    // Check if crops table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'crops'
      );
    `

    // If tables don't exist, create them
    if (!tableExists[0].exists) {
      console.log("Creating database schema...")

      // Create crops table
      await sql`
        CREATE TABLE IF NOT EXISTS crops (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          scientific_name VARCHAR(255),
          description TEXT,
          image_url VARCHAR(255)
        )
      `

      // Create diseases table
      await sql`
        CREATE TABLE IF NOT EXISTS diseases (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          crop_id INTEGER REFERENCES crops(id),
          symptoms TEXT,
          causes TEXT,
          prevention TEXT,
          organic_treatment TEXT,
          chemical_treatment TEXT,
          image_url VARCHAR(255)
        )
      `

      // Create diagnoses table
      await sql`
        CREATE TABLE IF NOT EXISTS diagnoses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          crop_id INTEGER,
          disease_id INTEGER,
          image_url TEXT,
          confidence_score FLOAT,
          notes TEXT,
          is_offline BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Insert expanded list of crops
      await sql`
        INSERT INTO crops (name, scientific_name, description, image_url)
        VALUES 
          ('Tomato', 'Solanum lycopersicum', 'Common garden vegetable with red fruits', '/images/crops/tomato.jpg'),
          ('Potato', 'Solanum tuberosum', 'Root vegetable and a staple food', '/images/crops/potato.jpg'),
          ('Rice', 'Oryza sativa', 'Staple food for more than half of the world population', '/images/crops/rice.jpg'),
          ('Wheat', 'Triticum aestivum', 'Cereal grain cultivated worldwide', '/images/crops/wheat.jpg'),
          ('Corn', 'Zea mays', 'Cereal grain domesticated in Mesoamerica', '/images/crops/corn.jpg'),
          ('Cotton', 'Gossypium hirsutum', 'Soft, fluffy staple fiber that grows in a boll', '/images/crops/cotton.jpg'),
          ('Sugarcane', 'Saccharum officinarum', 'Tall perennial grass used for sugar production', '/images/crops/sugarcane.jpg'),
          ('Soybean', 'Glycine max', 'Legume species native to East Asia', '/images/crops/soybean.jpg'),
          ('Chickpea', 'Cicer arietinum', 'Annual legume of the family Fabaceae', '/images/crops/chickpea.jpg'),
          ('Onion', 'Allium cepa', 'Vegetable that is the most widely cultivated species of the genus Allium', '/images/crops/onion.jpg'),
          ('Chili Pepper', 'Capsicum annuum', 'Fruit of plants from the genus Capsicum', '/images/crops/chili.jpg'),
          ('Eggplant', 'Solanum melongena', 'Plant species in the nightshade family Solanaceae', '/images/crops/eggplant.jpg'),
          ('Okra', 'Abelmoschus esculentus', 'Flowering plant in the mallow family', '/images/crops/okra.jpg'),
          ('Cucumber', 'Cucumis sativus', 'Widely-cultivated creeping vine plant in the Cucurbitaceae family', '/images/crops/cucumber.jpg'),
          ('Mango', 'Mangifera indica', 'Juicy stone fruit belonging to the genus Mangifera', '/images/crops/mango.jpg'),
          ('Banana', 'Musa', 'Edible fruit produced by several kinds of large herbaceous flowering plants', '/images/crops/banana.jpg'),
          ('Coconut', 'Cocos nucifera', 'Member of the palm tree family', '/images/crops/coconut.jpg'),
          ('Groundnut', 'Arachis hypogaea', 'Legume crop grown mainly for its edible seeds', '/images/crops/groundnut.jpg'),
          ('Mustard', 'Brassica juncea', 'Species of mustard plant', '/images/crops/mustard.jpg'),
          ('Turmeric', 'Curcuma longa', 'Flowering plant of the ginger family', '/images/crops/turmeric.jpg')
      `

      // Insert expanded list of diseases
      await sql`
        INSERT INTO diseases (name, crop_id, symptoms, causes, organic_treatment, chemical_treatment)
        VALUES 
          ('Early Blight', 1, 'Brown spots with concentric rings on leaves', 'Alternaria solani fungus', 'Remove infected leaves; Apply neem oil; Crop rotation', 'Apply copper-based fungicide; Use chlorothalonil'),
          ('Late Blight', 1, 'Water-soaked spots on leaves, white fuzzy growth', 'Phytophthora infestans', 'Remove infected plants; Improve air circulation; Apply compost tea', 'Apply copper-based fungicide; Use mancozeb'),
          ('Septoria Leaf Spot', 1, 'Small, circular spots with dark borders on leaves', 'Septoria lycopersici fungus', 'Remove infected leaves; Mulch around plants; Avoid overhead watering', 'Apply copper-based fungicide; Use chlorothalonil'),
          ('Tomato Yellow Leaf Curl Virus', 1, 'Yellowing and curling of leaves, stunted growth', 'Virus transmitted by whiteflies', 'Use reflective mulch; Plant resistant varieties; Control whiteflies with neem oil', 'No effective chemical treatment; Use insecticides to control whiteflies'),
          
          ('Bacterial Wilt', 2, 'Wilting of plants, browning of vascular tissue', 'Ralstonia solanacearum bacteria', 'Crop rotation; Use disease-free seed potatoes; Improve drainage', 'No effective chemical control; Preventive measures are key'),
          ('Late Blight', 2, 'Dark, water-soaked spots on leaves and stems', 'Phytophthora infestans', 'Remove infected plants; Improve air circulation; Apply compost tea', 'Apply copper-based fungicide; Use mancozeb'),
          ('Early Blight', 2, 'Dark brown to black lesions with concentric rings', 'Alternaria solani fungus', 'Crop rotation; Remove infected plants; Apply compost tea', 'Apply chlorothalonil; Use azoxystrobin'),
          ('Potato Scab', 2, 'Rough, corky patches on tuber surface', 'Streptomyces scabies bacteria', 'Maintain soil pH below 5.5; Use resistant varieties; Crop rotation', 'No effective chemical control; Preventive measures are key'),
          
          ('Blast Disease', 3, 'Diamond-shaped lesions on leaves', 'Magnaporthe oryzae fungus', 'Use resistant varieties; Balanced fertilization; Proper water management', 'Apply azoxystrobin; Use tricyclazole'),
          ('Bacterial Leaf Blight', 3, 'Water-soaked lesions that turn yellow to white', 'Xanthomonas oryzae bacteria', 'Use resistant varieties; Balanced fertilization; Proper drainage', 'Apply copper-based bactericides; Use streptomycin sulfate'),
          ('Brown Spot', 3, 'Brown lesions on leaves and glumes', 'Cochliobolus miyabeanus fungus', 'Balanced fertilization; Proper water management; Seed treatment', 'Apply propiconazole; Use carbendazim'),
          ('Sheath Blight', 3, 'Lesions on leaf sheaths, irregular spots on leaves', 'Rhizoctonia solani fungus', 'Reduce plant density; Balanced fertilization; Proper drainage', 'Apply azoxystrobin; Use hexaconazole'),
          
          ('Rust', 4, 'Reddish-brown pustules on leaves and stems', 'Puccinia species fungi', 'Crop rotation; Remove volunteer wheat; Plant resistant varieties', 'Apply propiconazole; Use tebuconazole'),
          ('Powdery Mildew', 4, 'White powdery growth on leaves and stems', 'Blumeria graminis fungus', 'Crop rotation; Proper spacing; Balanced fertilization', 'Apply sulfur; Use tebuconazole'),
          ('Fusarium Head Blight', 4, 'Bleached spikelets on the head, pink or orange spore masses', 'Fusarium graminearum fungus', 'Crop rotation; Plant resistant varieties; Proper timing of harvest', 'Apply metconazole; Use prothioconazole'),
          ('Septoria Tritici Blotch', 4, 'Irregular brown lesions on leaves', 'Zymoseptoria tritici fungus', 'Crop rotation; Remove crop debris; Plant resistant varieties', 'Apply azoxystrobin; Use epoxiconazole'),
          
          ('Corn Smut', 5, 'Galls on ears, tassels, and leaves', 'Ustilago maydis fungus', 'Crop rotation; Remove galls before they rupture; Plant resistant varieties', 'Apply fungicides with azoxystrobin; Use propiconazole'),
          ('Gray Leaf Spot', 5, 'Rectangular lesions on leaves', 'Cercospora zeae-maydis fungus', 'Crop rotation; Plant resistant varieties; Proper tillage', 'Apply azoxystrobin; Use pyraclostrobin'),
          ('Northern Corn Leaf Blight', 5, 'Long, elliptical lesions on leaves', 'Exserohilum turcicum fungus', 'Crop rotation; Plant resistant varieties; Remove crop debris', 'Apply azoxystrobin; Use propiconazole'),
          ('Common Rust', 5, 'Small, circular to elongated, reddish-brown pustules', 'Puccinia sorghi fungus', 'Plant resistant varieties; Early planting; Balanced fertilization', 'Apply azoxystrobin; Use propiconazole'),
          
          ('Cotton Leaf Curl Virus', 6, 'Upward curling of leaves, thickened veins, stunted growth', 'Virus transmitted by whiteflies', 'Control whiteflies with neem oil; Plant resistant varieties; Early sowing', 'Use insecticides to control whiteflies; No direct treatment for the virus'),
          ('Bacterial Blight', 6, 'Angular water-soaked lesions on leaves, black lesions on bolls', 'Xanthomonas citri pv. malvacearum bacteria', 'Use disease-free seeds; Crop rotation; Balanced fertilization', 'Apply copper-based bactericides; Use streptomycin sulfate'),
          ('Fusarium Wilt', 6, 'Yellowing of leaves, wilting, vascular discoloration', 'Fusarium oxysporum f. sp. vasinfectum fungus', 'Crop rotation; Plant resistant varieties; Balanced fertilization', 'No effective chemical control; Preventive measures are key'),
          
          ('Red Rot', 7, 'Red discoloration of internal tissues, withering of leaves', 'Colletotrichum falcatum fungus', 'Use disease-free setts; Hot water treatment of setts; Crop rotation', 'Apply carbendazim; Use propiconazole'),
          ('Smut', 7, 'Black whip-like structures emerging from the growing point', 'Sporisorium scitamineum fungus', 'Use disease-free setts; Hot water treatment of setts; Remove and destroy infected plants', 'Apply propiconazole; Use triadimefon'),
          ('Leaf Scald', 7, 'White to reddish-brown lesions with yellow halos on leaves', 'Xanthomonas albilineans bacteria', 'Use disease-free setts; Hot water treatment of setts; Crop rotation', 'Apply copper-based bactericides; No highly effective chemical control'),
          
          ('Soybean Rust', 8, 'Small, brown to reddish-brown lesions on leaves', 'Phakopsora pachyrhizi fungus', 'Plant resistant varieties; Early planting; Proper spacing', 'Apply azoxystrobin; Use tebuconazole'),
          ('Bacterial Pustule', 8, 'Small, yellow-to-brown spots with raised centers on leaves', 'Xanthomonas axonopodis pv. glycines bacteria', 'Crop rotation; Plant resistant varieties; Use disease-free seeds', 'Apply copper-based bactericides; Limited chemical control options'),
          ('Frogeye Leaf Spot', 8, 'Circular to angular spots with gray centers and reddish-brown borders', 'Cercospora sojina fungus', 'Crop rotation; Plant resistant varieties; Proper tillage', 'Apply azoxystrobin; Use difenoconazole'),
          
          ('Ascochyta Blight', 9, 'Brown lesions on leaves, stems, and pods', 'Ascochyta rabiei fungus', 'Crop rotation; Use disease-free seeds; Proper spacing', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Fusarium Wilt', 9, 'Yellowing and wilting of plants, vascular discoloration', 'Fusarium oxysporum f. sp. ciceris fungus', 'Crop rotation; Plant resistant varieties; Balanced fertilization', 'No effective chemical control; Preventive measures are key'),
          ('Root Rot', 9, 'Rotting of roots, yellowing and wilting of plants', 'Various fungi including Rhizoctonia, Fusarium, and Pythium', 'Crop rotation; Improve drainage; Balanced fertilization', 'Apply metalaxyl; Use thiophanate-methyl'),
          
          ('Purple Blotch', 10, 'Purple lesions on leaves and seed stalks', 'Alternaria porri fungus', 'Crop rotation; Proper spacing; Remove infected plants', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Downy Mildew', 10, 'Pale green to yellow patches on leaves, grayish-purple fuzzy growth', 'Peronospora destructor fungus', 'Crop rotation; Proper spacing; Improve air circulation', 'Apply mancozeb; Use metalaxyl'),
          ('Neck Rot', 10, 'Water-soaked lesions on neck, white fungal growth', 'Botrytis allii fungus', 'Proper curing of bulbs; Avoid injury during harvest; Proper storage conditions', 'Apply iprodione; Use fludioxonil'),
          
          ('Anthracnose', 11, 'Sunken, circular lesions on fruits', 'Colletotrichum species fungi', 'Crop rotation; Proper spacing; Remove infected fruits', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Bacterial Spot', 11, 'Small, water-soaked spots on leaves and fruits', 'Xanthomonas campestris pv. vesicatoria bacteria', 'Crop rotation; Use disease-free seeds; Avoid overhead irrigation', 'Apply copper-based bactericides; Use streptomycin sulfate'),
          ('Powdery Mildew', 11, 'White powdery growth on leaves and stems', 'Leveillula taurica fungus', 'Proper spacing; Improve air circulation; Apply neem oil', 'Apply sulfur; Use myclobutanil'),
          
          ('Verticillium Wilt', 12, 'Yellowing and wilting of leaves, vascular discoloration', 'Verticillium dahliae fungus', 'Crop rotation; Plant resistant varieties; Balanced fertilization', 'No effective chemical control; Preventive measures are key'),
          ('Phomopsis Blight', 12, 'Circular to irregular spots on leaves, sunken lesions on fruits', 'Phomopsis vexans fungus', 'Crop rotation; Remove infected plants; Use disease-free seeds', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Little Leaf', 12, 'Stunted growth, small and narrow leaves', 'Phytoplasma', 'Control insect vectors; Remove infected plants; Balanced fertilization', 'No effective chemical control; Use insecticides to control vectors'),
          
          ('Powdery Mildew', 13, 'White powdery growth on leaves and stems', 'Erysiphe cichoracearum fungus', 'Proper spacing; Improve air circulation; Apply neem oil', 'Apply sulfur; Use myclobutanil'),
          ('Yellow Vein Mosaic', 13, 'Yellowing of veins, mosaic pattern on leaves', 'Virus transmitted by whiteflies', 'Control whiteflies with neem oil; Plant resistant varieties; Early sowing', 'Use insecticides to control whiteflies; No direct treatment for the virus'),
          ('Cercospora Leaf Spot', 13, 'Circular to irregular spots with gray centers and reddish-brown borders', 'Cercospora abelmoschi fungus', 'Crop rotation; Remove infected leaves; Proper spacing', 'Apply azoxystrobin; Use chlorothalonil'),
          
          ('Downy Mildew', 14, 'Yellow spots on upper leaf surface, white fuzzy growth on lower surface', 'Pseudoperonospora cubensis fungus', 'Crop rotation; Proper spacing; Improve air circulation', 'Apply mancozeb; Use metalaxyl'),
          ('Angular Leaf Spot', 14, 'Angular, water-soaked lesions on leaves', 'Pseudomonas syringae pv. lachrymans bacteria', 'Crop rotation; Use disease-free seeds; Avoid overhead irrigation', 'Apply copper-based bactericides; Limited chemical control options'),
          ('Anthracnose', 14, 'Sunken, circular lesions on fruits', 'Colletotrichum orbiculare fungus', 'Crop rotation; Proper spacing; Remove infected fruits', 'Apply azoxystrobin; Use chlorothalonil'),
          
          ('Anthracnose', 15, 'Black spots on fruits, sunken lesions', 'Colletotrichum gloeosporioides fungus', 'Proper pruning; Remove infected fruits; Improve air circulation', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Powdery Mildew', 15, 'White powdery growth on leaves and young fruits', 'Oidium mangiferae fungus', 'Proper pruning; Improve air circulation; Apply neem oil', 'Apply sulfur; Use myclobutanil'),
          ('Bacterial Canker', 15, 'Black spots on leaves, cankers on twigs,  Use myclobutanil'),
          ('Bacterial Canker', 15, 'Black spots on leaves, cankers on twigs, gummy ooze from branches', 'Xanthomonas campestris pv. mangiferaeindicae bacteria', 'Proper pruning; Remove infected parts; Apply copper-based paste on cuts', 'Apply copper-based bactericides; Use streptomycin sulfate'),
          
          ('Panama Disease', 16, 'Yellowing and wilting of leaves, vascular discoloration', 'Fusarium oxysporum f. sp. cubense fungus', 'Plant resistant varieties; Improve drainage; Avoid infected areas', 'No effective chemical control; Preventive measures are key'),
          ('Black Sigatoka', 16, 'Black streaks and spots on leaves', 'Mycosphaerella fijiensis fungus', 'Remove infected leaves; Improve air circulation; Balanced fertilization', 'Apply propiconazole; Use mancozeb'),
          ('Banana Bunchy Top', 16, 'Stunted growth, bunchy appearance of leaves', 'Banana bunchy top virus', 'Control aphid vectors; Remove infected plants; Use disease-free planting material', 'No effective chemical control; Use insecticides to control vectors'),
          
          ('Bud Rot', 17, 'Rotting of the bud, wilting of young leaves', 'Phytophthora palmivora fungus', 'Improve drainage; Balanced fertilization; Apply Trichoderma', 'Apply metalaxyl; Use fosetyl-aluminum'),
          ('Lethal Yellowing', 17, 'Yellowing of leaves, premature nut fall', 'Phytoplasma', 'Control insect vectors; Remove infected plants; Plant resistant varieties', 'No effective chemical control; Use insecticides to control vectors'),
          ('Stem Bleeding', 17, 'Reddish-brown liquid oozing from cracks in the stem', 'Thielaviopsis paradoxa fungus', 'Avoid injury to the stem; Apply Trichoderma; Balanced fertilization', 'Apply carbendazim; Use thiophanate-methyl'),
          
          ('Early Leaf Spot', 18, 'Circular brown spots with yellow halos on leaves', 'Cercospora arachidicola fungus', 'Crop rotation; Remove crop debris; Balanced fertilization', 'Apply chlorothalonil; Use tebuconazole'),
          ('Late Leaf Spot', 18, 'Dark brown to black circular spots on leaves', 'Phaeoisariopsis personata fungus', 'Crop rotation; Remove crop debris; Balanced fertilization', 'Apply chlorothalonil; Use tebuconazole'),
          ('Groundnut Rosette', 18, 'Stunted growth, chlorotic rosette appearance', 'Groundnut rosette virus', 'Control aphid vectors; Early planting; Plant resistant varieties', 'No effective chemical control; Use insecticides to control vectors'),
          
          ('White Rust', 19, 'White pustules on leaves and stems', 'Albugo candida fungus', 'Crop rotation; Remove infected plants; Proper spacing', 'Apply mancozeb; Use metalaxyl'),
          ('Alternaria Blight', 19, 'Dark brown to black spots on leaves and pods', 'Alternaria brassicae fungus', 'Crop rotation; Remove infected plants; Use disease-free seeds', 'Apply azoxystrobin; Use mancozeb'),
          ('Downy Mildew', 19, 'Yellow spots on upper leaf surface, white fuzzy growth on lower surface', 'Hyaloperonospora parasitica fungus', 'Crop rotation; Proper spacing; Improve air circulation', 'Apply mancozeb; Use metalaxyl'),
          
          ('Leaf Spot', 20, 'Brown to black spots on leaves', 'Colletotrichum capsici fungus', 'Crop rotation; Remove infected leaves; Balanced fertilization', 'Apply azoxystrobin; Use chlorothalonil'),
          ('Rhizome Rot', 20, 'Yellowing and wilting of leaves, soft rot of rhizomes', 'Pythium aphanidermatum fungus', 'Improve drainage; Crop rotation; Use disease-free rhizomes', 'Apply metalaxyl; Use fosetyl-aluminum'),
          ('Bacterial Wilt', 20, 'Wilting of plants, vascular discoloration', 'Ralstonia solanacearum bacteria', 'Crop rotation; Improve drainage; Use disease-free rhizomes', 'No effective chemical control; Preventive measures are key')
      `

      console.log("Database schema created successfully")
    } else {
      console.log("Database schema already exists")
    }

    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

// Function to get mock crops data when database is not available
export function getMockCrops() {
  return [
    {
      id: 1,
      name: "Tomato",
      scientific_name: "Solanum lycopersicum",
      description: "Common garden vegetable with red fruits",
      image_url: "/images/crops/tomato.jpg",
    },
    {
      id: 2,
      name: "Potato",
      scientific_name: "Solanum tuberosum",
      description: "Root vegetable and a staple food",
      image_url: "/images/crops/potato.jpg",
    },
    {
      id: 3,
      name: "Rice",
      scientific_name: "Oryza sativa",
      description: "Staple food for more than half of the world population",
      image_url: "/images/crops/rice.jpg",
    },
    {
      id: 4,
      name: "Wheat",
      scientific_name: "Triticum aestivum",
      description: "Cereal grain cultivated worldwide",
      image_url: "/images/crops/wheat.jpg",
    },
    {
      id: 5,
      name: "Corn",
      scientific_name: "Zea mays",
      description: "Cereal grain domesticated in Mesoamerica",
      image_url: "/images/crops/corn.jpg",
    },
    {
      id: 6,
      name: "Cotton",
      scientific_name: "Gossypium hirsutum",
      description: "Soft, fluffy staple fiber that grows in a boll",
      image_url: "/images/crops/cotton.jpg",
    },
    {
      id: 7,
      name: "Sugarcane",
      scientific_name: "Saccharum officinarum",
      description: "Tall perennial grass used for sugar production",
      image_url: "/images/crops/sugarcane.jpg",
    },
    {
      id: 8,
      name: "Soybean",
      scientific_name: "Glycine max",
      description: "Legume species native to East Asia",
      image_url: "/images/crops/soybean.jpg",
    },
    {
      id: 9,
      name: "Chickpea",
      scientific_name: "Cicer arietinum",
      description: "Annual legume of the family Fabaceae",
      image_url: "/images/crops/chickpea.jpg",
    },
    {
      id: 10,
      name: "Onion",
      scientific_name: "Allium cepa",
      description: "Vegetable that is the most widely cultivated species of the genus Allium",
      image_url: "/images/crops/onion.jpg",
    },
  ]
}

// Function to get mock diseases data when database is not available
export function getMockDiseases(cropId: number) {
  const allDiseases = [
    {
      id: 1,
      name: "Early Blight",
      crop_id: 1,
      symptoms: "Brown spots with concentric rings on leaves",
      causes: "Alternaria solani fungus",
      prevention: "Proper spacing, crop rotation",
      organic_treatment: "Remove infected leaves; Apply neem oil; Crop rotation",
      chemical_treatment: "Apply copper-based fungicide; Use chlorothalonil",
      image_url: null,
    },
    {
      id: 2,
      name: "Late Blight",
      crop_id: 1,
      symptoms: "Water-soaked spots on leaves, white fuzzy growth",
      causes: "Phytophthora infestans",
      prevention: "Proper spacing, avoid overhead watering",
      organic_treatment: "Remove infected plants; Improve air circulation; Apply compost tea",
      chemical_treatment: "Apply copper-based fungicide; Use mancozeb",
      image_url: null,
    },
    {
      id: 3,
      name: "Septoria Leaf Spot",
      crop_id: 1,
      symptoms: "Small, circular spots with dark borders on leaves",
      causes: "Septoria lycopersici fungus",
      prevention: "Crop rotation, avoid overhead watering",
      organic_treatment: "Remove infected leaves; Mulch around plants; Avoid overhead watering",
      chemical_treatment: "Apply copper-based fungicide; Use chlorothalonil",
      image_url: null,
    },
    {
      id: 4,
      name: "Bacterial Wilt",
      crop_id: 2,
      symptoms: "Wilting of plants, browning of vascular tissue",
      causes: "Ralstonia solanacearum bacteria",
      prevention: "Use disease-free seed potatoes",
      organic_treatment: "Crop rotation; Use disease-free seed potatoes; Improve drainage",
      chemical_treatment: "No effective chemical control; Preventive measures are key",
      image_url: null,
    },
    {
      id: 5,
      name: "Late Blight",
      crop_id: 2,
      symptoms: "Dark, water-soaked spots on leaves and stems",
      causes: "Phytophthora infestans",
      prevention: "Proper spacing, avoid overhead watering",
      organic_treatment: "Remove infected plants; Improve air circulation; Apply compost tea",
      chemical_treatment: "Apply copper-based fungicide; Use mancozeb",
      image_url: null,
    },
    {
      id: 6,
      name: "Blast Disease",
      crop_id: 3,
      symptoms: "Diamond-shaped lesions on leaves",
      causes: "Magnaporthe oryzae fungus",
      prevention: "Use resistant varieties",
      organic_treatment: "Use resistant varieties; Balanced fertilization; Proper water management",
      chemical_treatment: "Apply azoxystrobin; Use tricyclazole",
      image_url: null,
    },
    {
      id: 7,
      name: "Bacterial Leaf Blight",
      crop_id: 3,
      symptoms: "Water-soaked lesions that turn yellow to white",
      causes: "Xanthomonas oryzae bacteria",
      prevention: "Use resistant varieties, proper drainage",
      organic_treatment: "Use resistant varieties; Balanced fertilization; Proper drainage",
      chemical_treatment: "Apply copper-based bactericides; Use streptomycin sulfate",
      image_url: null,
    },
    {
      id: 8,
      name: "Rust",
      crop_id: 4,
      symptoms: "Reddish-brown pustules on leaves and stems",
      causes: "Puccinia species fungi",
      prevention: "Plant resistant varieties",
      organic_treatment: "Crop rotation; Remove volunteer wheat; Plant resistant varieties",
      chemical_treatment: "Apply propiconazole; Use tebuconazole",
      image_url: null,
    },
    {
      id: 9,
      name: "Powdery Mildew",
      crop_id: 4,
      symptoms: "White powdery growth on leaves and stems",
      causes: "Blumeria graminis fungus",
      prevention: "Proper spacing, balanced fertilization",
      organic_treatment: "Crop rotation; Proper spacing; Balanced fertilization",
      chemical_treatment: "Apply sulfur; Use tebuconazole",
      image_url: null,
    },
    {
      id: 10,
      name: "Corn Smut",
      crop_id: 5,
      symptoms: "Galls on ears, tassels, and leaves",
      causes: "Ustilago maydis fungus",
      prevention: "Plant resistant varieties",
      organic_treatment: "Crop rotation; Remove galls before they rupture; Plant resistant varieties",
      chemical_treatment: "Apply fungicides with azoxystrobin; Use propiconazole",
      image_url: null,
    },
    {
      id: 11,
      name: "Gray Leaf Spot",
      crop_id: 5,
      symptoms: "Rectangular lesions on leaves",
      causes: "Cercospora zeae-maydis fungus",
      prevention: "Crop rotation, proper tillage",
      organic_treatment: "Crop rotation; Plant resistant varieties; Proper tillage",
      chemical_treatment: "Apply azoxystrobin; Use pyraclostrobin",
      image_url: null,
    },
    {
      id: 12,
      name: "Cotton Leaf Curl Virus",
      crop_id: 6,
      symptoms: "Upward curling of leaves, thickened veins, stunted growth",
      causes: "Virus transmitted by whiteflies",
      prevention: "Control whiteflies, early sowing",
      organic_treatment: "Control whiteflies with neem oil; Plant resistant varieties; Early sowing",
      chemical_treatment: "Use insecticides to control whiteflies; No direct treatment for the virus",
      image_url: null,
    },
    {
      id: 13,
      name: "Red Rot",
      crop_id: 7,
      symptoms: "Red discoloration of internal tissues, withering of leaves",
      causes: "Colletotrichum falcatum fungus",
      prevention: "Use disease-free setts, hot water treatment",
      organic_treatment: "Use disease-free setts; Hot water treatment of setts; Crop rotation",
      chemical_treatment: "Apply carbendazim; Use propiconazole",
      image_url: null,
    },
    {
      id: 14,
      name: "Soybean Rust",
      crop_id: 8,
      symptoms: "Small, brown to reddish-brown lesions on leaves",
      causes: "Phakopsora pachyrhizi fungus",
      prevention: "Early planting, proper spacing",
      organic_treatment: "Plant resistant varieties; Early planting; Proper spacing",
      chemical_treatment: "Apply azoxystrobin; Use tebuconazole",
      image_url: null,
    },
    {
      id: 15,
      name: "Ascochyta Blight",
      crop_id: 9,
      symptoms: "Brown lesions on leaves, stems, and pods",
      causes: "Ascochyta rabiei fungus",
      prevention: "Use disease-free seeds, proper spacing",
      organic_treatment: "Crop rotation; Use disease-free seeds; Proper spacing",
      chemical_treatment: "Apply azoxystrobin; Use chlorothalonil",
      image_url: null,
    },
    {
      id: 16,
      name: "Purple Blotch",
      crop_id: 10,
      symptoms: "Purple lesions on leaves and seed stalks",
      causes: "Alternaria porri fungus",
      prevention: "Proper spacing, remove infected plants",
      organic_treatment: "Crop rotation; Proper spacing; Remove infected plants",
      chemical_treatment: "Apply azoxystrobin; Use chlorothalonil",
      image_url: null,
    },
  ]

  // Filter diseases by crop ID
  const diseases = allDiseases.filter((disease) => disease.crop_id === cropId)

  // If no diseases found for this crop, return a generic one
  if (diseases.length === 0) {
    return [
      {
        id: 999,
        name: "Unknown Disease",
        crop_id: cropId,
        symptoms: "Various symptoms",
        causes: "Various causes",
        prevention: "General prevention measures",
        organic_treatment: "Apply neem oil; Use organic compost; Remove affected leaves",
        chemical_treatment: "Apply fungicide; Use appropriate pesticides",
        image_url: null,
      },
    ]
  }

  return diseases
}
