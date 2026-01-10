import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const productId = randomUUID().replace(/-/g, '')
  
  // Create Trunk Core product
  const trunkCore = await prisma.product.create({
    data: {
      id: productId,
      slug: 'trunk-core',
      name: 'Trunk Core Series',
      tagline: 'Crafted for the modern gentleman',
      description: "Redefines men's essentials with unmatched comfort, style, and durability. Proudly Made in India.",
      category: 'trunk',
      images: JSON.stringify([
        '/Packs/Packof1.jpg',
        '/Packs/Packof2.jpg',
        '/Packs/Packof3.jpg',
      ]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      productfeature: {
        create: [
          { id: randomUUID().replace(/-/g, ''), name: 'LuxeSoft', description: 'Luxuriously soft feel on the skin' },
          { id: randomUUID().replace(/-/g, ''), name: 'Air Max', description: 'Superior breathability' },
          { id: randomUUID().replace(/-/g, ''), name: 'Odour-free', description: 'Anti-microbial finish for long-lasting freshness' },
          { id: randomUUID().replace(/-/g, ''), name: '4-Way Stretch', description: 'Flexible fit that moves with you' },
          { id: randomUUID().replace(/-/g, ''), name: 'Premium Modal', description: '2× Softer Than Cotton' },
          { id: randomUUID().replace(/-/g, ''), name: 'Sweat Wicking', description: 'Cool & Dry Comfort' },
        ],
      },
      productvariant: {
        create: [
          // Pack of 1
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-S-BLK-1', size: 'S', color: 'black', pack: 1, price: 33500, stock: 50, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-M-BLK-1', size: 'M', color: 'black', pack: 1, price: 33500, stock: 100, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-L-BLK-1', size: 'L', color: 'black', pack: 1, price: 33500, stock: 100, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-XL-BLK-1', size: 'XL', color: 'black', pack: 1, price: 33500, stock: 50, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          
          // Pack of 2
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-S-BLK-2', size: 'S', color: 'black', pack: 2, price: 54600, stock: 40, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-M-BLK-2', size: 'M', color: 'black', pack: 2, price: 54600, stock: 80, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-L-BLK-2', size: 'L', color: 'black', pack: 2, price: 54600, stock: 80, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-XL-BLK-2', size: 'XL', color: 'black', pack: 2, price: 54600, stock: 40, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          
          // Pack of 3
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-S-BLK-3', size: 'S', color: 'black', pack: 3, price: 69400, stock: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-M-BLK-3', size: 'M', color: 'black', pack: 3, price: 69400, stock: 60, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-L-BLK-3', size: 'L', color: 'black', pack: 3, price: 69400, stock: 60, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          { id: randomUUID().replace(/-/g, ''), sku: 'TC-XL-BLK-3', size: 'XL', color: 'black', pack: 3, price: 69400, stock: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    },
  })

  console.log('✅ Product created:', trunkCore.name)
  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
