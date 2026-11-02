/** Stanley animations from the brand kit. `*White` versions sit on gradients. */
export const stanley = {
  headphoneWhite: "/brand/stanley-headphone-white.gif",
  tailwagWhite: "/brand/stanley-tailwag-white.gif",
  dancingWhite: "/brand/stanley-dancing-white.gif",
  listeningWhite: "/brand/stanley-listening-white.gif",
  barkingWhite: "/brand/stanley-barking-white.gif",
  runningWhite: "/brand/stanley-running-straight-white.gif",
  howlingWhite: "/brand/stanley-howling-white.gif",
  backflip: "/brand/stanley-backflip.gif",
  tailwag: "/brand/stanley-tailwag.gif",
  dance: "/brand/stanley-dance.gif",
  barking: "/brand/stanley-barking.gif",
  listening: "/brand/stanley-listening.gif",
  howling: "/brand/stanley-howling.gif",
  jumping: "/brand/stanley-jumping.gif",
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
