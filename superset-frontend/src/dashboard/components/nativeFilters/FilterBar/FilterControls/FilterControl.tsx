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
import { memo, useMemo } from 'react';
import { noop } from 'lodash';
import {
  createHtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal';
import { FilterBarOrientation } from 'src/dashboard/types';
import { isChartCustomization } from '@superset-ui/core';
import { t } from '@apache-superset/core/translation';
import { checkIsMissingRequiredValue } from '../utils';
import FilterValue from './FilterValue';
import { FilterControlProps } from './types';
import { useIsFilterInScope } from '../../state';
import {
  FilterStyledIcon,
  RequiredFieldIndicator,
  useFilterControlDisplay,
} from './FilterControlShared';
import GroupByFilterCard from './GroupByFilterCard';

const FilterControl = ({
  dataMaskSelected,
  filter,
  icon,
  onFilterSelectionChange,
  inView,
  showOverflow,
  parentRef,
  orientation = FilterBarOrientation.Vertical,
  overflow = false,
  clearAllTrigger,
  onClearAllComplete,
}: FilterControlProps) => {
  const portalNode = useMemo(() => createHtmlPortalNode(), []);

  const { name = '<undefined>' } = filter;

  const isFilterInScope = useIsFilterInScope();
  const isMissingRequiredValue =
    isFilterInScope(filter) &&
    checkIsMissingRequiredValue(filter, filter.dataMask?.filterState);
  const validateStatus = isMissingRequiredValue ? 'error' : undefined;
  const isRequired = !!filter.controlValues?.enableEmptyFilter;
  const inverseSelection = !!filter.controlValues?.inverseSelection;

  const {
    FilterControlContainer,
    FormItem,
    FilterControlTitleBox,
    FilterControlTitle,
  } = useFilterControlDisplay(orientation, overflow, inverseSelection);

  // Creare: no hover info on the filter title (no description tooltip and no
  // FilterCard popover below), it only confused report users.
  const label = useMemo(
    () => (
      <FilterControlTitleBox>
        <FilterControlTitle
          id={`filter-name-${filter.id}`}
          data-test="filter-control-name"
        >
          {t(name)}
        </FilterControlTitle>
        {isRequired && <RequiredFieldIndicator />}
        <FilterStyledIcon data-test="filter-icon">{icon}</FilterStyledIcon>
      </FilterControlTitleBox>
    ),
    [FilterControlTitleBox, FilterControlTitle, name, isRequired, icon],
  );

  if (
    isChartCustomization(filter) &&
    filter.filterType === 'chart_customization_dynamic_groupby'
  ) {
    return (
      <GroupByFilterCard
        customizationItem={filter}
        orientation={
          orientation === FilterBarOrientation.Horizontal
            ? 'horizontal'
            : 'vertical'
        }
        dataMaskSelected={dataMaskSelected}
        onFilterSelectionChange={onFilterSelectionChange}
      />
    );
  }

  return (
    <>
      <InPortal node={portalNode}>
        <FilterValue
          dataMaskSelected={dataMaskSelected}
          filter={filter}
          showOverflow={showOverflow}
          onFilterSelectionChange={onFilterSelectionChange}
          inView={inView}
          parentRef={parentRef}
          setFilterActive={noop}
          orientation={orientation}
          overflow={overflow}
          validateStatus={validateStatus}
          clearAllTrigger={clearAllTrigger}
          onClearAllComplete={onClearAllComplete}
        />
      </InPortal>
      <FilterControlContainer
        layout={
          orientation === FilterBarOrientation.Horizontal && !overflow
            ? 'horizontal'
            : 'vertical'
        }
      >
        <div>
          <FormItem
            label={label}
            htmlFor={filter.id}
            required={filter?.controlValues?.enableEmptyFilter}
            validateStatus={validateStatus}
          >
            <OutPortal node={portalNode} />
          </FormItem>
        </div>
      </FilterControlContainer>
    </>
  );
};

export default memo(FilterControl);
