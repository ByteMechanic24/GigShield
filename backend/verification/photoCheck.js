function checkPhotoEvidence(photos = []) {
  const validPhotos = Array.isArray(photos) ? photos.filter((photo) => photo && photo.dataUrl) : [];
  const photoCount = validPhotos.length;

  let score = 0.15;
  if (photoCount >= 1) score = 0.4;
  if (photoCount >= 3) score = 0.55;
  if (photoCount >= 6) score = 0.65;

  const flags = [];
  if (photoCount === 0) {
    flags.push('NO_PHOTO_EVIDENCE');
  } else {
    flags.push('HUMAN_PHOTO_REVIEW_RECOMMENDED');
  }

  return {
    checkName: 'photo_evidence',
    weight: 0,
    score,
    confidence: photoCount > 0 ? 'LOW' : 'NONE',
    hardReject: false,
    flags,
    data: {
      photoCount,
      requiresHumanReview: photoCount > 0,
      photos: validPhotos.map((photo) => ({
        name: photo.name || null,
        mimeType: photo.mimeType || null,
        sizeBytes: photo.sizeBytes || null,
        capturedAt: photo.capturedAt || null,
      })),
    },
    completedAt: new Date(),
  };
}

module.exports = {
  checkPhotoEvidence,
};
