const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Eğer hata verirse burayı 'bcryptjs' yapın

const prisma = new PrismaClient();

async function main() {
  console.log("Veritabanına bağlanılıyor...");
  
  // Şifreyi güvenli bir şekilde (bcrypt ile) şifreliyoruz
  const hashedPassword = await bcrypt.hash('nxa2026', 10);

  // User tablosuna Super Admin'i ekliyoruz
  const superAdmin = await prisma.user.create({
    data: {
      email: 'umut@nxa.com.tr',
      password: hashedPassword,
      name: 'Umut Erdoğan (Kurucu)',
      role: 'SUPER_ADMIN',
    },
  });

  console.log("✅ Başarılı! Super Admin hesabı oluşturuldu.");
  console.log(`📧 E-posta: ${superAdmin.email}`);
  console.log(`🔑 Şifre: nxa2026`);
}

main()
  .catch((e) => {
    console.error("❌ Bir hata oluştu:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });   