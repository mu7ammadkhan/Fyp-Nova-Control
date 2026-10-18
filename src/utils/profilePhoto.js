// Wait for the saved profile before considering a sign-in provider's photo.
// An explicitly cleared photo must never fall back to an older provider image.
export function resolveProfilePhoto(profile, providerPhoto, loaded) {
  if (!loaded) return "";
  if (profile && Object.hasOwn(profile, "photoURL")) return profile.photoURL || "";
  return providerPhoto || "";
}
