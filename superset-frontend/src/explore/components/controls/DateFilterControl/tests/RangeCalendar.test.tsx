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
import 'dayjs/locale/pt-br';
import { extendedDayjs } from '@superset-ui/core/utils/dates';
import { render, screen, userEvent } from 'spec/helpers/testing-library';
import { RangeCalendar } from '../components/RangeCalendar';

const date = (value: string) => extendedDayjs(value);

const day = (value: string) =>
  document.querySelector(`[data-date="${value}"]`) as HTMLElement | null;

const cell = (value: string) => day(value)!.parentElement as HTMLElement;

const renderCalendar = (
  startDay: string | null,
  endDay: string | null,
  onSelectDay = jest.fn(),
) => {
  render(
    <RangeCalendar
      startDay={startDay ? date(startDay) : null}
      endDay={endDay ? date(endDay) : null}
      onSelectDay={onSelectDay}
      locale="pt-br"
      initialMonth={date('2024-10-01')}
    />,
  );
  return onSelectDay;
};

test('shows the month with one letter per week day, only its days', () => {
  renderCalendar('2024-10-09', '2024-10-17');

  expect(screen.getByTestId('range-calendar-title')).toHaveTextContent(
    'outubro 2024',
  );
  expect(
    [...document.querySelectorAll('.range-calendar__weekday')].map(
      element => element.textContent,
    ),
  ).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
  expect(day('2024-10-01')).toBeInTheDocument();
  expect(day('2024-10-31')).toBeInTheDocument();
  expect(day('2024-09-30')).not.toBeInTheDocument();
  expect(day('2024-11-01')).not.toBeInTheDocument();
});

test('joins the days of the range with a band rounded at the week ends', () => {
  renderCalendar('2024-10-09', '2024-10-17');

  expect(day('2024-10-09')).toHaveClass('range-calendar__day--start');
  expect(day('2024-10-17')).toHaveClass('range-calendar__day--end');
  expect(cell('2024-10-09')).toHaveClass(
    'range-calendar__cell--band',
    'range-calendar__cell--band-start',
  );
  expect(cell('2024-10-10')).toHaveClass('range-calendar__cell--band');
  expect(cell('2024-10-12')).toHaveClass('range-calendar__cell--round-right');
  expect(cell('2024-10-13')).toHaveClass('range-calendar__cell--round-left');
  expect(cell('2024-10-17')).toHaveClass('range-calendar__cell--band-end');
  expect(cell('2024-10-18')).not.toHaveClass('range-calendar__cell--band');
});

test('a single day range has no band', () => {
  renderCalendar('2024-10-09', '2024-10-09');

  expect(day('2024-10-09')).toHaveClass(
    'range-calendar__day--start',
    'range-calendar__day--end',
  );
  expect(cell('2024-10-09')).not.toHaveClass('range-calendar__cell--band');
});

test('while the end is not picked, the range follows the mouse', () => {
  renderCalendar('2024-10-09', null);

  expect(cell('2024-10-10')).not.toHaveClass('range-calendar__cell--band');
  userEvent.hover(day('2024-10-17')!);
  expect(day('2024-10-17')).toHaveClass('range-calendar__day--preview');
  expect(cell('2024-10-12')).toHaveClass('range-calendar__cell--band');

  userEvent.unhover(day('2024-10-17')!);
  userEvent.hover(day('2024-10-05')!);
  expect(cell('2024-10-07')).toHaveClass('range-calendar__cell--band');
  expect(cell('2024-10-12')).not.toHaveClass('range-calendar__cell--band');
});

test('clicking a day selects it', () => {
  const onSelectDay = renderCalendar('2024-10-09', '2024-10-17');

  userEvent.click(day('2024-10-21')!);
  expect(onSelectDay).toHaveBeenCalledTimes(1);
  expect(onSelectDay.mock.calls[0][0].format('YYYY-MM-DD')).toBe('2024-10-21');
});

test('the arrows change the month', () => {
  renderCalendar('2024-10-09', '2024-10-17');

  userEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByTestId('range-calendar-title')).toHaveTextContent(
    'novembro 2024',
  );
  userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getByTestId('range-calendar-title')).toHaveTextContent(
    'setembro 2024',
  );
});

test('the title opens the months of the year', () => {
  renderCalendar('2024-10-09', '2024-10-17');

  userEvent.click(screen.getByTestId('range-calendar-title'));
  expect(screen.getAllByTestId('range-calendar-month')).toHaveLength(12);
  userEvent.click(screen.getByRole('button', { name: 'Next year' }));
  expect(screen.getByTestId('range-calendar-title')).toHaveTextContent('2025');

  userEvent.click(screen.getByText('mar'));
  expect(screen.getByTestId('range-calendar-title')).toHaveTextContent(
    'março 2025',
  );
  expect(day('2025-03-01')).toBeInTheDocument();
});
