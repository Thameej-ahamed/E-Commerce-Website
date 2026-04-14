const fs = require('fs');
const raw = fs.readFileSync('src/utils/mockData.js', 'utf8');
const match = raw.match(/export const productSeeds = (\[[\s\S]*?\]);/);
if (match) {
    let data = eval(match[1]);
    const transformed = data.map(p => ({
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: Math.round(p.price * 0.9),
        category: p.category,
        brand: p.brand || 'Fusion',
        images: [p.image],
        stock: p.stock || 50,
        ratings: p.rating || 4.5,
        numReviews: Math.floor(Math.random() * 200) + 1
    }));
    
    // Create the seed.js file
    const seedContent = `require('dotenv').config();
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

const productsData = ${JSON.stringify(transformed, null, 2)};

const seedDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-commerce';
    await mongoose.connect(connString);
    console.log('Connected to: ' + connString);
    
    await Category.deleteMany({});
    await Category.insertMany(categoriesData);
    console.log('[Seed] Categories created.');

    await Product.deleteMany({});
    await User.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Wishlist.deleteMany({});

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
        username: 'admin',
        email: 'admin@fusion.com',
        password: adminPassword,
        name: 'Thameej Ahamed',
        phone: '9876543210',
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
    console.log('[Seed] ' + createdProducts.length + ' Products created.');

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

    // Seed Order & Payment
    const orderNum = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const sampleOrder = new Order({
        orderNumber: orderNum,
        user: admin._id,
        customerName: admin.name,
        customerEmail: admin.email,
        customerAddress: '123 Main St, Chennai',
        customerPhone: admin.phone,
        items: [{ product: createdProducts[0]._id, name: createdProducts[0].name, quantity: 1, price: createdProducts[0].price }],
        total: createdProducts[0].price,
        paymentStatus: 'completed',
        orderStatus: 'Order Placed',
        paymentMethod: 'card'
    });
    await sampleOrder.save();
    
    const samplePayment = new Payment({
        userId: admin._id,
        orderId: sampleOrder._id,
        paymentId: 'stripe_seed_' + Date.now(),
        amount: createdProducts[0].price,
        status: 'Success'
    });
    await samplePayment.save();
    console.log('[Seed] Order & Payment created.');

    console.log('--- DATABASE FULLY SEEDED WITH ' + createdProducts.length + ' PRODUCTS ---');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedDB();
`;

    fs.writeFileSync('backend/seed.js', seedContent);
}
