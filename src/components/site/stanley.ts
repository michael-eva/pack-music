import headphoneWhite from "@/assets/stanley-headphone-white.gif.asset.json";
import tailwagWhite from "@/assets/stanley-tailwag-white.gif.asset.json";
import dancingWhite from "@/assets/stanley-dancing-white.gif.asset.json";
import listeningWhite from "@/assets/stanley-listening-white.gif.asset.json";
import barkingWhite from "@/assets/stanley-barking-white.gif.asset.json";
import runningWhite from "@/assets/stanley-running-straight-white.gif.asset.json";
import howlingWhite from "@/assets/stanley-howling-white.gif.asset.json";
import backflip from "@/assets/stanley-backflip.gif.asset.json";
import tailwag from "@/assets/stanley-tailwag.gif.asset.json";
import dance from "@/assets/stanley-dance.gif.asset.json";
import barking from "@/assets/stanley-barking.gif.asset.json";
import listening from "@/assets/stanley-listening.gif.asset.json";
import howling from "@/assets/stanley-howling.gif.asset.json";
import jumping from "@/assets/stanley-jumping.gif.asset.json";

/** Stanley animations from the brand kit. `*White` versions sit on gradients. */
export const stanley = {
  headphoneWhite: headphoneWhite.url,
  tailwagWhite: tailwagWhite.url,
  dancingWhite: dancingWhite.url,
  listeningWhite: listeningWhite.url,
  barkingWhite: barkingWhite.url,
  runningWhite: runningWhite.url,
  howlingWhite: howlingWhite.url,
  backflip: backflip.url,
  tailwag: tailwag.url,
  dance: dance.url,
  barking: barking.url,
  listening: listening.url,
  howling: howling.url,
  jumping: jumping.url,
} as const;

/** Tightly cropped hero versions (no transparent padding) so Stanley can be
 *  sized to exactly match the headline height. */
export const stanleyHero = {
  barking: "/stanley-barking-crop.gif",
  listening: "/stanley-listening-crop.gif",
  howling: "/stanley-howling-crop.gif",
  dancing: "/stanley-dance-crop.gif",
  tailwag: "/stanley-tailwag-crop.gif",
  backflip: "/stanley-backflip-crop.gif",
  jumping: "/stanley-jumping-crop.gif",
} as const;
