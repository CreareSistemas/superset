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
import { t } from '@apache-superset/core/translation';
import { customTimeRangeDecode } from '@superset-ui/core';
import { dttmToDayjs } from './dateParser';

// Creare: day/month/year for Portuguese and Spanish, month/day/year for
// English, ISO otherwise (same formats as the date pickers of
// SpecificRangeFrame)
const DAY_FIRST_LOCALES = ['pt', 'pt_BR', 'es'];
const MONTH_FIRST_LOCALES = ['en', 'en_US'];

export const getDateDisplayFormat = (locale?: string) => {
  if (locale && DAY_FIRST_LOCALES.includes(locale)) {
    return 'DD/MM/YYYY';
  }
  if (locale && MONTH_FIRST_LOCALES.includes(locale)) {
    return 'MM/DD/YYYY';
  }
  return 'YYYY-MM-DD';
};

/**
 * Creare: human readable text of a specific time range
 * ("2026-10-02T00:00:00 : 2026-10-09T00:00:00" -> "02/10/2026 to 09/10/2026"),
 * instead of the technical "2026-10-02 ≤ col < 2026-10-09". The hours are
 * shown only when one of the ends is not at midnight. The end is shown as
 * picked in the date picker (it is excluded from the range).
 *
 * Returns undefined when the value is not a specific range (e.g. "Last week").
 */
export function formatTimeRangeForDisplay(
  value: string | null | undefined,
  locale?: string,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const { customRange, matchedFlag } = customTimeRangeDecode(value);
  if (
    !matchedFlag ||
    customRange.sinceMode !== 'specific' ||
    customRange.untilMode !== 'specific'
  ) {
    return undefined;
  }
  const since = dttmToDayjs(customRange.sinceDatetime);
  const until = dttmToDayjs(customRange.untilDatetime);
  if (!since.isValid() || !until.isValid()) {
    return undefined;
  }
  const isMidnight = (date: typeof since) =>
    date.hour() === 0 && date.minute() === 0 && date.second() === 0;
  const format = `${getDateDisplayFormat(locale)}${
    isMidnight(since) && isMidnight(until) ? '' : ' HH:mm'
  }`;
  return t('%s to %s', since.format(format), until.format(format));
}
