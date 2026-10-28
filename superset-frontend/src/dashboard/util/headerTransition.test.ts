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
import {
  DASHBOARD_HEADER_TRANSITION_EVENT,
  notifyDashboardHeaderTransition,
  slideFromOffset,
  slideToOffset,
  stopSlide,
} from './headerTransition';

class FakeAnimation extends EventTarget {
  cancel = jest.fn();

  finish() {
    this.dispatchEvent(new Event('finish'));
  }
}

const animatable = () => {
  const element = document.createElement('div');
  const animations: FakeAnimation[] = [];
  const animate = jest.fn(() => {
    const animation = new FakeAnimation();
    animations.push(animation);
    return animation as unknown as Animation;
  });
  Object.assign(element, { animate });
  return { element, animate, animations };
};

test('slideFromOffset slides the elements back to their place', () => {
  const items = [animatable(), animatable()];

  slideFromOffset(
    items.map(item => item.element),
    -40,
    350,
  );

  items.forEach(({ animate }) =>
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translateY(-40px)' }, { transform: 'none' }],
      { duration: 350, easing: 'ease' },
    ),
  );
});

test('slideFromOffset does nothing without an offset', () => {
  const { element, animate } = animatable();
  slideFromOffset([element], 0, 350);
  expect(animate).not.toHaveBeenCalled();
});

test('slideToOffset slides the element away and cleans up', () => {
  const { element, animate, animations } = animatable();
  const onEnd = jest.fn();

  slideToOffset(element, -120, 350, onEnd);

  expect(animate).toHaveBeenCalledWith(
    [{ transform: 'none' }, { transform: 'translateY(-120px)' }],
    { duration: 350, easing: 'ease' },
  );
  expect(onEnd).not.toHaveBeenCalled();
  animations[0].finish();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('stopSlide cancels a running slide', () => {
  const { element, animations } = animatable();
  const onEnd = jest.fn();
  slideToOffset(element, -120, 350, onEnd);

  stopSlide([element]);

  expect(animations[0].cancel).toHaveBeenCalledTimes(1);
  expect(onEnd).not.toHaveBeenCalled();
});

test('a new slide replaces the running one', () => {
  const { element, animations } = animatable();
  slideFromOffset([element], 80, 350);
  slideFromOffset([element], -80, 350);
  expect(animations[0].cancel).toHaveBeenCalledTimes(1);
  expect(animations[1].cancel).not.toHaveBeenCalled();
});

test('slideToOffset cleans up at once without the Web Animations API', () => {
  const element = document.createElement('div');
  const onEnd = jest.fn();
  slideToOffset(element, -120, 350, onEnd);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('notifyDashboardHeaderTransition dispatches the event', () => {
  const listener = jest.fn();
  window.addEventListener(DASHBOARD_HEADER_TRANSITION_EVENT, listener);
  notifyDashboardHeaderTransition({ delta: 0, duration: 350 });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0][0].detail).toEqual({ delta: 0, duration: 350 });
  window.removeEventListener(DASHBOARD_HEADER_TRANSITION_EVENT, listener);
});
