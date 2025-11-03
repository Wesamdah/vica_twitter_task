import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Permissions
  const read = await prisma.permission.create({ data: { name: "Read" } });
  const write = await prisma.permission.create({ data: { name: "Write" } });
  const update = await prisma.permission.create({ data: { name: "Update" } });
  const del = await prisma.permission.create({ data: { name: "Delete" } });

  const role_one = await prisma.role.create({
    data: {
      name: "Admin",
      permissions: {
        create: [
          { permission_id: read.id },
          { permission_id: write.id },
          { permission_id: update.id },
          { permission_id: del.id },
        ],
      },
    },
  });

  const role_two = await prisma.role.create({
    data: {
      name: "user",
      permissions: {
        create: [
          { permission_id: read.id },
          { permission_id: write.id },
          { permission_id: update.id },
          { permission_id: del.id },
        ],
      },
    },
  });

  const role_three = await prisma.role.create({
    data: {
      name: "viwere",
      permissions: {
        create: [{ permission_id: read.id }],
      },
    },
  });
}

main()
  .then(async () => {
    console.log("Roles & permissions created successfully ");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
