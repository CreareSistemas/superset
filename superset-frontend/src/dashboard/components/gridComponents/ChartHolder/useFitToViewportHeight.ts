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
import { RefObject, useEffect, useState } from 'react';
import {
  DASHBOARD_HEADER_TRANSITION_EVENT,
  DashboardHeaderTransition,
} from 'src/dashboard/util/headerTransition';

export const FIT_MIN_HEIGHT = 300;

const HEADER_SELECTOR = '[data-test="dashboard-header-wrapper"]';

const toPx = (value: string) => parseFloat(value) || 0;

const getBottomGap = (element: HTMLElement) => {
  let gap = toPx(window.getComputedStyle(element).marginBottom);
  let current = element.parentElement;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    gap +=
      toPx(style.paddingBottom) +
      toPx(style.borderBottomWidth) +
      toPx(style.marginBottom);
    current = current.parentElement;
  }
  return gap;
};

const getLayoutTop = (element: HTMLElement) => {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
};

const getAvailableHeight = (element: HTMLElement) =>
  Math.floor(
    window.innerHeight - getLayoutTop(element) - getBottomGap(element),
  );

const getVerticalPadding = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  return (
    toPx(style.paddingTop) +
    toPx(style.paddingBottom) +
    toPx(style.borderTopWidth) +
    toPx(style.borderBottomWidth)
  );
};

export type FitToViewportHeight = {
  holderHeight: number;
  chartHeight: number;
};

export default function useFitToViewportHeight(
  enabled: boolean,
  holderRef: RefObject<HTMLElement | null>,
): FitToViewportHeight | undefined {
  const [fitHeight, setFitHeight] = useState<FitToViewportHeight>();

  useEffect(() => {
    if (!enabled) return undefined;

    let frame = 0;
    let transitionTimer: ReturnType<typeof setTimeout> | undefined;
    let transitioning = false;

    const update = (delta = 0) => {
      const holder = holderRef.current;
      if (!holder) return;
      const holderHeight = getAvailableHeight(holder) - delta;
      const chartHeight = holderHeight - getVerticalPadding(holder);
      setFitHeight(current => {
        if (holderHeight < FIT_MIN_HEIGHT) return undefined;
        if (
          current?.holderHeight === holderHeight &&
          current.chartHeight === chartHeight
        ) {
          return current;
        }
        return { holderHeight, chartHeight };
      });
    };

    const measure = () => {
      if (transitioning) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update());
    };

    const onHeaderTransition = (event: Event) => {
      const { delta, duration } = (
        event as CustomEvent<DashboardHeaderTransition>
      ).detail;
      cancelAnimationFrame(frame);
      clearTimeout(transitionTimer);
      update(delta);
      transitioning = true;
      transitionTimer = setTimeout(() => {
        transitioning = false;
        measure();
      }, duration + 50);
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener(
      DASHBOARD_HEADER_TRANSITION_EVENT,
      onHeaderTransition,
    );

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      const header = document.querySelector(HEADER_SELECTOR);
      if (header) observer.observe(header);
      observer.observe(document.body);
    }

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(transitionTimer);
      window.removeEventListener('resize', measure);
      window.removeEventListener(
        DASHBOARD_HEADER_TRANSITION_EVENT,
        onHeaderTransition,
      );
      observer?.disconnect();
    };
  }, [enabled, holderRef]);

  return enabled ? fitHeight : undefined;
}
