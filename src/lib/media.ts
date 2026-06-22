import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type PreparedImage = {
  uri: string;
  bytes: ArrayBuffer;
  contentType: "image/jpeg";
  extension: "jpg";
};

async function readFile(uri: string) {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Could not read the selected image.");
    return response.arrayBuffer();
  }

  return new File(uri).arrayBuffer();
}

export async function prepareImage(
  asset: ImagePickerAsset,
  maxDimension = 1600,
): Promise<PreparedImage> {
  if (asset.type && asset.type !== "image") {
    throw new Error("Choose an image file.");
  }

  const largestSide = Math.max(asset.width || 0, asset.height || 0);
  const resize = largestSide > maxDimension
    ? asset.width >= asset.height
      ? { width: maxDimension }
      : { height: maxDimension }
    : undefined;

  const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  if (resize) context.resize(resize);
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const bytes = await readFile(saved.uri);

  if (bytes.byteLength === 0) throw new Error("The selected image is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("This image is too large. Choose a photo under 5 MB.");
  }

  return {
    uri: saved.uri,
    bytes,
    contentType: "image/jpeg",
    extension: "jpg",
  };
}
