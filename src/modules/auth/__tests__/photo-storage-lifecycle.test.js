jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ customers: {} })),
}));

jest.mock("../../../config/db.js", () => ({
  prisma: {
    systemUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../imageUpload.js", () => ({
  decodeImageUpload: jest.fn(() => ({
    buffer: Buffer.from("image"),
    extension: "png",
  })),
}));

jest.mock("../../../services/objectStorage.js", () => ({
  contentTypeForExtension: jest.fn(() => "image/png"),
  uploadObject: jest.fn(),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  deleteStoredMedia: jest.fn().mockResolvedValue(undefined),
}));

const { prisma } = require("../../../config/db.js");
const {
  uploadObject,
  deleteObject,
  deleteStoredMedia,
} = require("../../../services/objectStorage.js");
const { uploadCoverPhoto, uploadProfilePhoto } = require("../service.js");

describe("photo storage lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteObject.mockResolvedValue(undefined);
    deleteStoredMedia.mockResolvedValue(undefined);
  });

  test("deletes the previous cover after the database points at the new one", async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ coverPhotoUrl: "/media/covers/old.png" });
    uploadObject.mockResolvedValue({
      storage: "r2",
      key: "covers/new.png",
      url: "/media/covers/new.png",
    });
    prisma.systemUser.update.mockResolvedValue({ coverPhotoUrl: "/media/covers/new.png" });

    const result = await uploadCoverPhoto("user-1", { coverPhoto: "data" });

    expect(result.status).toBe(200);
    expect(deleteStoredMedia).toHaveBeenCalledWith("/media/covers/old.png");
  });

  test("deletes a new profile object when the database update fails", async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ profilePhotoUrl: null });
    uploadObject.mockResolvedValue({
      storage: "r2",
      key: "profile-photos/new.png",
      url: "/media/profile-photos/new.png",
    });
    prisma.systemUser.update.mockRejectedValue(new Error("database unavailable"));

    await expect(
      uploadProfilePhoto("user-1", { profilePhoto: "data" }),
    ).rejects.toThrow("database unavailable");
    expect(deleteObject).toHaveBeenCalledWith("profile-photos/new.png", "r2");
  });
});
