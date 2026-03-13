// YouTube IFrame Player API - search and play directly
// No third-party search API needed

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

export function loadYouTubeAPI(): Promise<void> {
  if (apiReady) return Promise.resolve();
  return new Promise((resolve) => {
    if (apiLoaded) {
      if (apiReady) {
        resolve();
      } else {
        readyCallbacks.push(resolve);
      }
      return;
    }
    apiLoaded = true;
    readyCallbacks.push(resolve);

    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      apiReady = true;
      prev?.();
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}
