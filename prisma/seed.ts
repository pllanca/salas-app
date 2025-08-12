import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.booking.deleteMany()
  await prisma.facility.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@school.edu',
        name: 'Admin User',
        role: 'ADMIN',
        password: await bcrypt.hash('admin123', 12),
      },
    }),
    prisma.user.create({
      data: {
        email: 'john.doe@school.edu',
        name: 'John Doe',
        role: 'FACULTY',
        password: await bcrypt.hash('faculty123', 12),
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@school.edu',
        name: 'Jane Smith',
        role: 'STUDENT',
        password: await bcrypt.hash('student123', 12),
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create facilities
  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: 'Room A101',
        type: 'CLASSROOM',
        capacity: 30,
        description: 'Modern classroom with interactive whiteboard and projector',
        location: 'Academic Building',
        building: 'Academic Building',
        floor: 1,
        imageUrl: '/images/classroom-1.jpg',
        equipment: JSON.stringify(['Projector', 'Interactive Whiteboard', 'Sound System', 'WiFi']),
        amenities: JSON.stringify(['Air Conditioning', 'Natural Light', 'Accessible']),
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Science Lab B201',
        type: 'LAB',
        capacity: 20,
        description: 'Fully equipped chemistry laboratory with fume hoods',
        location: 'Science Building',
        building: 'Science Building',
        floor: 2,
        imageUrl: '/images/lab-1.jpg',
        equipment: JSON.stringify(['Fume Hoods', 'Lab Benches', 'Chemical Storage', 'Emergency Shower']),
        amenities: JSON.stringify(['Ventilation System', 'Safety Equipment', 'Accessible']),
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Main Auditorium',
        type: 'AUDITORIUM',
        capacity: 200,
        description: 'Large auditorium perfect for presentations and events',
        location: 'Main Building',
        building: 'Main Building',
        floor: 1,
        imageUrl: '/images/auditorium-1.jpg',
        equipment: JSON.stringify(['Stage', 'Microphone System', 'Projection System', 'Lighting']),
        amenities: JSON.stringify(['Air Conditioning', 'Tiered Seating', 'Accessible', 'Parking Nearby']),
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Conference Room C305',
        type: 'MEETING_ROOM',
        capacity: 12,
        description: 'Intimate meeting room ideal for small group discussions',
        location: 'Administration Building',
        building: 'Administration Building',
        floor: 3,
        imageUrl: '/images/meeting-room-1.jpg',
        equipment: JSON.stringify(['Conference Table', 'TV Display', 'Video Conferencing', 'WiFi']),
        amenities: JSON.stringify(['Coffee Station', 'Whiteboards', 'Natural Light']),
      },
    }),
  ])

  console.log(`✅ Created ${facilities.length} facilities`)

  // Create some sample bookings
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const endTime = new Date(tomorrow)
  endTime.setHours(12, 0, 0, 0)

  await prisma.booking.create({
    data: {
      userId: users[1].id, // Faculty user
      facilityId: facilities[0].id, // Room A101
      startTime: tomorrow,
      endTime: endTime,
      purpose: 'Mathematics Lecture',
      attendees: 25,
      status: 'APPROVED',
    },
  })

  console.log('✅ Created sample bookings')
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })