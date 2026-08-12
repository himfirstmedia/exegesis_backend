import { decodeImageUpload } from '../imageUpload.js';

describe('profile photo validation', () => {
  it('requires base64 image data', () => {
    expect(decodeImageUpload(undefined, 'profilePhoto').error).toMatchObject({
      status: 400,
      message: 'profilePhoto (base64) is required',
    });
  });

  it('rejects unsupported file contents', () => {
    const profilePhoto = Buffer.from('not an image').toString('base64');

    expect(decodeImageUpload(profilePhoto, 'profilePhoto').error).toMatchObject({
      status: 400,
      message: 'File is not a supported image (jpg/png/webp)',
    });
  });

  it('rejects images larger than five megabytes', () => {
    const profilePhoto = 'a'.repeat(Math.ceil((5 * 1024 * 1024 * 4) / 3) + 8);

    expect(decodeImageUpload(profilePhoto, 'profilePhoto').error).toMatchObject({
      status: 400,
      message: 'Image is too large (max 5MB)',
    });
  });

  it('accepts a valid PNG signature', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    expect(decodeImageUpload(png.toString('base64'), 'profilePhoto')).toMatchObject({
      extension: 'png',
    });
  });
});
