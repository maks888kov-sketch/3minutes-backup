/** Привязка MediaStream к <video> с автозапуском (важно для Chrome/Safari). */
export async function bindVideoStream(videoEl, stream) {
  if (!videoEl) return;
  if (!stream) {
    videoEl.srcObject = null;
    return;
  }
  videoEl.srcObject = stream;
  try {
    await videoEl.play();
  } catch {
    // autoplay policy — пользователь уже нажал «Начать»
  }
}
