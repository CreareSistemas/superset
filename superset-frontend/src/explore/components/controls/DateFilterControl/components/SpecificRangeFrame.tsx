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
import { useEffect, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { customTimeRangeDecode } from '@superset-ui/core';
import {
  AntdThemeProvider,
  Input,
  Loading,
} from '@superset-ui/core/components';
import {
  DAYJS_FORMAT,
  MIDNIGHT,
  SEVEN_DAYS_AGO,
  customTimeRangeEncode,
  dttmToDayjs,
} from 'src/explore/components/controls/DateFilterControl/utils';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { useLocale } from 'src/hooks/useLocale';
import { ExplorePageState } from 'src/explore/types';
import { RangeCalendar } from './RangeCalendar';

/*
 * Creare: a single calendar to pick the period (see RangeCalendar, as in the
 * Figma of the platform): 1st click = start day, 2nd click = end day; start
 * and end times below. The last day is included
 * in full: the end is saved with 59 seconds (23:59 -> 23:59:59).
 */

const TIME_FORMAT = 'HH:mm';

// width of the popover content: the calendar, the times and the buttons
// fill all of it (no blank space on the right)
const RANGE_FRAME_WIDTH = 308;

// grey line between the calendar and the times
const SEPARATOR_COLOR = '#E0E0E0';

const RangeFrame = styled.div`
  ${({ theme }) => css`
    width: ${RANGE_FRAME_WIDTH}px;

    /* start and end times side by side, so the popover is not too tall */
    .range-calendar__times {
      display: flex;
      gap: ${theme.sizeUnit * 3}px;
      margin-top: ${theme.sizeUnit * 2}px;
      padding-top: ${theme.sizeUnit * 3}px;
      border-top: 1px solid ${SEPARATOR_COLOR};

      & > div {
        flex: 1 1 0;
        min-width: 0;
      }
    }

    .range-calendar__time-label {
      display: block;
      margin-bottom: ${theme.sizeUnit}px;
      font-size: ${theme.fontSizeSM}px;
      color: ${theme.colorText};
    }
  `}
`;

/** "1234" -> "12:34", limiting hours to 23 and minutes to 59 (as the lib) */
export function formatTimeDraft(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  let hours = digits.slice(0, 2);
  let minutes = digits.slice(2, 4);
  if (hours.length === 2) {
    hours = String(Math.min(Number(hours), 23)).padStart(2, '0');
  }
  if (minutes.length === 1) {
    minutes = String(Math.min(Number(minutes), 5));
  }
  if (minutes.length === 2) {
    minutes = String(Math.min(Number(minutes), 59)).padStart(2, '0');
  }
  return digits.length <= 2 ? hours : `${hours}:${minutes}`;
}

export const isValidTimeText = (value: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const withTime = (day: Dayjs, time: string, second: number) => {
  const [hours, minutes] = time.split(':').map(Number);
  return day.hour(hours).minute(minutes).second(second).millisecond(0);
};

type RangeState = {
  startDay: Dayjs | null;
  endDay: Dayjs | null;
  startTime: string;
  endTime: string;
};

const isMidnight = (date: Dayjs) =>
  date.hour() === 0 && date.minute() === 0 && date.second() === 0;

/**
 * Days and times of the current value. An end at midnight (exclusive, as
 * saved before this calendar) becomes the previous day at 23:59:59, which
 * covers the same data. Any other time range becomes the last 7 days.
 */
export function getInitialRange(value: string): {
  range: RangeState;
  isSpecificRange: boolean;
} {
  const { customRange, matchedFlag } = customTimeRangeDecode(value);
  const isSpecificRange = Boolean(
    matchedFlag &&
    customRange.sinceMode === 'specific' &&
    customRange.untilMode === 'specific',
  );

  let since = dttmToDayjs(SEVEN_DAYS_AGO);
  let until = dttmToDayjs(MIDNIGHT);
  if (isSpecificRange) {
    since = dttmToDayjs(customRange.sinceDatetime);
    until = dttmToDayjs(customRange.untilDatetime);
  }
  if (isMidnight(until) && until.isAfter(since)) {
    until = until.subtract(1, 'second');
  }
  return {
    isSpecificRange,
    range: {
      startDay: since.startOf('day'),
      endDay: until.startOf('day'),
      startTime: since.format(TIME_FORMAT),
      endTime: until.format(TIME_FORMAT),
    },
  };
}

export function SpecificRangeFrame(props: FrameComponentProps) {
  const { onChange, onPendingChange, value } = props;
  const datePickerLocale = useLocale();
  const locale = useSelector(
    (state: ExplorePageState) => state?.common?.locale,
  );
  const dayjsLocale = (locale || 'en').toLowerCase().replace('_', '-');

  const [initial] = useState(() => getInitialRange(value));
  const [range, setRange] = useState<RangeState>(initial.range);
  const [startDraft, setStartDraft] = useState(initial.range.startTime);
  const [endDraft, setEndDraft] = useState(initial.range.endTime);

  const emit = (next: RangeState) => {
    if (!next.startDay || !next.endDay) return;
    const { customRange } = customTimeRangeDecode(value);
    onChange(
      customTimeRangeEncode({
        ...customRange,
        sinceMode: 'specific',
        sinceDatetime: withTime(next.startDay, next.startTime, 0).format(
          DAYJS_FORMAT,
        ),
        untilMode: 'specific',
        untilDatetime: withTime(next.endDay, next.endTime, 59).format(
          DAYJS_FORMAT,
        ),
      }),
    );
  };

  // any other time range ("Last week", "No filter"...) becomes the last 7 days
  useEffect(() => {
    if (!initial.isSpecificRange) {
      emit(initial.range);
    }
  }, []);

  const update = (next: RangeState) => {
    setRange(next);
    emit(next);
  };

  const onSelectDay = (day: Dayjs) => {
    const picked = day.startOf('day');
    if (!range.startDay || range.endDay) {
      // 1st click: new start, waiting for the end
      setRange({ ...range, startDay: picked, endDay: null });
      onPendingChange?.(true);
      return;
    }
    const [startDay, endDay] = picked.isBefore(range.startDay)
      ? [picked, range.startDay]
      : [range.startDay, picked];
    onPendingChange?.(false);
    update({ ...range, startDay, endDay });
  };

  const isSameDayRange = () =>
    Boolean(range.startDay && range.endDay?.isSame(range.startDay, 'day'));

  // on the same day the start can't be after the end (and vice versa)
  const onChangeStartTime = (time: string) => {
    const endTime =
      isSameDayRange() && time > range.endTime ? time : range.endTime;
    setEndDraft(endTime);
    update({ ...range, startTime: time, endTime });
  };

  const onChangeEndTime = (time: string) => {
    const startTime =
      isSameDayRange() && time < range.startTime ? time : range.startTime;
    setStartDraft(startTime);
    update({ ...range, endTime: time, startTime });
  };

  if (datePickerLocale === null) {
    return <Loading position="inline-centered" />;
  }

  const hasCompleteRange = Boolean(range.startDay && range.endDay);
  const renderTimeField = (
    id: string,
    label: string,
    draft: string,
    setDraft: (draft: string) => void,
    committed: string,
    onCommit: (time: string) => void,
  ) => (
    <div>
      <label className="range-calendar__time-label" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        data-test={id}
        placeholder="00:00"
        inputMode="numeric"
        maxLength={5}
        value={draft}
        disabled={!hasCompleteRange}
        onChange={event => {
          const next = formatTimeDraft(event.target.value);
          setDraft(next);
          if (isValidTimeText(next)) onCommit(next);
        }}
        onBlur={() => {
          if (!isValidTimeText(draft)) setDraft(committed);
        }}
      />
    </div>
  );

  return (
    <AntdThemeProvider locale={datePickerLocale}>
      <RangeFrame data-test="specific-range-frame">
        <RangeCalendar
          startDay={range.startDay}
          endDay={range.endDay}
          onSelectDay={onSelectDay}
          locale={dayjsLocale}
          initialMonth={initial.range.endDay ?? undefined}
        />
        <div className="range-calendar__times">
          {renderTimeField(
            'range-start-time',
            t('Start time'),
            startDraft,
            setStartDraft,
            range.startTime,
            onChangeStartTime,
          )}
          {renderTimeField(
            'range-end-time',
            t('End time'),
            endDraft,
            setEndDraft,
            range.endTime,
            onChangeEndTime,
          )}
        </div>
      </RangeFrame>
    </AntdThemeProvider>
  );
}
