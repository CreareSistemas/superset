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
import { useEffect } from 'react';
import { t } from '@apache-superset/core/translation';
import { customTimeRangeDecode } from '@superset-ui/core';
import {
  InfoTooltip,
  DatePicker,
  AntdThemeProvider,
  Col,
  Row,
  Loading,
} from '@superset-ui/core/components';
import {
  DAYJS_FORMAT,
  MIDNIGHT,
  SEVEN_DAYS_AGO,
  customTimeRangeEncode,
  dttmToDayjs,
  getDateDisplayFormat,
} from 'src/explore/components/controls/DateFilterControl/utils';
import {
  CustomRangeKey,
  FrameComponentProps,
} from 'src/explore/components/controls/DateFilterControl/types';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { useLocale } from 'src/hooks/useLocale';
import { ExplorePageState } from 'src/explore/types';

// Display format of the date pickers (the stored value keeps DAYJS_FORMAT):
// day/month/year for Portuguese and Spanish, month/day/year for English, ISO
// otherwise; no seconds
const TIME_FORMAT = 'HH:mm';
const getDisplayFormat = (locale?: string) =>
  `${getDateDisplayFormat(locale)} ${TIME_FORMAT}`;

/**
 * Simplified custom frame: only a specific start and end date/time.
 * Any other time range (relative, "Last week", "No filter"...) is
 * converted to the last 7 days when the frame opens.
 */
export function SpecificRangeFrame(props: FrameComponentProps) {
  const { customRange, matchedFlag } = customTimeRangeDecode(props.value);
  const datePickerLocale = useLocale();
  const displayFormat = getDisplayFormat(
    useSelector((state: ExplorePageState) => state?.common?.locale),
  );
  const isSpecificRange =
    matchedFlag &&
    customRange.sinceMode === 'specific' &&
    customRange.untilMode === 'specific';

  useEffect(() => {
    if (!isSpecificRange) {
      props.onChange(
        customTimeRangeEncode({
          ...customRange,
          sinceMode: 'specific',
          sinceDatetime: SEVEN_DAYS_AGO,
          untilMode: 'specific',
          untilDatetime: MIDNIGHT,
        }),
      );
    }
  }, [isSpecificRange]);

  function onChange(control: CustomRangeKey, value: string) {
    props.onChange(
      customTimeRangeEncode({
        ...customRange,
        [control]: value,
      }),
    );
  }

  if (!isSpecificRange || datePickerLocale === null) {
    return <Loading position="inline-centered" />;
  }

  const getPopupContainer = (triggerNode: HTMLElement) =>
    props.isOverflowingFilterBar
      ? (triggerNode.parentNode as HTMLElement)
      : document.body;

  return (
    <AntdThemeProvider locale={datePickerLocale}>
      <div data-test="specific-range-frame">
        <Row gutter={24}>
          <Col span={12}>
            <div className="control-label">
              {t('Start date')}{' '}
              <InfoTooltip
                tooltip={t('Start date included in time range')}
                placement="right"
              />
            </div>
            <DatePicker
              showTime={{ format: TIME_FORMAT }}
              format={displayFormat}
              defaultValue={dttmToDayjs(customRange.sinceDatetime)}
              onChange={(datetime: Dayjs) =>
                onChange('sinceDatetime', datetime.format(DAYJS_FORMAT))
              }
              allowClear={false}
              getPopupContainer={getPopupContainer}
            />
          </Col>
          <Col span={12}>
            <div className="control-label">
              {t('End date')}{' '}
              <InfoTooltip
                tooltip={t('End date excluded from time range')}
                placement="right"
              />
            </div>
            <DatePicker
              showTime={{ format: TIME_FORMAT }}
              format={displayFormat}
              defaultValue={dttmToDayjs(customRange.untilDatetime)}
              onChange={(datetime: Dayjs) =>
                onChange('untilDatetime', datetime.format(DAYJS_FORMAT))
              }
              allowClear={false}
              getPopupContainer={getPopupContainer}
            />
          </Col>
        </Row>
      </div>
    </AntdThemeProvider>
  );
}
