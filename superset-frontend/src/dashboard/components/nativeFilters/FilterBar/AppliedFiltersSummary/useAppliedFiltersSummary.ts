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
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { t } from '@apache-superset/core/translation';
import {
  DataMask,
  DataMaskStateWithId,
  Divider,
  ensureIsArray,
  Filter,
  isDefined,
  NativeFilterType,
  NO_TIME_RANGE,
} from '@superset-ui/core';
import { RootState } from 'src/dashboard/types';
import { useChartIds } from 'src/dashboard/util/charts/useChartIds';
import { useChartLayoutItems } from 'src/dashboard/util/useChartLayoutItems';
import { formatTimeRangeForDisplay } from 'src/explore/components/controls/DateFilterControl/utils';
import { useFilterConfiguration, useSelectFiltersInScope } from '../../state';
import { getFilterValueForDisplay } from '../../utils';
import crossFiltersSelector from '../CrossFilters/selectors';
import { useChartsVerboseMaps } from '../utils';

export interface AppliedFilterSummaryItem {
  id: string;
  name: string;
  values: string[];
}

const isEmptyValue = (value: unknown) =>
  !isDefined(value) ||
  value === '' ||
  value === NO_TIME_RANGE ||
  (Array.isArray(value) && value.length === 0);

export const getAppliedFilterValues = (
  filter: Filter,
  dataMask: DataMask | undefined,
  locale?: string,
): string[] => {
  const filterState = dataMask?.filterState;
  const value = filterState?.value;
  if (isEmptyValue(value)) {
    return [];
  }
  switch (filter.filterType) {
    case 'filter_select': {
      const prefix =
        filter.controlValues?.inverseSelection &&
        filterState?.excludeFilterValues
          ? '≠ '
          : '';
      return ensureIsArray(value).map(item => `${prefix}${item}`);
    }
    case 'filter_time':
      return [formatTimeRangeForDisplay(value, locale) ?? t(String(value))];
    default:
      return [filterState?.label || getFilterValueForDisplay(value)];
  }
};

export function useAppliedFiltersSummary(): AppliedFilterSummaryItem[] {
  const dataMask = useSelector<RootState, DataMaskStateWithId>(
    state => state.dataMask,
  );
  const locale = useSelector<RootState, string | undefined>(
    state => (state.common as { locale?: string } | undefined)?.locale,
  );
  const filterConfiguration = useFilterConfiguration();
  const [filtersInScope] = useSelectFiltersInScope(
    filterConfiguration as (Filter | Divider)[],
  );
  const chartIds = useChartIds();
  const chartLayoutItems = useChartLayoutItems();
  const verboseMaps = useChartsVerboseMaps();

  return useMemo(() => {
    const nativeFilters = filtersInScope
      .filter(
        (filter): filter is Filter =>
          filter.type === NativeFilterType.NativeFilter,
      )
      .map(filter => ({
        id: filter.id,
        name: t(filter.name),
        values: getAppliedFilterValues(filter, dataMask[filter.id], locale),
      }));

    const crossFilters = crossFiltersSelector({
      dataMask,
      chartIds,
      chartLayoutItems,
      verboseMaps,
    }).map(crossFilter => ({
      id: `cross-filter-${crossFilter.emitterId}`,
      name: String(crossFilter.column ?? crossFilter.name),
      values: [getFilterValueForDisplay(crossFilter.value)],
    }));

    return [...nativeFilters, ...crossFilters].filter(
      item => item.values.filter(Boolean).length > 0,
    );
  }, [
    filtersInScope,
    dataMask,
    locale,
    chartIds,
    chartLayoutItems,
    verboseMaps,
  ]);
}
