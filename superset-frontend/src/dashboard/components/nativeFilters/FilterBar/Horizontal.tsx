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

import { FC, memo, useEffect, useMemo, useState } from 'react';
import cx from 'classnames';
import { t } from '@apache-superset/core/translation';
import { DataMaskStateWithId } from '@superset-ui/core';
import { styled } from '@apache-superset/core/theme';
import { Loading } from '@superset-ui/core/components';
import { RootState } from 'src/dashboard/types';
import { useChartLayoutItems } from 'src/dashboard/util/useChartLayoutItems';
import { useChartIds } from 'src/dashboard/util/charts/useChartIds';
import { useSelector } from 'react-redux';
import { FILTER_BAR_COLLAPSE_DURATION } from 'src/dashboard/util/headerTransition';
import FilterControls from './FilterControls/FilterControls';
import { useChartsVerboseMaps, getFilterBarTestId } from './utils';
import { HorizontalBarProps } from './types';
import FilterBarSettings from './FilterBarSettings';
import { useFilterBarCollapse } from './FilterBarCollapse';
import crossFiltersSelector from './CrossFilters/selectors';

const HorizontalBar = styled.div`
  ${({ theme }) => `
    padding: ${theme.sizeUnit * 3}px ${theme.sizeUnit * 2}px ${
      theme.sizeUnit * 3
    }px ${theme.sizeUnit * 4}px;
    background: ${theme.colorBgBase};
    box-shadow: inset 0px -2px 2px -1px ${theme.colorSplit};
  `}
`;

const HorizontalBarContent = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-start;
    .loading {
      margin: ${theme.sizeUnit * 2}px auto ${theme.sizeUnit * 2}px;
      padding: 0;
    }
  `}
`;

// Creare: open/close animation of the platform filters. The height changes at
// once (no layout work on every frame) and takes no space at all when hidden.
// The bar slides like a drawer, clipped by this wrapper, together with the
// content below (see DashboardBuilder), all with transforms (compositor only).
// While animating the bar is clipped; once open it may overflow, so the select
// dropdowns are not cut
const CollapseWrapper = styled.div`
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: opacity ${FILTER_BAR_COLLAPSE_DURATION}ms ease;

  &.filter-bar-collapse--open {
    height: auto;
    opacity: 1;
  }

  &.filter-bar-collapse--settled {
    overflow: visible;
  }
`;

// Creare: the gear and the filters, so the dashboard CSS can put the action
// buttons on their own row
const HorizontalBarFields = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
`;

const FilterBarEmptyStateContainer = styled.div`
  ${({ theme }) => `
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorText};
    font-size: ${theme.fontSizeSM}px;
    padding-left: ${theme.sizeUnit * 2}px;
  `}
`;

const HorizontalFilterBar: FC<HorizontalBarProps> = ({
  actions,
  dataMaskSelected,
  filterValues,
  chartCustomizationValues,
  isInitialized,
  onSelectionChange,
  onPendingCustomizationDataMaskChange,
  clearAllTriggers,
  onClearAllComplete,
}) => {
  const collapsed = !!useFilterBarCollapse()?.collapsed;
  // open and done animating: the content may overflow (select dropdowns)
  const [settled, setSettled] = useState(!collapsed);
  useEffect(() => {
    if (collapsed) {
      setSettled(false);
      return undefined;
    }
    // the drawer animation runs on the bar (DashboardBuilder), so wait for it
    const timer = setTimeout(
      () => setSettled(true),
      FILTER_BAR_COLLAPSE_DURATION + 50,
    );
    return () => clearTimeout(timer);
  }, [collapsed]);
  const dataMask = useSelector<RootState, DataMaskStateWithId>(
    state => state.dataMask,
  );
  const chartIds = useChartIds();
  const chartLayoutItems = useChartLayoutItems();
  const verboseMaps = useChartsVerboseMaps();

  const selectedCrossFilters = useMemo(
    () =>
      crossFiltersSelector({
        dataMask,
        chartIds,
        chartLayoutItems,
        verboseMaps,
      }),
    [chartIds, chartLayoutItems, dataMask, verboseMaps],
  );

  const hasFilters =
    filterValues.length > 0 ||
    selectedCrossFilters.length > 0 ||
    chartCustomizationValues.length > 0;

  return (
    // Creare: the bar opens/closes with the same animation of the platform
    // filters; it is hidden, not unmounted, so the filters keep their state
    <CollapseWrapper
      className={cx(
        'filter-bar-collapse',
        !collapsed && 'filter-bar-collapse--open',
        !collapsed && settled && 'filter-bar-collapse--settled',
      )}
      aria-hidden={collapsed}
    >
      {/* Creare: stable class names so the dashboard CSS can style the bar */}
      <HorizontalBar
        className={
          collapsed
            ? 'filter-bar filter-bar--horizontal filter-bar--collapsed'
            : 'filter-bar filter-bar--horizontal'
        }
        {...getFilterBarTestId()}
      >
        <HorizontalBarContent className="filter-bar__content">
          {!isInitialized ? (
            <Loading position="inline-centered" size="s" muted />
          ) : (
            <>
              <HorizontalBarFields className="filter-bar__fields">
                <FilterBarSettings />
                {!hasFilters && (
                  <FilterBarEmptyStateContainer data-test="horizontal-filterbar-empty">
                    {t('No filters are currently added to this dashboard.')}
                  </FilterBarEmptyStateContainer>
                )}
                {hasFilters && (
                  <FilterControls
                    dataMaskSelected={dataMaskSelected}
                    onFilterSelectionChange={onSelectionChange}
                    onPendingCustomizationDataMaskChange={
                      onPendingCustomizationDataMaskChange
                    }
                    chartCustomizationValues={chartCustomizationValues}
                    clearAllTriggers={clearAllTriggers}
                    onClearAllComplete={onClearAllComplete}
                  />
                )}
              </HorizontalBarFields>
              {actions}
            </>
          )}
        </HorizontalBarContent>
      </HorizontalBar>
    </CollapseWrapper>
  );
};
export default memo(HorizontalFilterBar);
