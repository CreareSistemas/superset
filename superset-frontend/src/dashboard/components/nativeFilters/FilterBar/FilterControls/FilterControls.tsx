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
import { memo, Fragment, FC, useCallback, useMemo, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import {
  DataMask,
  DataMaskStateWithId,
  Filter,
  Divider,
  NativeFilterTarget,
  ChartCustomization,
  isChartCustomizationDivider,
  ChartCustomizationDivider,
} from '@superset-ui/core';
import { css, useTheme, styled } from '@apache-superset/core/theme';
import {
  createHtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal';
import { useSelector, useDispatch } from 'react-redux';
import {
  useDashboardHasTabs,
  useSelectFiltersInScope,
  useSelectCustomizationsInScope,
} from 'src/dashboard/components/nativeFilters/state';
import { FilterBarOrientation, RootState } from 'src/dashboard/types';
import { Typography } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import { useChartIds } from 'src/dashboard/util/charts/useChartIds';
import { useChartLayoutItems } from 'src/dashboard/util/useChartLayoutItems';
import { setPendingChartCustomization } from 'src/dashboard/actions/chartCustomizationActions';
import { getInitialDataMask } from 'src/dataMask/reducer';
import { FiltersOutOfScopeCollapsible } from '../FiltersOutOfScopeCollapsible';
import { CustomizationsOutOfScopeCollapsible } from '../CustomizationsOutOfScopeCollapsible';
import { useFilterControlFactory } from '../useFilterControlFactory';
import crossFiltersSelector from '../CrossFilters/selectors';
import CrossFilter from '../CrossFilters/CrossFilter';
import { useChartsVerboseMaps } from '../utils';
import FilterControl from './FilterControl';
import FilterDivider from './FilterDivider';

function addDataMaskToCustomization(
  customization: ChartCustomization,
  dataMaskSelected: DataMaskStateWithId,
): ChartCustomization & { dataMask: DataMask } {
  const dataMask =
    dataMaskSelected[customization.id] ?? getInitialDataMask(customization.id);
  return { ...customization, dataMask };
}

type FilterControlsProps = {
  dataMaskSelected: DataMaskStateWithId;
  onFilterSelectionChange: (filter: Filter, dataMask: DataMask) => void;
  onPendingCustomizationDataMaskChange: (
    customizationId: string,
    dataMask: DataMask,
  ) => void;
  chartCustomizationValues: (ChartCustomization | ChartCustomizationDivider)[];
  clearAllTriggers?: Record<string, boolean>;
  onClearAllComplete?: (filterId: string) => void;
  hideHeader?: boolean;
};

const SectionContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.sizeUnit * 3}px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.sizeUnit * 2}px 0;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${({ theme }) => theme.colorBgTextHover};
    margin: 0 -${({ theme }) => theme.sizeUnit * 2}px;
    padding: ${({ theme }) => theme.sizeUnit * 2}px;
    border-radius: ${({ theme }) => theme.borderRadius}px;
  }
`;

const { Title } = Typography;

const SectionContent = styled.div`
  padding: ${({ theme }) => theme.sizeUnit * 2}px 0;
`;

const StyledDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colorSplit};
  margin: ${({ theme }) => theme.sizeUnit * 2}px 0;
`;

const StyledIcon = styled(Icons.UpOutlined)<{ isOpen: boolean }>`
  transform: ${({ isOpen }) => (isOpen ? 'rotate(0deg)' : 'rotate(180deg)')};
  transition: transform 0.2s ease;
  color: ${({ theme }) => theme.colorTextSecondary};
`;

// Creare: the filters of the horizontal bar wrap to new rows instead of going
// to a "More filters" popover; each field grows to fill the row (up to a
// maximum) and shrinks down to a minimum before wrapping
const HorizontalFilters = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: ${theme.sizeUnit * 4}px;
    min-width: 0;
    padding: 0 ${theme.sizeUnit * 4}px;

    & > .filter-item-wrapper {
      flex: 1 1 ${theme.sizeUnit * 65}px;
      min-width: ${theme.sizeUnit * 50}px;
      max-width: ${theme.sizeUnit * 90}px;
    }

    & > .filter-item-wrapper:has(.ant-select-multiple) {
      flex-basis: ${theme.sizeUnit * 90}px;
      max-width: ${theme.sizeUnit * 120}px;
    }

    & > .filter-item-wrapper > *,
    & > .filter-item-wrapper .ant-form-item,
    & > .filter-item-wrapper .ant-form-item-row,
    & > .filter-item-wrapper .ant-form-item-control {
      width: 100%;
      min-width: 0;
    }
  `}
`;

const ChartCustomizationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
`;

const FilterControls: FC<FilterControlsProps> = ({
  dataMaskSelected,
  onFilterSelectionChange,
  onPendingCustomizationDataMaskChange,
  chartCustomizationValues,
  clearAllTriggers,
  onClearAllComplete,
  hideHeader = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const filterBarOrientation = useSelector<RootState, FilterBarOrientation>(
    ({ dashboardInfo }) => dashboardInfo.filterBarOrientation,
  );

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
  const { filterControlFactory, filtersWithValues } = useFilterControlFactory(
    dataMaskSelected,
    onFilterSelectionChange,
    clearAllTriggers,
    onClearAllComplete,
  );
  const portalNodes = useMemo(
    () =>
      Array.from({ length: filtersWithValues.length }, () =>
        createHtmlPortalNode(),
      ),
    [filtersWithValues.length],
  );

  const filterIds = new Set(filtersWithValues.map(item => item.id));

  const [filtersInScope, filtersOutOfScope] =
    useSelectFiltersInScope(filtersWithValues);

  const filteredChartCustomizationValues = useMemo(
    () => chartCustomizationValues.filter(item => !item.removed),
    [chartCustomizationValues],
  );

  const [customizationsInScope, customizationsOutOfScope] =
    useSelectCustomizationsInScope(filteredChartCustomizationValues);

  const hasRequiredFirst = useMemo(
    () => filtersWithValues.some(filter => filter.requiredFirst),
    [filtersWithValues],
  );

  const dashboardHasTabs = useDashboardHasTabs();
  const showCollapsePanel = dashboardHasTabs && filtersWithValues.length > 0;
  const showCustomizationCollapsePanel =
    dashboardHasTabs && filteredChartCustomizationValues.length > 0;

  const [sectionsOpen, setSectionsOpen] = useState({
    filters: true,
    chartCustomization: true,
  });

  const showFiltersOutOfScope =
    showCollapsePanel &&
    (hideHeader || sectionsOpen.filters) &&
    filtersOutOfScope.length > 0;

  const toggleSection = useCallback((section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleChartCustomizationChange = useCallback(
    (customizationItem: ChartCustomization, dataMask: DataMask) => {
      const columnValue = dataMask.ownState?.column;
      const existingTarget = customizationItem.targets?.[0] || {};

      dispatch(
        setPendingChartCustomization({
          ...customizationItem,
          targets: [
            {
              ...existingTarget,
              ...(columnValue && {
                column: {
                  ...existingTarget.column,
                  name: columnValue,
                },
              }),
            },
          ] as [Partial<NativeFilterTarget>],
        }),
      );

      onPendingCustomizationDataMaskChange(customizationItem.id, dataMask);
    },
    [dispatch, onPendingCustomizationDataMaskChange],
  );

  const renderer = useCallback(
    ({ id }: Filter | Divider, index: number | undefined) => {
      const filterIndex = filtersWithValues.findIndex(f => f.id === id);
      const key = index ?? id;
      return (
        // Empty text node is to ensure there's always an element preceding
        // the OutPortal, otherwise react-reverse-portal crashes
        <Fragment key={key}>
          {'' /* eslint-disable-line react/jsx-curly-brace-presence */}
          <OutPortal node={portalNodes[filterIndex]} inView />
        </Fragment>
      );
    },
    [filtersWithValues, portalNodes],
  );

  const customizationRenderer = useCallback(
    (item: ChartCustomization | ChartCustomizationDivider, index: number) => {
      if (isChartCustomizationDivider(item)) {
        return (
          <FilterDivider
            key={item.id}
            title={item.title}
            description={item.description}
            orientation={FilterBarOrientation.Vertical}
          />
        );
      }
      const filterWithDataMask = addDataMaskToCustomization(
        item,
        dataMaskSelected,
      );
      return (
        <FilterControl
          key={item.id}
          filter={filterWithDataMask}
          dataMaskSelected={dataMaskSelected}
          onFilterSelectionChange={(_, dataMask) =>
            handleChartCustomizationChange(item, dataMask)
          }
          orientation={FilterBarOrientation.Vertical}
          overflow={false}
        />
      );
    },
    [dataMaskSelected, handleChartCustomizationChange],
  );

  const renderVerticalContent = useCallback(
    () => (
      <>
        {filtersInScope.length > 0 && (
          <SectionContainer>
            {!hideHeader && (
              <SectionHeader
                onClick={() => toggleSection('filters')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('filters');
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: theme.fontSize,
                    fontWeight: theme.fontWeightNormal,
                    color: theme.colorText,
                    lineHeight: 1.3,
                  }}
                >
                  {t('Filters')}
                </Title>
                <StyledIcon iconSize="m" isOpen={sectionsOpen.filters} />
              </SectionHeader>
            )}
            {(hideHeader || sectionsOpen.filters) && (
              <SectionContent>{filtersInScope.map(renderer)}</SectionContent>
            )}
            {(hideHeader || sectionsOpen.filters) && <StyledDivider />}
          </SectionContainer>
        )}

        {showFiltersOutOfScope && (
          <FiltersOutOfScopeCollapsible
            filtersOutOfScope={filtersOutOfScope}
            renderer={renderer}
            forceRender={hasRequiredFirst}
          />
        )}

        {customizationsInScope.length > 0 && (
          <SectionContainer>
            {!hideHeader && (
              <SectionHeader
                onClick={() => toggleSection('chartCustomization')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('chartCustomization');
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: theme.fontSize,
                    fontWeight: theme.fontWeightNormal,
                    color: theme.colorText,
                    lineHeight: 1.3,
                  }}
                >
                  {t('Display controls')}
                </Title>
                <StyledIcon
                  iconSize="m"
                  isOpen={sectionsOpen.chartCustomization}
                />
              </SectionHeader>
            )}
            {(hideHeader || sectionsOpen.chartCustomization) && (
              <SectionContent>
                <ChartCustomizationContent>
                  {customizationsInScope.map((item, index) =>
                    customizationRenderer(item, index),
                  )}
                </ChartCustomizationContent>
              </SectionContent>
            )}
            {(hideHeader || sectionsOpen.chartCustomization) && (
              <StyledDivider />
            )}
          </SectionContainer>
        )}

        {showCustomizationCollapsePanel &&
          (hideHeader || sectionsOpen.chartCustomization) && (
            <CustomizationsOutOfScopeCollapsible
              customizationsOutOfScope={customizationsOutOfScope}
              renderer={customizationRenderer}
              forceRender={false}
            />
          )}
      </>
    ),
    [
      filtersInScope,
      renderer,
      showCollapsePanel,
      filtersOutOfScope,
      hasRequiredFirst,
      customizationsInScope,
      customizationsOutOfScope,
      showCustomizationCollapsePanel,
      customizationRenderer,
      sectionsOpen,
      toggleSection,
      theme,
      hideHeader,
      handleChartCustomizationChange,
      dataMaskSelected,
    ],
  );

  const rendererCrossFilter = useCallback(
    (crossFilter, orientation, last) => (
      <CrossFilter
        filter={crossFilter}
        orientation={orientation}
        last={
          filtersInScope.length > 0 &&
          `${last.name}${last.emitterId}` ===
            `${crossFilter.name}${crossFilter.emitterId}`
        }
      />
    ),
    [filtersInScope.length],
  );

  const items = useMemo(() => {
    const crossFilters = selectedCrossFilters.map(c => ({
      // a combination of filter name and chart id to account
      // for multiple cross filters from the same chart in the future
      id: `${c.name}${c.emitterId}`,
      element: rendererCrossFilter(
        c,
        FilterBarOrientation.Horizontal,
        selectedCrossFilters.at(-1),
      ),
    }));
    const nativeFiltersInScope = filtersInScope.map((filter, index) => ({
      id: filter.id,
      element: (
        <div className="filter-item-wrapper">{renderer(filter, index)}</div>
      ),
    }));
    const dividerItems = [];
    if (
      (crossFilters.length > 0 || nativeFiltersInScope.length > 0) &&
      chartCustomizationValues.length > 0
    ) {
      dividerItems.push({
        id: 'chart-customization-divider',
        element: (
          <div
            css={css`
              width: 1px;
              height: 22px;
              background: ${theme.colorBorder};
              margin-left: ${theme.sizeUnit * 4}px;
              margin-right: ${theme.sizeUnit}px;
              flex-shrink: 0;
            `}
          />
        ),
      });
    }

    const chartCustomizations = customizationsInScope.map(item => {
      if (isChartCustomizationDivider(item)) {
        return {
          id: `chart-customization-${item.id}`,
          element: (
            <div
              className="chart-customization-item-wrapper"
              css={css`
                flex-shrink: 0;
              `}
            >
              <FilterDivider
                title={item.title}
                description={item.description}
                orientation={FilterBarOrientation.Horizontal}
              />
            </div>
          ),
        };
      }
      return {
        id: `chart-customization-${item.id}`,
        element: (
          <div
            className="chart-customization-item-wrapper"
            css={css`
              flex-shrink: 0;
            `}
          >
            <FilterControl
              filter={addDataMaskToCustomization(item, dataMaskSelected)}
              dataMaskSelected={dataMaskSelected}
              onFilterSelectionChange={(_, dataMask) =>
                handleChartCustomizationChange(item, dataMask)
              }
              orientation={FilterBarOrientation.Horizontal}
              overflow={false}
            />
          </div>
        ),
      };
    });

    return [
      ...chartCustomizations,
      ...dividerItems,
      ...crossFilters,
      ...nativeFiltersInScope,
    ];
  }, [
    filtersInScope,
    renderer,
    rendererCrossFilter,
    selectedCrossFilters,
    customizationsInScope,
    theme,
    handleChartCustomizationChange,
    dataMaskSelected,
    chartCustomizationValues.length,
  ]);

  const renderHorizontalContent = useCallback(
    () => (
      <HorizontalFilters className="filter-bar__filters">
        {items.map(({ id, element }) => (
          <Fragment key={id}>{element}</Fragment>
        ))}
      </HorizontalFilters>
    ),
    [items],
  );

  // Creare: no filter overflows in the horizontal bar anymore; out of scope
  // filters (other tabs) are not shown there
  const overflowedByIndex = useMemo(() => {
    const filtersOutOfScopeIds = new Set(filtersOutOfScope.map(({ id }) => id));
    return filtersWithValues.map(
      filter =>
        filterBarOrientation === FilterBarOrientation.Horizontal &&
        filtersOutOfScopeIds.has(filter.id),
    );
  }, [filtersOutOfScope, filtersWithValues, filterBarOrientation]);

  return (
    <>
      {portalNodes
        .filter((node, index) => filterIds.has(filtersWithValues[index].id))
        .map((node, index) => (
          <InPortal node={node} key={filtersWithValues[index].id}>
            {filterControlFactory(
              index,
              filterBarOrientation,
              overflowedByIndex[index],
            )}
          </InPortal>
        ))}
      {filterBarOrientation === FilterBarOrientation.Vertical &&
        renderVerticalContent()}
      {filterBarOrientation === FilterBarOrientation.Horizontal &&
        renderHorizontalContent()}
    </>
  );
};

export default memo(FilterControls);
