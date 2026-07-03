import { Assets, Texture } from "pixi.js";
import type { CatAnimationKey, CatAnimationLibrary } from "./CatTypes";

const assetModules = import.meta.glob("../assets/cat/**/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function parseFrameNumber(path: string) {
  const match = path.match(/_(\d+)\.png$/i);
  return match ? Number(match[1]) : 0;
}

function buildUrlMap() {
  const grouped = new Map<CatAnimationKey, string[]>();

  for (const [path, url] of Object.entries(assetModules)) {
    const parts = path.split("/");
    const stateFolder = parts[parts.length - 2] as CatAnimationKey;
    const group = grouped.get(stateFolder) ?? [];
    group.push(url);
    grouped.set(stateFolder, group);
  }

  grouped.forEach((urls, key) => {
    urls.sort((left, right) => parseFrameNumber(left) - parseFrameNumber(right));
    grouped.set(key, urls);
  });

  return grouped;
}

export class CatAssetLoader {
  async load() {
    const urlMap = buildUrlMap();
    const library = {} as CatAnimationLibrary;

    for (const [key, urls] of urlMap.entries()) {
      const textures = await Promise.all(urls.map((url) => Assets.load<Texture>(url)));
      library[key] = textures;
    }

    return library;
  }
}
