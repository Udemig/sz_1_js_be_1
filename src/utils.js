/* Bütün uygulamanın ihtiyaç duyduğu ortak fonksiyonlaru buraya yazıp export ediyoruz. */

export const bufferToString = (buffer, encoding = "ascii") => {
  return Buffer.from(buffer).toString(encoding);
};
