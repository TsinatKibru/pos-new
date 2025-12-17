const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing connection...');
    try {
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        console.log('Testing Settings logic...');
        let settings = await prisma.storeSettings.findFirst();
        console.log('Settings found:', settings);

        if (!settings) {
            console.log('Creating settings...');
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: 'My Store',
                    currency: 'USD',
                    taxRate: 10,
                },
            });
            console.log('Created settings:', settings);
        }

        console.log('Testing Upsert logic...');
        const firstSettings = await prisma.storeSettings.findFirst();
        console.log('First settings for upsert:', firstSettings);

        const upserted = await prisma.storeSettings.upsert({
            where: { id: firstSettings?.id || 'placeholder' },
            update: { storeName: 'Updated Store' },
            create: {
                storeName: 'Updated Store',
                currency: 'USD',
                taxRate: 10,
            },
        });
        console.log('Upsert successful:', upserted);

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
