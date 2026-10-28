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
import { t } from '@apache-superset/core/translation';
import {
  DataMaskState,
  DataMaskStateWithId,
  isDefined,
  ChartCustomization,
  ChartCustomizationDivider,
} from '@superset-ui/core';
import { css, SupersetTheme, styled } from '@apache-superset/core/theme';
import { Button, Tooltip, Icons, Flex } from '@superset-ui/core/components';
import tinycolor from 'tinycolor2';
import { FilterBarOrientation } from 'src/dashboard/types';
import { getFilterBarTestId } from '../utils';
import { useFilterBarCollapse } from '../FilterBarCollapse';

interface ActionButtonsProps {
  onApply: () => void;
  onClearAll: () => void;
  dataMaskSelected: DataMaskState;
  dataMaskApplied: DataMaskStateWithId;
  chartCustomizationItems?: (ChartCustomization | ChartCustomizationDivider)[];
  isApplyDisabled: boolean;
  filterBarOrientation?: FilterBarOrientation;
  hasOutOfScopeRequiredFilters?: boolean;
}

const ButtonsContainer = styled.div<{ isVertical: boolean }>`
  ${({ theme, isVertical }) => css`
    display: flex;

    ${isVertical
      ? css`
          flex-direction: column;
          align-items: center;
          position: sticky;
          z-index: 100;
          bottom: 0;
          padding: ${theme.sizeUnit * 4}px;
          padding-top: ${theme.sizeUnit * 6}px;
          background: linear-gradient(
            ${tinycolor(theme.colorBgLayout).setAlpha(0).toRgbString()},
            ${theme.colorBgContainer} 20%
          );
        `
      : css`
          align-items: center;
          gap: ${theme.sizeUnit * 3}px;
          margin-left: auto;
        `}
  `}
`;

const applyButtonStyle = (theme: SupersetTheme, isVertical: boolean) => css`
  ${isVertical &&
  css`
    margin-bottom: ${theme.sizeUnit * 3}px;
  `}
`;

const clearAllButtonStyle = (theme: SupersetTheme) => css`
  && {
    color: ${theme.colorTextSecondary};
    margin-left: 0;

    &:hover {
      color: ${theme.colorPrimaryText};
    }

    &[disabled],
    &[disabled]:hover {
      color: ${theme.colorTextDisabled};
    }
  }
`;

const ActionButtons = ({
  onApply,
  onClearAll,
  dataMaskApplied,
  dataMaskSelected,
  isApplyDisabled,
  filterBarOrientation = FilterBarOrientation.Vertical,
  chartCustomizationItems,
  hasOutOfScopeRequiredFilters = false,
}: ActionButtonsProps) => {
  const isVertical = filterBarOrientation === FilterBarOrientation.Vertical;

  const isClearAllEnabled = useMemo(() => {
    const hasSelectedChanges = Object.entries(dataMaskSelected).some(
      ([, mask]) => {
        const hasValue = isDefined(mask?.filterState?.value);
        const hasGroupBy = isDefined(mask?.ownState?.column);
        return hasValue || hasGroupBy;
      },
    );

    const hasAppliedChanges = Object.entries(dataMaskApplied).some(
      ([, mask]) => {
        const hasValue = isDefined(mask?.filterState?.value);
        const hasGroupBy = isDefined(mask?.ownState?.column);
        return hasValue || hasGroupBy;
      },
    );

    const hasChartCustomizations = chartCustomizationItems?.some(item => {
      if (item.removed) return false;
      const mask = dataMaskApplied[item.id] || dataMaskSelected[item.id];
      const hasValue = isDefined(mask?.filterState?.value);
      const hasGroupBy = isDefined(mask?.ownState?.column);
      return hasValue || hasGroupBy;
    });

    return hasSelectedChanges || hasAppliedChanges || hasChartCustomizations;
  }, [dataMaskSelected, dataMaskApplied, chartCustomizationItems]);

  // Creare: in the horizontal bar the filters are hidden after "Search",
  // leaving the applied filters strip (the report header shows them again)
  const collapse = useFilterBarCollapse();
  const canCollapse = !isVertical && !!collapse;
  const handleApply = () => {
    onApply();
    if (canCollapse) {
      collapse.setCollapsed(true);
    }
  };

  const applyButton = (
    <Button
      disabled={isApplyDisabled}
      buttonStyle="primary"
      htmlType="submit"
      className="filter-apply-button"
      css={(theme: SupersetTheme) => applyButtonStyle(theme, isVertical)}
      onClick={handleApply}
      {...getFilterBarTestId('apply-button')}
    >
      {/* Creare: "Pesquisar" in the horizontal bar, as in the Design System */}
      {isVertical ? t('Apply filters') : t('Search')}
    </Button>
  );

  const clearAllButton = (
    <Flex className="filter-clear-all-container">
      <Button
        disabled={!isClearAllEnabled}
        // Creare: outlined in the horizontal bar (where "Close" was); its
        // border and spacing come from the dashboard CSS
        buttonStyle={isVertical ? 'link' : 'tertiary'}
        className="filter-clear-all-button"
        css={(theme: SupersetTheme) =>
          isVertical ? clearAllButtonStyle(theme) : undefined
        }
        onClick={onClearAll}
        {...getFilterBarTestId('clear-button')}
      >
        {t('Clear all')}
      </Button>
      {hasOutOfScopeRequiredFilters && (
        <Tooltip
          title={t(
            'Some required filters on other tabs have values and will not be cleared',
          )}
        >
          <Icons.InfoCircleOutlined
            iconSize="s"
            css={(theme: SupersetTheme) => css`
              margin-left: ${theme.sizeUnit}px;
            `}
          />
        </Tooltip>
      )}
    </Flex>
  );

  // Creare: stable class names (dropped in 6.1) so the dashboard CSS can style
  // the buttons; the horizontal bar follows the platform order
  // (Clear all -> Search)
  return (
    <ButtonsContainer
      isVertical={isVertical}
      className="filter-bar-actions"
      data-test="filterbar-action-buttons"
    >
      {isVertical ? applyButton : clearAllButton}
      {isVertical ? clearAllButton : applyButton}
    </ButtonsContainer>
  );
};

export default ActionButtons;
