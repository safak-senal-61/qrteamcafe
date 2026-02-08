const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
console.log('Checking dir:', uploadsDir);

try {
  if (!fs.existsSync(uploadsDir)) {
    console.log('Dir does not exist');
  } else {
    const files = fs.readdirSync(uploadsDir);
    console.log('Files:', files);
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const images = files
        .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => ({
          filename: file,
          url: `/uploads/products/${file}`
        }));
    console.log('Filtered images:', images);
    
    const query = 'su';
    const lowerQuery = query.toLowerCase();
    const filtered = images.filter(img => img.filename.toLowerCase().includes(lowerQuery));
    console.log('Query "su" result:', filtered);
  }
} catch (e) {
  console.error(e);
}
