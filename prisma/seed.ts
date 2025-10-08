import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create default users
  const users = [
    {
      username: 'tainara',
      password: 'laquie'
    },
    {
      username: 'raphael', 
      password: 'laquie'
    }
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: userData
      })
      console.log(`Created user: ${userData.username}`)
    } else {
      console.log(`User ${userData.username} already exists`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })