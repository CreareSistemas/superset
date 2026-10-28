/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export const FILTER_BAR_COLLAPSE_DURATION = 350;

export const DASHBOARD_HEADER_TRANSITION_EVENT =
  'creare:dashboard-header-transition';

export type DashboardHeaderTransition = {
  delta: number;
  duration: number;
};

export function notifyDashboardHeaderTransition(
  detail: DashboardHeaderTransition,
) {
  window.dispatchEvent(
    new CustomEvent<DashboardHeaderTransition>(
      DASHBOARD_HEADER_TRANSITION_EVENT,
      { detail },
    ),
  );
}

const slides = new WeakMap<HTMLElement, Animation>();

const canAnimate = (element: HTMLElement) =>
  typeof element.animate === 'function';

const slide = (
  element: HTMLElement,
  from: number,
  to: number,
  duration: number,
) => {
  slides.get(element)?.cancel();
  const animation = element.animate(
    [
      { transform: from ? `translateY(${from}px)` : 'none' },
      { transform: to ? `translateY(${to}px)` : 'none' },
    ],
    { duration, easing: 'ease' },
  );
  slides.set(element, animation);
  animation.addEventListener('finish', () => {
    if (slides.get(element) === animation) slides.delete(element);
  });
  return animation;
};

export function stopSlide(elements: HTMLElement[]) {
  elements.forEach(element => {
    slides.get(element)?.cancel();
    slides.delete(element);
  });
}

export function slideFromOffset(
  elements: HTMLElement[],
  offset: number,
  duration: number,
) {
  if (!offset) return;
  elements
    .filter(canAnimate)
    .forEach(element => slide(element, offset, 0, duration));
}

export function slideToOffset(
  element: HTMLElement,
  offset: number,
  duration: number,
  onEnd?: () => void,
) {
  if (!canAnimate(element)) {
    onEnd?.();
    return;
  }
  slide(element, 0, offset, duration).addEventListener('finish', () =>
    onEnd?.(),
  );
}
