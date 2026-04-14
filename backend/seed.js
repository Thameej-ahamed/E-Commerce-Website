require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Category = require('./models/Category');
const Cart = require('./models/Cart');
const Wishlist = require('./models/Wishlist');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const bcrypt = require('bcryptjs');

const categoriesData = [
  { name: 'electronics', description: 'Smartphones, Tablets and more' },
  { name: 'computers', description: 'Laptops, RAM, SSDs and PC parts' },
  { name: 'audio', description: 'Headphones and Speakers' },
  { name: 'cameras', description: 'Action cams and DSLRs' },
  { name: 'fitness', description: 'Wearables and health trackers' },
  { name: 'smarthome', description: 'Smart bulbs and home automation' }
];

const productsData = [
  {
    "name": "iPhone 15 Pro Max",
    "description": "Apple's latest flagship smartphone with Titanium frame and A17 Pro chip.",
    "price": 159900,
    "discountPrice": 148900,
    "category": "electronics",
    "brand": "Apple",
    "images": ["https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg"],
    "stock": 100
  },
  {
    "name": "MacBook Air M2",
    "description": "Powerful and incredibly thin laptop from Apple, featuring the M2 chip.",
    "price": 104900,
    "discountPrice": 96900,
    "category": "computers",
    "brand": "Apple",
    "images": ["https://cdn8.web4s.vn/media/products/mac-air-m2/macbookairm2-midnight%201.jpg"],
    "stock": 50
  },
  {
    "name": "MacBook Pro 14\" M2 Pro",
    "description": "High-performance laptop with M2 Pro chip and stunning Liquid Retina XDR display.",
    "price": 199900,
    "discountPrice": 184900,
    "category": "computers",
    "brand": "Apple",
    "images": ["https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/refurb-mbp14-m2-silver-202303?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=ZmdRZFZQaThmdmpsRzMrNlU0TnIrNVN1UEFsa2dENVBwbUVOOUlVZ3dMdmRxTENLaEJiU0o5a1FqaDFsUHhYNjE1UUxLT2t0cW42N3FvQzVqaGhrVVltRElNTjY0QXJtekNDMXFQT2xOSU4rYWpGdS9XeFgvbS9ITnNYOEhYaG4"],
    "stock": 30
  },
  {
    "name": "Sony WH-1000XM5",
    "description": "Industry-leading noise-canceling headphones with exceptional sound clarity.",
    "price": 29990,
    "discountPrice": 26990,
    "category": "audio",
    "brand": "Sony",
    "images": ["https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Entertainment/Headphones%20and%20Earphones/Images/272419_jqvb9x.png?tr=w-600"],
    "stock": 200
  },
  {
    "name": "Samsung 65\" QLED TV",
    "description": "Immersive 4K TV experience with QLED technology and AI Upscaling.",
    "price": 124900,
    "discountPrice": 114990,
    "category": "electronics",
    "brand": "Samsung",
    "images": ["https://cdn.mediamart.vn/images/product/qled-tivi-4k-samsung-65-inch-65q80c-smart-tv_5304e716.png"],
    "stock": 10
  },
  {
    "name": "Canon EOS R5",
    "description": "Professional 45MP full-frame mirrorless camera for elite photography.",
    "price": 339990,
    "discountPrice": 319990,
    "category": "cameras",
    "brand": "Canon",
    "images": ["https://i1.adis.ws/i/canon/eos-r5_front_rf24-105mmf4lisusm_square_32c26ad194234d42b3cd9e582a21c99b"],
    "stock": 5
  },
  {
    "name": "Apple Watch Series 9",
    "description": "Stay connected, active, and healthy with advanced sensors.",
    "price": 41900,
    "discountPrice": 39900,
    "category": "electronics",
    "brand": "Apple",
    "images": ["https://akbroshop.com/wp-content/uploads/2022/08/hinh-aw-s7-xanh.jpg"],
    "stock": 100
  },
  {
    "name": "Dell XPS 15",
    "description": "Elite performance laptop with InfinityEdge display.",
    "price": 174990,
    "discountPrice": 165990,
    "category": "computers",
    "brand": "Dell",
    "images": ["https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-1.psd?fmt=pjpg&wid=800"],
    "stock": 20
  },
  {
    "name": "Samsung Galaxy Tab S9 Ultra",
    "description": "The ultimate Android tablet experience with massive AMOLED screen.",
    "price": 108999,
    "discountPrice": 99990,
    "category": "electronics",
    "brand": "Samsung",
    "images": ["https://hanoicomputercdn.com/media/product/60370_may_tinh_bang_samsung_galaxy_tab_s7_plus_128gb_den.png"],
    "stock": 30
  },
  {
    "name": "Sony A7 IV",
    "description": "Full-frame camera with 33MP sensor and high-speed autofocus.",
    "price": 242990,
    "discountPrice": 224990,
    "category": "cameras",
    "brand": "Sony",
    "images": ["https://zshop.vn/images/detailed/92/1634812545_1667800.jpg"],
    "stock": 10
  },
  {
    "name": "ROG Zephyrus G14",
    "description": "Powerful 14-inch gaming laptop with Ryzen 9 and RTX GPU.",
    "price": 149990,
    "discountPrice": 139990,
    "category": "computers",
    "brand": "ASUS",
    "images": ["https://www.primeabgb.com/wp-content/uploads/2025/08/ASUS-ROG-Zephyrus-G14-14-inch-AMD-Ryzen-AI-9-HX-370-RTX-5070-Ti-GPU-32GB-RAM-2TB-SSD-Gaming-Laptop-GA403WR-QS123WS.jpg"],
    "stock": 25
  },
  {
    "name": "AirPods Pro 2",
    "description": "MagSafe charging, superior spatial audio, and noise cancellation.",
    "price": 24900,
    "discountPrice": 21900,
    "category": "audio",
    "brand": "Apple",
    "images": ["https://m.media-amazon.com/images/I/51emillNpWL._AC_UF350,350_QL80_.jpg"],
    "stock": 300
  },
  {
    "name": "Nintendo Switch OLED",
    "description": "The best console for handheld and TV gaming with vibrant OLED.",
    "price": 32900,
    "discountPrice": 29990,
    "category": "electronics",
    "brand": "Nintendo",
    "images": ["https://i.etsystatic.com/22580149/r/il/db60d8/3602821419/il_fullxfull.3602821419_303e.jpg"],
    "stock": 80
  },
  {
    "name": "Logitech MX Master 3S",
    "description": "High-precision ergonomic mouse for power users.",
    "price": 9995,
    "discountPrice": 8995,
    "category": "electronics",
    "brand": "Logitech",
    "images": ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800"],
    "stock": 150
  },
  {
    "name": "Keychron Q1 Pro",
    "description": "Custom mechanical keyboard with premium aluminum build.",
    "price": 18990,
    "discountPrice": 16990,
    "category": "electronics",
    "brand": "Keychron",
    "images": ["https://mechanicalkeyboards.com/cdn/shop/files/17105-KSGNZ-Keychron-Q1-Pro-w-Knob-Shell-White-Aluminum-75-Hotswap-Bluet.jpg?v=1766520376&width=750"],
    "stock": 45
  },
  {
    "name": "GoPro HERO 12 Black",
    "description": "Robust action camera with 5.3K video and HDR.",
    "price": 39990,
    "discountPrice": 37990,
    "category": "cameras",
    "brand": "GoPro",
    "images": ["https://m.media-amazon.com/images/I/61dUvabnSmL.jpg"],
    "stock": 60
  },
  {
    "name": "DJI Mini 3 Pro",
    "description": "Ultra-lightweight drone with obstacle sensing and vertical shooting.",
    "price": 84990,
    "discountPrice": 79990,
    "category": "electronics",
    "brand": "DJI",
    "images": ["https://m.media-amazon.com/images/I/51wt4-myDiL.jpg"],
    "stock": 15
  },
  {
    "name": "Fitbit Charge 6",
    "description": "Heart rate tracking, GPS, and health insights tracker.",
    "price": 14900,
    "discountPrice": 13500,
    "category": "fitness",
    "brand": "Fitbit",
    "images": ["https://m.media-amazon.com/images/I/41M+F43gRJL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 200
  },
  {
    "name": "Philips Hue Starter Kit",
    "description": "Begin your smart home lighting journey with millions of colors.",
    "price": 15990,
    "discountPrice": 14490,
    "category": "smarthome",
    "brand": "Philips",
    "images": ["https://m.media-amazon.com/images/I/51u3-6AeGiL.jpg"],
    "stock": 100
  },
  {
    "name": "Sonos One (Gen 2)",
    "description": "Premium smart speaker with voice control and crystal clear sound.",
    "price": 19990,
    "discountPrice": 17990,
    "category": "audio",
    "brand": "Sonos",
    "images": ["https://m.media-amazon.com/images/I/61JLYbKHBOL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 90
  },
  {
    "name": "Kindle Paperwhite",
    "description": "Waterproof e-reader with warm light and weeks of battery life.",
    "price": 13990,
    "discountPrice": 11990,
    "category": "electronics",
    "brand": "Amazon",
    "images": ["https://helios-i.mashable.com/imagery/comparisons/04xWc3e8dygWqXf9BjO7CYJ-item1.fit_lim.size_640x358.v1760549907.jpg"],
    "stock": 120
  },
  {
    "name": "Steam Deck (512GB)",
    "description": "Portable PC gaming handheld with massive library support.",
    "price": 54990,
    "discountPrice": 49990,
    "category": "electronics",
    "brand": "Valve",
    "images": ["https://m.media-amazon.com/images/I/51N0jRIIopL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 10
  },
  {
    "name": "Bose QuietComfort Ultra",
    "description": "World-class noise cancellation headphones with immersive audio.",
    "price": 35900,
    "discountPrice": 32900,
    "category": "audio",
    "brand": "Bose",
    "images": ["https://m.media-amazon.com/images/I/51yWZxN3vRL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 55
  },
  {
    "name": "Surface Laptop 5",
    "description": "Elegant design and powerful performance for work and play.",
    "price": 114990,
    "discountPrice": 104990,
    "category": "computers",
    "brand": "Microsoft",
    "images": ["https://images-cdn.ubuy.co.in/66218730e5044a1be3051cf8-microsoft-surface-laptop-5-15-intel-core.jpg"],
    "stock": 40
  },
  {
    "name": "WD Black SN850X 2TB",
    "description": "Ultra-fast NVMe SSD for high-performance gaming setups.",
    "price": 15990,
    "discountPrice": 14490,
    "category": "computers",
    "brand": "WD",
    "images": ["https://m.media-amazon.com/images/I/61jQCrK6mFL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 200
  },
  {
    "name": "Corsair Vengeance 32GB RAM",
    "description": "DDR5 memory for high speed and extreme reliability.",
    "price": 10990,
    "discountPrice": 9490,
    "category": "computers",
    "brand": "Corsair",
    "images": ["https://m.media-amazon.com/images/I/61D2DDpDITL.jpg"],
    "stock": 180
  },
  {
    "name": "Razer DeathAdder V3 Pro",
    "description": "Wired for pros, wireless for wins. Lightweight gaming mouse.",
    "price": 13990,
    "discountPrice": 12490,
    "category": "electronics",
    "brand": "Razer",
    "images": ["https://m.media-amazon.com/images/I/51HNNPbYdML.jpg"],
    "stock": 75
  },
  {
    "name": "Samsung T7 Shield 2TB",
    "description": "Rugged, fast, and drop-resistant portable SSD.",
    "price": 17900,
    "discountPrice": 15900,
    "category": "electronics",
    "brand": "Samsung",
    "images": ["https://m.media-amazon.com/images/I/71sKzf5EoyL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 110
  },
  {
    "name": "Beats Studio Pro",
    "description": "Personalized spatial audio and active noise canceling.",
    "price": 27900,
    "discountPrice": 24900,
    "category": "audio",
    "brand": "Beats",
    "images": ["https://accessworld.in/cdn/shop/files/beats-studio-pro-sandstone-1.jpg?v=1693399859&width=1000"],
    "stock": 65
  },
  {
    "name": "Google Pixel 8 Pro",
    "description": "Powerful triple camera system and Google's smartest chip.",
    "price": 106990,
    "discountPrice": 98990,
    "category": "electronics",
    "brand": "Google",
    "images": ["https://in.static.webuy.com/product_images/Phones/Phones%20Android/SGOOPIX8P256GBUNLB_l.jpg"],
    "stock": 95
  },
  {
    "name": "Nest Learning Thermostat",
    "description": "Save energy and keep your home comfortable automatically.",
    "price": 19990,
    "discountPrice": 17990,
    "category": "smarthome",
    "brand": "Google",
    "images": ["https://i5.walmartimages.com/asr/ee4d0bec-0d2b-4c8a-8425-892bf305f42e_1.c5698b9408b60133ce62a2083cd1ff99.jpeg?odnHeight=768&odnWidth=768&odnBg=FFFFFF"],
    "stock": 50
  },
  {
    "name": "Ring Video Doorbell 4",
    "description": "See who's there from anywhere with 1080p HD video.",
    "price": 14995,
    "discountPrice": 12995,
    "category": "smarthome",
    "brand": "Ring",
    "images": ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVIbUeSCKT99lNffbkptu1bkU3257KolDrJg&s"],
    "stock": 130
  },
  {
    "name": "Insta360 X3",
    "description": "Unleash your creativity with incredible 360 action video.",
    "price": 43900,
    "discountPrice": 40990,
    "category": "cameras",
    "brand": "Insta360",
    "images": ["https://m.media-amazon.com/images/I/61JIsqTNFPL.jpg"],
    "stock": 35
  },
  {
    "name": "Garmin Fenix 7 Pro",
    "description": "Built for the outdoors with multi-band GPS and solar charging.",
    "price": 68900,
    "discountPrice": 64900,
    "category": "fitness",
    "brand": "Garmin",
    "images": ["https://m.media-amazon.com/images/I/71yjOArb3YL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 22
  },
  {
    "name": "JBL Charge 5",
    "description": "Portable waterproof speaker with powerbank functionality.",
    "price": 14999,
    "discountPrice": 12999,
    "category": "audio",
    "brand": "JBL",
    "images": ["https://microless.com/cdn/products/a225db9116f168e7c9f250bcd7bda4de-hi.jpg"],
    "stock": 140
  },
  {
    "name": "Marshall Stanmore III",
    "description": "Signature rock 'n' roll sound for your home.",
    "price": 31990,
    "discountPrice": 28990,
    "category": "audio",
    "brand": "Marshall",
    "images": ["https://m.media-amazon.com/images/I/41SCO-fEVzL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 45
  },
  {
    "name": "Elgato Stream Deck MK.2",
    "description": "Seamless control for streamers and content creators.",
    "price": 12900,
    "discountPrice": 11400,
    "category": "electronics",
    "brand": "Elgato",
    "images": ["https://m.media-amazon.com/images/I/5166khyKBGL.jpg"],
    "stock": 85
  },
  {
    "name": "Blue Yeti USB Microphone",
    "description": "The world's #1 USB microphone for professional recording.",
    "price": 10990,
    "discountPrice": 9490,
    "category": "audio",
    "brand": "Blue",
    "images": ["https://m.media-amazon.com/images/I/61rGxyu5lUL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 115
  },
  {
    "name": "iPad Pro 12.9\" (M2)",
    "description": "Astonishing performance and advanced Liquid Retina display.",
    "price": 112900,
    "discountPrice": 104900,
    "category": "electronics",
    "brand": "Apple",
    "images": ["https://m.media-amazon.com/images/I/81rxOSprYqL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 55
  },
  {
    "name": "Oculus Quest 3 (128GB)",
    "description": "Break into Mixed Reality with stunning visual fidelity.",
    "price": 49900,
    "discountPrice": 46900,
    "category": "electronics",
    "brand": "Meta",
    "images": ["https://m.media-amazon.com/images/I/61nkctF66PL.jpg"],
    "stock": 70
  },
  {
    "name": "NVIDIA GeForce RTX 4080",
    "description": "Beyond fast for gamers and creators alike.",
    "price": 102990,
    "discountPrice": 94990,
    "category": "computers",
    "brand": "NVIDIA",
    "images": ["https://rukmini1.flixcart.com/image/1500/1500/xif0q/graphics-card/2/f/v/geforce-rtx-4080-16gb-ventus-3x-oc-msi-original-imagt5y7ddpgg5pn.jpeg?q=70"],
    "stock": 5
  },
  {
    "name": "Dell UltraSharp 27\" 4K",
    "description": "Experience true-to-life color and clarity.",
    "price": 54990,
    "discountPrice": 50899,
    "category": "computers",
    "brand": "Dell",
    "images": ["https://m.media-amazon.com/images/I/91tUHZCszIL.jpg"],
    "stock": 35
  },
  {
    "name": "Wacom Intuos Pro (Medium)",
    "description": "Professional drawing tablet for creative workflows.",
    "price": 32900,
    "discountPrice": 29699,
    "category": "electronics",
    "brand": "Wacom",
    "images": ["https://m.media-amazon.com/images/I/61HXRDydAQL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 28
  },
  {
    "name": "Anker 737 Power Bank",
    "description": "Ultra-powerful 24,000mAh portable charger.",
    "price": 12990,
    "discountPrice": 11400,
    "category": "electronics",
    "brand": "Anker",
    "images": ["https://m.media-amazon.com/images/I/71QrhaW+kAL.jpg"],
    "stock": 190
  },
  {
    "name": "Sennheiser Momentum 4",
    "description": "Top-tier audio performance and massive 60-hour battery.",
    "price": 27900,
    "discountPrice": 24900,
    "category": "audio",
    "brand": "Sennheiser",
    "images": ["https://m.media-amazon.com/images/I/71zsm84mJsL.jpg"],
    "stock": 48
  },
  {
    "name": "Wyze Cam Pan v3",
    "description": "360-degree coverage smart home camera.",
    "price": 4900,
    "discountPrice": 4400,
    "category": "smarthome",
    "brand": "Wyze",
    "images": ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSbdUF8MtQeiBahUn35ltA1Qm_VQ8E35pkLA&s"],
    "stock": 250
  },
  {
    "name": "Oura Ring Gen3",
    "description": "Discreet health and sleep monitoring.",
    "price": 28900,
    "discountPrice": 26900,
    "category": "fitness",
    "brand": "Oura",
    "images": ["https://m.media-amazon.com/images/I/61pHtQLDz4L._UF350,350_QL80_.jpg"],
    "stock": 35
  },
  {
    "name": "Nanoleaf Shapes Triangles",
    "description": "Reactive modular LED smart lighting.",
    "price": 17900,
    "discountPrice": 15900,
    "category": "smarthome",
    "brand": "Nanoleaf",
    "images": ["https://m.media-amazon.com/images/I/71d+2pwGBpL._AC_UF894,1000_QL80_.jpg"],
    "stock": 65
  },
  {
    "name": "TP-Link Deco XE75 Mesh",
    "description": "True tri-band WiFi 6E mesh system.",
    "price": 34990,
    "discountPrice": 31990,
    "category": "smarthome",
    "brand": "TP-Link",
    "images": ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqh1X6MouHkiAmkDwQRiIUobTvrY2BMXVukA&s"],
    "stock": 95
  },
  {
    "name": "SteelSeries Arctis Nova Pro",
    "description": "Supreme fidelity audio for gaming enthusiasts.",
    "price": 29990,
    "discountPrice": 27490,
    "category": "audio",
    "brand": "SteelSeries",
    "images": ["https://m.media-amazon.com/images/I/61RMiMyIlGL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 72
  },
  {
    "name": "Alienware 34 Curved QD-OLED",
    "description": "The pinnacle of ultra-wide gaming displays.",
    "price": 99990,
    "discountPrice": 92990,
    "category": "computers",
    "brand": "Alienware",
    "images": ["https://www.theitdepot.com/image/cache/catalog/products/images/proimages/39949-500-min-550x550.jpg"],
    "stock": 15
  },
  {
    "name": "Razer Leviathan V2",
    "description": "Desktop soundbar with THX Spatial Audio.",
    "price": 21990,
    "discountPrice": 19490,
    "category": "audio",
    "brand": "Razer",
    "images": ["https://m.media-amazon.com/images/I/71W+erooYNL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 44
  },
  {
    "name": "Sony PlayStation 5 Console",
    "description": "Experience lightning-fast loading with an ultra-high speed SSD and deeper immersion.",
    "price": 54990,
    "discountPrice": 49990,
    "category": "electronics",
    "brand": "Sony",
    "images": ["https://m.media-amazon.com/images/I/61qM7CPPcrL.jpg"],
    "stock": 15
  },
  {
    "name": "Sony DualSense Edge Wireless Controller",
    "description": "Get an edge in gameplay by creating your own custom controls.",
    "price": 18990,
    "discountPrice": 17490,
    "category": "electronics",
    "brand": "Sony",
    "images": ["https://m.media-amazon.com/images/I/61wcZaT2vkL._AC_UF894,1000_QL80_.jpg"],
    "stock": 30
  },
  {
    "name": "Sony PlayStation VR2",
    "description": "Escape into worlds that feel, look and sound truly real with PlayStation VR2.",
    "price": 57990,
    "discountPrice": 54990,
    "category": "electronics",
    "brand": "Sony",
    "images": ["https://gmedia.playstation.com/is/image/SIEPDC/PSVR2-thumbnail-01-en-22feb22?$facebook$"],
    "stock": 10
  },
  {
    "name": "Sony Pulse 3D Wireless Headset",
    "description": "Enjoy a seamless, wireless experience with a headset fine-tuned for 3D Audio on PS5.",
    "price": 8590,
    "discountPrice": 7990,
    "category": "audio",
    "brand": "Sony",
    "images": ["https://m.media-amazon.com/images/I/41IfEf6+4CL.jpg"],
    "stock": 45
  },
  {
    "name": "Samsung Galaxy S24 Ultra",
    "description": "Welcome to the era of mobile AI. With Galaxy S24 Ultra, you can unleash whole new levels of creativity.",
    "price": 129999,
    "discountPrice": 124999,
    "category": "electronics",
    "brand": "Samsung",
    "images": ["https://m.media-amazon.com/images/I/717Q2swzhBL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 25
  },
  {
    "name": "Google Pixel 8",
    "description": "The all-new phone engineered by Google. It's sleek, sophisticated and has the best Pixel camera yet.",
    "price": 75990,
    "discountPrice": 69990,
    "category": "electronics",
    "brand": "Google",
    "images": ["https://www.designinfo.in/wp-content/uploads/2024/11/Google-Pixel-8-5G-8GB-RAM-256GB-Hazel-Imported-1.webp"],
    "stock": 20
  },
  {
    "name": "OnePlus 12 (Emerald Green)",
    "description": "Smooth Beyond Belief. The OnePlus 12 defines the new gold standard for flagship performance.",
    "price": 64999,
    "discountPrice": 61999,
    "category": "electronics",
    "brand": "OnePlus",
    "images": ["https://m.media-amazon.com/images/I/717Qo4MH97L._AC_UF1000,1000_QL80_.jpg"],
    "stock": 35
  },
  {
    "name": "Nothing Phone (2) Dark Edition",
    "description": "Come to the bright side. Meet Phone (2). A new era for the smartphone.",
    "price": 44999,
    "discountPrice": 39999,
    "category": "electronics",
    "brand": "Nothing",
    "images": ["https://m.media-amazon.com/images/I/61cZJcKweLL._AC_UF1000,1000_QL80_.jpg"],
    "stock": 50
  }
];

const seedDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-commerce';
    await mongoose.connect(connString);
    console.log('Connected to: ' + connString);
    
    await Category.deleteMany({});
    await Category.insertMany(categoriesData);
    console.log('[Seed] Categories created.');

    await Product.deleteMany({});
    await User.deleteMany({ role: 'admin' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Wishlist.deleteMany({});

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
        username: 'admin',
        email: 'thameejahamed73@gmail.com',
        password: adminPassword,
        name: 'Thameej Ahamed',
        phone: '+91 98765 43210',
        role: 'admin',
        address: [{
            street: '123 Main St',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
            country: 'India'
        }]
    });
    await admin.save();
    console.log('[Seed] Admin user created.');

    const createdProducts = await Product.insertMany(productsData);
    console.log('[Seed] ' + createdProducts.length + ' Products created with native INR pricing.');

    // Seed Review
    const sampleReview = new Review({
        userId: admin._id,
        productId: createdProducts[0]._id,
        rating: 5,
        comment: 'Excellent battery life!'
    });
    await sampleReview.save();
    console.log('[Seed] Review created.');

    // Seed Cart
    const adminCart = new Cart({
        userId: admin._id,
        items: [{ productId: createdProducts[1]._id, quantity: 1, price: createdProducts[1].price }],
        totalAmount: createdProducts[1].price
    });
    await adminCart.save();
    console.log('[Seed] Cart created.');

    // Seed Wishlist as separate items (New model structure)
    const adminWishlist1 = new Wishlist({
        userId: admin._id,
        productId: createdProducts[2]._id,
        name: createdProducts[2].name,
        price: createdProducts[2].price,
        image: createdProducts[2].images[0],
        brand: createdProducts[2].brand,
        category: createdProducts[2].category
    });
    await adminWishlist1.save();
    console.log('[Seed] Wishlist Item created.');

    console.log('[Seed] Wishlist Item created.');

    console.log('--- DATABASE FULLY SEEDED WITH ' + createdProducts.length + ' PRODUCTS ---');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedDB();
