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
import { useMemo, useState } from 'react';
import cx from 'classnames';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { Button, Icons } from '@superset-ui/core/components';
import { extendedDayjs } from '@superset-ui/core/utils/dates';
import { Dayjs } from 'dayjs';

/*
 * Creare: month calendar of the period filter, as in the Figma of the
 * platform: the days of the range joined by a band (rounded at the ends of
 * each week), start and end in solid color, a preview of the range while the
 * end is not picked yet (dashed circle on the hovered day), only the days of
 * the month and the month/year picked from the title.
 */

// Creare Design System: turquoise band of the range
const RANGE_BAND_COLOR = 'rgba(32, 172, 172, 0.4)';
const RANGE_PREVIEW_COLOR = '#20ACAC';

const CELL_SIZE = 34;
const DAY_SIZE = 30;
// the band is thinner than the circle of the day
const BAND_HEIGHT = 22;

const CalendarRoot = styled.div`
  ${({ theme }) => css`
    /* the columns stretch to the width of the popover */
    width: 100%;
    min-width: ${CELL_SIZE * 7}px;
    user-select: none;

    .range-calendar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: ${theme.sizeUnit * 2}px;
    }

    && .range-calendar__title {
      display: inline-flex;
      align-items: center;
      gap: ${theme.sizeUnit}px;
      height: ${theme.sizeUnit * 8}px;
      padding: 0 ${theme.sizeUnit}px;
      color: ${theme.colorText};
      font-size: ${theme.fontSize}px;
      font-weight: ${theme.fontWeightStrong};

      &::first-letter {
        text-transform: uppercase;
      }
    }

    .range-calendar__nav {
      display: flex;
    }

    && .range-calendar__nav .superset-button {
      min-width: ${theme.sizeUnit * 8}px;
      height: ${theme.sizeUnit * 8}px;
      padding: 0;
      color: ${theme.colorText};
    }

    .range-calendar__weekdays,
    .range-calendar__week {
      display: grid;
      grid-template-columns: repeat(7, minmax(${CELL_SIZE}px, 1fr));
    }

    .range-calendar__weekday {
      height: ${CELL_SIZE}px;
      line-height: ${CELL_SIZE}px;
      text-align: center;
      color: ${theme.colorTextSecondary};
      font-size: ${theme.fontSizeSM}px;
    }

    .range-calendar__week {
      margin-bottom: ${theme.sizeUnit}px;
    }

    .range-calendar__cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: ${CELL_SIZE}px;
    }

    /* the band of the range, behind the day */
    .range-calendar__cell--band::before {
      content: '';
      position: absolute;
      top: ${(CELL_SIZE - BAND_HEIGHT) / 2}px;
      bottom: ${(CELL_SIZE - BAND_HEIGHT) / 2}px;
      left: 0;
      right: 0;
      background: ${RANGE_BAND_COLOR};
    }

    .range-calendar__cell--band-start::before {
      left: 50%;
    }

    .range-calendar__cell--band-end::before {
      right: 50%;
    }

    /* the cells are wider than the days: round at the edge of the day */
    .range-calendar__cell--round-left::before {
      left: calc(50% - ${DAY_SIZE / 2}px);
      border-top-left-radius: ${BAND_HEIGHT / 2}px;
      border-bottom-left-radius: ${BAND_HEIGHT / 2}px;
    }

    .range-calendar__cell--round-right::before {
      right: calc(50% - ${DAY_SIZE / 2}px);
      border-top-right-radius: ${BAND_HEIGHT / 2}px;
      border-bottom-right-radius: ${BAND_HEIGHT / 2}px;
    }

    .range-calendar__day {
      position: relative;
      width: ${DAY_SIZE}px;
      height: ${DAY_SIZE}px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 50%;
      background: transparent;
      color: ${theme.colorText};
      font-family: inherit;
      font-size: ${theme.fontSizeSM}px;
      cursor: pointer;

      &:hover {
        border-color: ${theme.colorPrimary};
      }

      &:focus-visible {
        outline: 2px solid ${theme.colorPrimary};
        outline-offset: 1px;
      }
    }

    .range-calendar__day--today {
      font-weight: ${theme.fontWeightStrong};
    }

    .range-calendar__day--start,
    .range-calendar__day--end {
      background: ${theme.colorPrimary};
      color: ${theme.colorTextLightSolid};
      font-weight: ${theme.fontWeightStrong};
    }

    /* end of the range while it is not picked yet */
    && .range-calendar__day--preview {
      border: 1px dashed ${RANGE_PREVIEW_COLOR};
    }

    .range-calendar__months {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: ${theme.sizeUnit * 2}px;
      padding: ${theme.sizeUnit * 2}px 0;
    }

    .range-calendar__month {
      height: ${theme.sizeUnit * 9}px;
      border: 1px solid transparent;
      border-radius: ${theme.sizeUnit * 4.5}px;
      background: transparent;
      color: ${theme.colorText};
      font-family: inherit;
      font-size: ${theme.fontSizeSM}px;
      text-transform: capitalize;
      cursor: pointer;

      &:hover {
        border-color: ${theme.colorPrimary};
      }
    }

    .range-calendar__month--current {
      background: ${theme.colorPrimary};
      color: ${theme.colorTextLightSolid};
    }
  `}
`;

/** One letter per week day, starting on Sunday: "D S T Q Q S S" */
const getWeekDayLetters = (locale: string) => {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // 2024-09-01 was a Sunday
  return [...Array(7)].map((_, index) =>
    format.format(new Date(2024, 8, 1 + index)),
  );
};

export type RangeCalendarProps = {
  startDay: Dayjs | null;
  endDay: Dayjs | null;
  onSelectDay: (day: Dayjs) => void;
  /** dayjs locale, e.g. "pt-br" */
  locale: string;
  initialMonth?: Dayjs;
};

export function RangeCalendar({
  startDay,
  endDay,
  onSelectDay,
  locale,
  initialMonth,
}: RangeCalendarProps) {
  const [month, setMonth] = useState<Dayjs>(() =>
    (initialMonth ?? endDay ?? startDay ?? extendedDayjs()).startOf('month'),
  );
  const [view, setView] = useState<'days' | 'months'>('days');
  const [hoverDay, setHoverDay] = useState<Dayjs | null>(null);

  const weekStart: number = extendedDayjs.Ls[locale]?.weekStart ?? 0;
  const weekDays = useMemo(() => {
    let letters: string[];
    try {
      letters = getWeekDayLetters(locale);
    } catch {
      letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    }
    return [...letters.slice(weekStart), ...letters.slice(0, weekStart)];
  }, [locale, weekStart]);

  // while only the start is picked, the range follows the mouse
  const isPreview = Boolean(startDay && !endDay && hoverDay);
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (startDay && !endDay && hoverDay) {
      return hoverDay.isBefore(startDay, 'day')
        ? [hoverDay, startDay]
        : [startDay, hoverDay];
    }
    return [startDay, endDay];
  }, [startDay, endDay, hoverDay]);

  const weeks = useMemo(() => {
    const offset = (month.day() - weekStart + 7) % 7;
    const daysInMonth = month.daysInMonth();
    const cells: (Dayjs | null)[] = [
      ...Array(offset).fill(null),
      ...[...Array(daysInMonth)].map((_, index) => month.date(index + 1)),
    ];
    while (cells.length % 7) cells.push(null);
    return [...Array(cells.length / 7)].map((_, index) =>
      cells.slice(index * 7, index * 7 + 7),
    );
  }, [month, weekStart]);

  const today = extendedDayjs();
  const isRange = Boolean(
    rangeStart && rangeEnd && !rangeStart.isSame(rangeEnd, 'day'),
  );

  const renderCell = (day: Dayjs | null, column: number) => {
    if (!day) {
      return <div key={`empty-${column}`} className="range-calendar__cell" />;
    }
    const isStart = Boolean(startDay?.isSame(day, 'day'));
    const isEnd = Boolean(endDay?.isSame(day, 'day'));
    const isPreviewEnd =
      isPreview && Boolean(hoverDay?.isSame(day, 'day')) && !isStart;
    const inRange = Boolean(
      rangeStart &&
      rangeEnd &&
      !day.isBefore(rangeStart, 'day') &&
      !day.isAfter(rangeEnd, 'day'),
    );
    const isBandStart = Boolean(rangeStart?.isSame(day, 'day'));
    const isBandEnd = Boolean(rangeEnd?.isSame(day, 'day'));
    const inBand = isRange && inRange;
    return (
      <div
        key={day.format('YYYY-MM-DD')}
        className={cx('range-calendar__cell', {
          'range-calendar__cell--band': inBand,
          'range-calendar__cell--band-start': inBand && isBandStart,
          'range-calendar__cell--band-end': inBand && isBandEnd,
          // the band is rounded at the ends of each week and of the month
          'range-calendar__cell--round-left':
            inBand && !isBandStart && (column === 0 || day.date() === 1),
          'range-calendar__cell--round-right':
            inBand &&
            !isBandEnd &&
            (column === 6 || day.date() === day.daysInMonth()),
        })}
      >
        <button
          type="button"
          className={cx('range-calendar__day', {
            'range-calendar__day--in-range': inRange && !isPreview,
            'range-calendar__day--start': isStart,
            'range-calendar__day--end': isEnd,
            'range-calendar__day--preview': isPreviewEnd,
            'range-calendar__day--today': day.isSame(today, 'day'),
          })}
          data-test="range-calendar-day"
          data-date={day.format('YYYY-MM-DD')}
          aria-label={day.locale(locale).format('D MMMM YYYY')}
          aria-pressed={isStart || isEnd}
          onClick={() => onSelectDay(day)}
          onMouseEnter={() => setHoverDay(day)}
        >
          {day.date()}
        </button>
      </div>
    );
  };

  const isDaysView = view === 'days';
  const step = isDaysView ? 'month' : 'year';

  return (
    <CalendarRoot className="range-calendar" data-test="range-calendar">
      <div className="range-calendar__header">
        <Button
          buttonStyle="link"
          className="range-calendar__title"
          aria-label={
            isDaysView ? t('Choose the month') : t('Back to the days')
          }
          onClick={() => setView(isDaysView ? 'months' : 'days')}
          data-test="range-calendar-title"
        >
          {month.locale(locale).format(isDaysView ? 'MMMM YYYY' : 'YYYY')}
          {isDaysView ? (
            <Icons.CaretDownOutlined iconSize="s" />
          ) : (
            <Icons.CaretUpOutlined iconSize="s" />
          )}
        </Button>
        <div className="range-calendar__nav">
          <Button
            buttonStyle="link"
            aria-label={isDaysView ? t('Previous month') : t('Previous year')}
            onClick={() => setMonth(month.subtract(1, step))}
          >
            <Icons.LeftOutlined iconSize="m" />
          </Button>
          <Button
            buttonStyle="link"
            aria-label={isDaysView ? t('Next month') : t('Next year')}
            onClick={() => setMonth(month.add(1, step))}
          >
            <Icons.RightOutlined iconSize="m" />
          </Button>
        </div>
      </div>
      {isDaysView ? (
        <>
          <div className="range-calendar__weekdays">
            {weekDays.map((letter, index) => (
              <div
                // the letters repeat (S, Q), the position is the key
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="range-calendar__weekday"
              >
                {letter}
              </div>
            ))}
          </div>
          <div
            className="range-calendar__days"
            onMouseLeave={() => setHoverDay(null)}
          >
            {weeks.map(week => (
              <div
                key={week.find(Boolean)?.format('YYYY-MM-DD')}
                className="range-calendar__week"
              >
                {week.map(renderCell)}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="range-calendar__months">
          {[...Array(12)].map((_, index) => {
            const option = month.month(index);
            return (
              <button
                key={index}
                type="button"
                className={cx('range-calendar__month', {
                  'range-calendar__month--current': index === month.month(),
                })}
                data-test="range-calendar-month"
                onClick={() => {
                  setMonth(option);
                  setView('days');
                }}
              >
                {option.locale(locale).format('MMM')}
              </button>
            );
          })}
        </div>
      )}
    </CalendarRoot>
  );
}
