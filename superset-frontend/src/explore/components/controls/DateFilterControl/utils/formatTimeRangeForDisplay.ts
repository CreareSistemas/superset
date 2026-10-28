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
  const isEndOfDay = (date: typeof since) =>
    date.hour() === 23 && date.minute() === 59 && date.second() === 59;
  const isWholeDays =
    isMidnight(since) && (isMidnight(until) || isEndOfDay(until));
  const format = `${getDateDisplayFormat(locale)}${isWholeDays ? '' : ' HH:mm'}`;
  return t('%s to %s', since.format(format), until.format(format));
}
