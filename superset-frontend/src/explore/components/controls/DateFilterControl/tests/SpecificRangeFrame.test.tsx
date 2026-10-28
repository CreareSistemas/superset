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
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { render, screen, userEvent } from 'spec/helpers/testing-library';
import { SpecificRangeFrame } from '../components';
import { getInitialRange } from '../components/SpecificRangeFrame';
import { MIDNIGHT, SEVEN_DAYS_AGO, dttmToDayjs } from '../utils';

const mockStore = configureStore([thunk]);

const renderFrame = (value: string) => {
  const onChange = jest.fn();
  const onPendingChange = jest.fn();
  render(
    <SpecificRangeFrame
      onChange={onChange}
      onPendingChange={onPendingChange}
      value={value}
    />,
    { store: mockStore({ common: { locale: 'pt_BR' } }) },
  );
  return { onChange, onPendingChange };
};

const day = (date: string) =>
  document.querySelector(`[data-date="${date}"]`) as HTMLElement;

// range saved before the calendar: the end (17th at midnight) is exclusive
const legacyValue = '2021-03-16T00:00:00 : 2021-03-17T00:00:00';

test('shows a single calendar with the start and end times, no date pickers', async () => {
  renderFrame('2021-03-10T00:00:00 : 2021-03-12T23:59:59');

  expect(await screen.findByTestId('specific-range-frame')).toBeInTheDocument();
  expect(document.querySelector('.ant-picker-input')).not.toBeInTheDocument();
  expect(screen.getByTestId('range-start-time')).toHaveValue('00:00');
  expect(screen.getByTestId('range-end-time')).toHaveValue('23:59');
});

test('fills the days of the range, the ends in solid color', async () => {
  renderFrame('2021-03-10T00:00:00 : 2021-03-12T23:59:59');
  await screen.findByTestId('specific-range-frame');

  expect(day('2021-03-10')).toHaveClass('range-calendar__day--start');
  expect(day('2021-03-11')).toHaveClass('range-calendar__day--in-range');
  expect(day('2021-03-12')).toHaveClass('range-calendar__day--end');
  expect(day('2021-03-13')).not.toHaveClass('range-calendar__day--in-range');
});

test('an exclusive end at midnight is shown as the previous day', async () => {
  renderFrame(legacyValue);
  await screen.findByTestId('specific-range-frame');

  expect(day('2021-03-16')).toHaveClass(
    'range-calendar__day--start',
    'range-calendar__day--end',
  );
  expect(day('2021-03-17')).not.toHaveClass('range-calendar__day--end');
  expect(screen.getByTestId('range-end-time')).toHaveValue('23:59');
});

test('1st click picks the start, 2nd click the end, the last day in full', async () => {
  const { onChange, onPendingChange } = renderFrame(legacyValue);
  await screen.findByTestId('specific-range-frame');

  userEvent.click(day('2021-03-10'));
  expect(onPendingChange).toHaveBeenLastCalledWith(true);
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByTestId('range-end-time')).toBeDisabled();

  userEvent.click(day('2021-03-12'));
  expect(onPendingChange).toHaveBeenLastCalledWith(false);
  expect(onChange).toHaveBeenLastCalledWith(
    '2021-03-10T00:00:00 : 2021-03-12T23:59:59',
  );
});

test('an end before the start swaps them', async () => {
  const { onChange } = renderFrame(legacyValue);
  await screen.findByTestId('specific-range-frame');

  userEvent.click(day('2021-03-12'));
  userEvent.click(day('2021-03-10'));
  expect(onChange).toHaveBeenLastCalledWith(
    '2021-03-10T00:00:00 : 2021-03-12T23:59:59',
  );
});

test('the time fields change the start and end times', async () => {
  const { onChange } = renderFrame(legacyValue);
  await screen.findByTestId('specific-range-frame');

  const endTime = screen.getByTestId('range-end-time');
  userEvent.clear(endTime);
  userEvent.type(endTime, '1830');
  expect(endTime).toHaveValue('18:30');
  expect(onChange).toHaveBeenLastCalledWith(
    '2021-03-16T00:00:00 : 2021-03-16T18:30:59',
  );

  const startTime = screen.getByTestId('range-start-time');
  userEvent.clear(startTime);
  userEvent.type(startTime, '0815');
  expect(onChange).toHaveBeenLastCalledWith(
    '2021-03-16T08:15:00 : 2021-03-16T18:30:59',
  );
});

test('on the same day the end time follows a later start time', async () => {
  const { onChange } = renderFrame(legacyValue);
  await screen.findByTestId('specific-range-frame');

  const endTime = screen.getByTestId('range-end-time');
  userEvent.clear(endTime);
  userEvent.type(endTime, '1000');
  const startTime = screen.getByTestId('range-start-time');
  userEvent.clear(startTime);
  userEvent.type(startTime, '1200');
  expect(endTime).toHaveValue('12:00');
  expect(onChange).toHaveBeenLastCalledWith(
    '2021-03-16T12:00:00 : 2021-03-16T12:00:59',
  );
});

test('any other time range becomes the last 7 full days', async () => {
  const { onChange } = renderFrame('Last week');
  await screen.findByTestId('specific-range-frame');

  const until = dttmToDayjs(MIDNIGHT).subtract(1, 'second');
  expect(onChange).toHaveBeenCalledWith(
    `${SEVEN_DAYS_AGO} : ${until.format('YYYY-MM-DD[T]HH:mm:ss')}`,
  );
});

test('getInitialRange keeps a range of whole days', () => {
  const { range, isSpecificRange } = getInitialRange(
    '2021-03-10T00:00:00 : 2021-03-12T23:59:59',
  );
  expect(isSpecificRange).toBe(true);
  expect(range.startDay?.format('YYYY-MM-DD')).toBe('2021-03-10');
  expect(range.endDay?.format('YYYY-MM-DD')).toBe('2021-03-12');
  expect(range.startTime).toBe('00:00');
  expect(range.endTime).toBe('23:59');
});
