let transitioning = false;

export function isPageTransitioning() {
  return transitioning;
}

export function setPageTransitioning(value: boolean) {
  transitioning = value;
}
