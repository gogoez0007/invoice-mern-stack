const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://tofikgogo:R2mP2lTkrnQNF3At@cluster0.h0a0c.mongodb.net/test';
const client = new MongoClient(uri);

async function exportAllCollections() {
  try {
    await client.connect();
    const db = client.db('test'); // Ganti dengan nama database kamu
    const collections = await db.listCollections().toArray();

    // Buat folder untuk hasil ekspor
    const outputDir = path.join(__dirname, 'mongo_exports');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Ekspor setiap koleksi ke file JSON
    for (const { name } of collections) {
      console.log(`📤 Mengekspor koleksi: ${name}...`);
      const data = await db.collection(name).find().toArray();
      const outputPath = path.join(outputDir, `${name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`✅ Koleksi "${name}" berhasil diekspor ke ${outputPath}`);
    }

    console.log('🎉 Semua koleksi berhasil diekspor!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat ekspor:', error);
  } finally {
    await client.close();
  }
}

exportAllCollections();
