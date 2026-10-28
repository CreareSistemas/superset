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
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { t } from '@apache-superset/core/translation';
import {
  NO_TIME_RANGE,
  useCSSTextTruncation,
  fetchTimeRange,
} from '@superset-ui/core';
import {
  css,
  styled,
  useTheme,
  SupersetTheme,
} from '@apache-superset/core/theme';
import {
  Button,
  Constants,
  Divider,
  Tooltip,
  Select,
} from '@superset-ui/core/components';
import ControlHeader from 'src/explore/components/ControlHeader';
import { Icons } from '@superset-ui/core/components/Icons';
import { useDebouncedEffect } from 'src/explore/exploreUtils';
import { noOp } from 'src/utils/common';
import ControlPopover from '../ControlPopover/ControlPopover';

import { DateFilterControlProps, FrameType } from './types';
import {
  DateFilterTestKey,
  FRAME_OPTIONS,
  formatTimeRangeForDisplay,
  guessFrame,
  useDefaultTimeFilter,
} from './utils';
import {
  CommonFrame,
  CalendarFrame,
  CustomFrame,
  AdvancedFrame,
  DateLabel,
  SpecificRangeFrame,
} from './components';
import { CurrentCalendarFrame } from './components/CurrentCalendarFrame';

const StyledRangeType = styled(Select)`
  width: 272px;
`;

const ContentStyleWrapper = styled.div`
  ${({ theme }) => css`
    .ant-row {
      margin-top: 8px;
    }

    .ant-picker {
      padding: 4px 17px 4px;
      border-radius: 4px;
    }

    .ant-divider-horizontal {
      margin: 16px 0;
    }

    .control-label {
      font-size: ${theme.fontSizeSM}px;
      line-height: 16px;
      margin: 8px 0;
    }

    .section-title {
      font-style: normal;
      font-weight: ${theme.fontWeightStrong};
      font-size: 15px;
      line-height: 24px;
      margin-bottom: 8px;
    }

    .control-anchor-to {
      margin-top: 16px;
    }

    .control-anchor-to-datetime {
      width: 217px;
    }

    .footer {
      text-align: right;
    }

    .footer--range {
      display: flex;
      gap: ${theme.sizeUnit * 2}px;
      margin-top: ${theme.sizeUnit * 4}px;

      .superset-button {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
      }
    }
  `}
`;

const IconWrapper = styled.span`
  span {
    margin-right: ${({ theme }) => 2 * theme.sizeUnit}px;
    vertical-align: middle;
  }
  .text {
    vertical-align: middle;
  }
  .error {
    color: ${({ theme }) => theme.colorError};
  }
`;

const getTooltipTitle = (
  isLabelTruncated: boolean,
  label: string | undefined,
  range: string | undefined,
) =>
  isLabelTruncated ? (
    <div>
      {label && <strong>{label}</strong>}
      {range && (
        <div
          css={(theme: SupersetTheme) => css`
            margin-top: ${theme.sizeUnit}px;
          `}
        >
          {range}
        </div>
      )}
    </div>
  ) : (
    range || null
  );

export default function DateFilterLabel(props: DateFilterControlProps) {
  const {
    name,
    onChange,
    onOpenPopover = noOp,
    onClosePopover = noOp,
    isOverflowingFilterBar = false,
    specificRangeOnly = false,
    placeholder,
  } = props;
  const defaultTimeFilter = useDefaultTimeFilter();
  const locale = useSelector(
    (state: { common?: { locale?: string } }) => state?.common?.locale,
  );

  const value = props.value ?? defaultTimeFilter;
  const [actualTimeRange, setActualTimeRange] = useState<string>(value);

  const [show, setShow] = useState<boolean>(false);
  const guessedFrame = useMemo(() => guessFrame(value), [value]);
  const [frame, setFrame] = useState<FrameType>(guessedFrame);
  const [lastFetchedTimeRange, setLastFetchedTimeRange] = useState(value);
  const [timeRangeValue, setTimeRangeValue] = useState(value);
  const [validTimeRange, setValidTimeRange] = useState<boolean>(false);
  const [rangePending, setRangePending] = useState<boolean>(false);
  const [evalResponse, setEvalResponse] = useState<string>(value);
  const [tooltipTitle, setTooltipTitle] = useState<ReactNode | null>(value);
  const theme = useTheme();
  const [labelRef, labelIsTruncated] = useCSSTextTruncation<HTMLSpanElement>();

  useEffect(() => {
    if (value === NO_TIME_RANGE) {
      setActualTimeRange(NO_TIME_RANGE);
      setTooltipTitle(null);
      setValidTimeRange(true);
      return;
    }
    fetchTimeRange(value).then(({ value: actualRange, error }) => {
      if (error) {
        setEvalResponse(error || '');
        setValidTimeRange(false);
        setTooltipTitle(value || null);
      } else {
        /*
          HRT == human readable text
          ADR == actual datetime range
          +--------------+------+----------+--------+----------+-----------+
          |              | Last | Previous | Custom | Advanced | No Filter |
          +--------------+------+----------+--------+----------+-----------+
          | control pill | HRT  | HRT      | ADR    | ADR      |   HRT     |
          +--------------+------+----------+--------+----------+-----------+
          | tooltip      | ADR  | ADR      | HRT    | HRT      |   ADR     |
          +--------------+------+----------+--------+----------+-----------+
        */
        if (
          guessedFrame === 'Common' ||
          guessedFrame === 'Calendar' ||
          guessedFrame === 'Current' ||
          guessedFrame === 'No filter'
        ) {
          setActualTimeRange(value);
          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, value, actualRange),
          );
        } else if (specificRangeOnly) {
          setActualTimeRange(
            formatTimeRangeForDisplay(value, locale) ?? (actualRange || ''),
          );
        } else {
          setActualTimeRange(actualRange || '');
          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, actualRange, value),
          );
        }
        setValidTimeRange(true);
      }
      setLastFetchedTimeRange(value);
      setEvalResponse(actualRange || value);
    });
  }, [
    guessedFrame,
    labelIsTruncated,
    labelRef,
    value,
    specificRangeOnly,
    locale,
  ]);

  useDebouncedEffect(
    () => {
      if (timeRangeValue === NO_TIME_RANGE) {
        setEvalResponse(NO_TIME_RANGE);
        setLastFetchedTimeRange(NO_TIME_RANGE);
        setValidTimeRange(true);
        return;
      }
      if (lastFetchedTimeRange !== timeRangeValue) {
        fetchTimeRange(timeRangeValue).then(({ value: actualRange, error }) => {
          if (error) {
            setEvalResponse(error || '');
            setValidTimeRange(false);
          } else {
            setEvalResponse(actualRange || '');
            setValidTimeRange(true);
          }
          setLastFetchedTimeRange(timeRangeValue);
        });
      }
    },
    Constants.SLOW_DEBOUNCE,
    [timeRangeValue],
  );

  function onSave() {
    onChange(timeRangeValue);
    setShow(false);
    onClosePopover();
  }

  function onOpen() {
    setRangePending(false);
    setTimeRangeValue(value);
    setFrame(guessedFrame);
    setShow(true);
    onOpenPopover();
  }

  function onHide() {
    setRangePending(false);
    setTimeRangeValue(value);
    setFrame(guessedFrame);
    setShow(false);
    onClosePopover();
  }

  const toggleOverlay = () => {
    if (show) {
      onHide();
    } else {
      onOpen();
    }
  };

  function onChangeFrame(value: FrameType) {
    if (value === NO_TIME_RANGE) {
      setTimeRangeValue(NO_TIME_RANGE);
    }
    setFrame(value);
  }

  const frameContent = specificRangeOnly ? (
    <SpecificRangeFrame
      value={timeRangeValue}
      onChange={setTimeRangeValue}
      onPendingChange={setRangePending}
      isOverflowingFilterBar={isOverflowingFilterBar}
    />
  ) : (
    <>
      <div className="control-label">{t('Range type')}</div>
      <StyledRangeType
        ariaLabel={t('Range type')}
        options={FRAME_OPTIONS}
        value={frame}
        onChange={onChangeFrame}
      />
      {frame !== 'No filter' && <Divider />}
      {frame === 'Common' && (
        <CommonFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Calendar' && (
        <CalendarFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Current' && (
        <CurrentCalendarFrame
          value={timeRangeValue}
          onChange={setTimeRangeValue}
        />
      )}
      {frame === 'Advanced' && (
        <AdvancedFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Custom' && (
        <CustomFrame
          value={timeRangeValue}
          onChange={setTimeRangeValue}
          isOverflowingFilterBar={isOverflowingFilterBar}
        />
      )}
      {frame === 'No filter' && <div data-test={DateFilterTestKey.NoFilter} />}
    </>
  );

  const overlayContent = (
    <ContentStyleWrapper>
      {frameContent}
      {!specificRangeOnly && <Divider />}
      {specificRangeOnly ? (
        !validTimeRange && (
          <>
            <IconWrapper className="warning">
              <Icons.ExclamationCircleOutlined iconColor={theme.colorError} />
              <span className="text error">{evalResponse}</span>
            </IconWrapper>
            <Divider />
          </>
        )
      ) : (
        <>
          <div>
            <div className="section-title">{t('Actual time range')}</div>
            {validTimeRange && (
              <div>
                {evalResponse === 'No filter' ? t('No filter') : evalResponse}
              </div>
            )}
            {!validTimeRange && (
              <IconWrapper className="warning">
                <Icons.ExclamationCircleOutlined iconColor={theme.colorError} />
                <span className="text error">{evalResponse}</span>
              </IconWrapper>
            )}
          </div>
          <Divider />
        </>
      )}
      <div className={cx('footer', { 'footer--range': specificRangeOnly })}>
        <Button
          buttonStyle="secondary"
          cta
          key="cancel"
          onClick={onHide}
          data-test={DateFilterTestKey.CancelButton}
        >
          {specificRangeOnly ? t('Cancel') : t('CANCEL')}
        </Button>
        <Button
          buttonStyle="primary"
          cta
          disabled={!validTimeRange || rangePending}
          key="apply"
          onClick={onSave}
          data-test={DateFilterTestKey.ApplyButton}
        >
          {specificRangeOnly ? t('Apply') : t('APPLY')}
        </Button>
      </div>
    </ContentStyleWrapper>
  );

  const popoverContent = (
    <ControlPopover
      autoAdjustOverflow={false}
      trigger="click"
      placement={specificRangeOnly ? 'bottomLeft' : 'right'}
      content={overlayContent}
      defaultOpen={show}
      open={show}
      onOpenChange={toggleOverlay}
      overlayStyle={{ width: '600px' }}
      destroyTooltipOnHide
      getPopupContainer={nodeTrigger =>
        isOverflowingFilterBar
          ? (nodeTrigger.parentNode as HTMLElement)
          : document.body
      }
      overlayClassName="time-range-popover"
    >
      <Tooltip placement="top" title={specificRangeOnly ? null : tooltipTitle}>
        <DateLabel
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          label={
            actualTimeRange === NO_TIME_RANGE && placeholder
              ? placeholder
              : actualTimeRange
          }
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.PopoverOverlay}
          ref={labelRef}
        />
      </Tooltip>
    </ControlPopover>
  );

  return (
    <>
      <ControlHeader {...props} />
      {popoverContent}
    </>
  );
}
