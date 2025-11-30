export const getYouTubeThumbnail = (url: string) => {
  if (!url) return null;
  // Wyciągamy ID filmu z różnych formatów linków (youtu.be, youtube.com/watch etc.)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    // Zwracamy link do oficjalnej miniaturki YouTube w wysokiej jakości
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
};