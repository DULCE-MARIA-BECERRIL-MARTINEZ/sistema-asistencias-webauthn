import fs from 'fs';
import https from 'https';
import path from 'path';

const MODEL_URL =
  'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

const FILES = [
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json'
];

const download = (file) =>
  new Promise((resolve, reject) => {
    const dir = path.resolve('public/models');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, file);
    const fileUrl = MODEL_URL + file;

    console.log(`⬇️ Descargando: ${fileUrl}`);

    https.get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(`HTTP ${response.statusCode}: ${fileUrl}`);
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✔ Guardado: ${filePath}`);
        resolve();
      });
    });
  });

(async () => {
  for (const file of FILES) {
    try {
      await download(file);
    } catch (err) {
      console.error('❌ Error:', err);
    }
  }
  console.log('🎉 Modelos descargados correctamente');
})();
