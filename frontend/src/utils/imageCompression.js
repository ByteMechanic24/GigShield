function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load the selected image.'));
    image.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export async function compressImageFile(file, options = {}) {
  const {
    maxDimension = 1600,
    quality = 0.72,
    outputType = 'image/jpeg',
  } = options;

  if (!file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      originalSizeBytes: file.size,
      capturedAt: new Date().toISOString(),
      dataUrl,
    };
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const compressedDataUrl = canvas.toDataURL(outputType, quality);
  const compressedBlob = dataUrlToBlob(compressedDataUrl);

  return {
    name: file.name.replace(/\.[^.]+$/, '.jpg'),
    mimeType: outputType,
    sizeBytes: compressedBlob.size,
    originalSizeBytes: file.size,
    capturedAt: new Date().toISOString(),
    dataUrl: compressedDataUrl,
  };
}
