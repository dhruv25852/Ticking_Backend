const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');

const CLOUDINARY_URLS = {
  datejust: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/datejust.jpg',
  daytona: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/daytona.jpg',
  submariner: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/submariner.jpg',
  nautilus: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/nautilus.jpg',
  overseas: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/overseas.jpg',
  santos: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/santos.jpg',
  speedmaster: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/speedmaster.jpg',
  navitimer: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/navitimer.jpg',
  lange_1815: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/lange_1815.jpg',
  ap_diver: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/ap_diver.jpg',
  hero_chronograph: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/hero_chronograph.jpg',
  movement_craft: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/movement_craft.jpg',
  tag_connected: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/tag_connected.jpg'
};

function mapLocalPathToCloudinary(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const lower = filePath.toLowerCase();
  for (const [key, cUrl] of Object.entries(CLOUDINARY_URLS)) {
    if (lower.includes(key)) {
      return { url: cUrl, publicId: key };
    }
  }
  return null;
}

async function migrate() {
  console.log('--- Connecting to MongoDB Atlas for Cloudinary Image Migration ---');
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not found in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Atlas connected successfully\n');

  // 1. Migrate Products
  console.log('1. Migrating Product documents...');
  const products = await Product.find({});
  console.log(`Found ${products.length} products to check.\n`);

  for (const product of products) {
    const originalImages = product.images || [];
    const updatedImages = [];
    const updatedPublicIds = [];

    for (const img of originalImages) {
      if (img.startsWith('https://res.cloudinary.com/')) {
        updatedImages.push(img);
        const match = mapLocalPathToCloudinary(img);
        if (match) updatedPublicIds.push(match.publicId);
      } else {
        const match = mapLocalPathToCloudinary(img);
        if (match) {
          updatedImages.push(match.url);
          updatedPublicIds.push(match.publicId);
        } else {
          updatedImages.push(img);
        }
      }
    }

    // Safety fallback: if no images mapped, try by product name/slug
    if (updatedImages.length === 0 || !updatedImages[0].startsWith('https://res.cloudinary.com/')) {
      const nameMatch = mapLocalPathToCloudinary(product.slug || product.name);
      if (nameMatch) {
        updatedImages.unshift(nameMatch.url);
        updatedPublicIds.unshift(nameMatch.publicId);
      }
    }

    product.images = updatedImages;
    product.imagePublicIds = updatedPublicIds;
    await product.save();
    console.log(`  ✓ Updated [${product.sku}] ${product.name}`);
    console.log(`      Primary Cloudinary URL: ${updatedImages[0]}`);
  }

  // 2. Migrate Categories
  console.log('\n2. Migrating Category documents...');
  const categories = await Category.find({});
  for (const cat of categories) {
    if (cat.image) {
      const match = mapLocalPathToCloudinary(cat.image);
      if (match) {
        cat.image = match.url;
        await cat.save();
        console.log(`  ✓ Updated Category "${cat.name}" -> ${cat.image}`);
      }
    }
  }

  // 3. Migrate Brands
  console.log('\n3. Migrating Brand banner images...');
  const brands = await Brand.find({});
  for (const b of brands) {
    if (b.bannerImage) {
      const match = mapLocalPathToCloudinary(b.bannerImage);
      if (match) {
        b.bannerImage = match.url;
        await b.save();
        console.log(`  ✓ Updated Brand "${b.name}" banner -> ${b.bannerImage}`);
      }
    }
  }

  // 4. Migrate Orders (so existing orders display high-res Cloudinary images)
  console.log('\n4. Migrating existing Order item images...');
  const orders = await Order.find({});
  for (const order of orders) {
    let orderChanged = false;
    for (const item of order.items) {
      if (item.image && !item.image.startsWith('https://res.cloudinary.com/')) {
        const match = mapLocalPathToCloudinary(item.image) || mapLocalPathToCloudinary(item.name);
        if (match) {
          item.image = match.url;
          orderChanged = true;
        }
      }
    }
    if (orderChanged) {
      await order.save();
      console.log(`  ✓ Updated Order #${order.orderId} item images to Cloudinary`);
    }
  }

  console.log('\n--- Migration Completed Successfully! ---');
  await mongoose.disconnect();
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
  });
