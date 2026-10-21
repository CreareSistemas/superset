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
import { useAppliedFiltersSummary } from './useAppliedFiltersSummary';

// Number of tag colors of the Design System (see the dashboard CSS)
const TAG_COLORS = 5;

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
  `}
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
        {appliedFilters.map((filter, index) =>
          filter.values.map(value => (
            <span
              key={`${filter.id}-${value}`}
              className={`applied-filters-summary__tag applied-filters-summary__tag--${
                (index % TAG_COLORS) + 1
              }`}
              title={filter.name}
            >
              {value}
            </span>
          )),
        )}
      </div>
    </SummaryContainer>
  );
};

export default memo(AppliedFiltersSummary);
