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
import { formatTimeRangeForDisplay } from '../utils';

test('formats a specific range without hours when both ends are at midnight', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-02T00:00:00 : 2026-10-09T00:00:00',
      'pt_BR',
    ),
  ).toBe('02/10/2026 to 09/10/2026');
});

test('a range saved by the calendar (end at 23:59:59) shows only the dates', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-19T00:00:00 : 2026-10-26T23:59:59',
      'pt_BR',
    ),
  ).toBe('19/10/2026 to 26/10/2026');
});

test('shows the hours when the calendar end time is not the end of the day', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-19T00:00:00 : 2026-10-26T18:30:59',
      'pt_BR',
    ),
  ).toBe('19/10/2026 00:00 to 26/10/2026 18:30');
});

test('shows the hours when one of the ends is not at midnight', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-02T08:30:00 : 2026-10-09T00:00:00',
      'pt_BR',
    ),
  ).toBe('02/10/2026 08:30 to 09/10/2026 00:00');
});

test('uses month/day/year for English', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-02T00:00:00 : 2026-10-09T00:00:00',
      'en',
    ),
  ).toBe('10/02/2026 to 10/09/2026');
});

test('uses ISO dates for other locales', () => {
  expect(
    formatTimeRangeForDisplay(
      '2026-10-02T00:00:00 : 2026-10-09T00:00:00',
      'fr',
    ),
  ).toBe('2026-10-02 to 2026-10-09');
});

test.each([
  'Last week',
  'No filter',
  'DATEADD(DATETIME("now"), -7, day) : now',
  '',
  undefined,
])('returns undefined for a non specific range (%s)', value => {
  expect(formatTimeRangeForDisplay(value, 'pt_BR')).toBeUndefined();
});
