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
import { memo } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { Tooltip } from '@superset-ui/core/components';
import { useAppliedFiltersSummary } from './useAppliedFiltersSummary';

// Number of tag colors of the Design System (see the dashboard CSS)
const TAG_COLORS = 5;

// Creare: with many values the strip would grow without limit, so each
// filter shows only its first values and a "+N" tag with the others
export const MAX_TAGS_PER_FILTER = 3;

// Creare: Design System "Filtro/Resumo" strip. Base layout and colors come from
// the theme; the dashboard CSS refines it through the classes below.
const SummaryContainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
    min-height: ${theme.sizeUnit * 10}px;
    margin: 0 0 ${theme.sizeUnit * 4}px;
    padding: 0 ${theme.sizeUnit * 4}px;
    border-radius: ${theme.borderRadius}px;
    background: ${theme.colorWarningBg};
    color: ${theme.colorText};
    font-size: ${theme.fontSizeSM}px;

    .applied-filters-summary__text {
      margin: 0;
      white-space: nowrap;
    }

    .applied-filters-summary__count {
      font-weight: ${theme.fontWeightStrong};
    }

    .applied-filters-summary__tags {
      display: flex;
      flex: 1 1 auto;
      flex-wrap: wrap;
      gap: ${theme.sizeUnit * 2}px;
      min-width: 0;
      padding: ${theme.sizeUnit * 1.5}px 0;
    }

    .applied-filters-summary__tag {
      padding: ${theme.sizeUnit / 2}px ${theme.sizeUnit * 3}px;
      border-radius: ${theme.borderRadiusSM}px;
      background: ${theme.colorFillSecondary};
      font-weight: ${theme.fontWeightStrong};
      white-space: nowrap;
    }

    .applied-filters-summary__tag--more {
      cursor: default;
    }
  `}
`;

const HiddenValues = styled.div`
  max-height: 240px;
  overflow-y: auto;
`;

const AppliedFiltersSummary = () => {
  const appliedFilters = useAppliedFiltersSummary();

  if (!appliedFilters.length) {
    return null;
  }

  const count = appliedFilters.length;
  const names = appliedFilters
    .map(filter => filter.name.toLocaleLowerCase())
    .join(', ');

  return (
    <SummaryContainer
      className="applied-filters-summary"
      role="status"
      data-test="applied-filters-summary"
    >
      <p className="applied-filters-summary__text">
        <span className="applied-filters-summary__count">
          {count === 1
            ? t('%s filter applied', count)
            : t('%s filters applied', count)}
        </span>
        , {names}
      </p>
      <div className="applied-filters-summary__tags">
        {appliedFilters.map((filter, index) => {
          const tagClassName = `applied-filters-summary__tag applied-filters-summary__tag--${
            (index % TAG_COLORS) + 1
          }`;
          const shown = filter.values.slice(0, MAX_TAGS_PER_FILTER);
          const hidden = filter.values.slice(MAX_TAGS_PER_FILTER);
          return [
            ...shown.map(value => (
              <span
                key={`${filter.id}-${value}`}
                className={tagClassName}
                title={`${filter.name}: ${value}`}
              >
                {value}
              </span>
            )),
            hidden.length > 0 && (
              <Tooltip
                key={`${filter.id}-more`}
                placement="bottom"
                title={
                  <HiddenValues>
                    {hidden.map(value => (
                      <div key={value}>{value}</div>
                    ))}
                  </HiddenValues>
                }
              >
                <span
                  className={`${tagClassName} applied-filters-summary__tag--more`}
                  data-test="applied-filters-summary-more"
                  aria-label={t(
                    '%s more values of %s',
                    hidden.length,
                    filter.name,
                  )}
                >
                  +{hidden.length}
                </span>
              </Tooltip>
            ),
          ];
        })}
      </div>
    </SummaryContainer>
  );
};

export default memo(AppliedFiltersSummary);
